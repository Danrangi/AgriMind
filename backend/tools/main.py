# ============================================================
# AgriMind — FastAPI Backend
# 
# Endpoints:
#   POST /analyze          → full agent flow (crop + irrigation + weather)
#   POST /irrigation        → standalone irrigation advice (no soil needed)
#   GET  /detect-location    → IP-based city auto-detect
#   GET  /                  → health check
# ============================================================
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from tools.weather_tool import get_weather_forecast
from tools.crop_tool import recommend_crop
from tools.irrigation_tool import get_irrigation_advice
from tools.location_tool import detect_location_from_ip

load_dotenv()

app = FastAPI(title="AgriMind API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    location:  str
    soil_type: str


class IrrigationRequest(BaseModel):
    location: str


@app.get("/")
def root():
    return {"status": "AgriMind API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# ============================================================
# FULL AGENT FLOW — crop + irrigation + weather combined
# ============================================================
@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    """
    Main endpoint — the agentic flow.
    weather_tool → crop_tool → irrigation_tool, returns combined plan.
    """
    try:
        weather     = get_weather_forecast(req.location)
        crop_result = recommend_crop(req.soil_type, weather)
        irrigation  = get_irrigation_advice(weather, crop_result["crop"])

        reasoning_steps = [
            f"Fetched live weather data for {req.location} using OpenWeatherMap API.",
            f"Current conditions: {weather['current_temp']}°C, {weather['current_humidity']}% humidity, {weather['current_condition']}.",
            f"Generated 30-day forecast by extending 5-day API data using pattern projection.",
            f"30-day averages: temperature {weather['avg_temp']}°C, humidity {weather['avg_humidity']}%, dominant weather: {weather['dominant']}.",
            f"Mapped {req.soil_type} soil type to N={crop_result['soil_used']['N']}, P={crop_result['soil_used']['P']}, K={crop_result['soil_used']['K']}, pH={crop_result['soil_used']['ph']}.",
            f"Fed soil profile + weather averages into Random Forest crop model — evaluated 22 crop types.",
            f"Model returned {crop_result['crop'].capitalize()} with {crop_result['confidence']}% confidence, plus 4 close alternatives.",
            f"Computed irrigation advice: {irrigation['label']} — {irrigation['amount']}."
        ]

        return {
            "crop":         crop_result["crop"],
            "crop_reason":  crop_result["reason"],
            "confidence":   crop_result["confidence"],
            "crop_tags":    crop_result["tags"],
            "alternatives": crop_result["alternatives"],
            "weather": {
                "avg_temp":     str(weather["avg_temp"]),
                "avg_humidity": str(weather["avg_humidity"]),
                "dominant":     weather["dominant"],
                "breakdown":    weather["breakdown"],
                "forecast":     weather["forecast"][:7]
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


# ============================================================
# STANDALONE IRRIGATION — matches original app's irrigation tab
# Only needs location, no soil type required
# ============================================================
@app.post("/irrigation")
def irrigation_only(req: IrrigationRequest):
    """
    Standalone irrigation advice based purely on weather —
    no crop or soil type needed. Mirrors the original SmartFarm
    app's independent "Irrigation Advice" tab.
    """
    try:
        weather    = get_weather_forecast(req.location)
        irrigation = get_irrigation_advice(weather, crop="general")

        return {
            "location": req.location,
            "current": {
                "temp":      weather["current_temp"],
                "humidity":  weather["current_humidity"],
                "condition": weather["current_condition"]
            },
            "irrigation": {
                "level_pct": irrigation["level_pct"],
                "label":     irrigation["label"],
                "amount":    irrigation["amount"],
                "tips":      irrigation["tips"]
            }
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Irrigation lookup failed: {str(e)}")


# ============================================================
# AUTO-DETECT LOCATION — matches original "Use My Current Location"
# ============================================================
@app.get("/detect-location")
def detect_location(request: Request):
    """
    Detects the user's city from their IP address.
    Uses the real client IP from request headers when available
    (works correctly behind Render's proxy via X-Forwarded-For).
    """
    try:
        # Try to get real client IP (Render sets X-Forwarded-For)
        forwarded = request.headers.get("x-forwarded-for")
        client_ip = forwarded.split(",")[0].strip() if forwarded else None

        result = detect_location_from_ip(client_ip)
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Location detection failed: {str(e)}")
