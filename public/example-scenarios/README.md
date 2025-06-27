# CARJAN Beispielszenarien

Dieser Ordner enthält Beispielszenarien für die neue CARJAN-app Storage-Architektur.

## 🚀 Verwendung der neuen Architektur

### 1. App starten

```bash
npm run dev
```

### 2. Szenario laden

1. Klicken Sie auf "Open" in der FileManagerToolbar (oder `Ctrl+O`)
2. Navigieren Sie zu `example-scenarios/`
3. Wählen Sie eine `.json` Datei aus
4. Das Szenario wird automatisch in die App geladen

### 3. Arbeiten mit Szenarien

- **Auto-Save**: Läuft automatisch alle 5 Sekunden
- **Speichern**: `Ctrl+S` oder "Save" Button
- **Speichern unter**: `Ctrl+Shift+S` oder "Save As" Button
- **Neu**: `Ctrl+N` oder "New" Button

### 4. Export-Optionen

- **JSON Export**: Standard-Format für CARJAN
- **Python Export**: Direkt für CARLA verwendbar

### 5. CARLA Live-Integration (optional)

1. CARLA starten: `./CarlaUE4.exe`
2. CARLA Bridge starten: `./start_carla_bridge.bat`
3. In CARJAN: LiveStreaming Panel → "Connect"
4. Änderungen werden real-time an CARLA übertragen

## 📁 Verfügbare Szenarien

### 1. `urban-intersection.json`

**Beschreibung**: Stadtkreuzung mit Fußgängern und Fahrzeugen

- **Entities**: 2 Fahrzeuge, 2 Fußgänger
- **Paths**: Fahrzeugstrecke und Fußgängerüberweg
- **Map Type**: Urban intersection with mixed traffic

### 2. `highway-overtaking.json`

**Beschreibung**: Autobahn-Überholmanöver

- **Entities**: 5 Fahrzeuge (fast car, slow truck, highway traffic)
- **Paths**: Rechte Spur, linke Spur, Überholmanöver
- **Map Type**: Multi-lane highway scenario

### 3. `parking-lot.json`

**Beschreibung**: Parkplatz-Manöver

- **Entities**: 1 parkendes Fahrzeug, 3 geparkte Autos, 1 Fußgänger
- **Paths**: Einparkmanöver und Fußgängerweg
- **Map Type**: Parking lot with obstacles

## 🔧 Datenformat-Erklärung

### Grid Data Format

- `"r"` = Road (Straße)
- `"v"` = Void/Building (Gebäude/Hindernis)
- `"p"` = Parking/Sidewalk (Parkplatz/Gehweg)

### Entity Types

- `"vehicle"` = Fahrzeug
- `"pedestrian"` = Fußgänger
- `"autonomous"` = Autonomes Fahrzeug
- `"obstacle"` = Hindernis

### Heading Directions

- `"North"`, `"North-East"`, `"East"`, `"South-East"`
- `"South"`, `"South-West"`, `"West"`, `"North-West"`

## 🎨 Farben

Entities und Paths können mit Hex-Farben versehen werden:

- `#2196F3` = Blau (Fahrzeuge)
- `#4CAF50` = Grün (Fußgänger)
- `#F44336` = Rot (Notfall/Gefahr)
- `#FF9800` = Orange (LKW/langsame Fahrzeuge)
- `#E91E63` = Pink (Schnelle Fahrzeuge)
- `#9C27B0` = Lila (Entgegenkommender Verkehr)

## 📝 Eigene Szenarien erstellen

### Methode 1: In der App

1. "New" klicken
2. Szenario-Name eingeben
3. Grid bearbeiten, Entities platzieren, Paths zeichnen
4. "Save As" für eigene Datei

### Methode 2: JSON bearbeiten

1. Bestehende `.json` Datei kopieren
2. `metadata` anpassen (Name, Beschreibung)
3. `mapData` für Grid-Layout ändern
4. `entities` und `paths` nach Bedarf anpassen

### Koordinatensystem

- **X-Achse**: Zeilen (vertikal, 0-11)
- **Y-Achse**: Spalten (horizontal, 0-7)
- **Origin**: Oben links (0,0)

## 🐛 Troubleshooting

### Szenario lädt nicht

- Prüfen Sie die JSON-Syntax (online JSON-Validator verwenden)
- Koordinaten müssen innerhalb der Grid-Dimensionen liegen
- Alle IDs müssen eindeutig sein

### CARLA Integration funktioniert nicht

1. CARLA läuft? (`localhost:2000`)
2. CARLA Bridge läuft? (`localhost:8765`)
3. Firewall-Einstellungen prüfen
4. Python-Dependencies installiert? (`pip install -r requirements.txt`)

### Auto-Save funktioniert nicht

- Browser localStorage aktiviert?
- Schreibrechte im Projektordner?
- Console-Logs auf Fehler prüfen

## 💡 Tipps

1. **Performance**: Große Grids (>20x20) können langsam werden
2. **Paths**: Mindestens 2 Waypoints pro Path erforderlich
3. **Colors**: Verwenden Sie aussagekräftige Farben für verschiedene Entity-Typen
4. **Testing**: Testen Sie Szenarien erst in CARJAN, dann in CARLA
5. **Backup**: Auto-Save als Backup, trotzdem regelmäßig manuell speichern

## 🔄 Migration vom alten System

Falls Sie alte RDF/AJAN-Szenarien haben:

1. Exportieren Sie diese als JSON aus dem alten System
2. Passen Sie das Format an die neue Struktur an
3. Verwenden Sie die Beispielszenarien als Vorlage
