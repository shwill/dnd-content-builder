const API_URL = 'http://localhost:3100/api';

let currentMonsterId = null;
let sensesList = [];
let languagesList = [];

// DOM Elements
const monsterList = document.getElementById('monsterList');
const monsterForm = document.getElementById('monsterForm');
const form = document.getElementById('monster-form');
const newMonsterBtn = document.getElementById('newMonsterBtn');
const cancelBtn = document.getElementById('cancelBtn');
const cancelBtnBottom = document.getElementById('cancelBtnBottom');
const formTitle = document.getElementById('formTitle');

// Skill to ability mapping
const skillAbilities = {
  acrobatics: 'dex',
  animalHandling: 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  sleightOfHand: 'dex',
  stealth: 'dex',
  survival: 'wis'
};

// Initialize
loadMonsters();

// Event Listeners
newMonsterBtn.addEventListener('click', showNewMonsterForm);
cancelBtn.addEventListener('click', hideForm);
cancelBtnBottom.addEventListener('click', hideForm);
form.addEventListener('submit', handleSubmit);

// Ability score change listeners
['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
  document.getElementById(ability).addEventListener('input', updateSavesAndSkills);
});
document.getElementById('profBonus').addEventListener('input', updateSavesAndSkills);

// Senses and languages
document.getElementById('addSenseBtn').addEventListener('click', addSense);
document.getElementById('addLanguageBtn').addEventListener('click', addLanguage);

// Helper functions
function calcModifier(score) {
  if (!score) return 0;
  return Math.floor((score - 10) / 2);
}

function formatBonus(bonus) {
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}

function updateSavesAndSkills() {
  const profBonus = parseInt(document.getElementById('profBonus').value) || 0;

  // Update saves
  const abilities = {
    str: parseInt(document.getElementById('str').value) || 10,
    dex: parseInt(document.getElementById('dex').value) || 10,
    con: parseInt(document.getElementById('con').value) || 10,
    int: parseInt(document.getElementById('int').value) || 10,
    wis: parseInt(document.getElementById('wis').value) || 10,
    cha: parseInt(document.getElementById('cha').value) || 10
  };

  // Update save displays
  Object.keys(abilities).forEach(ability => {
    const modifier = calcModifier(abilities[ability]);
    const proficiency = document.getElementById(`${ability}SaveProf`).value;
    let bonus = modifier;

    if (proficiency === 'proficient') bonus += profBonus;
    if (proficiency === 'expert') bonus += profBonus * 2;

    document.getElementById(`${ability}SaveDisplay`).textContent = formatBonus(bonus);
  });

  // Update skill displays
  Object.keys(skillAbilities).forEach(skill => {
    const ability = skillAbilities[skill];
    const modifier = calcModifier(abilities[ability]);
    const proficiency = document.getElementById(`${skill}Prof`).value;
    let bonus = modifier;

    if (proficiency === 'proficient') bonus += profBonus;
    if (proficiency === 'expert') bonus += profBonus * 2;

    document.getElementById(`${skill}Display`).textContent = formatBonus(bonus);
  });
}

// Add proficiency change listeners
['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
  document.getElementById(`${ability}SaveProf`).addEventListener('change', updateSavesAndSkills);
});

Object.keys(skillAbilities).forEach(skill => {
  document.getElementById(`${skill}Prof`).addEventListener('change', updateSavesAndSkills);
});

// Senses management
function addSense() {
  const type = document.getElementById('senseType').value;
  const range = document.getElementById('senseRange').value;
  const qualifier = document.getElementById('senseQualifier').value;

  if (!type || !range) {
    alert('Please select a sense type and enter a range/value');
    return;
  }

  let senseText = '';
  if (type === 'passive Perception') {
    senseText = `passive Perception ${range}`;
  } else {
    senseText = `${type} ${range} ft.`;
    if (qualifier) {
      senseText += ` (${qualifier})`;
    }
  }

  sensesList.push(senseText);
  renderSenses();

  // Clear inputs
  document.getElementById('senseType').value = '';
  document.getElementById('senseRange').value = '';
  document.getElementById('senseQualifier').value = '';
}

