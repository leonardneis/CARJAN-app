# CARJAN Map Tools

This directory contains utilities for managing CARJAN maps and generating thumbnails.

## Thumbnail Generator

The thumbnail generator creates both SVG and high-quality PNG thumbnails for maps that match the styling of the CarjanGrid.vue component.

### Usage

#### Generate PNG thumbnails for all maps (recommended)

```bash
npm run thumbnails:png
```

#### Generate PNG thumbnail for a specific map

```bash
npm run thumbnails:png-single <map-id>
```

#### Generate scenario thumbnails with entities and waypoints

```bash
npm run thumbnails:scenarios
```

#### Generate SVG thumbnails (legacy)

```bash
npm run thumbnails:generate
npm run thumbnails:single <map-id>
```

#### Direct Node.js usage

```bash
# PNG thumbnails - all maps
node tools/generatePNGThumbnails.cjs

# PNG thumbnail - specific map
node tools/generatePNGThumbnails.cjs carjan-map01

# Scenario thumbnails
node tools/generateScenarioThumbnails.cjs

# SVG thumbnails (legacy)
node tools/generateThumbnails.cjs
```

### Map Cell Types

The system now uses standardized cell type identifiers:

- `v` = **Void** - Non-traversable void area (dark gray `#2D2D2D`)
- `r` = **Road** - Drivable road surface (pastel mint green `#A8E6CF`)
- `s` = **Sidewalk** - Walkable sidewalk area (pastel blue `#B8D8F0`)

### Map Structure

Maps should follow this structure:

```json
{
  "id": "map-id",
  "name": "Map Name",
  "description": "Map description",
  "grid": {
    "dimensions": { "rows": 12, "cols": 8 },
    "mapData": [
      ["v", "v", "s", "r", "r", "s", "v", "v"]
      // ... more rows
    ]
  },
  "legend": {
    "v": {
      "name": "Void",
      "color": "#2D2D2D",
      "description": "Non-traversable void area"
    },
    "r": {
      "name": "Road",
      "color": "#A8E6CF",
      "description": "Drivable road surface"
    },
    "s": {
      "name": "Sidewalk",
      "color": "#B8D8F0",
      "description": "Walkable sidewalk area"
    }
  }
}
```

### Scenario Structure

Scenarios contain entity information and should reference a map:

```json
{
  "id": "scenario-id",
  "name": "Scenario Name",
  "description": "Scenario description",
  "mapId": "map-id",
  "entities": [
    {
      "id": "entity-1",
      "type": "vehicle",
      "position": { "x": 4, "y": 11 }
      // ... more entity properties
    }
  ],
  "waypoints": [
    {
      "id": "waypoint-1",
      "position": { "x": 2, "y": 2 }
      // ... more waypoint properties
    }
  ],
  "paths": [
    {
      "id": "path-1",
      "waypoints": ["waypoint-1", "waypoint-2"]
      // ... more path properties
    }
  ]
}
```

### Files

- `generateThumbnails.cjs` - Main thumbnail generation script
- `thumbnailService.cjs` - Service class for thumbnail generation
- This script automatically generates SVG thumbnails that match the CarjanGrid.vue styling

### Color Scheme

The thumbnail generator uses the same color scheme as CarjanGrid.vue:

- **Void**: `#2D2D2D` (Dark gray)
- **Road**: `#A8E6CF` (Pastel mint green)
- **Sidewalk**: `#B8D8F0` (Pastel blue)

Grid lines are rendered in `#555` with 50% opacity for subtle visual separation.
