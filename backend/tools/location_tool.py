# ============================================================
# AgriMind — Location Auto-Detection Tool
# Uses free IP geolocation API to detect user's city
# Mirrors original SmartFarm "Use My Current Location" feature
# ============================================================
import requests


def detect_location_from_ip(ip_address: str = None) -> dict:
    """
    Detects city from IP address using ipapi.co (free, no key required).
    If ip_address is None, detects based on the server's own IP
    (used as fallback — in production, pass the client's real IP
    from the request headers for accuracy).
    """
    try:
        url = f"https://ipapi.co/{ip_address}/json/" if ip_address else "https://ipapi.co/json/"
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        data = resp.json()

        city = data.get("city")
        if not city:
            raise ValueError("Could not detect city from location data.")

        return {
            "city":    city,
            "region":  data.get("region", ""),
            "country": data.get("country_name", "")
        }
    except Exception as e:
        raise ValueError(f"Location detection failed: {str(e)}")
