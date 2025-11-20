const API_URL = 'http://localhost:3100/api';

let currentMonsterId = null;

// DOM Elements
const monsterList = document.getElementById('monsterList');
const monsterForm = document.getElementById('monsterForm');
const form = document.getElementById('monster-form');
const newMonsterBtn = document.getElementById('newMonsterBtn');
const cancelBtn = document.getElementById('cancelBtn');
const cancelBtnBottom = document.getElementById('cancelBtnBottom');
const formTitle = document.getElementById('formTitle');

// Initialize
loadMonsters();

// Event Listeners
newMonsterBtn.addEventListener('click', showNewMonsterForm);
cancelBtn.addEventListener('click', hideForm);
cancelBtnBottom.addEventListener('click', hideForm);
form.addEventListener('submit', handleSubmit);

// Load all monsters
async function loadMonsters() {
  try {
    const response = await fetch(`${API_URL}/monsters`);
    const monsters = await response.json();

    if (monsters.length === 0) {
      monsterList.innerHTML = '<p class="text-muted text-center">No monsters yet. Create your first one!</p>';
      return;
    }

    monsterList.innerHTML = monsters.map(monster => `
      <div class="content-item">
        <div class="content-item-info">
          <h3>${monster.monster.name}</h3>
          <p>${monster.monster.size || 'Unknown'} ${monster.monster.type || 'Creature'} • CR ${monster.monster.challengeRating?.rating || '—'}</p>
        </div>
        <div class="content-item-actions">
          <button class="btn btn-small btn-secondary" onclick="editMonster('${monster.id}')">Edit</button>
          <button class="btn btn-small btn-success" onclick="duplicateMonster('${monster.id}')">Duplicate</button>
          <button class="btn btn-small btn-danger" onclick="deleteMonster('${monster.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading monsters:', error);
    monsterList.innerHTML = '<p class="text-danger">Error loading monsters. Make sure the server is running.</p>';
  }
}

// Show new monster form
function showNewMonsterForm() {
  currentMonsterId = null;
  formTitle.textContent = 'New Monster';
  form.reset();
  monsterList.style.display = 'none';
  monsterForm.style.display = 'block';
}

// Hide form
function hideForm() {
  monsterForm.style.display = 'none';
  monsterList.style.display = 'block';
  form.reset();
  currentMonsterId = null;
}

// Edit monster
async function editMonster(id) {
  try {
    const response = await fetch(`${API_URL}/monsters/${id}`);
    const data = await response.json();
    const monster = data.monster;

    currentMonsterId = id;
    formTitle.textContent = 'Edit Monster';

    // Populate form
    document.getElementById('name').value = monster.name || '';
    document.getElementById('size').value = monster.size || '';
    document.getElementById('type').value = monster.type || '';
    document.getElementById('subType').value = monster.subType || '';
    document.getElementById('alignment').value = monster.alignment || '';

    // Combat stats
    document.getElementById('ac').value = monster.armor?.ac || '';
    document.getElementById('armorType').value = monster.armor?.type || '';
    document.getElementById('hp').value = monster.hitPoints?.hp || '';
    document.getElementById('hpFormula').value = monster.hitPoints?.formula || '';
    document.getElementById('speed').value = monster.speed ? JSON.stringify(monster.speed) : '';
    document.getElementById('cr').value = monster.challengeRating?.rating || '';
    document.getElementById('xp').value = monster.challengeRating?.xp || '';

    // Abilities
    document.getElementById('str').value = monster.abilities?.strength?.score || '';
    document.getElementById('dex').value = monster.abilities?.dexterity?.score || '';
    document.getElementById('con').value = monster.abilities?.constitution?.score || '';
    document.getElementById('int').value = monster.abilities?.intelligence?.score || '';
    document.getElementById('wis').value = monster.abilities?.wisdom?.score || '';
    document.getElementById('cha').value = monster.abilities?.charisma?.score || '';

    // Additional details
    document.getElementById('languages').value = monster.languages?.join(', ') || '';
    document.getElementById('senses').value = monster.senses?.join(', ') || '';
    document.getElementById('damageResistances').value = monster.damageResistances?.join(', ') || '';
    document.getElementById('damageImmunities').value = monster.damageImmunities?.join(', ') || '';
    document.getElementById('conditionImmunities').value = monster.conditionImmunities?.join(', ') || '';

    monsterList.style.display = 'none';
    monsterForm.style.display = 'block';
  } catch (error) {
    console.error('Error loading monster:', error);
    alert('Error loading monster');
  }
}

// Delete monster
async function deleteMonster(id) {
  if (!confirm('Are you sure you want to delete this monster?')) {
    return;
  }

  try {
    await fetch(`${API_URL}/monsters/${id}`, { method: 'DELETE' });
    loadMonsters();
  } catch (error) {
    console.error('Error deleting monster:', error);
    alert('Error deleting monster');
  }
}

// Duplicate monster
async function duplicateMonster(id) {
  try {
    await fetch(`${API_URL}/monsters/${id}/duplicate`, { method: 'POST' });
    loadMonsters();
  } catch (error) {
    console.error('Error duplicating monster:', error);
    alert('Error duplicating monster');
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();

  const calcModifier = (score) => {
    if (!score) return null;
    return Math.floor((score - 10) / 2);
  };

  // Parse speed JSON
  let speed = null;
  const speedValue = document.getElementById('speed').value.trim();
  if (speedValue) {
    try {
      speed = JSON.parse(speedValue);
    } catch (e) {
      alert('Invalid speed format. Use JSON like {"walk": 30, "fly": 60}');
      return;
    }
  }

  // Build monster data
  const str = parseInt(document.getElementById('str').value) || null;
  const dex = parseInt(document.getElementById('dex').value) || null;
  const con = parseInt(document.getElementById('con').value) || null;
  const int = parseInt(document.getElementById('int').value) || null;
  const wis = parseInt(document.getElementById('wis').value) || null;
  const cha = parseInt(document.getElementById('cha').value) || null;

  const monsterData = {
    monster: {
      name: document.getElementById('name').value,
      size: document.getElementById('size').value || null,
      type: document.getElementById('type').value || null,
      subType: document.getElementById('subType').value || null,
      alignment: document.getElementById('alignment').value || null,
      armor: {
        ac: parseInt(document.getElementById('ac').value) || null,
        type: document.getElementById('armorType').value || null
      },
      hitPoints: {
        hp: parseInt(document.getElementById('hp').value) || null,
        formula: document.getElementById('hpFormula').value || null
      },
      speed,
      proficiencyBonus: null,
      initiative: dex ? calcModifier(dex) : null,
      abilities: {
        strength: str ? { score: str, modifier: calcModifier(str) } : null,
        dexterity: dex ? { score: dex, modifier: calcModifier(dex) } : null,
        constitution: con ? { score: con, modifier: calcModifier(con) } : null,
        intelligence: int ? { score: int, modifier: calcModifier(int) } : null,
        wisdom: wis ? { score: wis, modifier: calcModifier(wis) } : null,
        charisma: cha ? { score: cha, modifier: calcModifier(cha) } : null
      },
      skills: null,
      damageResistances: document.getElementById('damageResistances').value
        ? document.getElementById('damageResistances').value.split(',').map(s => s.trim())
        : null,
      damageImmunities: document.getElementById('damageImmunities').value
        ? document.getElementById('damageImmunities').value.split(',').map(s => s.trim())
        : null,
      damageVulnerabilities: null,
      conditionImmunities: document.getElementById('conditionImmunities').value
        ? document.getElementById('conditionImmunities').value.split(',').map(s => s.trim())
        : null,
      senses: document.getElementById('senses').value
        ? document.getElementById('senses').value.split(',').map(s => s.trim())
        : null,
      languages: document.getElementById('languages').value
        ? document.getElementById('languages').value.split(',').map(s => s.trim())
        : null,
      challengeRating: {
        rating: parseFloat(document.getElementById('cr').value) || null,
        xp: parseInt(document.getElementById('xp').value) || null
      },
      traits: null,
      actions: null,
      bonusActions: null,
      reactions: null,
      legendaryActions: null,
      legendaryActionsIntro: null,
      mythicActions: null,
      lairActions: null,
      meta: {
        url: '',
        timestamp: new Date().toISOString(),
        sourceVersion: '1.0.0',
        edition: null,
        tags: null,
        habitat: null,
        source: null
      }
    }
  };

  try {
    const url = currentMonsterId
      ? `${API_URL}/monsters/${currentMonsterId}`
      : `${API_URL}/monsters`;
    const method = currentMonsterId ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(monsterData)
    });

    hideForm();
    loadMonsters();
  } catch (error) {
    console.error('Error saving monster:', error);
    alert('Error saving monster');
  }
}

// Make functions global
window.editMonster = editMonster;
window.deleteMonster = deleteMonster;
window.duplicateMonster = duplicateMonster;
