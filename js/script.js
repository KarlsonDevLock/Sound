// ============================================================
// MAIN FUNCTION: runs when Convert button is clicked
// ============================================================

document.getElementById('convertBtn').addEventListener('click', function() {
  // 1. READ: get the 4 input values, turn text -> numbers
  const freq = parseFloat(document.getElementById('freq').value);
  const amp = parseFloat(document.getElementById('amp').value);
  const samples = parseInt(document.getElementById('samples').value);
  const bits = parseInt(document.getElementById('bits').value);

  // 2. VALIDATE: are the numbers legal?
  const validation = validateInputs(freq, amp, samples, bits);
  if (!validation.valid) {
    showWarning(validation.message);
    clearResults();
    return;
  }

  // Valid input: clear warning, continue
  clearWarning();
  
  // 3. WAVE FACTS: compute period + wavelength, show them
  showWaveFacts(freq, amp, samples, bits);
  
  // 4. LOOP: for each sample i = 0 ... n-1
  const results = loopSamples(freq, amp, samples, bits);
  
  // 5. SUMMARY: join binaries with spaces, show them, compute total bits
  showResults(results, samples, bits);
});

// ============================================================
// 2. VALIDATION: validate inputs, return true/false + message
// ============================================================

function validateInputs(freq, amp, samples, bits) {
  if (freq <= 0) {
    return { valid: false, message: 'Frequency must be greater than 0.' };
  }
  if (amp < 0 || amp > 1) {
    return { valid: false, message: 'Amplitude must be between 0 and 1.' };
  }
  if (samples < 2 || samples > 64 || Number.isInteger(samples) === false) {
    return { valid: false, message: 'Samples must be a whole number between 2 and 64.' };
  }
  if (bits < 1 || bits > 8 || Number.isInteger(bits) === false) {
    return { valid: false, message: 'Bits must be a whole number between 1 and 8.' };
  }
  return { valid: true, message: '' };
}

// ============================================================
// 3. WAVE FACTS: compute period + wavelength, show them
// ============================================================

function showWaveFacts(freq, amp, samples, bits) {
  const period = (1 / freq) * 1000; // ms
  const wavelength = 343 / freq; // meters (speed of sound = 343 m/s)
  const levels = Math.pow(2, bits);
  
  const factsDiv = document.getElementById('waveFacts');
  factsDiv.innerHTML = `
    <h2>Wave Facts</h2>
    <div class="facts-grid">
      <div class="fact-item">
        <span class="label">Period</span>
        <span class="value">${period.toFixed(2)} ms</span>
      </div>
      <div class="fact-item">
        <span class="label">Wavelength</span>
        <span class="value">${formatWavelength(wavelength)}</span>
      </div>
      <div class="fact-item">
        <span class="label">Levels</span>
        <span class="value">${levels} (levels 0 to ${levels - 1})</span>
      </div>
      <div class="fact-item">
        <span class="label">Total Bits</span>
        <span class="value">${samples * bits}</span>
      </div>
    </div>
  `;
  showElement('waveFacts');
}

function formatWavelength(meters) {
  if (meters < 1) {
    return (meters * 100).toFixed(1) + ' cm';
  }
  return meters.toFixed(2) + ' m';
}

// ============================================================
// 4. LOOP: for each sample i = 0 ... n-1
// ============================================================

function loopSamples(freq, amp, samples, bits) {
  const period = (1 / freq) * 1000;
  const levels = Math.pow(2, bits);
  const tableBody = document.getElementById('tableBody');
  
  // Clear old rows
  tableBody.innerHTML = '';
  
  const binaryList = [];
  
  for (let i = 0; i < samples; i++) {
    // A. TIME = i x period / n
    const time = i * period / samples;
    
    // B. HEIGHT = amplitude x sin(2 x PI x i / n)
    const height = amp * Math.sin(2 * Math.PI * i / samples);
    
    // C. LEVEL = round( (height + 1) / 2 x (levels - 1) )
    const level = Math.round((height + 1) / 2 * (levels - 1));
    
    // D. BINARY = level written in base 2, padded with zeros to exactly bits digits
    const binary = toBinary(level, bits);
    
    // Add row to table
    const row = tableBody.insertRow();
    const sampleNum = row.insertCell();
    const timeCell = row.insertCell();
    const ampCell = row.insertCell();
    const levelCell = row.insertCell();
    const binaryCell = row.insertCell();
    
    sampleNum.textContent = i + 1; // Show as 1-indexed
    timeCell.textContent = time.toFixed(2);
    ampCell.textContent = amp.toFixed(2);
    levelCell.textContent = level;
    binaryCell.textContent = binary;
    
    // Row hover effect
    row.classList.add('sample-row');
    
    // Keep binary in list
    binaryList.push(binary);
  }
  
  return { binaryList, samples, bits, levels };
}

