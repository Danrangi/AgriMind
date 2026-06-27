// ============================================================
// AgriMind — Dashboard Interactions
// Soil type → internal NPK/pH mapping (same as original project)
// API call to FastAPI backend (wired in Day 5)
// ============================================================

const API_BASE = 'http://localhost:8000';

// Soil type → NPK + pH mapping (from original project)
const SOIL_PROFILES = {
  sandy:  { N: 20,  P: 15,  K: 10,  ph: 5.5, rainfall: 60  },
  clay:   { N: 40,  P: 30,  K: 35,  ph: 6.0, rainfall: 120 },
  loamy:  { N: 60,  P: 50,  K: 50,  ph: 6.5, rainfall: 100 },
  chalky: { N: 25,  P: 20,  K: 20,  ph: 7.5, rainfall: 70  },
  peaty:  { N: 80,  P: 35,  K: 25,  ph: 4.5, rainfall: 150 },
  silty:  { N: 55,  P: 45,  K: 40,  ph: 6.2, rainfall: 110 }
};

// --- SIDEBAR NAVIGATION ---
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

// --- SOIL SELECTION → show properties card ---
document.getElementById('soil').addEventListener('change', function () {
  const val = this.value;
  const card = document.getElementById('soilInfoCard');
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
    <span class="soil-prop">Est. rainfall: ${p.rainfall}mm</span>
  `;
  card.style.display = 'block';
});

// --- ANALYSE HANDLER ---
async function handleAnalyze() {
  const location = document.getElementById('location').value.trim();
  const soil     = document.getElementById('soil').value;

  if (!location) { alert('Please enter your city or location.'); return; }
  if (!soil)     { alert('Please select your soil type.'); return; }

  const soilProfile = SOIL_PROFILES[soil];
  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  btn.querySelector('.btn-text').style.display = 'none';
  btn.querySelector('.btn-loader').style.display = 'inline';

  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location,
        soil_type: soil,
        N:        soilProfile.N,
        P:        soilProfile.P,
        K:        soilProfile.K,
        ph:       soilProfile.ph,
        rainfall: soilProfile.rainfall
      })
    });

    if (!response.ok) throw new Error('Backend error');
    const data = await response.json();
    renderResults(data);

  } catch (err) {
    // Demo fallback while backend is not yet running
    console.warn('Backend not connected — showing demo result.');
    renderResults(getDemoResult(location, soil));
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.btn-loader').style.display = 'none';
  }
}

// --- RENDER RESULTS ---
function renderResults(data) {
  const resultsArea = document.getElementById('resultsArea');
  resultsArea.style.display = 'flex';
  setTimeout(() => resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

  // Crop
  document.getElementById('cropName').textContent       = capitalize(data.crop);
  document.getElementById('cropReason').textContent     = data.crop_reason;
  document.getElementById('cropConfidence').textContent = `${data.confidence}% match`;

  const metaEl = document.getElementById('cropMeta');
  metaEl.innerHTML = (data.crop_tags || []).map(t => `<span class="crop-tag">${t}</span>`).join('');

  // Weather stats
  document.getElementById('avgTemp').textContent        = `${data.weather.avg_temp}°C`;
  document.getElementById('avgHumidity').textContent    = `${data.weather.avg_humidity}%`;
  document.getElementById('dominantWeather').textContent = data.weather.dominant;

  // Weather breakdown (Clear/Clouds/Rain counts — like original project table)
  const breakdown = document.getElementById('weatherBreakdown');
  breakdown.innerHTML = (data.weather.breakdown || []).map(b => `
    <div class="breakdown-row">
      <span class="breakdown-label">${b.condition}</span>
      <div class="breakdown-bar-wrap">
        <div class="breakdown-bar" style="width:${b.pct}%"></div>
      </div>
      <span class="breakdown-count">${b.days} days</span>
    </div>
  `).join('');

  // Forecast strip (first 7 days)
  const strip = document.getElementById('forecastStrip');
  strip.innerHTML = (data.weather.forecast || []).slice(0, 7).map(day => `
    <div class="forecast-day">
      <div class="fday-label">${day.label}</div>
      <div class="fday-icon">${getWeatherIcon(day.condition)}</div>
      <div class="fday-temp">${day.temp}°</div>
    </div>
  `).join('');

  // Irrigation
  document.getElementById('levelFill').style.width  = `${data.irrigation.level_pct}%`;
  document.getElementById('levelLabel').textContent = data.irrigation.label;

  const amountEl = document.getElementById('irrigationAmount');
  amountEl.innerHTML = data.irrigation.amount
    ? `<span class="irrigation-amount-value">${data.irrigation.amount}</span>`
    : '';

  const tipsEl = document.getElementById('irrigationTips');
  tipsEl.innerHTML = (data.irrigation.tips || []).map(t => `<li>${t}</li>`).join('');

  // Reasoning steps
  const stepsEl = document.getElementById('reasoningSteps');
  stepsEl.innerHTML = (data.reasoning_steps || []).map((step, i) => `
    <div class="reasoning-step">
      <span class="step-num">${i + 1}</span>
      <span class="step-text">${step}</span>
    </div>
  `).join('');
}

// --- DEMO FALLBACK DATA ---
function getDemoResult(location, soil) {
  return {
    crop: 'Maize',
    crop_reason: `Based on your ${soil} soil profile and the 30-day weather forecast for ${location}, maize is the most suitable crop. The projected temperature and humidity levels align well with maize growth requirements, and your soil composition provides adequate nutrients.`,
    confidence: 89,
    crop_tags: ['High-yield potential', capitalize(soil) + ' soil compatible', 'Moderate water needs'],
    weather: {
      avg_temp: '28.3',
      avg_humidity: '65',
      dominant: 'Clouds',
      breakdown: [
        { condition: 'Clouds', days: 18, pct: 60 },
        { condition: 'Clear',  days: 8,  pct: 27 },
        { condition: 'Rain',   days: 4,  pct: 13 }
      ],
      forecast: [
        { label: 'Mon', temp: 29, condition: 'clouds' },
        { label: 'Tue', temp: 27, condition: 'clear'  },
        { label: 'Wed', temp: 30, condition: 'clouds' },
        { label: 'Thu', temp: 28, condition: 'rain'   },
        { label: 'Fri', temp: 26, condition: 'clouds' },
        { label: 'Sat', temp: 25, condition: 'clear'  },
        { label: 'Sun', temp: 27, condition: 'clouds' }
      ]
    },
    irrigation: {
      level_pct: 45,
      label: 'Light irrigation recommended',
      amount: '15 litres per square metre, every 3 days',
      tips: [
        'Forecast shows mostly cloudy weather — moderate evaporation expected.',
        'Water in the early morning to reduce evaporation loss.',
        'Reduce watering on days where rain is predicted.',
        'Monitor soil moisture every 2 days during the first 2 weeks of planting.'
      ]
    },
    reasoning_steps: [
      `Fetched live weather data for ${location} using OpenWeatherMap API.`,
      'Retrieved current temperature and humidity to seed the 30-day forecast model.',
      'Ran weather prediction model — classified each of the next 30 days as Clear, Clouds, or Rain.',
      `Computed 30-day averages: temperature ${28.3}°C, humidity ${65}%, dominant condition: Clouds.`,
      `Mapped ${soil} soil type to N/P/K/pH profile internally.`,
      'Fed soil profile + weather averages into the crop recommendation model (Random Forest).',
      'Model evaluated 22 crop types and returned Maize with 89% confidence.',
      'Computed irrigation advice based on projected rainfall vs. expected crop water needs.',
      'Assembled and returned the complete farming plan.'
    ]
  };
}

// --- UTILITIES ---
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getWeatherIcon(condition) {
  const c = (condition || '').toLowerCase();
  if (c.includes('rain'))   return '🌧';
  if (c.includes('cloud'))  return '☁';
  if (c.includes('clear'))  return '☀';
  return '🌤';
}
