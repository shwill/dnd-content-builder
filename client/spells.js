const API_URL = 'http://localhost:3100/api';

let currentSpellId = null;

// DOM Elements
const spellList = document.getElementById('spellList');
const spellForm = document.getElementById('spellForm');
const form = document.getElementById('spell-form');
const newSpellBtn = document.getElementById('newSpellBtn');
const cancelBtn = document.getElementById('cancelBtn');
const cancelBtnBottom = document.getElementById('cancelBtnBottom');
const formTitle = document.getElementById('formTitle');

// Initialize
loadSpells();

// Event Listeners
newSpellBtn.addEventListener('click', showNewSpellForm);
cancelBtn.addEventListener('click', hideForm);
cancelBtnBottom.addEventListener('click', hideForm);
form.addEventListener('submit', handleSubmit);

// Markdown preview listeners
document.getElementById('description').addEventListener('input', function() {
  updateMarkdownPreview('description', 'descriptionPreview');
});
document.getElementById('higherLevels').addEventListener('input', function() {
  updateMarkdownPreview('higherLevels', 'higherLevelsPreview');
});

// Helper function for markdown preview
function updateMarkdownPreview(textareaId, previewId) {
  const textarea = document.getElementById(textareaId);
  const preview = document.getElementById(previewId);
  const text = textarea.value.trim();

  if (!text) {
    preview.innerHTML = '';
    return;
  }

  // Use marked.js to convert markdown to HTML
  preview.innerHTML = marked.parse(text);
}