function removeSense(index) {
  sensesList.splice(index, 1);
  renderSenses();
}

function renderSenses() {
  const container = document.getElementById('sensesList');
  if (sensesList.length === 0) {
    container.innerHTML = '<p class="text-muted" style="margin: 0;">No senses added</p>';
    return;
  }

  container.innerHTML = sensesList.map((sense, index) => `
    <div class="tag">
      <span>${sense}</span>
      <button type="button" onclick="removeSense(${index})">×</button>
    </div>
  `).join('');
}

// Languages management
function addLanguage() {
  const language = document.getElementById('languageSelect').value;
  const qualifier = document.getElementById('languageQualifier').value;
  const telepathyRange = document.getElementById('telepathyRange').value;

  if (!language) {
    alert('Please select a language');
    return;
  }

  let languageText = language;

  if (language === 'Telepathy' && telepathyRange) {
    languageText = `Telepathy ${telepathyRange} ft.`;
  } else if (qualifier) {
    languageText += ` (${qualifier})`;
  }

  languagesList.push(languageText);
  renderLanguages();

  // Clear inputs
  document.getElementById('languageSelect').value = '';
  document.getElementById('languageQualifier').value = '';
  document.getElementById('telepathyRange').value = '';
}

function removeLanguage(index) {
  languagesList.splice(index, 1);
  renderLanguages();
}

function renderLanguages() {
  const container = document.getElementById('languagesList');
  if (languagesList.length === 0) {
    container.innerHTML = '<p class="text-muted" style="margin: 0;">No languages added</p>';
    return;
  }

  container.innerHTML = languagesList.map((language, index) => `
    <div class="tag">
      <span>${language}</span>
      <button type="button" onclick="removeLanguage(${index})">×</button>
    </div>
  `).join('');
}

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
  sensesList = [];
  languagesList = [];
  renderSenses();
  renderLanguages();
  updateSavesAndSkills();
  monsterList.style.display = 'none';
  monsterForm.style.display = 'block';
}

