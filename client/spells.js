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

// Paste listeners for spell descriptions
document.getElementById('description').addEventListener('paste', function(e) {
  handlePasteWithFormatting(e, 'description', 'descriptionPreview');
});
document.getElementById('higherLevels').addEventListener('paste', function(e) {
  handlePasteWithFormatting(e, 'higherLevels', 'higherLevelsPreview');
});

// Paste listener for name field (convert to title case)
document.getElementById('name').addEventListener('paste', function(e) {
  handlePasteTitleCase(e, 'name');
});

// Paste listener for classes field (parse level, school, and classes)
document.getElementById('classes').addEventListener('paste', function(e) {
  handlePasteSpellHeader(e);
});

// Paste listener for material components field (parse V, S, M and material description)
document.getElementById('material').addEventListener('paste', function(e) {
  handlePasteComponents(e);
});

// Paste listener for range field (parse full spell details block)
document.getElementById('range').addEventListener('paste', function(e) {
  handlePasteSpellDetails(e);
});

// Quick paste area listener
document.getElementById('quickPasteArea').addEventListener('paste', function(e) {
  handleQuickPaste(e);
});

// Keyboard shortcuts for markdown formatting
const markdownFields = ['description', 'higherLevels'];
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
  } else if (event.ctrlKey && (event.key === 'm' || event.key === 'M')) {
    event.preventDefault();
    insertMarkdownLink(event.target, 'monster');
  } else if (event.ctrlKey && (event.key === 's' || event.key === 'S')) {
    event.preventDefault();
    insertMarkdownLink(event.target, 'spell');
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

function insertMarkdownLink(textarea, linkType) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);

  if (!selectedText) {
    return; // Nothing selected, do nothing
  }

  const beforeText = textarea.value.substring(0, start);
  const afterText = textarea.value.substring(end);

  // Create slug from selected text (lowercase, spaces to hyphens)
  const slug = selectedText.toLowerCase().replace(/\s+/g, '-');

  // Create markdown link: [Text](type/slug)
  const markdownLink = `[${selectedText}](${linkType}/${slug})`;

  // Replace selected text with markdown link
  textarea.value = beforeText + markdownLink + afterText;

  // Set cursor position at the end of the inserted link
  const newPosition = start + markdownLink.length;
  textarea.setSelectionRange(newPosition, newPosition);

  // Trigger input event to update preview
  textarea.dispatchEvent(new Event('input'));
}

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

