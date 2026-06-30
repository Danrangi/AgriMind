// ============================================================
// AgriMind — Production Frontend
// Three modes: dashboard / crop (both use /analyze),
// irrigation (uses /irrigation + /detect-location)
// No demo data. All results come from the live backend.
// ============================================================

const RENDER_URL = 'https://agrimind-backend-5kzh.onrender.com';
const API_BASE = RENDER_URL || 'http://localhost:8000';

const SOIL_PROFILES = {
  sandy:  { N: 20,  P: 15,  K: 10,  ph: 5.5, rainfall: 60  },
  clay:   { N: 40,  P: 30,  K: 35,  ph: 6.0, rainfall: 120 },
  loamy:  { N: 60,  P: 50,  K: 50,  ph: 6.5, rainfall: 100 },
  chalky: { N: 25,  P: 20,  K: 20,  ph: 7.5, rainfall: 70  },
  peaty:  { N: 80,  P: 35,  K: 25,  ph: 4.5, rainfall: 150 },
  silty:  { N: 55,  P: 45,  K: 40,  ph: 6.2, rainfall: 110 }
};

const MODE_CONTENT = {
  dashboard: {
    eyebrow: 'Smart Farming, Simplified',
    title:   'What will you grow today?',
    sub:     'Tell us your location and soil type. AgriMind will fetch live weather data, forecast the next 30 days, and return your complete farming plan — crop, weather, and irrigation — in one place.'
  },
  crop: {
    eyebrow: 'Crop Recommendation',
    title:   'Find your best crop',
    sub:     'AgriMind analyses your soil and 30-day weather forecast to recommend the most suitable crop, plus four close alternatives.'
  },
  irrigation: {
    eyebrow: 'Irrigation Advice',
    title:   'How much water does your farm need?',
    sub:     'Get instant watering advice based on real-time weather — no soil type required.'
  }
};

let currentMode = 'dashboard';

