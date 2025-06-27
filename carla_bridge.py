#!/usr/bin/env python3
"""
CARLA WebSocket Bridge for CARJAN-app
Enables real-time communication between CARJAN Vue app and CARLA simulation
"""

import asyncio
import websockets
import json
import logging
import carla
import time
from datetime import datetime
from typing import Dict, List, Optional, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CarlaWebSocketBridge:
    def __init__(self, carla_host="localhost", carla_port=2000, ws_host="localhost", ws_port=8765):
        self.carla_host = carla_host
        self.carla_port = carla_port
        self.ws_host = ws_host
        self.ws_port = ws_port

        # CARLA connection
        self.carla_client = None
        self.carla_world = None
        self.blueprint_library = None
        self.spawn_points = []

        # WebSocket connections
        self.connected_clients = set()

        # Spawned actors
        self.spawned_vehicles = {}
        self.spawned_pedestrians = {}
        self.debug_shapes = []

        # Simulation state
        self.simulation_state = {
            "state": "stopped",
            "fps": 0,
            "tick": 0,
            "weather": "Clear",
            "time_of_day": 12.0,
        }

        # Current scenario data
        self.current_scenario = None

    async def start_server(self):
        """Start the WebSocket server"""
        logger.info(
            f"Starting CARLA WebSocket Bridge on {self.ws_host}:{self.ws_port}")

        # Connect to CARLA
        if await self.connect_to_carla():
            logger.info("Connected to CARLA successfully")
        else:
            logger.error("Failed to connect to CARLA")
            return

        # Start WebSocket server
        async with websockets.serve(self.handle_client, self.ws_host, self.ws_port):
            logger.info("WebSocket server started, waiting for connections...")
            await asyncio.Future()  # Run forever

    async def connect_to_carla(self):
        """Connect to CARLA simulation"""
        try:
            self.carla_client = carla.Client(self.carla_host, self.carla_port)
            self.carla_client.set_timeout(10.0)

            self.carla_world = self.carla_client.get_world()
            self.blueprint_library = self.carla_world.get_blueprint_library()
            self.spawn_points = self.carla_world.get_map().get_spawn_points()

            # Setup world tick callback
            self.carla_world.on_tick(self.on_world_tick)

            logger.info(
                f"Connected to CARLA at {self.carla_host}:{self.carla_port}")
            logger.info(f"Available spawn points: {len(self.spawn_points)}")

            self.simulation_state["state"] = "connected"
            return True

        except Exception as e:
            logger.error(f"Failed to connect to CARLA: {e}")
            return False

    def on_world_tick(self, world_snapshot):
        """Called on every CARLA world tick"""
        self.simulation_state["tick"] = world_snapshot.frame
        self.simulation_state["fps"] = 1.0 / \
            world_snapshot.timestamp.delta_seconds if world_snapshot.timestamp.delta_seconds > 0 else 0

        # Broadcast simulation state to all connected clients
        asyncio.create_task(self.broadcast_simulation_state())

    async def handle_client(self, websocket, path):
        """Handle new WebSocket client connection"""
        logger.info(f"New client connected: {websocket.remote_address}")
        self.connected_clients.add(websocket)

        try:
            # Send initial connection confirmation
            await self.send_to_client(websocket, "connected", {
                "carla_host": self.carla_host,
                "carla_port": self.carla_port,
                "simulation_state": self.simulation_state,
            })

            # Handle incoming messages
            async for message in websocket:
                await self.handle_message(websocket, message)

        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client disconnected: {websocket.remote_address}")
        except Exception as e:
            logger.error(
                f"Error handling client {websocket.remote_address}: {e}")
        finally:
            self.connected_clients.discard(websocket)

    async def handle_message(self, websocket, message):
        """Handle incoming message from WebSocket client"""
        try:
            data = json.loads(message)
            message_type = data.get("type")
            payload = data.get("data", {})

            logger.info(f"Received message: {message_type}")

            # Route message to appropriate handler
            if message_type == "load_complete_scenario":
                await self.handle_load_scenario(websocket, payload)
            elif message_type == "spawn_entity":
                await self.handle_spawn_entity(websocket, payload)
            elif message_type == "destroy_entity":
                await self.handle_destroy_entity(websocket, payload)
            elif message_type == "move_entity":
                await self.handle_move_entity(websocket, payload)
            elif message_type == "create_path":
                await self.handle_create_path(websocket, payload)
            elif message_type == "set_weather":
                await self.handle_set_weather(websocket, payload)
            elif message_type == "simulation_control":
                await self.handle_simulation_control(websocket, payload)
            elif message_type == "get_simulation_state":
                await self.send_simulation_state(websocket)
            else:
                logger.warning(f"Unknown message type: {message_type}")

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON received: {e}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self.send_to_client(websocket, "error", {"message": str(e)})

    async def handle_load_scenario(self, websocket, scenario_data):
        """Load complete scenario into CARLA"""
        try:
            logger.info(
                f"Loading scenario: {scenario_data.get('scenario', {}).get('metadata', {}).get('name', 'Unknown')}")

            # Clear existing actors
            await self.clear_all_actors()

            # Store scenario data
            self.current_scenario = scenario_data.get("scenario", {})

            # Apply environment settings
            environment = self.current_scenario.get("environment", {})
            if environment.get("weather"):
                await self.set_weather(environment["weather"])

            # Spawn entities
            entities = self.current_scenario.get("entities", [])
            for entity in entities:
                await self.spawn_entity(entity)

            # Create paths
            paths = self.current_scenario.get("paths", [])
            for path in paths:
                await self.create_path_visualization(path)

            # Notify client
            await self.send_to_client(websocket, "scenario_loaded", {
                "scenario_name": self.current_scenario.get("metadata", {}).get("name"),
                "entities_spawned": len(entities),
                "paths_created": len(paths),
            })

        except Exception as e:
            logger.error(f"Error loading scenario: {e}")
            await self.send_to_client(websocket, "error", {"message": f"Failed to load scenario: {str(e)}"})

    async def handle_spawn_entity(self, websocket, entity_data):
        """Spawn entity in CARLA"""
        try:
            entity = entity_data.get("entity", {})
            position = entity_data.get("position", {})

            actor = await self.spawn_entity(entity, position)
            if actor:
                await self.send_to_client(websocket, "entity_spawned", {
                    "entity_id": entity.get("id"),
                    "actor_id": actor.id,
                    "type": entity.get("type"),
                })

        except Exception as e:
            logger.error(f"Error spawning entity: {e}")
            await self.send_to_client(websocket, "error", {"message": f"Failed to spawn entity: {str(e)}"})

    async def spawn_entity(self, entity, position=None):
        """Spawn a single entity in CARLA"""
        entity_type = entity.get("type")
        entity_id = entity.get("id")

        if not position:
            # Convert grid position to CARLA coordinates
            grid_x = entity.get("x", 0)
            grid_y = entity.get("y", 0)
            position = self.grid_to_carla_position(grid_x, grid_y)

        try:
            if entity_type == "vehicle":
                # Get random vehicle blueprint
                vehicle_bps = self.blueprint_library.filter("vehicle.*")
                if vehicle_bps:
                    blueprint = vehicle_bps[0]  # Use first available vehicle

                    # Create spawn point
                    spawn_point = carla.Transform(
                        carla.Location(
                            x=position["x"], y=position["y"], z=position["z"]),
                        carla.Rotation(yaw=self.heading_to_yaw(
                            entity.get("heading", "North")))
                    )

                    # Spawn vehicle
                    actor = self.carla_world.spawn_actor(
                        blueprint, spawn_point)
                    self.spawned_vehicles[entity_id] = actor

                    logger.info(f"Spawned vehicle {entity_id} at {position}")
                    return actor

            elif entity_type == "pedestrian":
                # Get random pedestrian blueprint
                pedestrian_bps = self.blueprint_library.filter(
                    "walker.pedestrian.*")
                if pedestrian_bps:
                    # Use first available pedestrian
                    blueprint = pedestrian_bps[0]

                    # Create spawn point
                    spawn_point = carla.Transform(
                        carla.Location(
                            x=position["x"], y=position["y"], z=position["z"])
                    )

                    # Spawn pedestrian
                    actor = self.carla_world.spawn_actor(
                        blueprint, spawn_point)
                    self.spawned_pedestrians[entity_id] = actor

                    logger.info(
                        f"Spawned pedestrian {entity_id} at {position}")
                    return actor

        except Exception as e:
            logger.error(f"Failed to spawn {entity_type} {entity_id}: {e}")
            return None

    async def create_path_visualization(self, path):
        """Create visual representation of path in CARLA"""
        waypoints = path.get("waypoints", [])
        if len(waypoints) < 2:
            return

        # Convert waypoints to CARLA coordinates
        carla_waypoints = []
        for waypoint in waypoints:
            pos = self.grid_to_carla_position(waypoint["x"], waypoint["y"])
            carla_waypoints.append(carla.Location(
                x=pos["x"], y=pos["y"], z=pos["z"]))

        # Draw lines between waypoints
        debug = self.carla_world.debug
        color = carla.Color(33, 150, 243)  # Blue

        for i in range(len(carla_waypoints) - 1):
            debug.draw_line(
                carla_waypoints[i],
                carla_waypoints[i + 1],
                thickness=0.1,
                color=color,
                life_time=0  # Permanent
            )

        logger.info(
            f"Created path visualization with {len(waypoints)} waypoints")

    async def set_weather(self, weather_name):
        """Set weather in CARLA"""
        weather_presets = {
            "Clear": carla.WeatherParameters.ClearNoon,
            "Cloudy": carla.WeatherParameters.CloudyNoon,
            "Rainy": carla.WeatherParameters.HardRainNoon,
            "Sunny": carla.WeatherParameters.ClearNoon,
        }

        weather = weather_presets.get(
            weather_name, carla.WeatherParameters.ClearNoon)
        self.carla_world.set_weather(weather)
        self.simulation_state["weather"] = weather_name

        logger.info(f"Weather set to: {weather_name}")

    async def clear_all_actors(self):
        """Clear all spawned actors"""
        # Destroy vehicles
        for actor in self.spawned_vehicles.values():
            if actor.is_alive:
                actor.destroy()
        self.spawned_vehicles.clear()

        # Destroy pedestrians
        for actor in self.spawned_pedestrians.values():
            if actor.is_alive:
                actor.destroy()
        self.spawned_pedestrians.clear()

        logger.info("Cleared all spawned actors")

    def grid_to_carla_position(self, grid_x, grid_y):
        """Convert grid coordinates to CARLA world coordinates"""
        # Assuming 4 meter spacing between grid cells
        return {
            "x": float(grid_x * 4.0),
            "y": float(grid_y * 4.0),
            "z": 0.5,
        }

    def heading_to_yaw(self, heading):
        """Convert heading direction to CARLA yaw angle"""
        heading_map = {
            "North": 0,
            "North-East": 45,
            "East": 90,
            "South-East": 135,
            "South": 180,
            "South-West": 225,
            "West": 270,
            "North-West": 315,
        }
        return heading_map.get(heading, 0)

    async def send_to_client(self, websocket, message_type, data):
        """Send message to specific client"""
        message = {
            "type": message_type,
            "timestamp": datetime.now().isoformat(),
            "data": data,
        }

        try:
            await websocket.send(json.dumps(message))
        except websockets.exceptions.ConnectionClosed:
            logger.warning("Tried to send to closed connection")

    async def broadcast_to_all(self, message_type, data):
        """Broadcast message to all connected clients"""
        if not self.connected_clients:
            return

        message = {
            "type": message_type,
            "timestamp": datetime.now().isoformat(),
            "data": data,
        }

        disconnected = set()
        for websocket in self.connected_clients:
            try:
                await websocket.send(json.dumps(message))
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(websocket)

        # Remove disconnected clients
        self.connected_clients -= disconnected

    async def broadcast_simulation_state(self):
        """Broadcast current simulation state to all clients"""
        await self.broadcast_to_all("simulation_state", self.simulation_state)

    async def send_simulation_state(self, websocket):
        """Send simulation state to specific client"""
        await self.send_to_client(websocket, "simulation_state", self.simulation_state)

    async def handle_simulation_control(self, websocket, control_data):
        """Handle simulation control commands"""
        action = control_data.get("action")

        if action == "play":
            self.simulation_state["state"] = "playing"
        elif action == "pause":
            self.simulation_state["state"] = "paused"
        elif action == "stop":
            self.simulation_state["state"] = "stopped"
            await self.clear_all_actors()
        elif action == "reset":
            self.simulation_state["state"] = "stopped"
            await self.clear_all_actors()
            if self.current_scenario:
                await self.handle_load_scenario(websocket, {"scenario": self.current_scenario})

        logger.info(f"Simulation control: {action}")
        await self.send_simulation_state(websocket)

    async def handle_destroy_entity(self, websocket, entity_data):
        """Destroy entity in CARLA"""
        entity_id = entity_data.get("entityId")

        if entity_id in self.spawned_vehicles:
            actor = self.spawned_vehicles[entity_id]
            if actor.is_alive:
                actor.destroy()
            del self.spawned_vehicles[entity_id]
            logger.info(f"Destroyed vehicle {entity_id}")

        elif entity_id in self.spawned_pedestrians:
            actor = self.spawned_pedestrians[entity_id]
            if actor.is_alive:
                actor.destroy()
            del self.spawned_pedestrians[entity_id]
            logger.info(f"Destroyed pedestrian {entity_id}")

    async def handle_move_entity(self, websocket, move_data):
        """Move entity in CARLA"""
        entity_id = move_data.get("entityId")
        position = move_data.get("position")
        rotation = move_data.get("rotation", {})

        actor = None
        if entity_id in self.spawned_vehicles:
            actor = self.spawned_vehicles[entity_id]
        elif entity_id in self.spawned_pedestrians:
            actor = self.spawned_pedestrians[entity_id]

        if actor and actor.is_alive:
            new_transform = carla.Transform(
                carla.Location(x=position["x"],
                               y=position["y"], z=position["z"]),
                carla.Rotation(pitch=rotation.get("pitch", 0), yaw=rotation.get(
                    "yaw", 0), roll=rotation.get("roll", 0))
            )
            actor.set_transform(new_transform)
            logger.info(f"Moved entity {entity_id} to {position}")

    async def handle_create_path(self, websocket, path_data):
        """Create path visualization in CARLA"""
        path = path_data.get("path")
        await self.create_path_visualization(path)

    async def handle_set_weather(self, websocket, weather_data):
        """Set weather in CARLA"""
        weather = weather_data.get("weather")
        await self.set_weather(weather)


async def main():
    bridge = CarlaWebSocketBridge()
    await bridge.start_server()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
