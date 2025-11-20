const API_URL = 'http://localhost:3100/api';

let currentMonsterId = null;
let sensesList = [];
let languagesList = [];
let skillsList = [];
let traitsList = [];
let actionsList = [];
let bonusActionsList = [];
let reactionsList = [];
let legendaryActionsList = [];
let mythicActionsList = [];

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

// Skill display names
const skillNames = {
  acrobatics: 'Acrobatics',
  animalHandling: 'Animal Handling',
  arcana: 'Arcana',
  athletics: 'Athletics',
  deception: 'Deception',
  history: 'History',
  insight: 'Insight',
  intimidation: 'Intimidation',
  investigation: 'Investigation',
  medicine: 'Medicine',
  nature: 'Nature',
  perception: 'Perception',
  performance: 'Performance',
  persuasion: 'Persuasion',
  religion: 'Religion',
  sleightOfHand: 'Sleight of Hand',
  stealth: 'Stealth',
  survival: 'Survival'
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
  document.getElementById(ability).addEventListener('input', updateAbilitiesAndSkills);
});
document.getElementById('profBonus').addEventListener('input', updateAbilitiesAndSkills);

// Save click listeners (toggle proficiency)
['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
  document.getElementById(`${ability}Save`).addEventListener('click', function() {
    const current = this.getAttribute('data-prof');
    let next;

    if (current === 'none') next = 'proficient';
    else if (current === 'proficient') next = 'expert';
    else next = 'none';

    this.setAttribute('data-prof', next);
    updateAbilitiesAndSkills();
  });
});

// Initiative click listener (toggle proficiency)
document.getElementById('initiativeSave').addEventListener('click', function() {
  const current = this.getAttribute('data-prof');
  let next;

  if (current === 'none') next = 'proficient';
  else if (current === 'proficient') next = 'expert';
  else next = 'none';

  this.setAttribute('data-prof', next);
  updateAbilitiesAndSkills();
});

// Skills, senses and languages
document.getElementById('addSkillBtn').addEventListener('click', addSkill);
document.getElementById('addSenseBtn').addEventListener('click', addSense);
document.getElementById('addLanguageBtn').addEventListener('click', addLanguage);

// Traits and actions
document.getElementById('addTraitBtn').addEventListener('click', addTrait);
document.getElementById('addActionBtn').addEventListener('click', addAction);
document.getElementById('addBonusActionBtn').addEventListener('click', addBonusAction);
document.getElementById('addReactionBtn').addEventListener('click', addReaction);
document.getElementById('addLegendaryActionBtn').addEventListener('click', addLegendaryAction);
document.getElementById('addMythicActionBtn').addEventListener('click', addMythicAction);

// HP formula calculation
document.getElementById('hpFormula').addEventListener('input', calculateAverageHP);

// CR to XP calculation
document.getElementById('cr').addEventListener('input', calculateXPFromCR);

// Markdown preview listeners
document.getElementById('traitContent').addEventListener('input', function() {
  updateMarkdownPreview('traitContent', 'traitPreview');
});
document.getElementById('actionContent').addEventListener('input', function() {
  updateMarkdownPreview('actionContent', 'actionPreview');
});
document.getElementById('bonusActionContent').addEventListener('input', function() {
  updateMarkdownPreview('bonusActionContent', 'bonusActionPreview');
});
document.getElementById('reactionContent').addEventListener('input', function() {
  updateMarkdownPreview('reactionContent', 'reactionPreview');
});
document.getElementById('legendaryActionContent').addEventListener('input', function() {
  updateMarkdownPreview('legendaryActionContent', 'legendaryActionPreview');
});
document.getElementById('mythicActionContent').addEventListener('input', function() {
  updateMarkdownPreview('mythicActionContent', 'mythicActionPreview');
});

// Keyboard shortcuts for markdown formatting
const markdownFields = [
  'traitContent', 'actionContent', 'bonusActionContent',
  'reactionContent', 'legendaryActionContent', 'mythicActionContent'
];
markdownFields.forEach(fieldId => {
  document.getElementById(fieldId).addEventListener('keydown', handleMarkdownShortcuts);
});

function handleMarkdownShortcuts(event) {
  // Check for Ctrl+B (bold) or Ctrl+I (italic)
  if (event.ctrlKey && (event.key === 'b' || event.key === 'B')) {
    event.preventDefault();
    toggleMarkdownFormat(event.target, '**');
  } else if (event.ctrlKey && (event.key === 'i' || event.key === 'I')) {
    event.preventDefault();
    toggleMarkdownFormat(event.target, '_');
  }
}

