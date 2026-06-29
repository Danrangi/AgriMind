# ============================================================
# AgriMind — Crop Recommendation Tool
# Loads trained RandomForest model and predicts best crop
# ============================================================
import os
import joblib
import numpy as np

# Paths to your trained model files
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR  = os.path.join(BASE_DIR, "../models")

MODEL_PATH   = os.path.join(MODEL_DIR, "crop_model.pkl")
SCALER_PATH  = os.path.join(MODEL_DIR, "crop_scaler.pkl")
ENCODER_PATH = os.path.join(MODEL_DIR, "crop_label_encoder.pkl")

# Load once at startup
model   = joblib.load(MODEL_PATH)
scaler  = joblib.load(SCALER_PATH)
encoder = joblib.load(ENCODER_PATH)


# Soil type → NPK/pH mapping (same as frontend)
SOIL_PROFILES = {
    "sandy":  {"N": 20,  "P": 15,  "K": 10,  "ph": 5.5, "rainfall": 60},
    "clay":   {"N": 40,  "P": 30,  "K": 35,  "ph": 6.0, "rainfall": 120},
    "loamy":  {"N": 60,  "P": 50,  "K": 50,  "ph": 6.5, "rainfall": 100},
    "chalky": {"N": 25,  "P": 20,  "K": 20,  "ph": 7.5, "rainfall": 70},
    "peaty":  {"N": 80,  "P": 35,  "K": 25,  "ph": 4.5, "rainfall": 150},
    "silty":  {"N": 55,  "P": 45,  "K": 40,  "ph": 6.2, "rainfall": 110},
}

# Crop knowledge base for tags and context
CROP_TAGS = {
    "rice":        ["High humidity crop", "Needs heavy rainfall", "Tropical climate"],
    "maize":       ["Drought tolerant", "Wide soil compatibility", "High yield"],
    "chickpea":    ["Low water needs", "Nitrogen-fixing", "Dry season crop"],
    "kidneybeans": ["Moderate rainfall", "Rich soil needed", "Legume crop"],
    "pigeonpeas":  ["Drought resistant", "Poor soil tolerant", "Protein-rich"],
    "mothbeans":   ["Very drought tolerant", "Sandy soil friendly", "Arid regions"],
    "mungbean":    ["Short growing season", "Warm climate", "Low water needs"],
    "blackgram":   ["Humid climate", "Heavy soil compatible", "Legume"],
    "lentil":      ["Cool season crop", "Low rainfall", "High protein"],
    "pomegranate": ["Drought tolerant", "Well-draining soil", "Tropical fruit"],
    "banana":      ["High humidity", "Rich fertile soil", "Year-round crop"],
    "mango":       ["Dry season fruit", "Well-draining soil", "Tropical"],
    "grapes":      ["Warm dry climate", "Well-draining soil", "Low humidity"],
    "watermelon":  ["Hot climate", "Sandy loam ideal", "High rainfall"],
    "muskmelon":   ["Warm dry climate", "Well-draining soil", "Short season"],
    "apple":       ["Cool climate", "Well-draining soil", "Temperate fruit"],
    "orange":      ["Subtropical climate", "Well-draining soil", "Citrus"],
    "papaya":      ["Tropical climate", "Rich moist soil", "Year-round"],
    "coconut":     ["Coastal tropical", "Sandy soil", "High humidity"],
    "cotton":      ["Warm dry climate", "Heavy soil", "Cash crop"],
    "jute":        ["High rainfall", "Alluvial soil", "Warm humid"],
    "coffee":      ["High altitude", "Acidic rich soil", "Shade-loving"],
}


def recommend_crop(soil_type: str, weather: dict) -> dict:
    """
    Takes soil type + weather summary and returns crop recommendation
    with confidence score, reasoning tags, and explanation.
    """

    profile = SOIL_PROFILES.get(soil_type.lower())
    if not profile:
        raise ValueError(f"Unknown soil type: {soil_type}")

    # Build feature vector: [N, P, K, temperature, humidity, ph, rainfall]
    features = np.array([[
        profile["N"],
        profile["P"],
        profile["K"],
        weather["avg_temp"],
        weather["avg_humidity"],
        profile["ph"],
        profile["rainfall"]
    ]])

    # Scale and predict
    features_scaled = scaler.transform(features)
    probabilities   = model.predict_proba(features_scaled)[0]
    predicted_index = np.argmax(probabilities)
    confidence      = round(float(probabilities[predicted_index]) * 100, 1)
    crop_name       = encoder.inverse_transform([predicted_index])[0]

    # Build reasoning string
    dominant = weather.get("dominant", "mixed")
    reason = (
        f"Based on your {soil_type} soil profile (N={profile['N']}, P={profile['P']}, "
        f"K={profile['K']}, pH={profile['ph']}) and the 30-day weather forecast for "
        f"{weather.get('location', 'your location')} — average temperature {weather['avg_temp']}°C, "
        f"humidity {weather['avg_humidity']}%, dominant condition: {dominant} — "
        f"the model recommends {crop_name.capitalize()} with {confidence}% confidence."
    )

    tags = CROP_TAGS.get(crop_name.lower(), ["Suitable for your conditions"])

    return {
        "crop":       crop_name,
        "confidence": confidence,
        "reason":     reason,
        "tags":       tags,
        "soil_used":  profile
    }