function cleanupLineBreaks(text) {
  // Clean up line breaks from PDFs: preserve paragraph breaks (blank lines) but remove single line breaks
  // Special handling for markdown tables which need line breaks preserved

  // Split by blank lines (one or more empty lines with possible whitespace)
  const paragraphs = text.split(/(?:\r?\n\s*){2,}/);

  // For each paragraph, check if it contains a markdown table
  const cleanedParagraphs = paragraphs.map(para => {
    const lines = para.split(/\r?\n/);

    // Check if this paragraph contains markdown table lines (lines starting with |)
    const hasTableLines = lines.some(line => line.trim().startsWith('|'));

    if (hasTableLines) {
      // Preserve line breaks for tables, just trim each line
      return lines.map(line => line.trim()).join('\n');
    } else {
      // Regular paragraph: replace single newlines with spaces and normalize whitespace
      return para.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }).filter(para => para.length > 0); // Remove empty paragraphs

  // Join paragraphs back with double newlines
  return cleanedParagraphs.join('\n\n');
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

function handlePasteSpellHeader(event) {
  // Get pasted text
  let pastedText = (event.clipboardData || window.clipboardData).getData('text').trim();

  // Prevent default paste behavior
  event.preventDefault();

  // Normalize line breaks and special characters from PDFs
  // Replace various dash/hyphen characters with standard hyphen
  pastedText = pastedText.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-');
  // Collapse multiple spaces and newlines into single spaces
  pastedText = pastedText.replace(/\s+/g, ' ').trim();

  // Extract classes from parentheses
  let classes = '';
  const classesMatch = pastedText.match(/\(([^)]+)\)/);
  if (classesMatch) {
    classes = classesMatch[1].trim();
    // Remove the parentheses part from the text for further parsing
    pastedText = pastedText.replace(/\s*\([^)]+\)/, '').trim();
  }

  // Parse level and school
  let level = '';
  let school = '';

  // Check for "Cantrip" pattern: "School Cantrip"
  if (/\bcantrip\b/i.test(pastedText)) {
    level = '0';
    // School is the word before "Cantrip"
    const cantripMatch = pastedText.match(/^(\w+)\s+cantrip/i);
    if (cantripMatch) {
      school = cantripMatch[1].toLowerCase();
    }
  }
  // Check for "Nth-level School" pattern (e.g., "1st-level Abjuration")
  else {
    const levelMatch = pastedText.match(/^(\d+)(st|nd|rd|th)-level\s+(\w+)/i);
    if (levelMatch) {
      level = levelMatch[1];
      school = levelMatch[3].toLowerCase();
    }
    // Check for "Level N School" pattern (e.g., "Level 1 Abjuration")
    else {
      const levelMatch2 = pastedText.match(/^level\s+(\d+)\s+(\w+)/i);
      if (levelMatch2) {
        level = levelMatch2[1];
        school = levelMatch2[2].toLowerCase();
      } else {
        // If no level specified, try to extract just the school
        const schoolMatch = pastedText.match(/^(\w+)/);
        if (schoolMatch) {
          school = schoolMatch[1].toLowerCase();
        }
      }
    }
  }

  // Set the fields (only if not already set)
  const levelField = document.getElementById('level');
  if (level && !levelField.value) {
    levelField.value = level;
  }

  const schoolField = document.getElementById('school');
  if (school && !schoolField.value) {
    schoolField.value = school;
  }

  // Always set the classes field (that's where we pasted)
  const classesField = document.getElementById('classes');
  classesField.value = classes;
}

function handlePasteComponents(event) {
  // Get pasted text
  let pastedText = (event.clipboardData || window.clipboardData).getData('text').trim();

  // Prevent default paste behavior
  event.preventDefault();

  // Check for V, S, M components
  const hasVerbal = /\bV\b/i.test(pastedText);
  const hasSomatic = /\bS\b/i.test(pastedText);
  const hasMaterial = /\bM\b/i.test(pastedText);

  // Set the checkboxes
  document.getElementById('verbal').checked = hasVerbal;
  document.getElementById('somatic').checked = hasSomatic;
  document.getElementById('materialCheck').checked = hasMaterial;

  // Extract material description from parentheses
  let materialDescription = '';
  const materialMatch = pastedText.match(/\(([^)]+)\)/);
  if (materialMatch) {
    materialDescription = materialMatch[1].trim();
  }

  // Set the material field
  const materialField = document.getElementById('material');
  materialField.value = materialDescription;
}