function toggleMarkdownFormat(textarea, marker) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const beforeText = textarea.value.substring(0, start);
  const afterText = textarea.value.substring(end);

  // Check if already formatted
  const markerLen = marker.length;
  const isFormatted = beforeText.endsWith(marker) && afterText.startsWith(marker);

  if (isFormatted) {
    // Remove formatting
    textarea.value = beforeText.slice(0, -markerLen) + selectedText + afterText.slice(markerLen);
    textarea.setSelectionRange(start - markerLen, end - markerLen);
  } else {
    // Add formatting
    textarea.value = beforeText + marker + selectedText + marker + afterText;
    textarea.setSelectionRange(start + markerLen, end + markerLen);
  }

  // Trigger input event to update preview
  textarea.dispatchEvent(new Event('input'));
}

// Paste parsing listeners for auto-splitting title and content
document.getElementById('traitContent').addEventListener('paste', function(e) {
  handlePasteWithTitleSplit(e, 'traitTitle', 'traitContent');
});
document.getElementById('actionContent').addEventListener('paste', function(e) {
  handlePasteWithTitleSplit(e, 'actionTitle', 'actionContent');
});
document.getElementById('bonusActionContent').addEventListener('paste', function(e) {
  handlePasteWithTitleSplit(e, 'bonusActionTitle', 'bonusActionContent');
});
document.getElementById('reactionContent').addEventListener('paste', function(e) {
  handlePasteWithTitleSplit(e, 'reactionTitle', 'reactionContent');
});
document.getElementById('legendaryActionContent').addEventListener('paste', function(e) {
  handlePasteWithTitleSplit(e, 'legendaryActionTitle', 'legendaryActionContent');
});
document.getElementById('mythicActionContent').addEventListener('paste', function(e) {
  handlePasteWithTitleSplit(e, 'mythicActionTitle', 'mythicActionContent');
});

// Paste listener for legendary actions intro (no title split, just cleanup)
document.getElementById('legendaryActionsIntro').addEventListener('paste', function(e) {
  handlePasteCleanup(e, 'legendaryActionsIntro');
});

// Paste listener for name field (convert to title case)
document.getElementById('name').addEventListener('paste', function(e) {
  handlePasteTitleCase(e, 'name');
});

// Helper functions
function calcModifier(score) {
  if (!score) return 0;
  return Math.floor((score - 10) / 2);
}

function formatBonus(bonus) {
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}

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

function cleanupLineBreaks(text) {
  // Clean up line breaks from PDFs: preserve paragraph breaks (blank lines) but remove single line breaks
  // Split by blank lines (one or more empty lines with possible whitespace)
  const paragraphs = text.split(/(?:\r?\n\s*){2,}/);

  // For each paragraph, replace single newlines with spaces and normalize whitespace
  const cleanedParagraphs = paragraphs.map(para => {
    return para.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  }).filter(para => para.length > 0); // Remove empty paragraphs

  // Join paragraphs back with double newlines
  return cleanedParagraphs.join('\n\n');
}

function handlePasteCleanup(event, fieldId) {
  // Get pasted text
  let pastedText = (event.clipboardData || window.clipboardData).getData('text');

  // Clean up line breaks
  pastedText = cleanupLineBreaks(pastedText);

  // Prevent default paste behavior
  event.preventDefault();

  // Set field content
  const field = document.getElementById(fieldId);
  field.value = pastedText;
}

function handlePasteTitleCase(event, fieldId) {
  // Get pasted text
  let pastedText = (event.clipboardData || window.clipboardData).getData('text');

  // Convert to title case (first letter of each word uppercase, rest lowercase)
  pastedText = pastedText
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Prevent default paste behavior
  event.preventDefault();

  // Set field content
  const field = document.getElementById(fieldId);
  field.value = pastedText;
}

