# D&D Content Builder

A simple web application for creating and managing D&D monsters and spells. Content is stored as individual JSON files following the D&D Beyond schema format.

## Features

- **Monster Builder**: Create custom monsters with:
  - Basic info (size, type, alignment)
  - Combat stats (AC, HP, CR)
  - Ability scores
  - Senses, languages, resistances, immunities
  - Quick dropdowns for common D&D values

- **Spell Builder**: Create custom spells with:
  - Spell level and school of magic
  - Casting details (time, range, duration, components)
  - Spell effects and damage types
  - Quick selects for common options

- **Content Management**: Edit, delete, and duplicate any monster or spell
- **Local Storage**: All content saved as JSON files in `/data/monsters` and `/data/spells`

## Tech Stack

- **Server**: Node.js + Express
- **Client**: Vanilla HTML/CSS/JavaScript
- **Storage**: Local JSON files

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm

### Setup

1. Install server dependencies:
```bash
cd server
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Creating a Monster

1. Click "Manage Monsters"
2. Click "+ New Monster"
3. Fill in the form:
   - **Required**: Name
   - **Optional**: All other fields
   - Use dropdowns for common D&D values (size, type, alignment, etc.)
   - Enter ability scores to auto-calculate modifiers
   - Use JSON format for speed: `{"walk": 30, "fly": 60}`
4. Click "Save Monster"

### Creating a Spell

1. Click "Manage Spells"
2. Click "+ New Spell"
3. Fill in the form:
   - **Required**: Name, Description
   - **Optional**: All other fields
   - Select spell level (0-9)
   - Choose school of magic
   - Set components (V, S, M)
   - Add classes that can cast it
4. Click "Save Spell"

### Managing Content

- **Edit**: Click "Edit" button on any item to modify
- **Duplicate**: Click "Duplicate" to create a copy (adds "(Copy)" to name)
- **Delete**: Click "Delete" to remove (requires confirmation)

## File Structure

```
/server
  - server.js          # Express server with REST API
  - package.json       # Server dependencies

/client
  - index.html         # Home page
  - monsters.html      # Monster management page
  - spells.html        # Spell management page
  - style.css          # Shared styles
  - monsters.js        # Monster management logic
  - spells.js          # Spell management logic

/data
  - monsters/          # Monster JSON files
  - spells/            # Spell JSON files

/schema
  - monster.schema.json  # Monster JSON schema
  - spell.schema.json    # Spell JSON schema
```

## API Endpoints

### Monsters
- `GET /api/monsters` - List all monsters
- `GET /api/monsters/:id` - Get single monster
- `POST /api/monsters` - Create monster
- `PUT /api/monsters/:id` - Update monster
- `DELETE /api/monsters/:id` - Delete monster
- `POST /api/monsters/:id/duplicate` - Duplicate monster

### Spells
- `GET /api/spells` - List all spells
- `GET /api/spells/:id` - Get single spell
- `POST /api/spells` - Create spell
- `PUT /api/spells/:id` - Update spell
- `DELETE /api/spells/:id` - Delete spell
- `POST /api/spells/:id/duplicate` - Duplicate spell

## Data Format

Content is stored according to the schemas in `/schema`:
- Monsters follow `monster.schema.json`
- Spells follow `spell.schema.json`

Files are saved as:
- `/data/monsters/{name-slug}.json`
- `/data/spells/{name-slug}.json`

## Tips

- Use the dropdowns to quickly fill in common D&D values
- Ability scores automatically calculate modifiers
- Speed uses JSON format: `{"walk": 30}` for simple, `{"walk": 30, "fly": 60}` for multiple
- Comma-separated lists work for: languages, senses, resistances, immunities, classes, tags
- Duplicate existing content as a starting point for similar creatures/spells

## Development

To modify the app:

1. Server changes: Edit `/server/server.js` and restart
2. Client changes: Edit HTML/CSS/JS in `/client` (auto-reload in browser)
3. Schema changes: Update `/schema/*.schema.json`

## License

MIT