function handleQuickPaste(event) {
  // Get pasted text
  let pastedText = (event.clipboardData || window.clipboardData).getData('text').trim();

  // Prevent default paste
  event.preventDefault();

  // Clear the quick paste area
  document.getElementById('quickPasteArea').value = '';

  // Parse lines
  const lines = pastedText.split(/\r\n|\r|\n/).filter(line => line.trim());

  if (lines.length === 0) return;

  // Show new spell form
  showNewSpellForm();

  // Line 1: Spell name
  const spellName = lines[0].trim();
  document.getElementById('name').value = spellName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Line 2: Level, School, Classes (e.g., "Level 4 Enchantment (Bard, Druid)")
  if (lines.length > 1) {
    const headerLine = lines[1].trim();

    // Normalize dashes
    const normalizedHeader = headerLine.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-');

    // Extract classes from parentheses
    let classes = '';
    const classesMatch = normalizedHeader.match(/\(([^)]+)\)/);
    if (classesMatch) {
      classes = classesMatch[1].trim();
      document.getElementById('classes').value = classes;
    }

    // Remove parentheses for level/school parsing
    const headerWithoutClasses = normalizedHeader.replace(/\s*\([^)]+\)/, '').trim();

    // Parse level and school
    let level = '';
    let school = '';

    if (/\bcantrip\b/i.test(headerWithoutClasses)) {
      level = '0';
      const cantripMatch = headerWithoutClasses.match(/^(\w+)\s+cantrip/i);
      if (cantripMatch) {
        school = cantripMatch[1].toLowerCase();
      }
    } else {
      const levelMatch = headerWithoutClasses.match(/^(\d+)(st|nd|rd|th)-level\s+(\w+)/i);
      if (levelMatch) {
        level = levelMatch[1];
        school = levelMatch[3].toLowerCase();
      } else {
        const levelMatch2 = headerWithoutClasses.match(/^level\s+(\d+)\s+(\w+)/i);
        if (levelMatch2) {
          level = levelMatch2[1];
          school = levelMatch2[2].toLowerCase();
        }
      }
    }

    if (level) document.getElementById('level').value = level;
    if (school) document.getElementById('school').value = school;
  }

  // Parse remaining lines for spell details
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();

    // Casting Time
    const castingTimeMatch = line.match(/^Casting Time:\s*(.+)$/i);
    if (castingTimeMatch) {
      const castingTimeValue = castingTimeMatch[1].trim();
      const castingTimeMap = {
        'action': '1 action',
        '1 action': '1 action',
        'bonus action': '1 bonus action',
        '1 bonus action': '1 bonus action',
        'reaction': '1 reaction',
        '1 reaction': '1 reaction',
        '1 minute': '1 minute',
        '10 minutes': '10 minutes',
        '1 hour': '1 hour',
        '8 hours': '8 hours',
        '12 hours': '12 hours',
        '24 hours': '24 hours'
      };

      const mappedValue = castingTimeMap[castingTimeValue.toLowerCase()];
      if (mappedValue) {
        document.getElementById('castingTime').value = mappedValue;
      }

      const reactionTriggerMatch = castingTimeValue.match(/\(([^)]+)\)/);
      if (reactionTriggerMatch) {
        document.getElementById('reactionTrigger').value = reactionTriggerMatch[1].trim();
      }
    }

    // Range
    const rangeMatch = line.match(/^Range:\s*(.+)$/i);
    if (rangeMatch) {
      document.getElementById('range').value = rangeMatch[1].trim();
    }

    // Components
    const componentsMatch = line.match(/^Components:\s*(.+)$/i);
    if (componentsMatch) {
      const componentsText = componentsMatch[1].trim();

      document.getElementById('verbal').checked = /\bV\b/i.test(componentsText);
      document.getElementById('somatic').checked = /\bS\b/i.test(componentsText);
      document.getElementById('materialCheck').checked = /\bM\b/i.test(componentsText);

      const materialMatch = componentsText.match(/\(([^)]+)\)/);
      if (materialMatch) {
        document.getElementById('material').value = materialMatch[1].trim();
      }
    }

    // Duration
    const durationMatch = line.match(/^Duration:\s*(.+)$/i);
    if (durationMatch) {
      const durationValue = durationMatch[1].trim();

      if (/^concentration/i.test(durationValue)) {
        document.getElementById('concentration').checked = true;

        const actualDuration = durationValue.replace(/^concentration,?\s*/i, '').trim();
        const durationMap = {
          'instantaneous': 'Instantaneous',
          '1 round': '1 round',
          'up to 1 minute': 'Concentration, up to 1 minute',
          'up to 10 minutes': 'Concentration, up to 10 minutes',
          'up to 1 hour': 'Concentration, up to 1 hour',
          'up to 8 hours': 'Concentration, up to 8 hours',
          '1 minute': '1 minute',
          '10 minutes': '10 minutes',
          '1 hour': '1 hour',
          '8 hours': '8 hours',
          '24 hours': '24 hours',
          'until dispelled': 'Until dispelled',
          'special': 'Special'
        };

        const mappedDuration = durationMap[actualDuration.toLowerCase()];
        if (mappedDuration) {
          document.getElementById('duration').value = mappedDuration;
        }
      } else {
        document.getElementById('concentration').checked = false;

        const durationMap = {
          'instantaneous': 'Instantaneous',
          '1 round': '1 round',
          '1 minute': '1 minute',
          '10 minutes': '10 minutes',
          '1 hour': '1 hour',
          '8 hours': '8 hours',
          '24 hours': '24 hours',
          'until dispelled': 'Until dispelled',
          'special': 'Special'
        };

        const mappedDuration = durationMap[durationValue.toLowerCase()];
        if (mappedDuration) {
          document.getElementById('duration').value = mappedDuration;
        }
      }
    }
  }
}

