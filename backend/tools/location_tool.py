# ============================================================
# AgriMind — Location Auto-Detection Tool
# Uses ip-api.com (free, no key, 45 req/min limit — more
# reliable than ipapi.co for hackathon/demo traffic)
# Mirrors original SmartFarm "Use My Current Location" feature
# ============================================================
import requests


def detect_location_from_ip(ip_address: str = None) -> dict:
    """
    Detects city from IP address using ip-api.com (free, no key).
    If ip_address is None or is a local/private address, detects
    based on the server's own public IP as a fallback.
    """
    try:
        # ip-api.com doesn't resolve private/local IPs — use empty
        # path to auto-detect from the requester's IP when valid
        target = ip_address if (ip_address and not _is_private_ip(ip_address)) else ""
        url = f"http://ip-api.com/json/{target}"

        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        data = resp.json()

        if data.get("status") != "success":
            raise ValueError(data.get("message", "Could not detect location."))

        city = data.get("city")
        if not city:
            raise ValueError("Could not detect city from location data.")

        return {
            "city":    city,
            "region":  data.get("regionName", ""),
            "country": data.get("country", "")
        }
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Location service unavailable: {str(e)}")
    except Exception as e:
        raise ValueError(f"Location detection failed: {str(e)}")


def _is_private_ip(ip: str) -> bool:
    """Checks if an IP is private/local (won't resolve to a real location)."""
    private_prefixes = ("10.", "172.16.", "192.168.", "127.")
    return ip.startswith(private_prefixes) or ip == "localhost"