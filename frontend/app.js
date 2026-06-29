// ============================================================
// AgriMind — Production Frontend
// No demo data. All results come from the live backend.
// API_BASE auto-detects: same origin in production,
// localhost in local development.
// ============================================================

// Auto-detect backend URL:
// - In production (GitHub Pages → Render): set RENDER_URL below
// - In local dev (Codespace): falls back to localhost:8000
const RENDER_URL = '';  // ← paste your Render URL here when deployed e.g. 'https://agrimind.onrender.com'
const API_BASE = RENDER_URL || 'http://localhost:8000';

// ============================================================
// Soil type → NPK/pH mapping (mirrors backend exactly)
// ============================================================
const SOIL_PROFILES = {
  sandy:  { N: 20,  P: 15,  K: 10,  ph: 5.5, rainfall: 60,  label: 'Sandy Soil'  },
  clay:   { N: 40,  P: 30,  K: 35,  ph: 6.0, rainfall: 120, label: 'Clay Soil'   },
  loamy:  { N: 60,  P: 50,  K: 50,  ph: 6.5, rainfall: 100, label: 'Loamy Soil'  },
  chalky: { N: 25,  P: 20,  K: 20,  ph: 7.5, rainfall: 70,  label: 'Chalky Soil' },
  peaty:  { N: 80,  P: 35,  K: 25,  ph: 4.5, rainfall: 150, label: 'Peaty Soil'  },
  silty:  { N: 55,  P: 45,  K: 40,  ph: 6.2, rainfall: 110, label: 'Silty Soil'  }
};

// ============================================================
// SIDEBAR NAVIGATION
// ============================================================
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

// ============================================================
// SOIL SELECTION → show properties card
// ============================================================
document.getElementById('soil').addEventListener('change', function () {
  const val   = this.value;
  const card  = document.getElementById('soilInfoCard');
  const props = document.getElementById('soilProps');

  if (!val || !SOIL_PROFILES[val]) {
    card.style.display = 'none';
    return;
  }

  const p = SOIL_PROFILES[val];
  props.innerHTML = `
    <span class="soil-prop">N: ${p.N}</span>
    <span class="soil-prop">P: ${p.P}</span>
    <span class="soil-prop">K: ${p.K}</span>
    <span class="soil-prop">pH: ${p.ph}</span>
    <span class="soil-prop">Est. rainfall: ${p.rainfall} mm</span>
  `;
  card.style.display = 'block';
});

// ============================================================
// MAIN ANALYSE HANDLER
// ============================================================
async function handleAnalyze() {
  const location = document.getElementById('location').value.trim();
  const soil     = document.getElementById('soil').value;

  // Validation
  if (!location) {
    showError('Please enter your city or location.');
    return;
  }
  if (!soil) {
    showError('Please select your soil type.');
    return;
  }

  // Hide any previous error or results
  hideError();
  hideResults();

  // Set loading state
  setLoading(true);

  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location:  location,
        soil_type: soil
      })
    });

    // Handle HTTP errors from backend
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Server error (${response.status}). Please try again.`);
    }

    const data = await response.json();
    renderResults(data);

  } catch (err) {
    // Network error or backend error — show to user clearly
    if (err.message === 'Failed to fetch') {
      showError('Could not reach the AgriMind server. Please check your connection and try again.');
    } else {
      showError(err.message);
    }
  } finally {
    setLoading(false);
  }
}

// ============================================================
// RENDER RESULTS — all data from live backend
// ============================================================
function renderResults(data) {
  const resultsArea = document.getElementById('resultsArea');
  resultsArea.style.display = 'flex';
  setTimeout(() => resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

  // --- Crop card ---
  document.getElementById('cropName').textContent       = capitalize(data.crop);
  document.getElementById('cropReason').textContent     = data.crop_reason;
  document.getElementById('cropConfidence').textContent = `${data.confidence}% match`;

  const metaEl = document.getElementById('cropMeta');
  metaEl.innerHTML = (data.crop_tags || [])
    .map(t => `<span class="crop-tag">${t}</span>`)
    .join('');

  // --- Weather stats ---
  document.getElementById('avgTemp').textContent         = `${data.weather.avg_temp}°C`;
  document.getElementById('avgHumidity').textContent     = `${data.weather.avg_humidity}%`;
  document.getElementById('dominantWeather').textContent = data.weather.dominant;

  // --- Weather breakdown bars ---
  const breakdown = document.getElementById('weatherBreakdown');
  breakdown.innerHTML = (data.weather.breakdown || []).map(b => `
    <div class="breakdown-row">
      <span class="breakdown-label">${b.condition}</span>
      <div class="breakdown-bar-wrap">
        <div class="breakdown-bar" style="width: ${b.pct}%"></div>
      </div>
      <span class="breakdown-count">${b.days} days</span>
    </div>
  `).join('');

  // --- 7-day forecast strip ---
  const strip = document.getElementById('forecastStrip');
  strip.innerHTML = (data.weather.forecast || []).slice(0, 7).map(day => `
    <div class="forecast-day">
      <div class="fday-label">${day.label}</div>
      <div class="fday-icon">${getWeatherIcon(day.condition)}</div>
      <div class="fday-temp">${day.temp}°</div>
    </div>
  `).join('');

  // --- Irrigation ---
  document.getElementById('levelFill').style.width  = `${data.irrigation.level_pct}%`;
  document.getElementById('levelLabel').textContent = data.irrigation.label;

  const amountEl = document.getElementById('irrigationAmount');
  amountEl.innerHTML = data.irrigation.amount
    ? `<span class="irrigation-amount-value">${data.irrigation.amount}</span>`
    : '';

  const tipsEl = document.getElementById('irrigationTips');
  tipsEl.innerHTML = (data.irrigation.tips || [])
    .map(t => `<li>${t}</li>`)
    .join('');

  // --- Agent reasoning steps ---
  const stepsEl = document.getElementById('reasoningSteps');
  stepsEl.innerHTML = (data.reasoning_steps || []).map((step, i) => `
    <div class="reasoning-step">
      <span class="step-num">${i + 1}</span>
      <span class="step-text">${step}</span>
    </div>
  `).join('');
}

// ============================================================
// UI STATE HELPERS
// ============================================================
function setLoading(on) {
  const btn     = document.getElementById('analyzeBtn');
  const btnText = btn.querySelector('.btn-text');
  const loader  = btn.querySelector('.btn-loader');

  btn.disabled       = on;
  btnText.style.display = on ? 'none'   : 'inline';
  loader.style.display  = on ? 'inline' : 'none';
}

function showError(message) {
  let errorEl = document.getElementById('errorBanner');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.id = 'errorBanner';
    errorEl.className = 'error-banner';
    document.querySelector('.form-action').after(errorEl);
  }
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

function hideError() {
  const errorEl = document.getElementById('errorBanner');
  if (errorEl) errorEl.style.display = 'none';
}

function hideResults() {
  document.getElementById('resultsArea').style.display = 'none';
}

// ============================================================
// UTILITIES
// ============================================================
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getWeatherIcon(condition) {
  const c = (condition || '').toLowerCase();
  if (c.includes('rain'))  return '🌧';
  if (c.includes('cloud')) return '☁';
  if (c.includes('clear')) return '☀';
  return '🌤';
}