function handlePasteWithTitleSplit(event, titleFieldId, contentFieldId) {
  // Get pasted text
  let pastedText = (event.clipboardData || window.clipboardData).getData('text');

  // Clean up line breaks
  pastedText = cleanupLineBreaks(pastedText);

  // Auto-format common D&D patterns with markdown italics
  // Attack Roll patterns
  pastedText = pastedText.replace(/\b(Melee or Ranged Attack Roll):/g, '_$1:_');
  pastedText = pastedText.replace(/\b(Melee Attack Roll):/g, '_$1:_');
  pastedText = pastedText.replace(/\b(Ranged Attack Roll):/g, '_$1:_');

  // Saving Throw patterns (all ability scores)
  pastedText = pastedText.replace(/\b(Strength Saving Throw):/g, '_$1:_');
  pastedText = pastedText.replace(/\b(Dexterity Saving Throw):/g, '_$1:_');
  pastedText = pastedText.replace(/\b(Constitution Saving Throw):/g, '_$1:_');
  pastedText = pastedText.replace(/\b(Intelligence Saving Throw):/g, '_$1:_');
  pastedText = pastedText.replace(/\b(Wisdom Saving Throw):/g, '_$1:_');
  pastedText = pastedText.replace(/\b(Charisma Saving Throw):/g, '_$1:_');

  // Common result patterns
  pastedText = pastedText.replace(/\b(Hit):/g, '_$1:_');
  pastedText = pastedText.replace(/\b(Failure):/g, '_$1:_');
  pastedText = pastedText.replace(/\b(Success):/g, '_$1:_');

  // Check if the pasted text contains a period
  const firstDotIndex = pastedText.indexOf('.');

  if (firstDotIndex > 0) {
    // Prevent default paste behavior
    event.preventDefault();

    // Split on first period
    const title = pastedText.substring(0, firstDotIndex).trim();
    const content = pastedText.substring(firstDotIndex + 1).trim();

    // Set title field (only if it's empty to avoid overwriting existing title)
    const titleField = document.getElementById(titleFieldId);
    if (!titleField.value) {
      titleField.value = title;
    }

    // Set content field
    const contentField = document.getElementById(contentFieldId);
    contentField.value = content;

    // Trigger input event to update markdown preview
    contentField.dispatchEvent(new Event('input'));
  }
  // If no period found, let the default paste behavior happen
}

function calculateAverageHP() {
  const formula = document.getElementById('hpFormula').value.trim();
  if (!formula) {
    return;
  }

  // Dice averages
  const diceAverages = {
    4: 2.5,
    6: 3.5,
    8: 4.5,
    10: 5.5,
    12: 6.5,
    20: 10.5
  };

  // Parse formula like "8d8+16" or "5d10-2" or just "3d6"
  const match = formula.match(/^(\d+)d(\d+)(([+-]\d+))?$/i);

  if (!match) {
    // Invalid format, don't update
    return;
  }

  const numDice = parseInt(match[1]);
  const dieType = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;

  if (!diceAverages[dieType]) {
    // Unknown die type
    return;
  }

  const average = Math.floor(numDice * diceAverages[dieType] + modifier);
  document.getElementById('hp').value = average;
}

function calculateXPFromCR() {
  const cr = parseFloat(document.getElementById('cr').value);
  if (isNaN(cr)) {
    return;
  }

  // CR to XP lookup table
  const crToXP = {
    0: 10,
    0.125: 25,
    0.25: 50,
    0.5: 100,
    1: 200,
    2: 450,
    3: 700,
    4: 1100,
    5: 1800,
    6: 2300,
    7: 2900,
    8: 3900,
    9: 5000,
    10: 5900,
    11: 7200,
    12: 8400,
    13: 10000,
    14: 11500,
    15: 13000,
    16: 15000,
    17: 18000,
    18: 20000,
    19: 22000,
    20: 25000,
    21: 33000,
    22: 41000,
    23: 50000,
    24: 62000,
    25: 75000,
    26: 90000,
    27: 105000,
    28: 120000,
    29: 135000,
    30: 155000
  };

  if (crToXP[cr] !== undefined) {
    document.getElementById('xp').value = crToXP[cr];
  }
}