// Load all spells
async function loadSpells() {
  try {
    const response = await fetch(`${API_URL}/spells`);
    const spells = await response.json();

    if (spells.length === 0) {
      spellList.innerHTML = '<p class="text-muted text-center">No spells yet. Create your first one!</p>';
      return;
    }

    spellList.innerHTML = spells.map(spell => {
      const level = spell.spell.level === 0 ? 'Cantrip' : `Level ${spell.spell.level}`;
      const school = spell.spell.school ? spell.spell.school.charAt(0).toUpperCase() + spell.spell.school.slice(1) : '';
      return `
        <div class="content-item">
          <div class="content-item-info">
            <h3>${spell.spell.name}</h3>
            <p>${level}${school ? ' • ' + school : ''}</p>
          </div>
          <div class="content-item-actions">
            <button class="btn btn-small btn-secondary" onclick="editSpell('${spell.id}')">Edit</button>
            <button class="btn btn-small btn-success" onclick="duplicateSpell('${spell.id}')">Duplicate</button>
            <button class="btn btn-small btn-danger" onclick="deleteSpell('${spell.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading spells:', error);
    spellList.innerHTML = '<p class="text-danger">Error loading spells. Make sure the server is running.</p>';
  }
}

// Show new spell form
function showNewSpellForm() {
  currentSpellId = null;
  formTitle.textContent = 'New Spell';
  form.reset();
  document.getElementById('descriptionPreview').innerHTML = '';
  document.getElementById('higherLevelsPreview').innerHTML = '';
  spellList.style.display = 'none';
  spellForm.style.display = 'block';
}

// Hide form
function hideForm() {
  spellForm.style.display = 'none';
  spellList.style.display = 'block';
  form.reset();
  document.getElementById('descriptionPreview').innerHTML = '';
  document.getElementById('higherLevelsPreview').innerHTML = '';
  currentSpellId = null;
}

// Edit spell
async function editSpell(id) {
  try {
    const response = await fetch(`${API_URL}/spells/${id}`);
    const data = await response.json();
    const spell = data.spell;

    currentSpellId = id;
    formTitle.textContent = 'Edit Spell';

    // Populate form
    document.getElementById('name').value = spell.name || '';
    document.getElementById('level').value = spell.level !== null ? spell.level : '';
    document.getElementById('school').value = spell.school || '';
    document.getElementById('classes').value = spell.meta?.classes?.join(', ') || '';
    document.getElementById('source').value = spell.meta?.source || '';

    // Casting details
    document.getElementById('castingTime').value = spell.castingTime?.value || '';
    document.getElementById('reactionTrigger').value = spell.castingTime?.trigger || '';
    document.getElementById('range').value = spell.range || '';
    document.getElementById('duration').value = spell.duration || '';

    // Components
    document.getElementById('verbal').checked = spell.components?.verbal || false;
    document.getElementById('somatic').checked = spell.components?.somatic || false;
    document.getElementById('materialCheck').checked = !!spell.components?.material;
    document.getElementById('material').value = spell.components?.material || '';

    document.getElementById('concentration').checked = spell.concentration || false;
    document.getElementById('ritual').checked = spell.ritual || false;

    // Effects
    document.getElementById('description').value = spell.description || '';
    document.getElementById('higherLevels').value = spell.higherLevels || '';
    document.getElementById('attack').value = spell.attack || '';
    document.getElementById('save').value = spell.save || '';
    document.getElementById('damageType').value = spell.damageType?.join(', ') || '';
    document.getElementById('tags').value = spell.meta?.tags?.join(', ') || '';

    // Update markdown previews
    updateMarkdownPreview('description', 'descriptionPreview');
    updateMarkdownPreview('higherLevels', 'higherLevelsPreview');

    spellList.style.display = 'none';
    spellForm.style.display = 'block';
  } catch (error) {
    console.error('Error loading spell:', error);
    alert('Error loading spell');
  }
}

// Delete spell
async function deleteSpell(id) {
  if (!confirm('Are you sure you want to delete this spell?')) {
    return;
  }

  try {
    await fetch(`${API_URL}/spells/${id}`, { method: 'DELETE' });
    loadSpells();
  } catch (error) {
    console.error('Error deleting spell:', error);
    alert('Error deleting spell');
  }
}

// Duplicate spell
async function duplicateSpell(id) {
  try {
    await fetch(`${API_URL}/spells/${id}/duplicate`, { method: 'POST' });
    loadSpells();
  } catch (error) {
    console.error('Error duplicating spell:', error);
    alert('Error duplicating spell');
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();

  const spellData = {
    spell: {
      name: document.getElementById('name').value,
      level: document.getElementById('level').value !== ''
        ? parseInt(document.getElementById('level').value)
        : null,
      school: document.getElementById('school').value || null,
      castingTime: {
        value: document.getElementById('castingTime').value || null,
        trigger: document.getElementById('reactionTrigger').value || null
      },
      range: document.getElementById('range').value || null,
      components: {
        verbal: document.getElementById('verbal').checked,
        somatic: document.getElementById('somatic').checked,
        material: document.getElementById('material').value || null
      },
      duration: document.getElementById('duration').value || null,
      description: document.getElementById('description').value,
      concentration: document.getElementById('concentration').checked,
      ritual: document.getElementById('ritual').checked,
      attack: document.getElementById('attack').value || null,
      save: document.getElementById('save').value || null,
      damageType: document.getElementById('damageType').value
        ? document.getElementById('damageType').value.split(',').map(s => s.trim())
        : null,
      higherLevels: document.getElementById('higherLevels').value || null,
      meta: {
        url: '',
        timestamp: new Date().toISOString(),
        sourceVersion: '1.0.0',
        edition: null,
        tags: document.getElementById('tags').value
          ? document.getElementById('tags').value.split(',').map(s => s.trim())
          : [],
        source: document.getElementById('source').value || null,
        classes: document.getElementById('classes').value
          ? document.getElementById('classes').value.split(',').map(s => s.trim())
          : []
      }
    }
  };

  try {
    const url = currentSpellId
      ? `${API_URL}/spells/${currentSpellId}`
      : `${API_URL}/spells`;
    const method = currentSpellId ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spellData)
    });

    hideForm();
    loadSpells();
  } catch (error) {
    console.error('Error saving spell:', error);
    alert('Error saving spell');
  }
}

// Make functions global
window.editSpell = editSpell;
window.deleteSpell = deleteSpell;
window.duplicateSpell = duplicateSpell;
