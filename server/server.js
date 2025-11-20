const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Data directories
const DATA_DIR = path.join(__dirname, '../data');
const MONSTERS_DIR = path.join(DATA_DIR, 'monsters');
const SPELLS_DIR = path.join(DATA_DIR, 'spells');

// Ensure data directories exist
async function ensureDirectories() {
  await fs.mkdir(MONSTERS_DIR, { recursive: true });
  await fs.mkdir(SPELLS_DIR, { recursive: true });
}

// Helper to generate filename-safe ID from name
function generateId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ===== MONSTER ENDPOINTS =====

// Get all monsters
app.get('/api/monsters', async (req, res) => {
  try {
    const files = await fs.readdir(MONSTERS_DIR);
    const monsters = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async file => {
          const content = await fs.readFile(path.join(MONSTERS_DIR, file), 'utf8');
          return { id: file.replace('.json', ''), ...JSON.parse(content) };
        })
    );
    res.json(monsters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single monster
app.get('/api/monsters/:id', async (req, res) => {
  try {
    const content = await fs.readFile(
      path.join(MONSTERS_DIR, `${req.params.id}.json`),
      'utf8'
    );
    res.json({ id: req.params.id, ...JSON.parse(content) });
  } catch (error) {
    res.status(404).json({ error: 'Monster not found' });
  }
});

// Create monster
app.post('/api/monsters', async (req, res) => {
  try {
    const data = req.body;
    const id = generateId(data.monster.name);
    const filename = path.join(MONSTERS_DIR, `${id}.json`);

    // Add metadata
    if (!data.monster.meta) {
      data.monster.meta = {};
    }
    data.monster.meta.timestamp = new Date().toISOString();
    data.monster.meta.sourceVersion = '1.0.0';
    data.monster.meta.url = '';

    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    res.json({ id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update monster
app.put('/api/monsters/:id', async (req, res) => {
  try {
    const data = req.body;
    const filename = path.join(MONSTERS_DIR, `${req.params.id}.json`);

    // Update timestamp
    if (!data.monster.meta) {
      data.monster.meta = {};
    }
    data.monster.meta.timestamp = new Date().toISOString();

    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    res.json({ id: req.params.id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete monster
app.delete('/api/monsters/:id', async (req, res) => {
  try {
    await fs.unlink(path.join(MONSTERS_DIR, `${req.params.id}.json`));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Duplicate monster
app.post('/api/monsters/:id/duplicate', async (req, res) => {
  try {
    const content = await fs.readFile(
      path.join(MONSTERS_DIR, `${req.params.id}.json`),
      'utf8'
    );
    const data = JSON.parse(content);

    // Modify name and generate new ID
    data.monster.name = `${data.monster.name} (Copy)`;
    const newId = generateId(data.monster.name) + '-' + Date.now();

    // Update metadata
    data.monster.meta.timestamp = new Date().toISOString();

    const filename = path.join(MONSTERS_DIR, `${newId}.json`);
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    res.json({ id: newId, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== SPELL ENDPOINTS =====

// Get all spells
app.get('/api/spells', async (req, res) => {
  try {
    const files = await fs.readdir(SPELLS_DIR);
    const spells = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async file => {
          const content = await fs.readFile(path.join(SPELLS_DIR, file), 'utf8');
          return { id: file.replace('.json', ''), ...JSON.parse(content) };
        })
    );
    res.json(spells);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single spell
app.get('/api/spells/:id', async (req, res) => {
  try {
    const content = await fs.readFile(
      path.join(SPELLS_DIR, `${req.params.id}.json`),
      'utf8'
    );
    res.json({ id: req.params.id, ...JSON.parse(content) });
  } catch (error) {
    res.status(404).json({ error: 'Spell not found' });
  }
});

// Create spell
app.post('/api/spells', async (req, res) => {
  try {
    const data = req.body;
    const id = generateId(data.spell.name);
    const filename = path.join(SPELLS_DIR, `${id}.json`);

    // Add metadata
    if (!data.spell.meta) {
      data.spell.meta = {};
    }
    data.spell.meta.timestamp = new Date().toISOString();
    data.spell.meta.sourceVersion = '1.0.0';
    data.spell.meta.url = '';

    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    res.json({ id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update spell
app.put('/api/spells/:id', async (req, res) => {
  try {
    const data = req.body;
    const filename = path.join(SPELLS_DIR, `${req.params.id}.json`);

    // Update timestamp
    if (!data.spell.meta) {
      data.spell.meta = {};
    }
    data.spell.meta.timestamp = new Date().toISOString();

    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    res.json({ id: req.params.id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete spell
app.delete('/api/spells/:id', async (req, res) => {
  try {
    await fs.unlink(path.join(SPELLS_DIR, `${req.params.id}.json`));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Duplicate spell
app.post('/api/spells/:id/duplicate', async (req, res) => {
  try {
    const content = await fs.readFile(
      path.join(SPELLS_DIR, `${req.params.id}.json`),
      'utf8'
    );
    const data = JSON.parse(content);

    // Modify name and generate new ID
    data.spell.name = `${data.spell.name} (Copy)`;
    const newId = generateId(data.spell.name) + '-' + Date.now();

    // Update metadata
    data.spell.meta.timestamp = new Date().toISOString();

    const filename = path.join(SPELLS_DIR, `${newId}.json`);
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    res.json({ id: newId, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
ensureDirectories().then(() => {
  app.listen(PORT, () => {
    console.log(`D&D Content Builder server running on http://localhost:${PORT}`);
  });
});
