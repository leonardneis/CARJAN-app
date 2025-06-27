# CARJAN Map System

## Overview

Das Map-System ermöglicht es Benutzern, verschiedene Verkehrsszenarien zu laden und zu erstellen. Maps definieren das Layout von Straßen, Gehwegen und Void-Bereichen in einem Raster-Format.

## Map Structure

### Dateiorganisation

```
public/maps/
├── index.json              # Map-Verzeichnis
├── highway-straight.json   # Einzelne Map-Dateien
├── urban-intersection.json
├── parking-lot.json
├── highway-curve.json
├── city-roundabout.json
├── residential-street.json
└── thumbnails/            # Vorschaubilder (optional)
    ├── highway-straight.png
    └── ...
```

### Map-Format

Jede Map ist eine JSON-Datei mit folgendem Format:

```json
{
  "id": "unique-map-id",
  "name": "Human Readable Name",
  "description": "Description of the map scenario",
  "category": "Highway|Urban|Residential",
  "size": {
    "rows": 12,
    "cols": 8
  },
  "thumbnail": "/maps/thumbnails/map-name.png",
  "difficulty": "Easy|Medium|Hard",
  "recommendedEntities": ["vehicle", "pedestrian", "autonomous"],
  "spawnPoints": [
    { "x": 5, "y": 1, "type": "vehicle" },
    { "x": 6, "y": 1, "type": "autonomous" }
  ],
  "mapData": [
    ["v", "v", "p", "r", "r", "p", "v", "v"]
    // ... weitere Zeilen
  ],
  "legend": {
    "v": "void",
    "r": "road",
    "p": "path/sidewalk"
  },
  "metadata": {
    "created": "2025-06-26",
    "version": "1.0",
    "author": "CARJAN Default Maps"
  }
}
```

### Zelltypen

- **`v` (void)**: Leere Bereiche, keine Bewegung möglich
- **`r` (road)**: Straßen für Fahrzeuge
- **`p` (path)**: Gehwege für Fußgänger

## Default Maps

### 1. Highway Straight

- **Kategorie**: Highway
- **Schwierigkeit**: Easy
- **Beschreibung**: Gerade Autobahnstrecke, perfekt für Überholszenarien

### 2. Urban Intersection

- **Kategorie**: Urban
- **Schwierigkeit**: Medium
- **Beschreibung**: Komplexe Stadtkreuzung mit mehreren Straßenverbindungen

### 3. Parking Lot

- **Kategorie**: Urban
- **Schwierigkeit**: Easy
- **Beschreibung**: Parkplatz mit Fußgängerwegen, ideal für autonome Parkszenarien

### 4. Highway Curve

- **Kategorie**: Highway
- **Schwierigkeit**: Hard
- **Beschreibung**: Kurvenreiche Autobahnstrecke mit herausfordernden Kurven

### 5. City Roundabout

- **Kategorie**: Urban
- **Schwierigkeit**: Hard
- **Beschreibung**: Kreisverkehr in städtischer Umgebung

### 6. Residential Street

- **Kategorie**: Residential
- **Schwierigkeit**: Easy
- **Beschreibung**: Ruhige Wohnstraße mit Gehwegen

## Verwendung

### Im Editor

1. Öffnen Sie das Maps-Panel im CARJAN Editor
2. Wählen Sie eine Kategorie (optional)
3. Klicken Sie auf eine Map zur Auswahl
4. Klicken Sie auf "Load Selected Map"
5. Die Map wird mit Stagger-Animation geladen

### Programmatisch

```javascript
import MapService from "../services/MapService";

// Lade alle verfügbaren Maps
const mapsIndex = await MapService.loadMapsIndex();

// Lade eine spezifische Map
const mapData = await MapService.loadMap("/maps/highway-straight.json");

// Validiere Map-Daten
MapService.validateMapData(mapData);
```

## Eigene Maps erstellen

### 1. JSON-Datei erstellen

Erstellen Sie eine neue JSON-Datei nach dem oben beschriebenen Format.

### 2. Map zu index.json hinzufügen

```json
{
  "maps": [
    // ... bestehende maps
    {
      "id": "my-custom-map",
      "name": "My Custom Map",
      "description": "Custom scenario description",
      "category": "Urban",
      "difficulty": "Medium",
      "thumbnail": "/maps/thumbnails/my-custom-map.png",
      "file": "/maps/my-custom-map.json"
    }
  ]
}
```

### 3. Optional: Thumbnail erstellen

Erstellen Sie ein 80x80px Vorschaubild im `thumbnails/` Ordner.

## Validierung

Das System validiert automatisch:

- Erforderliche Felder (id, name, mapData)
- 2D-Array-Format für mapData
- Konsistente Zeilenlängen
- Gültige Zelltypen (v, r, p)

## Erweiterungen

Das Map-System kann erweitert werden für:

- **Höhendaten**: Zusätzliche Ebene für 3D-Topographie
- **Verkehrszeichen**: Spezielle Zellen für Ampeln, Schilder
- **Wetterbedingungen**: Map-spezifische Wettereinstellungen
- **Zeitbasierte Änderungen**: Dynamische Maps mit Zeitvariablen
- **Import/Export**: Benutzeroberfläche für Map-Upload/-Download