// Hide form
function hideForm() {
  monsterForm.style.display = 'none';
  monsterList.style.display = 'block';
  form.reset();
  sensesList = [];
  languagesList = [];
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

    // Speed
    document.getElementById('speedWalk').value = monster.speed?.walk || '';
    document.getElementById('speedFly').value = monster.speed?.fly || '';
    document.getElementById('speedSwim').value = monster.speed?.swim || '';
    document.getElementById('speedBurrow').value = monster.speed?.burrow || '';
    document.getElementById('speedClimb').value = monster.speed?.climb || '';

    document.getElementById('cr').value = monster.challengeRating?.rating || '';
    document.getElementById('xp').value = monster.challengeRating?.xp || '';

    // Proficiency bonus
    document.getElementById('profBonus').value = monster.proficiencyBonus || 2;

    // Abilities
    document.getElementById('str').value = monster.abilities?.strength?.score || '';
    document.getElementById('dex').value = monster.abilities?.dexterity?.score || '';
    document.getElementById('con').value = monster.abilities?.constitution?.score || '';
    document.getElementById('int').value = monster.abilities?.intelligence?.score || '';
    document.getElementById('wis').value = monster.abilities?.wisdom?.score || '';
    document.getElementById('cha').value = monster.abilities?.charisma?.score || '';

    // Load saves
    const abilityMap = {
      str: 'strength',
      dex: 'dexterity',
      con: 'constitution',
      int: 'intelligence',
      wis: 'wisdom',
      cha: 'charisma'
    };

    Object.keys(abilityMap).forEach(short => {
      const fullName = abilityMap[short];
      const saveData = monster.abilities?.[fullName]?.save;
      if (saveData && saveData.proficiency) {
        document.getElementById(`${short}SaveProf`).value = saveData.proficiency;
      }
    });

    // Load skills
    if (monster.skills) {
      Object.keys(monster.skills).forEach(skillName => {
        const skill = monster.skills[skillName];
        if (skill.proficiency) {
          document.getElementById(`${skillName}Prof`).value = skill.proficiency;
        }
      });
    }

    // Update displays
    updateSavesAndSkills();

    // Senses
    sensesList = monster.senses || [];
    renderSenses();

    // Languages
    languagesList = monster.languages || [];
    renderLanguages();

    // Additional details
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

  // Build speed object
  const speed = {};
  const walkSpeed = parseInt(document.getElementById('speedWalk').value);
  const flySpeed = parseInt(document.getElementById('speedFly').value);
  const swimSpeed = parseInt(document.getElementById('speedSwim').value);
  const burrowSpeed = parseInt(document.getElementById('speedBurrow').value);
  const climbSpeed = parseInt(document.getElementById('speedClimb').value);

  if (walkSpeed) speed.walk = walkSpeed;
  if (flySpeed) speed.fly = flySpeed;
  if (swimSpeed) speed.swim = swimSpeed;
  if (burrowSpeed) speed.burrow = burrowSpeed;
  if (climbSpeed) speed.climb = climbSpeed;

  // Build monster data
  const str = parseInt(document.getElementById('str').value) || null;
  const dex = parseInt(document.getElementById('dex').value) || null;
  const con = parseInt(document.getElementById('con').value) || null;
  const int = parseInt(document.getElementById('int').value) || null;
  const wis = parseInt(document.getElementById('wis').value) || null;
  const cha = parseInt(document.getElementById('cha').value) || null;
  const profBonus = parseInt(document.getElementById('profBonus').value) || 2;

  // Build abilities with saves
  const abilityMap = {
    str: { name: 'strength', score: str },
    dex: { name: 'dexterity', score: dex },
    con: { name: 'constitution', score: con },
    int: { name: 'intelligence', score: int },
    wis: { name: 'wisdom', score: wis },
    cha: { name: 'charisma', score: cha }
  };

  const abilities = {};
  Object.keys(abilityMap).forEach(short => {
    const { name, score } = abilityMap[short];
    if (score) {
      const modifier = calcModifier(score);
      const saveProf = document.getElementById(`${short}SaveProf`).value;
      let saveBonus = modifier;

      if (saveProf === 'proficient') saveBonus += profBonus;
      if (saveProf === 'expert') saveBonus += profBonus * 2;

      abilities[name] = {
        score,
        modifier,
        save: saveProf !== 'none' ? {
          bonus: saveBonus,
          proficiency: saveProf
        } : null
      };
    }
  });

  // Build skills
  const skills = {};
  Object.keys(skillAbilities).forEach(skill => {
    const proficiency = document.getElementById(`${skill}Prof`).value;
    if (proficiency !== 'none') {
      const ability = skillAbilities[skill];
      const abilityScore = parseInt(document.getElementById(ability).value) || 10;
      const modifier = calcModifier(abilityScore);
      let bonus = modifier;

      if (proficiency === 'proficient') bonus += profBonus;
      if (proficiency === 'expert') bonus += profBonus * 2;

      skills[skill] = {
        bonus,
        proficiency
      };
    }
  });

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
      speed: Object.keys(speed).length > 0 ? speed : null,
      proficiencyBonus: profBonus,
      initiative: dex ? calcModifier(dex) : null,
      abilities: Object.keys(abilities).length > 0 ? abilities : null,
      skills: Object.keys(skills).length > 0 ? skills : null,
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
      senses: sensesList.length > 0 ? sensesList : null,
      languages: languagesList.length > 0 ? languagesList : null,
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
window.removeSense = removeSense;
window.removeLanguage = removeLanguage;
