# ============================================================
# AgriMind — Irrigation Tool
# Rule-based logic (same approach as original project)
# Uses temperature, humidity, rain_days to compute advice
# ============================================================


def get_irrigation_advice(weather: dict, crop: str) -> dict:
    """
    Rule-based irrigation logic based on:
    - Average temperature
    - Average humidity
    - Number of rainy days in 30-day forecast

    Returns label, level_pct (for progress bar), amount, and tips.
    """

    temp      = weather["avg_temp"]
    humidity  = weather["avg_humidity"]
    rain_days = weather["rain_days"]

    # --- Core rules (from original project logic) ---

    # Heavy rain expected → minimal irrigation
    if rain_days >= 15:
        return {
            "label":     "Minimal irrigation needed",
            "level_pct": 15,
            "amount":    "5 litres per sq.m every 5 days",
            "tips": [
                "Rainfall covers most water requirements for the month.",
                "Only water if soil surface feels dry 5cm below ground.",
                "Ensure proper drainage to avoid waterlogging.",
                f"{rain_days} rainy days expected — monitor for overwatering risk."
            ]
        }

    # Hot and dry → heavy irrigation
    if temp >= 32 and humidity < 40:
        return {
            "label":     "Heavy irrigation required",
            "level_pct": 90,
            "amount":    "25 litres per sq.m every day",
            "tips": [
                "High temperature and low humidity cause rapid soil moisture loss.",
                "Water in early morning (before 8am) to reduce evaporation.",
                "Consider mulching to retain soil moisture.",
                "Check soil moisture daily — don't let it dry out completely."
            ]
        }

    # Warm and moderately dry → moderate irrigation
    if temp >= 28 and humidity < 55:
        return {
            "label":     "Moderate irrigation recommended",
            "level_pct": 65,
            "amount":    "20 litres per sq.m every 2 days",
            "tips": [
                "Warm weather increases evaporation — water consistently.",
                "Water in the morning or late evening.",
                f"Only {rain_days} rainy days expected — supplement with irrigation.",
                "Check soil weekly for moisture retention."
            ]
        }

    # Cool and humid → light irrigation
    if temp < 24 or humidity >= 70:
        return {
            "label":     "Light irrigation needed",
            "level_pct": 30,
            "amount":    "10 litres per sq.m every 3 days",
            "tips": [
                "Cool or humid conditions reduce water loss from soil.",
                "Avoid overwatering — check soil moisture before each session.",
                "Reduce watering frequency if rain is forecast.",
                "Morning watering is still preferred."
            ]
        }

    # Default — balanced conditions
    return {
        "label":     "Standard irrigation recommended",
        "level_pct": 45,
        "amount":    "15 litres per sq.m every 2-3 days",
        "tips": [
            "Conditions are balanced — maintain a regular watering schedule.",
            "Water in early morning to minimise evaporation.",
            f"Adjust schedule on the {rain_days} days where rain is expected.",
            "Monitor crop leaves — wilting indicates more water is needed."
        ]
    }
