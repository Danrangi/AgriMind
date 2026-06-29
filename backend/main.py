# ============================================================
# AgriMind — FastAPI Backend
# Single /analyze endpoint — receives location + soil type,
# runs the agent, returns complete farming plan
# ============================================================
import os
import sys

# Make sure tools/ is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from tools.weather_tool import get_weather_forecast
from tools.crop_tool import recommend_crop
from tools.irrigation_tool import get_irrigation_advice

load_dotenv()

app = FastAPI(title="AgriMind API", version="1.0.0")

# Allow frontend to call the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    location:  str
    soil_type: str


@app.get("/")
def root():
    return {"status": "AgriMind API is running"}


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    """
    Main endpoint. Called by the frontend when farmer clicks Analyse.
    
    Flow:
    1. weather_tool  → 30-day forecast
    2. crop_tool     → best crop for soil + weather
    3. irrigation_tool → watering advice
    4. Return structured response matching frontend schema
    """
    try:
        # Step 1 — Weather
        weather = get_weather_forecast(req.location)

        # Step 2 — Crop recommendation
        crop_result = recommend_crop(req.soil_type, weather)

        # Step 3 — Irrigation advice
        irrigation = get_irrigation_advice(weather, crop_result["crop"])

        # Step 4 — Build reasoning steps (what the agent did)
        reasoning_steps = [
            f"Fetched live weather data for {req.location} using OpenWeatherMap API.",
            f"Current conditions: {weather['current_temp']}°C, {weather['current_humidity']}% humidity, {weather['current_condition']}.",
            f"Generated 30-day forecast by extending 5-day API data using pattern projection.",
            f"30-day averages: temperature {weather['avg_temp']}°C, humidity {weather['avg_humidity']}%, dominant weather: {weather['dominant']}.",
            f"Mapped {req.soil_type} soil type to N={crop_result['soil_used']['N']}, P={crop_result['soil_used']['P']}, K={crop_result['soil_used']['K']}, pH={crop_result['soil_used']['ph']}.",
            f"Fed soil profile + weather averages into Random Forest crop model — evaluated 22 crop types.",
            f"Model returned {crop_result['crop'].capitalize()} with {crop_result['confidence']}% confidence.",
            f"Computed irrigation advice: {irrigation['label']} — {irrigation['amount']}."
        ]

        # Return in the shape the frontend expects
        return {
            "crop":        crop_result["crop"],
            "crop_reason": crop_result["reason"],
            "confidence":  crop_result["confidence"],
            "crop_tags":   crop_result["tags"],
            "weather": {
                "avg_temp":    str(weather["avg_temp"]),
                "avg_humidity": str(weather["avg_humidity"]),
                "dominant":    weather["dominant"],
                "breakdown":   weather["breakdown"],
                "forecast":    weather["forecast"][:7]   # only first 7 for strip
            },
            "irrigation": {
                "level_pct": irrigation["level_pct"],
                "label":     irrigation["label"],
                "amount":    irrigation["amount"],
                "tips":      irrigation["tips"]
            },
            "reasoning_steps": reasoning_steps
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/health")
def health():
    return {"status": "ok"}