function updateAbilitiesAndSkills() {
  const profBonus = parseInt(document.getElementById('profBonus').value) || 0;

  // Get ability scores
  const abilities = {
    str: parseInt(document.getElementById('str').value) || 10,
    dex: parseInt(document.getElementById('dex').value) || 10,
    con: parseInt(document.getElementById('con').value) || 10,
    int: parseInt(document.getElementById('int').value) || 10,
    wis: parseInt(document.getElementById('wis').value) || 10,
    cha: parseInt(document.getElementById('cha').value) || 10
  };

  // Update modifiers and saves
  Object.keys(abilities).forEach(ability => {
    const score = abilities[ability];
    const modifier = calcModifier(score);

    // Update modifier display
    document.getElementById(`${ability}Mod`).textContent = formatBonus(modifier);

    // Update save display
    const proficiency = document.getElementById(`${ability}Save`).getAttribute('data-prof');
    let saveBonus = modifier;

    if (proficiency === 'proficient') saveBonus += profBonus;
    if (proficiency === 'expert') saveBonus += profBonus * 2;

    document.getElementById(`${ability}SaveDisplay`).textContent = formatBonus(saveBonus);
  });

  // Update initiative (based on DEX)
  const dexModifier = calcModifier(abilities.dex);
  const initiativeProficiency = document.getElementById('initiativeSave').getAttribute('data-prof');
  let initiativeBonus = dexModifier;

  if (initiativeProficiency === 'proficient') initiativeBonus += profBonus;
  if (initiativeProficiency === 'expert') initiativeBonus += profBonus * 2;

  document.getElementById('initiativeDisplay').textContent = formatBonus(initiativeBonus);

  // Re-render skills with updated bonuses
  renderSkills();
}

// Skills management
function addSkill() {
  const skillKey = document.getElementById('skillSelect').value;
  const proficiency = document.getElementById('skillProfSelect').value;

  if (!skillKey) {
    alert('Please select a skill');
    return;
  }

  // Check if skill already added
  if (skillsList.some(s => s.key === skillKey)) {
    alert('This skill has already been added');
    return;
  }

  skillsList.push({ key: skillKey, proficiency });
  renderSkills();

  // Clear selection
  document.getElementById('skillSelect').value = '';
}

function removeSkill(index) {
  skillsList.splice(index, 1);
  renderSkills();
}

function toggleSkillProficiency(index) {
  const skill = skillsList[index];
  // Toggle between proficient and expert
  skill.proficiency = skill.proficiency === 'proficient' ? 'expert' : 'proficient';
  renderSkills();
}

function renderSkills() {
  const container = document.getElementById('skillsList');
  if (skillsList.length === 0) {
    container.innerHTML = '<p class="text-muted" style="margin: 0;">No skills added</p>';
    return;
  }

  const profBonus = parseInt(document.getElementById('profBonus').value) || 0;
  const abilities = {
    str: parseInt(document.getElementById('str').value) || 10,
    dex: parseInt(document.getElementById('dex').value) || 10,
    con: parseInt(document.getElementById('con').value) || 10,
    int: parseInt(document.getElementById('int').value) || 10,
    wis: parseInt(document.getElementById('wis').value) || 10,
    cha: parseInt(document.getElementById('cha').value) || 10
  };

  container.innerHTML = skillsList.map((skill, index) => {
    const ability = skillAbilities[skill.key];
    const modifier = calcModifier(abilities[ability]);
    let bonus = modifier;

    if (skill.proficiency === 'proficient') bonus += profBonus;
    if (skill.proficiency === 'expert') bonus += profBonus * 2;

    const profLabel = skill.proficiency === 'expert' ? 'Expert' : 'Proficient';

    return `
      <div class="tag skill-tag">
        <span class="skill-content" onclick="toggleSkillProficiency(${index})">
          <strong>${skillNames[skill.key]}</strong>: ${formatBonus(bonus)} (${profLabel})
        </span>
        <button type="button" onclick="removeSkill(${index})">×</button>
      </div>
    `;
  }).join('');
}

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

// Traits management
function addTrait() {
  const title = document.getElementById('traitTitle').value.trim();
  const content = document.getElementById('traitContent').value.trim();

  if (!title || !content) {
    alert('Please enter both title and content');
    return;
  }

  traitsList.push({ title, content: [content] });
  renderTraits();

  document.getElementById('traitTitle').value = '';
  document.getElementById('traitContent').value = '';
  document.getElementById('traitPreview').innerHTML = '';
}

function removeTrait(index) {
  traitsList.splice(index, 1);
  renderTraits();
}

function renderTraits() {
  const container = document.getElementById('traitsList');
  if (traitsList.length === 0) {
    container.innerHTML = '<p class="text-muted" style="margin: 0;">No traits added</p>';
    return;
  }

  container.innerHTML = traitsList.map((trait, index) => `
    <div class="item-card">
      <div class="item-card-header">
        <div class="item-card-title">${trait.title}</div>
        <button type="button" class="item-card-remove" onclick="removeTrait(${index})">×</button>
      </div>
      <div class="item-card-content">${trait.content.join('\n')}</div>
    </div>
  `).join('');
}

