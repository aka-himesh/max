"""
Dashcam Vehicle Telemetry & Detection Runner
Inspired by coding-parrot/pothole-reporter drive mode.
Continuously runs or processes camera stream and submits detected hazards
to the Backend ingestion endpoint: POST /api/ml/reports
"""

import os
import time
import json
import requests
from typing import Optional

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
ML_SERVICE_KEY = os.getenv("ML_SERVICE_KEY", "secret_ml_dashcam_service_key_9912")

class DashcamRunner:
    def __init__(self, device_id: str = "bus-12-cam-1"):
        self.device_id = device_id
        self.endpoint = f"{BACKEND_URL}/api/ml/reports"
        self.headers = {"X-Service-Key": ML_SERVICE_KEY}

    def submit_detection(
        self,
        image_path: str,
        latitude: float,
        longitude: float,
        detection_data: dict,
    ) -> Optional[dict]:
        payload = {
            "client_event_id": f"dashcam_{int(time.time() * 1000)}",
            "device_id": self.device_id,
            "captured_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "latitude": latitude,
            "longitude": longitude,
            "model": {
                "name": "Urban Issues YOLOv8 Detector",
                "version": "1.0",
            },
            "detection": detection_data,
        }

        try:
            with open(image_path, "rb") as img_file:
                files = {"image": img_file}
                data = {"payload": json.dumps(payload)}
                response = requests.post(self.endpoint, headers=self.headers, files=files, data=data)
                
            if response.status_code in (200, 201):
                res_data = response.json()
                print(f"✅ Ingested report: {res_data.get('data', {}).get('report_id')}")
                return res_data
            else:
                print(f"❌ Ingestion failed ({response.status_code}): {response.text}")
                return None
        except Exception as e:
            print(f"Exception during dashcam submission: {e}")
            return None

if __name__ == "__main__":
    runner = DashcamRunner()
    print(f"Dashcam Runner initialized for device {runner.device_id}, target: {runner.endpoint}")