// ============================================================
// MODE SWITCHING
// ============================================================
function switchMode(mode) {
  currentMode = mode;

  document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
  document.querySelector(`.menu-item[data-mode="${mode}"]`).classList.add('active');

  const content = MODE_CONTENT[mode];
  document.getElementById('modeEyebrow').textContent = content.eyebrow;
  document.getElementById('modeTitle').textContent    = content.title;
  document.getElementById('modeSub').textContent      = content.sub;

  hideError();
  document.getElementById('resultsArea').style.display = 'none';
  document.getElementById('irrigationResultsArea').style.display = 'none';

  if (mode === 'irrigation') {
    document.getElementById('fullForm').style.display = 'none';
    document.getElementById('irrigationForm').style.display = 'block';
  } else {
    document.getElementById('fullForm').style.display = 'block';
    document.getElementById('irrigationForm').style.display = 'none';
  }
}

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
// FULL ANALYZE (Dashboard + Crop Recommendation modes)
// ============================================================
async function handleAnalyze() {
  const location = document.getElementById('location').value.trim();
  const soil     = document.getElementById('soil').value;

  if (!location) { showError('Please enter your city or location.'); return; }
  if (!soil)     { showError('Please select your soil type.'); return; }

  hideError();
  document.getElementById('resultsArea').style.display = 'none';
  setBtnLoading('analyzeBtn', true);

  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, soil_type: soil })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Server error (${response.status}). Please try again.`);
    }

    const data = await response.json();
    renderFullResults(data);

  } catch (err) {
    showError(err.message === 'Failed to fetch'
      ? 'Could not reach the AgriMind server. Please check your connection and try again.'
      : err.message);
  } finally {
    setBtnLoading('analyzeBtn', false);
  }
}

// ============================================================
// IRRIGATION-ONLY (Irrigation Advice mode)
// ============================================================
async function handleIrrigationOnly() {
  const location = document.getElementById('irrigationLocation').value.trim();

  if (!location) { showError('Please enter your city or use auto-detect.'); return; }

  hideError();
  document.getElementById('irrigationResultsArea').style.display = 'none';
  setBtnLoading('irrigationBtn', true);

  try {
    const response = await fetch(`${API_BASE}/irrigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Server error (${response.status}). Please try again.`);
    }

    const data = await response.json();
    renderIrrigationResults(data);

  } catch (err) {
    showError(err.message === 'Failed to fetch'
      ? 'Could not reach the AgriMind server. Please check your connection and try again.'
      : err.message);
  } finally {
    setBtnLoading('irrigationBtn', false);
  }
}

// ============================================================
// AUTO-DETECT LOCATION
// ============================================================
async function handleDetectLocation() {
  hideError();
  setBtnLoading('detectBtn', true);

  try {
    const response = await fetch(`${API_BASE}/detect-location`);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Could not detect your location.');
    }

    const data = await response.json();
    document.getElementById('irrigationLocation').value = data.city;

  } catch (err) {
    showError(err.message === 'Failed to fetch'
      ? 'Could not reach the AgriMind server.'
      : err.message);
  } finally {
    setBtnLoading('detectBtn', false);
  }
}

// ============================================================
// RENDER — FULL RESULTS (Dashboard / Crop modes)
// ============================================================
function renderFullResults(data) {
  const resultsArea = document.getElementById('resultsArea');
  resultsArea.style.display = 'flex';
  setTimeout(() => resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

  document.getElementById('cropName').textContent       = capitalize(data.crop);
  document.getElementById('cropReason').textContent     = data.crop_reason;
  document.getElementById('cropConfidence').textContent = `${data.confidence}% match`;

  document.getElementById('cropMeta').innerHTML = (data.crop_tags || [])
    .map(t => `<span class="crop-tag">${t}</span>`).join('');

  // Alternatives grid
  const altGrid = document.getElementById('alternativesGrid');
  altGrid.innerHTML = (data.alternatives || []).map(alt => `
    <div class="alt-card">
      <div class="alt-card__header">
        <span class="alt-crop-name">${capitalize(alt.crop)}</span>
        <span class="alt-confidence">${alt.confidence}%</span>
      </div>
      <div class="alt-tags">
        ${(alt.tags || []).slice(0, 2).map(t => `<span class="alt-tag">${t}</span>`).join('')}
      </div>
    </div>
  `).join('');

  document.getElementById('avgTemp').textContent         = `${data.weather.avg_temp}°C`;
  document.getElementById('avgHumidity').textContent     = `${data.weather.avg_humidity}%`;
  document.getElementById('dominantWeather').textContent = data.weather.dominant;

  document.getElementById('weatherBreakdown').innerHTML = (data.weather.breakdown || []).map(b => `
    <div class="breakdown-row">
      <span class="breakdown-label">${b.condition}</span>
      <div class="breakdown-bar-wrap"><div class="breakdown-bar" style="width:${b.pct}%"></div></div>
      <span class="breakdown-count">${b.days} days</span>
    </div>
  `).join('');

  document.getElementById('forecastStrip').innerHTML = (data.weather.forecast || []).slice(0, 7).map(day => `
    <div class="forecast-day">
      <div class="fday-label">${day.label}</div>
      <div class="fday-icon">${getWeatherIcon(day.condition)}</div>
      <div class="fday-temp">${day.temp}°</div>
    </div>
  `).join('');

  document.getElementById('levelFill').style.width  = `${data.irrigation.level_pct}%`;
  document.getElementById('levelLabel').textContent = data.irrigation.label;
  document.getElementById('irrigationAmount').innerHTML = data.irrigation.amount
    ? `<span class="irrigation-amount-value">${data.irrigation.amount}</span>` : '';
  document.getElementById('irrigationTips').innerHTML = (data.irrigation.tips || [])
    .map(t => `<li>${t}</li>`).join('');

  document.getElementById('reasoningSteps').innerHTML = (data.reasoning_steps || []).map((step, i) => `
    <div class="reasoning-step">
      <span class="step-num">${i + 1}</span>
      <span class="step-text">${step}</span>
    </div>
  `).join('');
}

// ============================================================
// RENDER — IRRIGATION-ONLY RESULTS
// ============================================================
function renderIrrigationResults(data) {
  const area = document.getElementById('irrigationResultsArea');
  area.style.display = 'flex';
  setTimeout(() => area.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

  document.getElementById('irrCurrentTemp').textContent      = `${data.current.temp}°C`;
  document.getElementById('irrCurrentHumidity').textContent  = `${data.current.humidity}%`;
  document.getElementById('irrCurrentCondition').textContent = data.current.condition;

  document.getElementById('irrLevelFill').style.width  = `${data.irrigation.level_pct}%`;
  document.getElementById('irrLevelLabel').textContent = data.irrigation.label;
  document.getElementById('irrAmount').innerHTML = data.irrigation.amount
    ? `<span class="irrigation-amount-value">${data.irrigation.amount}</span>` : '';
  document.getElementById('irrTips').innerHTML = (data.irrigation.tips || [])
    .map(t => `<li>${t}</li>`).join('');
}

// ============================================================
// UI STATE HELPERS
// ============================================================
function setBtnLoading(btnId, on) {
  const btn     = document.getElementById(btnId);
  const btnText = btn.querySelector('.btn-text');
  const loader  = btn.querySelector('.btn-loader');
  btn.disabled  = on;
  btnText.style.display = on ? 'none'   : 'inline';
  loader.style.display  = on ? 'inline' : 'none';
}

function showError(message) {
  let errorEl = document.getElementById('errorBanner');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.id = 'errorBanner';
    errorEl.className = 'error-banner';
    const activeForm = currentMode === 'irrigation'
      ? document.getElementById('irrigationForm')
      : document.getElementById('fullForm');
    activeForm.appendChild(errorEl);
  } else {
    // Move banner to currently visible form
    const activeForm = currentMode === 'irrigation'
      ? document.getElementById('irrigationForm')
      : document.getElementById('fullForm');
    activeForm.appendChild(errorEl);
  }
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

function hideError() {
  const errorEl = document.getElementById('errorBanner');
  if (errorEl) errorEl.style.display = 'none';
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