// Actions management
function addAction() {
  const title = document.getElementById('actionTitle').value.trim();
  const content = document.getElementById('actionContent').value.trim();

  if (!title || !content) {
    alert('Please enter both title and content');
    return;
  }

  actionsList.push({ title, content: [content] });
  renderActions();

  document.getElementById('actionTitle').value = '';
  document.getElementById('actionContent').value = '';
  document.getElementById('actionPreview').innerHTML = '';
}

function removeAction(index) {
  actionsList.splice(index, 1);
  renderActions();
}

function renderActions() {
  const container = document.getElementById('actionsList');
  if (actionsList.length === 0) {
    container.innerHTML = '<p class="text-muted" style="margin: 0;">No actions added</p>';
    return;
  }

  container.innerHTML = actionsList.map((action, index) => `
    <div class="item-card">
      <div class="item-card-header">
        <div class="item-card-title">${action.title}</div>
        <button type="button" class="item-card-remove" onclick="removeAction(${index})">×</button>
      </div>
      <div class="item-card-content">${action.content.join('\n')}</div>
    </div>
  `).join('');
}

// Bonus Actions management
function addBonusAction() {
  const title = document.getElementById('bonusActionTitle').value.trim();
  const content = document.getElementById('bonusActionContent').value.trim();

  if (!title || !content) {
    alert('Please enter both title and content');
    return;
  }

  bonusActionsList.push({ title, content: [content] });
  renderBonusActions();

  document.getElementById('bonusActionTitle').value = '';
  document.getElementById('bonusActionContent').value = '';
  document.getElementById('bonusActionPreview').innerHTML = '';
}

function removeBonusAction(index) {
  bonusActionsList.splice(index, 1);
  renderBonusActions();
}

function renderBonusActions() {
  const container = document.getElementById('bonusActionsList');
  if (bonusActionsList.length === 0) {
    container.innerHTML = '<p class="text-muted" style="margin: 0;">No bonus actions added</p>';
    return;
  }

  container.innerHTML = bonusActionsList.map((action, index) => `
    <div class="item-card">
      <div class="item-card-header">
        <div class="item-card-title">${action.title}</div>
        <button type="button" class="item-card-remove" onclick="removeBonusAction(${index})">×</button>
      </div>
      <div class="item-card-content">${action.content.join('\n')}</div>
    </div>
  `).join('');
}

// Reactions management
function addReaction() {
  const title = document.getElementById('reactionTitle').value.trim();
  const content = document.getElementById('reactionContent').value.trim();

  if (!title || !content) {
    alert('Please enter both title and content');
    return;
  }

  reactionsList.push({ title, content: [content] });
  renderReactions();

  document.getElementById('reactionTitle').value = '';
  document.getElementById('reactionContent').value = '';
  document.getElementById('reactionPreview').innerHTML = '';
}

function removeReaction(index) {
  reactionsList.splice(index, 1);
  renderReactions();
}

function renderReactions() {
  const container = document.getElementById('reactionsList');
  if (reactionsList.length === 0) {
    container.innerHTML = '<p class="text-muted" style="margin: 0;">No reactions added</p>';
    return;
  }

  container.innerHTML = reactionsList.map((reaction, index) => `
    <div class="item-card">
      <div class="item-card-header">
        <div class="item-card-title">${reaction.title}</div>
        <button type="button" class="item-card-remove" onclick="removeReaction(${index})">×</button>
      </div>
      <div class="item-card-content">${reaction.content.join('\n')}</div>
    </div>
  `).join('');
}

// Legendary Actions management
function addLegendaryAction() {
  const title = document.getElementById('legendaryActionTitle').value.trim();
  const content = document.getElementById('legendaryActionContent').value.trim();

  if (!title || !content) {
    alert('Please enter both title and content');
    return;
  }

  legendaryActionsList.push({ title, content: [content] });
  renderLegendaryActions();

  document.getElementById('legendaryActionTitle').value = '';
  document.getElementById('legendaryActionContent').value = '';
  document.getElementById('legendaryActionPreview').innerHTML = '';
}

function removeLegendaryAction(index) {
  legendaryActionsList.splice(index, 1);
  renderLegendaryActions();
}

