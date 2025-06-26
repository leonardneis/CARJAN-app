/**
 * Live Streaming Service for CARLA Integration
 * Handles real-time communication between CARJAN-app and CARLA
 */

export class LiveStreamingService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.messageQueue = [];
    this.listeners = new Map();
  }

  /**
   * Connect to CARLA streaming endpoint
   */
  async connect(endpoint = "ws://localhost:8765") {
    try {
      if (this.socket && this.isConnected) {
        await this.disconnect();
      }

      this.socket = new WebSocket(endpoint);

      return new Promise((resolve, reject) => {
        this.socket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log("Connected to CARLA streaming service");

          // Send queued messages
          this.flushMessageQueue();

          // Notify listeners
          this.emit("connected", { endpoint });

          resolve(true);
        };

        this.socket.onclose = (event) => {
          this.isConnected = false;
          console.log("Disconnected from CARLA streaming service");

          // Notify listeners
          this.emit("disconnected", { code: event.code, reason: event.reason });

          // Auto-reconnect if not intentional
          if (
            !event.wasClean &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.scheduleReconnect(endpoint);
          }
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleIncomingMessage(message);
          } catch (error) {
            console.error("Failed to parse incoming message:", error);
          }
        };

        this.socket.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.emit("error", { error });
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error("Connection timeout"));
          }
        }, 5000);
      });
    } catch (error) {
      console.error("Failed to connect to CARLA:", error);
      throw error;
    }
  }

  /**
   * Disconnect from CARLA
   */
  async disconnect() {
    if (this.socket) {
      this.socket.close(1000, "Intentional disconnect");
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect(endpoint) {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect(endpoint).catch((error) => {
        console.error("Reconnection failed:", error);
      });
    }, delay);
  }

  /**
   * Send message to CARLA
   */
  send(messageType, data) {
    const message = {
      type: messageType,
      timestamp: new Date().toISOString(),
      data: data,
    };

    if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      // Queue message for later
      this.messageQueue.push(message);
      console.warn("Message queued - not connected to CARLA");
    }
  }

  /**
   * Send queued messages
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.socket.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming messages from CARLA
   */
  handleIncomingMessage(message) {
    const { type, data } = message;

    switch (type) {
      case "scenario_loaded":
        this.emit("scenario_loaded", data);
        break;
      case "entity_spawned":
        this.emit("entity_spawned", data);
        break;
      case "entity_moved":
        this.emit("entity_moved", data);
        break;
      case "simulation_state":
        this.emit("simulation_state", data);
        break;
      case "error":
        this.emit("carla_error", data);
        break;
      default:
        console.warn("Unknown message type from CARLA:", type);
    }
  }

  /**
   * Stream scenario change to CARLA
   */
  streamScenarioChange(changeType, changeData) {
    switch (changeType) {
      case "entity_added":
        this.send("spawn_entity", {
          entity: changeData,
          position: this.gridToCarlaPosition(changeData.x, changeData.y),
        });
        break;

      case "entity_removed":
        this.send("destroy_entity", {
          entityId: changeData.id,
        });
        break;

      case "entity_moved":
        this.send("move_entity", {
          entityId: changeData.id,
          position: this.gridToCarlaPosition(changeData.x, changeData.y),
          rotation: this.headingToCarlaRotation(changeData.heading),
        });
        break;

      case "path_added":
        this.send("create_path", {
          path: changeData,
          waypoints: changeData.waypoints.map((wp) =>
            this.gridToCarlaPosition(wp.x, wp.y)
          ),
        });
        break;

      case "weather_changed":
        this.send("set_weather", {
          weather: changeData.weather,
        });
        break;

      case "scenario_loaded":
        this.send("load_scenario", {
          scenario: changeData,
        });
        break;
    }
  }

  /**
   * Convert grid coordinates to CARLA world coordinates
   */
  gridToCarlaPosition(gridX, gridY) {
    // Assuming 4 meter spacing between grid cells
    return {
      x: gridX * 4.0,
      y: gridY * 4.0,
      z: 0.5,
    };
  }

  /**
   * Convert heading to CARLA rotation
   */
  headingToCarlaRotation(heading) {
    const rotationMap = {
      North: { pitch: 0, yaw: 0, roll: 0 },
      "North-East": { pitch: 0, yaw: 45, roll: 0 },
      East: { pitch: 0, yaw: 90, roll: 0 },
      "South-East": { pitch: 0, yaw: 135, roll: 0 },
      South: { pitch: 0, yaw: 180, roll: 0 },
      "South-West": { pitch: 0, yaw: 225, roll: 0 },
      West: { pitch: 0, yaw: 270, roll: 0 },
      "North-West": { pitch: 0, yaw: 315, roll: 0 },
    };

    return rotationMap[heading] || { pitch: 0, yaw: 0, roll: 0 };
  }

  /**
   * Add event listener
   */
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }

  /**
   * Remove event listener
   */
  off(event, listener) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Send complete scenario to CARLA
   */
  sendCompleteScenario(scenarioData) {
    this.send("load_complete_scenario", {
      scenario: scenarioData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Request simulation state from CARLA
   */
  requestSimulationState() {
    this.send("get_simulation_state", {});
  }

  /**
   * Control simulation playback
   */
  controlSimulation(action) {
    this.send("simulation_control", {
      action: action, // "play", "pause", "stop", "reset"
    });
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
    };
  }
}

export const liveStreaming = new LiveStreamingService();
