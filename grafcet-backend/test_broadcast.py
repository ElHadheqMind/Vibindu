
import requests
import json

url = "http://127.0.0.1:8000/api/broadcast"
payload = {
    "payload": {
        "type": "sim_panel_open"
    }
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