function toBinary(level, bits) {
  return level.toString(2).padStart(bits, '0');
}

// ============================================================
// 5. SUMMARY: join binaries with spaces, show them, compute total bits
// ============================================================

function showResults(results, samples, bits) {
  const { binaryList } = results;
  const binaryLine = binaryList.join(' ');
  const totalBits = samples * bits;
  
  const binaryDiv = document.getElementById('binaryResult');
  binaryDiv.innerHTML = `
    <span class="binary-line" id="binaryLine">${binaryLine}</span>
    <span class="total-bits" id="totalBits">${totalBits} total bits</span>
  `;
  showElement('binaryResult');
}

// Helper to show an element
function showElement(id) {
  const el = document.getElementById(id);
  el.classList.add('show');
}

// ============================================================
// Warning / Clear functions
// ============================================================

function showWarning(message) {
  const warning = document.getElementById('warning');
  warning.textContent = message;
  warning.classList.add('show');
}

function clearWarning() {
  const warning = document.getElementById('warning');
  warning.classList.remove('show');
  warning.textContent = '';
}

function clearResults() {
  // Hide sections
  hideElement('waveFacts');
  hideElement('sampleTable');
  hideElement('binaryResult');
  hideElement('testResults');
}

function hideElement(id) {
  const el = document.getElementById(id);
  el.classList.remove('show');
}

// ============================================================
// Play button (bonus): using Web Audio API
// ============================================================

document.getElementById('playBtn').addEventListener('click', function() {
  const freq = parseFloat(document.getElementById('freq').value);
  if (freq <= 0) {
    showWarning('Please convert first with a valid frequency.');
    return;
  }
  
  // Create AudioContext (may be suspended until user interaction)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.frequency.value = freq;
  oscillator.type = 'sine';
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.start();
  setTimeout(() => {
    oscillator.stop();
  }, 1000);
});

// ============================================================
// Test Results: fixed test cases A, B, C
// ============================================================

function populateTestResults() {
  const testCasesDiv = document.getElementById('testCases');
  
  // Test A: frequency 1000, amplitude 1, samples 4, bits 2 (from worked trace)
  const testA = `
    <div class="test-case">
      <h3>Test A: freq=1000, amp=1, samples=4, bits=2</h3>
      <p>Period: 1.00 ms, Wavelength: 34.3 cm, Levels: 4 (0,1,2,3)</p>
      <p>Expected binary line: 10 11 10 00, Total bits: 8</p>
    </div>
  `;
  
  // Test B: frequency 440, amplitude 0.5, samples 8, bits 3
  const testB = `
    <div class="test-case">
      <h3>Test B: freq=440, amp=0.5, samples=8, bits=3</h3>
      <p>Period: 2.27 ms, Wavelength: 0.78 m, Levels: 8 (0-7)</p>
      <p>Total bits: 24</p>
    </div>
  `;
  
  // Test C: frequency 200, amplitude 0.8, samples 16, bits 4
  const testC = `
    <div class="test-case">
      <h3>Test C: freq=200, amp=0.8, samples=16, bits=4</h3>
      <p>Period: 5.00 ms, Wavelength: 1.72 m, Levels: 16 (0-15)</p>
      <p>Total bits: 64</p>
    </div>
  `;
  
  testCasesDiv.innerHTML = testA + testB + testC;
  showElement('testResults');
}

// Populate test results on page load
document.addEventListener('DOMContentLoaded', populateTestResults);

// ============================================================
// Explain It section: 4 written answers
// ============================================================

const explainAnswers = [
  'The period is the time for one complete wave cycle, calculated as 1/frequency × 1000 to get milliseconds. It represents how long it takes for the sound wave to repeat its pattern.',
  'The wavelength is the physical distance sound travels in one period, calculated as speed_of_sound / frequency. Using 343 m/s for sound speed, higher frequencies have shorter wavelengths.',
  'The level quantization converts the continuous sine wave height (-1 to +1) into discrete whole-number steps. The formula rounds ((height + 1) / 2 × (levels - 1)) to map the height to levels 0 through (2^bits - 1).',
  'Binary encoding pads each level value to exactly "bits" digits using base-2 representation. This ensures consistent binary output width, where total bits = samples × bits per sample, enabling fixed-size digital representation.'
];

// Set the explain answers
document.addEventListener('DOMContentLoaded', function() {
  const answerSpans = document.querySelectorAll('#explainIt .answer-text + span');
  answerSpans.forEach((span, index) => {
    span.textContent = explainAnswers[index];
  });
  showElement('explainIt');
});