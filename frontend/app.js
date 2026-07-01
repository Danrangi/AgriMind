// ============================================================
// AgriMind — Production JS
// All data from live Render backend. Zero mock data.
// ============================================================

const API_BASE = 'https://agrimind-backend-5kzh.onrender.com';

const SOIL_PROFILES = {
  sandy:  { N: 20,  P: 15,  K: 10,  ph: 5.5, rainfall: 60  },
  clay:   { N: 40,  P: 30,  K: 35,  ph: 6.0, rainfall: 120 },
  loamy:  { N: 60,  P: 50,  K: 50,  ph: 6.5, rainfall: 100 },
  chalky: { N: 25,  P: 20,  K: 20,  ph: 7.5, rainfall: 70  },
  peaty:  { N: 80,  P: 35,  K: 25,  ph: 4.5, rainfall: 150 },
  silty:  { N: 55,  P: 45,  K: 40,  ph: 6.2, rainfall: 110 }
};

// Crop photo mapping using Unsplash
const CROP_PHOTOS = {
  rice:        'https://images.unsplash.com/photo-1536054945547-8a6c8b9dba81?w=600&q=80',
  maize:       'https://images.unsplash.com/photo-1507637379087-515718ca7c58?w=600&q=80',
  chickpea:    'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80',
  kidneybeans: 'https://images.unsplash.com/photo-1627485937980-221c88ac04f9?w=600&q=80',
  pigeonpeas:  'https://images.unsplash.com/photo-1592994711654-21d9f1a74e47?w=600&q=80',
  mothbeans:   'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80',
  mungbean:    'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80',
  blackgram:   'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80',
  lentil:      'https://images.unsplash.com/photo-1548366086-7f1b76106622?w=600&q=80',
  pomegranate: 'https://images.unsplash.com/photo-1615485925600-97237c4fc1ec?w=600&q=80',
  banana:      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80',
  mango:       'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80',
  grapes:      'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&q=80',
  watermelon:  'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?w=600&q=80',
  muskmelon:   'https://images.unsplash.com/photo-1571575173927-4dfa3c1d0c35?w=600&q=80',
  apple:       'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80',
  orange:      'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=600&q=80',
  papaya:      'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=600&q=80',
  coconut:     'https://images.unsplash.com/photo-1546636889-ba9fdd63583e?w=600&q=80',
  cotton:      'https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=600&q=80',
  jute:        'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?w=600&q=80',
  coffee:      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80',
};

const CROP_EMOJIS = {
  rice:'🌾', maize:'🌽', chickpea:'🫘', kidneybeans:'🫘', pigeonpeas:'🫛',
  mothbeans:'🌿', mungbean:'🌿', blackgram:'🫘', lentil:'🫘',
  pomegranate:'🍎', banana:'🍌', mango:'🥭', grapes:'🍇',
  watermelon:'🍉', muskmelon:'🍈', apple:'🍎', orange:'🍊',
  papaya:'🍐', coconut:'🥥', cotton:'🌸', jute:'🌿', coffee:'☕',
};

// ============================================================
// PAGE NAVIGATION
// ============================================================
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  document.querySelectorAll('.nav-link, .bottom-nav__item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  window.scrollTo(0, 0);
}

