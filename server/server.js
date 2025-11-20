const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3100;

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

// Helper to sanitize source for directory name
function sanitizeSource(source) {
  if (!source || source.trim() === '') {
    return 'uncategorized';
  }
  return source.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Helper to recursively read all JSON files from a directory
async function readAllJsonFiles(baseDir) {
  const results = [];

  async function scan(dir, sourcePath = '') {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          await scan(fullPath, sourcePath ? `${sourcePath}/${entry.name}` : entry.name);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          const content = await fs.readFile(fullPath, 'utf8');
          const id = sourcePath ? `${sourcePath}/${entry.name.replace('.json', '')}` : entry.name.replace('.json', '');
          results.push({ id, ...JSON.parse(content) });
        }
      }
    } catch (error) {
      // Directory might not exist yet, that's okay
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  await scan(baseDir);
  return results;
}

// Helper to find a file across all source directories
async function findFileById(baseDir, id) {
  // First try direct path (includes source directory)
  const directPath = path.join(baseDir, `${id}.json`);
  try {
    const content = await fs.readFile(directPath, 'utf8');
    return { path: directPath, content };
  } catch (error) {
    // Not found with direct path
  }

  // Try searching in root directory (for backwards compatibility)
  const rootPath = path.join(baseDir, `${id}.json`);
  try {
    const content = await fs.readFile(rootPath, 'utf8');
    return { path: rootPath, content };
  } catch (error) {
    throw new Error('File not found');
  }
}

// ===== MONSTER ENDPOINTS =====

// Get all monsters
app.get('/api/monsters', async (req, res) => {
  try {
    const monsters = await readAllJsonFiles(MONSTERS_DIR);
    res.json(monsters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single monster
app.get('/api/monsters/:id(*)', async (req, res) => {
  try {
    const { content } = await findFileById(MONSTERS_DIR, req.params.id);
    res.json({ id: req.params.id, ...JSON.parse(content) });
  } catch (error) {
    res.status(404).json({ error: 'Monster not found' });
  }
});

// Create monster
app.post('/api/monsters', async (req, res) => {
  try {
    const data = req.body;
    const nameId = generateId(data.monster.name);
    const sourceDir = sanitizeSource(data.monster.meta?.source);
    const id = `${sourceDir}/${nameId}`;
    const dirPath = path.join(MONSTERS_DIR, sourceDir);
    const filename = path.join(dirPath, `${nameId}.json`);

    // Ensure source directory exists
    await fs.mkdir(dirPath, { recursive: true });

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
app.put('/api/monsters/:id(*)', async (req, res) => {
  try {
    const data = req.body;
    const oldFile = await findFileById(MONSTERS_DIR, req.params.id);

    // Generate new path based on current source
    const nameId = generateId(data.monster.name);
    const sourceDir = sanitizeSource(data.monster.meta?.source);
    const newId = `${sourceDir}/${nameId}`;
    const dirPath = path.join(MONSTERS_DIR, sourceDir);
    const newFilename = path.join(dirPath, `${nameId}.json`);

    // Ensure source directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Update timestamp
    if (!data.monster.meta) {
      data.monster.meta = {};
    }
    data.monster.meta.timestamp = new Date().toISOString();

    await fs.writeFile(newFilename, JSON.stringify(data, null, 2));

    // If the file path changed, delete the old file
    if (oldFile.path !== newFilename) {
      try {
        await fs.unlink(oldFile.path);
      } catch (error) {
        // Old file already gone, that's okay
      }
    }

    res.json({ id: newId, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete monster
app.delete('/api/monsters/:id(*)', async (req, res) => {
  try {
    const { path: filePath } = await findFileById(MONSTERS_DIR, req.params.id);
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Duplicate monster
app.post('/api/monsters/:id(*)/duplicate', async (req, res) => {
  try {
    const { content } = await findFileById(MONSTERS_DIR, req.params.id);
    const data = JSON.parse(content);

    // Modify name and generate new ID
    data.monster.name = `${data.monster.name} (Copy)`;
    const nameId = generateId(data.monster.name) + '-' + Date.now();
    const sourceDir = sanitizeSource(data.monster.meta?.source);
    const newId = `${sourceDir}/${nameId}`;
    const dirPath = path.join(MONSTERS_DIR, sourceDir);
    const filename = path.join(dirPath, `${nameId}.json`);

    // Ensure source directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Update metadata
    data.monster.meta.timestamp = new Date().toISOString();

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
    const spells = await readAllJsonFiles(SPELLS_DIR);
    res.json(spells);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single spell
app.get('/api/spells/:id(*)', async (req, res) => {
  try {
    const { content } = await findFileById(SPELLS_DIR, req.params.id);
    res.json({ id: req.params.id, ...JSON.parse(content) });
  } catch (error) {
    res.status(404).json({ error: 'Spell not found' });
  }
});

// Create spell
app.post('/api/spells', async (req, res) => {
  try {
    const data = req.body;
    const nameId = generateId(data.spell.name);
    const sourceDir = sanitizeSource(data.spell.meta?.source);
    const id = `${sourceDir}/${nameId}`;
    const dirPath = path.join(SPELLS_DIR, sourceDir);
    const filename = path.join(dirPath, `${nameId}.json`);

    // Ensure source directory exists
    await fs.mkdir(dirPath, { recursive: true });

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
app.put('/api/spells/:id(*)', async (req, res) => {
  try {
    const data = req.body;
    const oldFile = await findFileById(SPELLS_DIR, req.params.id);

    // Generate new path based on current source
    const nameId = generateId(data.spell.name);
    const sourceDir = sanitizeSource(data.spell.meta?.source);
    const newId = `${sourceDir}/${nameId}`;
    const dirPath = path.join(SPELLS_DIR, sourceDir);
    const newFilename = path.join(dirPath, `${nameId}.json`);

    // Ensure source directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Update timestamp
    if (!data.spell.meta) {
      data.spell.meta = {};
    }
    data.spell.meta.timestamp = new Date().toISOString();

    await fs.writeFile(newFilename, JSON.stringify(data, null, 2));

    // If the file path changed, delete the old file
    if (oldFile.path !== newFilename) {
      try {
        await fs.unlink(oldFile.path);
      } catch (error) {
        // Old file already gone, that's okay
      }
    }

    res.json({ id: newId, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete spell
app.delete('/api/spells/:id(*)', async (req, res) => {
  try {
    const { path: filePath } = await findFileById(SPELLS_DIR, req.params.id);
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Duplicate spell
app.post('/api/spells/:id(*)/duplicate', async (req, res) => {
  try {
    const { content } = await findFileById(SPELLS_DIR, req.params.id);
    const data = JSON.parse(content);

    // Modify name and generate new ID
    data.spell.name = `${data.spell.name} (Copy)`;
    const nameId = generateId(data.spell.name) + '-' + Date.now();
    const sourceDir = sanitizeSource(data.spell.meta?.source);
    const newId = `${sourceDir}/${nameId}`;
    const dirPath = path.join(SPELLS_DIR, sourceDir);
    const filename = path.join(dirPath, `${nameId}.json`);

    // Ensure source directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Update metadata
    data.spell.meta.timestamp = new Date().toISOString();

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