function handlePasteSpellDetails(event) {
  // Get pasted text
  let pastedText = (event.clipboardData || window.clipboardData).getData('text').trim();

  // Check if this looks like a multi-line spell details block
  // (contains at least 2 of the common field labels)
  const fieldCount = (pastedText.match(/\b(Casting Time|Range|Components|Duration):/gi) || []).length;

  if (fieldCount < 2) {
    // Not a details block, just paste normally into range field
    return; // Let default paste happen
  }

  // Prevent default paste behavior
  event.preventDefault();

  // Parse each line (handle \r\n, \n, or \r line endings)
  const lines = pastedText.split(/\r\n|\r|\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Casting Time
    const castingTimeMatch = trimmedLine.match(/^Casting Time:\s*(.+)$/i);
    if (castingTimeMatch) {
      const castingTimeValue = castingTimeMatch[1].trim();
      const castingTimeField = document.getElementById('castingTime');

      // Try to map to select options
      const castingTimeMap = {
        'action': '1 action',
        '1 action': '1 action',
        'bonus action': '1 bonus action',
        '1 bonus action': '1 bonus action',
        'reaction': '1 reaction',
        '1 reaction': '1 reaction',
        '1 minute': '1 minute',
        '10 minutes': '10 minutes',
        '1 hour': '1 hour',
        '8 hours': '8 hours',
        '12 hours': '12 hours',
        '24 hours': '24 hours'
      };

      const mappedValue = castingTimeMap[castingTimeValue.toLowerCase()];
      if (mappedValue) {
        castingTimeField.value = mappedValue;
      }

      // Check if there's a reaction trigger (text in parentheses)
      const reactionTriggerMatch = castingTimeValue.match(/\(([^)]+)\)/);
      if (reactionTriggerMatch) {
        document.getElementById('reactionTrigger').value = reactionTriggerMatch[1].trim();
      }
    }

    // Range
    const rangeMatch = trimmedLine.match(/^Range:\s*(.+)$/i);
    if (rangeMatch) {
      document.getElementById('range').value = rangeMatch[1].trim();
    }

    // Components
    const componentsMatch = trimmedLine.match(/^Components:\s*(.+)$/i);
    if (componentsMatch) {
      const componentsText = componentsMatch[1].trim();

      // Check for V, S, M
      const hasVerbal = /\bV\b/i.test(componentsText);
      const hasSomatic = /\bS\b/i.test(componentsText);
      const hasMaterial = /\bM\b/i.test(componentsText);

      document.getElementById('verbal').checked = hasVerbal;
      document.getElementById('somatic').checked = hasSomatic;
      document.getElementById('materialCheck').checked = hasMaterial;

      // Extract material description from parentheses
      const materialMatch = componentsText.match(/\(([^)]+)\)/);
      if (materialMatch) {
        document.getElementById('material').value = materialMatch[1].trim();
      }
    }

    // Duration
    const durationMatch = trimmedLine.match(/^Duration:\s*(.+)$/i);
    if (durationMatch) {
      const durationValue = durationMatch[1].trim();
      const durationField = document.getElementById('duration');
      const concentrationField = document.getElementById('concentration');

      // Check if it requires concentration
      if (/^concentration/i.test(durationValue)) {
        concentrationField.checked = true;

        // Extract the actual duration after "Concentration, "
        const actualDuration = durationValue.replace(/^concentration,?\s*/i, '').trim();

        // Try to map to select options
        const durationMap = {
          'instantaneous': 'Instantaneous',
          '1 round': '1 round',
          'up to 1 minute': 'Concentration, up to 1 minute',
          'up to 10 minutes': 'Concentration, up to 10 minutes',
          'up to 1 hour': 'Concentration, up to 1 hour',
          'up to 8 hours': 'Concentration, up to 8 hours',
          '1 minute': '1 minute',
          '10 minutes': '10 minutes',
          '1 hour': '1 hour',
          '8 hours': '8 hours',
          '24 hours': '24 hours',
          'until dispelled': 'Until dispelled',
          'special': 'Special'
        };

        const mappedDuration = durationMap[actualDuration.toLowerCase()];
        if (mappedDuration) {
          durationField.value = mappedDuration;
        }
      } else {
        concentrationField.checked = false;

        // Map non-concentration durations
        const durationMap = {
          'instantaneous': 'Instantaneous',
          '1 round': '1 round',
          '1 minute': '1 minute',
          '10 minutes': '10 minutes',
          '1 hour': '1 hour',
          '8 hours': '8 hours',
          '24 hours': '24 hours',
          'until dispelled': 'Until dispelled',
          'special': 'Special'
        };

        const mappedDuration = durationMap[durationValue.toLowerCase()];
        if (mappedDuration) {
          durationField.value = mappedDuration;
        }
      }
    }
  }
}

