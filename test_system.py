#!/usr/bin/env python3
"""
Comprehensive test script for the Agrobreez Predictive Maintenance system.
Tests all services and their integration.
"""

import requests
import json
import time
import sys
from typing import Dict, Any

class SystemTester:
    def __init__(self):
        self.backend_url = "http://localhost:3000"
        self.ml_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:5173"
        self.mqtt_url = "mqtt://localhost:1883"

        # Test data
        self.test_machine_id = 999
        self.test_telemetry = {
            "machine_id": self.test_machine_id,
            "metrics": {
                "vibration": 85.5,
                "oil_level": 15.2,
                "temperature": 95.0,
                "pressure": 45.0,
                "rpm": 1800
            }
        }

    def test_service_health(self, url: str, service_name: str) -> bool:
        """Test if a service is healthy"""
        try:
            if service_name == "ML Service":
                response = requests.get(f"{url}/health", timeout=5)
            else:
                response = requests.get(f"{url}/api/machines", timeout=5)

            if response.status_code == 200:
                print(f"✅ {service_name} is healthy")
                return True
            else:
                print(f"❌ {service_name} returned status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ {service_name} is not accessible: {e}")
            return False

    def test_ml_prediction(self) -> bool:
        """Test ML service prediction"""
        try:
            response = requests.post(
                f"{self.ml_url}/predict",
                json=self.test_telemetry,
                timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                print(f"✅ ML Prediction successful: Risk={result.get('failure_risk', 'N/A')}, Level={result.get('risk_level', 'N/A')}")
                return True
            else:
                print(f"❌ ML Prediction failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ ML Prediction error: {e}")
            return False

    def test_backend_endpoints(self) -> bool:
        """Test backend API endpoints"""
        success = True

        # Test machines endpoint
        try:
            response = requests.get(f"{self.backend_url}/api/machines", timeout=5)
            if response.status_code == 200:
                machines = response.json()
                print(f"✅ Machines endpoint: {len(machines)} machines found")
            else:
                print(f"❌ Machines endpoint failed: {response.status_code}")
                success = False
        except Exception as e:
            print(f"❌ Machines endpoint error: {e}")
            success = False

        # Test readings endpoint (may be empty)
        try:
            response = requests.get(f"{self.backend_url}/api/readings/{self.test_machine_id}", timeout=5)
            if response.status_code == 200:
                readings = response.json()
                print(f"✅ Readings endpoint: {len(readings)} readings found")
            else:
                print(f"❌ Readings endpoint failed: {response.status_code}")
                success = False
        except Exception as e:
            print(f"❌ Readings endpoint error: {e}")
            success = False

        return success

    def test_mqtt_simulation(self) -> bool:
        """Test MQTT message simulation"""
        try:
            # This would require mosquitto_pub to be installed
            import subprocess

            # Publish a test message
            message = json.dumps({
                "metric": "vibration",
                "value": 75.5,
                "ts": "2023-12-01T10:00:00Z"
            })

            result = subprocess.run([
                "mosquitto_pub",
                "-h", "localhost",
                "-t", f"agro/{self.test_machine_id}/telemetry",
                "-m", message
            ], capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                print("✅ MQTT message published successfully")
                # Wait a moment for processing
                time.sleep(2)
                return True
            else:
                print(f"❌ MQTT publish failed: {result.stderr}")
                return False

        except FileNotFoundError:
            print("⚠️  mosquitto_pub not found, skipping MQTT test")
            return True  # Not a failure, just not available
        except Exception as e:
            print(f"❌ MQTT test error: {e}")
            return False

    def test_frontend_accessibility(self) -> bool:
        """Test if frontend is accessible"""
        try:
            response = requests.get(self.frontend_url, timeout=5)
            if response.status_code == 200:
                print("✅ Frontend is accessible")
                return True
            else:
                print(f"❌ Frontend returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Frontend not accessible: {e}")
            return False

    def run_all_tests(self) -> bool:
        """Run all system tests"""
        print("🚀 Starting Agrobreez System Tests\n")

        tests = [
            ("Backend Service", lambda: self.test_service_health(self.backend_url, "Backend")),
            ("ML Service", lambda: self.test_service_health(self.ml_url, "ML Service")),
            ("Frontend", self.test_frontend_accessibility),
            ("Backend Endpoints", self.test_backend_endpoints),
            ("ML Prediction", self.test_ml_prediction),
            ("MQTT Simulation", self.test_mqtt_simulation),
        ]

        results = []
        for test_name, test_func in tests:
            print(f"\n🔍 Testing {test_name}...")
            result = test_func()
            results.append(result)

        print(f"\n{'='*50}")
        print("📊 Test Results Summary:")
        print(f"{'='*50}")

        passed = sum(results)
        total = len(results)

        for i, (test_name, _) in enumerate(tests):
            status = "✅ PASS" if results[i] else "❌ FAIL"
            print(f"{status} {test_name}")

        print(f"\n🎯 Overall: {passed}/{total} tests passed")

        if passed == total:
            print("🎉 All systems operational!")
            return True
        else:
            print("⚠️  Some tests failed. Check the output above for details.")
            return False

def main():
    tester = SystemTester()

    if tester.run_all_tests():
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