// ============================================================
// CROP RECOMMENDATION FLOW
// ============================================================
async function handleCropAnalyze() {
  const location = document.getElementById('cropLocation').value.trim();
  const soil     = document.getElementById('cropSoil').value;

  hideError('cropError');
  if (!location) { showError('cropError', 'Please enter your city or town.'); return; }
  if (!soil)     { showError('cropError', 'Please select your soil type.'); return; }

  // Show step 2 (analyzing screen)
  document.getElementById('crop-step1').style.display = 'none';
  document.getElementById('crop-step2').style.display = 'block';
  document.getElementById('crop-step3').style.display = 'none';

  // Animate reasoning trail steps
  const trailSteps = [
    'Fetching 30-day weather forecast for your location...',
    `Analysing crop compatibility for ${soil} soil...`,
    'Calculating estimated water requirements...',
    'Finalising top recommendations with confidence scores...'
  ];
  const trail = document.getElementById('reasoningTrail');
  trail.innerHTML = trailSteps.map((text, i) => `
    <div class="reasoning-trail__item" id="trail-${i}">
      <svg class="icon-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M9 12l2 2 4-4"/></svg>
      ${text}
    </div>
  `).join('');

  // Reveal steps one by one
  const delays = [300, 1200, 2400, 3600];
  delays.forEach((delay, i) => {
    setTimeout(() => {
      const el = document.getElementById(`trail-${i}`);
      if (el) {
        el.classList.add('visible');
        // Mark previous as checked
        if (i > 0) {
          const prev = document.getElementById(`trail-${i-1}`);
          if (prev) prev.querySelector('svg').outerHTML = `<svg class="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        }
      }
    }, delay);
  });

  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, soil_type: soil })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Server error (${response.status}).`);
    }

    const data = await response.json();

    // Wait for trail animation to finish before showing results
    setTimeout(() => renderCropResults(data, location, soil), 4200);

  } catch (err) {
    setTimeout(() => {
      document.getElementById('crop-step2').style.display = 'none';
      document.getElementById('crop-step1').style.display = 'block';
      showError('cropError', err.message === 'Failed to fetch'
        ? 'Could not reach the AgriMind server. Please check your connection.'
        : err.message);
    }, 1000);
  }
}

function renderCropResults(data, location, soil) {
  document.getElementById('crop-step2').style.display = 'none';
  document.getElementById('crop-step3').style.display = 'block';

  const crop = data.crop.toLowerCase();

  // Primary crop card
  const img = document.getElementById('cropResultImg');
  const photo = CROP_PHOTOS[crop];
  if (photo) {
    img.src = photo;
    img.alt = data.crop;
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
    document.querySelector('.crop-result-img-wrap').innerHTML =
      `<div style="height:100%;background:var(--green-100);display:flex;align-items:center;justify-content:center;font-size:3rem;">${CROP_EMOJIS[crop] || '🌱'}</div><span class="crop-top-badge">Top Match</span>`;
  }

  document.getElementById('cropResultName').textContent = capitalize(data.crop);
  document.getElementById('cropResultConf').textContent = `${data.confidence}%`;
  document.getElementById('cropResultReason').textContent = data.crop_reason;

  // Weather big numbers
  const bd = data.weather.breakdown || [];
  const clearDays  = (bd.find(b => b.condition === 'Clear')  || {}).days || 0;
  const cloudDays  = (bd.find(b => b.condition === 'Clouds') || {}).days || 0;
  const rainDays   = (bd.find(b => b.condition === 'Rain')   || {}).days || 0;
  document.getElementById('weatherBigNums').innerHTML = `
    <div class="weather-big-num">
      <span class="weather-big-num__val weather-big-num__val--sun">${clearDays}</span>
      <span class="weather-big-num__label">Clear</span>
    </div>
    <div class="weather-big-num">
      <span class="weather-big-num__val weather-big-num__val--cloud">${cloudDays}</span>
      <span class="weather-big-num__label">Cloudy</span>
    </div>
    <div class="weather-big-num">
      <span class="weather-big-num__val weather-big-num__val--rain">${rainDays}</span>
      <span class="weather-big-num__label">Rainy</span>
    </div>
  `;

  // 7-day strip
  document.getElementById('cropForecastStrip').innerHTML =
    (data.weather.forecast || []).slice(0, 7).map(day => `
      <div class="forecast-day">
        <span class="forecast-day__label">${day.label}</span>
        <span class="forecast-day__icon">${getWeatherIcon(day.condition)}</span>
        <span class="forecast-day__temp">${Math.round(day.temp)}°</span>
      </div>
    `).join('');

  // Irrigation amount block
  const irr = data.irrigation;
  document.getElementById('irrigationAmountBlock').innerHTML = `
    <div class="irrigation-amount-badge">${irr.amount.split(' ').slice(0,2).join(' ')}</div>
    <div class="irrigation-amount-text">
      <p class="irrigation-amount-title">${irr.label}</p>
      <p>${irr.amount}</p>
    </div>
  `;

  document.getElementById('cropIrrigationTips').innerHTML =
    (irr.tips || []).map(t => `<li>${t}</li>`).join('');

  // Alternatives grid
  document.getElementById('altGrid').innerHTML =
    (data.alternatives || []).map(alt => {
      const altKey = alt.crop.toLowerCase();
      const altPhoto = CROP_PHOTOS[altKey];
      const imgBlock = altPhoto
        ? `<div class="alt-card__img"><img src="${altPhoto}" alt="${alt.crop}" /></div>`
        : `<div class="alt-card__img--placeholder">${CROP_EMOJIS[altKey] || '🌱'}</div>`;
      return `
        <div class="alt-card">
          ${imgBlock}
          <div class="alt-card__body">
            <div class="alt-card__name">${capitalize(alt.crop)}</div>
            <div class="alt-card__bar-wrap">
              <div class="alt-card__bar"><div class="alt-card__bar-fill" style="width:${alt.confidence}%"></div></div>
              <span class="alt-card__conf">${alt.confidence}%</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

  document.getElementById('crop-step3').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetCrop() {
  document.getElementById('crop-step1').style.display = 'block';
  document.getElementById('crop-step2').style.display = 'none';
  document.getElementById('crop-step3').style.display = 'none';
  document.getElementById('cropLocation').value = '';
  document.getElementById('cropSoil').value = '';
  hideError('cropError');
  window.scrollTo(0, 0);
}

// ============================================================
// IRRIGATION FLOW
// ============================================================
async function handleIrrigationOnly() {
  const location = document.getElementById('irrLocation').value.trim();
  hideError('irrError');
  if (!location) { showError('irrError', 'Please enter your city or use auto-detect.'); return; }

  setBtnLoading('irrBtn', true);
  document.getElementById('irr-results').style.display = 'none';

  try {
    const response = await fetch(`${API_BASE}/irrigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Server error (${response.status}).`);
    }

    const data = await response.json();
    renderIrrigationResults(data, location);

  } catch (err) {
    showError('irrError', err.message === 'Failed to fetch'
      ? 'Could not reach the AgriMind server. Please check your connection.'
      : err.message);
  } finally {
    setBtnLoading('irrBtn', false);
  }
}

async function handleDetectLocation() {
  setBtnLoading('detectBtn', true);
  hideError('irrError');

  try {
    const response = await fetch(`${API_BASE}/detect-location`);
    if (!response.ok) throw new Error('Could not detect your location.');
    const data = await response.json();
    document.getElementById('irrLocation').value = data.city;
  } catch (err) {
    showError('irrError', err.message);
  } finally {
    setBtnLoading('detectBtn', false);
  }
}

function renderIrrigationResults(data, location) {
  document.getElementById('irrHeroLocation').textContent = `📍 ${location}`;
  document.getElementById('irrHeroTemp').textContent     = `${Math.round(data.current.temp)}°`;
  document.getElementById('irrHeroCondition').textContent = data.current.condition;
  document.getElementById('irrHeroHumidity').textContent  = `${data.current.humidity}% humidity`;
  document.getElementById('irrHeroConditionTag').textContent = data.current.condition;

  const irr = data.irrigation;
  document.getElementById('irrAdviceHeader').innerHTML = `
    <div class="irr-advice-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2C6 9 4 13 4 16a8 8 0 0016 0c0-3-2-7-8-14z"/>
      </svg>
    </div>
    <div>
      <div class="irr-advice-title">${irr.label}</div>
      <p class="irr-advice-desc">Apply <strong>${irr.amount}</strong> to keep your crops healthy.</p>
    </div>
  `;

  document.getElementById('irrTipsList').innerHTML =
    (irr.tips || []).map(t => `<li>${t}</li>`).join('');

  document.getElementById('irr-results').style.display = 'flex';
  setTimeout(() => document.getElementById('irr-results').scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function resetIrrigation() {
  document.getElementById('irr-results').style.display = 'none';
  document.getElementById('irrLocation').value = '';
  hideError('irrError');
  window.scrollTo(0, 0);
}

// ============================================================
// HELPERS
// ============================================================
function setBtnLoading(id, on) {
  const btn  = document.getElementById(id);
  const text = btn.querySelector('.btn__text');
  const load = btn.querySelector('.btn__loader');
  btn.disabled = on;
  if (text) text.style.display = on ? 'none' : 'inline-flex';
  if (load) load.style.display = on ? 'inline-flex' : 'none';
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function hideError(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getWeatherIcon(condition) {
  const c = (condition || '').toLowerCase();
  if (c.includes('rain'))  return '🌧';
  if (c.includes('cloud')) return '☁️';
  if (c.includes('clear')) return '☀️';
  return '🌤';
}