function handlePasteWithFormatting(event, fieldId, previewId) {
  // Get pasted text
  let pastedText = (event.clipboardData || window.clipboardData).getData('text');

  // Clean up line breaks
  pastedText = cleanupLineBreaks(pastedText);

  // Auto-detect and populate spell fields based on description (only for description field)
  if (fieldId === 'description') {
    autoDetectSpellProperties(pastedText);
  }

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

  // Prevent default paste behavior
  event.preventDefault();

  // Insert at cursor position instead of replacing entire content
  const field = document.getElementById(fieldId);
  const start = field.selectionStart;
  const end = field.selectionEnd;
  const currentValue = field.value;

  // Insert the formatted text at cursor position
  field.value = currentValue.substring(0, start) + pastedText + currentValue.substring(end);

  // Set cursor position after the inserted text
  const newCursorPos = start + pastedText.length;
  field.setSelectionRange(newCursorPos, newCursorPos);

  // Trigger input event to update markdown preview
  if (previewId) {
    field.dispatchEvent(new Event('input'));
  }
}

function autoDetectSpellProperties(text) {
  const lowerText = text.toLowerCase();

  // Detect attack type (only if not already set)
  const attackField = document.getElementById('attack');
  if (!attackField.value) {
    if (lowerText.includes('ranged spell attack')) {
      attackField.value = 'Ranged';
    } else if (lowerText.includes('melee spell attack')) {
      attackField.value = 'Melee';
    }
  }

  // Detect saving throw (only if not already set)
  const saveField = document.getElementById('save');
  if (!saveField.value) {
    const abilities = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
    for (const ability of abilities) {
      const pattern = new RegExp(`\\b${ability.toLowerCase()} sav(e|ing throw)`, 'i');
      if (pattern.test(lowerText)) {
        saveField.value = ability;
        break;
      }
    }
  }

  // Detect damage types (only if not already set)
  const damageTypeField = document.getElementById('damageType');
  if (!damageTypeField.value) {
    const damageTypes = [
      'acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning',
      'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'
    ];
    const detectedTypes = new Set();

    // Look for patterns like "Xd[Y] [damage type] damage" or just "[damage type] damage"
    for (const damageType of damageTypes) {
      const pattern = new RegExp(`(\\d+d\\d+\\s+)?${damageType}\\s+damage`, 'i');
      if (pattern.test(lowerText)) {
        detectedTypes.add(damageType);
      }
    }

    // Set the detected damage types
    if (detectedTypes.size > 0) {
      damageTypeField.value = Array.from(detectedTypes).join(', ');
    }
  }
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

    // Save the source value before resetting the form
    const savedSource = document.getElementById('source').value;

    // Reload the spells list (in background)
    loadSpells();

    // Show a new spell form with the source pre-filled
    showNewSpellForm();
    document.getElementById('source').value = savedSource;
  } catch (error) {
    console.error('Error saving spell:', error);
    alert('Error saving spell');
  }
}

// Make functions global
window.editSpell = editSpell;
window.deleteSpell = deleteSpell;
window.duplicateSpell = duplicateSpell;