function renderLegendaryActions() {
  const container = document.getElementById('legendaryActionsList');
  if (legendaryActionsList.length === 0) {
    container.innerHTML = '<p class="text-muted" style="margin: 0;">No legendary actions added</p>';
    return;
  }

  container.innerHTML = legendaryActionsList.map((action, index) => `
    <div class="item-card">
      <div class="item-card-header">
        <div class="item-card-title">${action.title}</div>
        <button type="button" class="item-card-remove" onclick="removeLegendaryAction(${index})">×</button>
      </div>
      <div class="item-card-content">${action.content.join('\n')}</div>
    </div>
  `).join('');
}

// Mythic Actions management
function addMythicAction() {
  const title = document.getElementById('mythicActionTitle').value.trim();
  const content = document.getElementById('mythicActionContent').value.trim();

  if (!title || !content) {
    alert('Please enter both title and content');
    return;
  }

  mythicActionsList.push({ title, content: [content] });
  renderMythicActions();

  document.getElementById('mythicActionTitle').value = '';
  document.getElementById('mythicActionContent').value = '';
  document.getElementById('mythicActionPreview').innerHTML = '';
}

function removeMythicAction(index) {
  mythicActionsList.splice(index, 1);
  renderMythicActions();
}

function renderMythicActions() {
  const container = document.getElementById('mythicActionsList');
  if (mythicActionsList.length === 0) {
    container.innerHTML = '<p class="text-muted" style="margin: 0;">No mythic actions added</p>';
    return;
  }

  container.innerHTML = mythicActionsList.map((action, index) => `
    <div class="item-card">
      <div class="item-card-header">
        <div class="item-card-title">${action.title}</div>
        <button type="button" class="item-card-remove" onclick="removeMythicAction(${index})">×</button>
      </div>
      <div class="item-card-content">${action.content.join('\n')}</div>
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
  skillsList = [];
  traitsList = [];
  actionsList = [];
  bonusActionsList = [];
  reactionsList = [];
  legendaryActionsList = [];
  mythicActionsList = [];

  // Reset save proficiencies
  ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
    document.getElementById(`${ability}Save`).setAttribute('data-prof', 'none');
  });

  // Reset initiative proficiency
  document.getElementById('initiativeSave').setAttribute('data-prof', 'none');

  renderSkills();
  renderSenses();
  renderLanguages();
  renderTraits();
  renderActions();
  renderBonusActions();
  renderReactions();
  renderLegendaryActions();
  renderMythicActions();
  updateAbilitiesAndSkills();
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
  skillsList = [];
  traitsList = [];
  actionsList = [];
  bonusActionsList = [];
  reactionsList = [];
  legendaryActionsList = [];
  mythicActionsList = [];
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
    document.getElementById('hpFormula').value = monster.hitPoints?.formula || '';
    document.getElementById('hp').value = monster.hitPoints?.hp || '';

    // Calculate HP if formula exists but HP doesn't
    if (monster.hitPoints?.formula && !monster.hitPoints?.hp) {
      calculateAverageHP();
    }

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

    // Reset all saves to none first
    Object.keys(abilityMap).forEach(short => {
      document.getElementById(`${short}Save`).setAttribute('data-prof', 'none');
    });

    // Load save proficiencies
    Object.keys(abilityMap).forEach(short => {
      const fullName = abilityMap[short];
      const saveData = monster.abilities?.[fullName]?.save;
      if (saveData && saveData.proficiency) {
        document.getElementById(`${short}Save`).setAttribute('data-prof', saveData.proficiency);
      }
    });

    // Load initiative proficiency
    document.getElementById('initiativeSave').setAttribute('data-prof', 'none');
    if (monster.initiative?.proficiency) {
      document.getElementById('initiativeSave').setAttribute('data-prof', monster.initiative.proficiency);
    }

    // Load skills
    skillsList = [];
    if (monster.skills) {
      Object.keys(monster.skills).forEach(skillKey => {
        const skill = monster.skills[skillKey];
        if (skill.proficiency) {
          skillsList.push({ key: skillKey, proficiency: skill.proficiency });
        }
      });
    }
    renderSkills();

    // Update displays
    updateAbilitiesAndSkills();

    // Senses
    sensesList = monster.senses || [];
    renderSenses();

    // Languages
    languagesList = monster.languages || [];
    renderLanguages();

    // Traits and actions
    traitsList = monster.traits || [];
    renderTraits();
    actionsList = monster.actions || [];
    renderActions();
    bonusActionsList = monster.bonusActions || [];
    renderBonusActions();
    reactionsList = monster.reactions || [];
    renderReactions();
    legendaryActionsList = monster.legendaryActions || [];
    renderLegendaryActions();
    document.getElementById('legendaryActionsIntro').value = monster.legendaryActionsIntro || '';
    mythicActionsList = monster.mythicActions || [];
    renderMythicActions();

    // Additional details
    document.getElementById('damageResistances').value = monster.damageResistances?.join('; ') || '';
    document.getElementById('damageImmunities').value = monster.damageImmunities?.join('; ') || '';
    document.getElementById('damageVulnerabilities').value = monster.damageVulnerabilities?.join('; ') || '';
    document.getElementById('conditionImmunities').value = monster.conditionImmunities?.join('; ') || '';

    // Source
    document.getElementById('source').value = monster.meta?.source || '';

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
      const saveProf = document.getElementById(`${short}Save`).getAttribute('data-prof');
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

  // Build skills - only include explicitly added skills
  const skills = {};
  skillsList.forEach(skill => {
    const ability = skillAbilities[skill.key];
    const abilityScore = parseInt(document.getElementById(ability).value) || 10;
    const modifier = calcModifier(abilityScore);
    let bonus = modifier;

    if (skill.proficiency === 'proficient') bonus += profBonus;
    if (skill.proficiency === 'expert') bonus += profBonus * 2;

    skills[skill.key] = {
      bonus,
      proficiency: skill.proficiency
    };
  });

  // Build initiative (based on DEX)
  const initiativeProficiency = document.getElementById('initiativeSave').getAttribute('data-prof');
  let initiativeBonus = calcModifier(dex || 10);

  if (initiativeProficiency === 'proficient') initiativeBonus += profBonus;
  if (initiativeProficiency === 'expert') initiativeBonus += profBonus * 2;

  const initiative = initiativeProficiency !== 'none' ? {
    bonus: initiativeBonus,
    proficiency: initiativeProficiency
  } : null;

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
      initiative: initiative,
      abilities: Object.keys(abilities).length > 0 ? abilities : null,
      skills: Object.keys(skills).length > 0 ? skills : null,
      damageResistances: document.getElementById('damageResistances').value
        ? document.getElementById('damageResistances').value.split(';').map(s => s.trim())
        : null,
      damageImmunities: document.getElementById('damageImmunities').value
        ? document.getElementById('damageImmunities').value.split(';').map(s => s.trim())
        : null,
      damageVulnerabilities: document.getElementById('damageVulnerabilities').value
        ? document.getElementById('damageVulnerabilities').value.split(';').map(s => s.trim())
        : null,
      conditionImmunities: document.getElementById('conditionImmunities').value
        ? document.getElementById('conditionImmunities').value.split(';').map(s => s.trim())
        : null,
      senses: sensesList.length > 0 ? sensesList : null,
      languages: languagesList.length > 0 ? languagesList : null,
      challengeRating: {
        rating: parseFloat(document.getElementById('cr').value) || null,
        xp: parseInt(document.getElementById('xp').value) || null
      },
      traits: traitsList.length > 0 ? traitsList : null,
      actions: actionsList.length > 0 ? actionsList : null,
      bonusActions: bonusActionsList.length > 0 ? bonusActionsList : null,
      reactions: reactionsList.length > 0 ? reactionsList : null,
      legendaryActions: legendaryActionsList.length > 0 ? legendaryActionsList : null,
      legendaryActionsIntro: document.getElementById('legendaryActionsIntro').value || null,
      mythicActions: mythicActionsList.length > 0 ? mythicActionsList : null,
      lairActions: null,
      meta: {
        url: '',
        timestamp: new Date().toISOString(),
        sourceVersion: '1.0.0',
        edition: null,
        tags: null,
        habitat: null,
        source: document.getElementById('source').value || null
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
window.removeSkill = removeSkill;
window.toggleSkillProficiency = toggleSkillProficiency;
window.removeSense = removeSense;
window.removeLanguage = removeLanguage;
window.removeTrait = removeTrait;
window.removeAction = removeAction;
window.removeBonusAction = removeBonusAction;
window.removeReaction = removeReaction;
window.removeLegendaryAction = removeLegendaryAction;
window.removeMythicAction = removeMythicAction;
