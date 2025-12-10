# Agrobreez Predictive Maintenance — Starter

Quick start (Mac)

1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
2. (Optional) Install mosquitto client for testing:
   brew install mosquitto
3. From repo root run:
   docker compose up --build

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- ML service: http://localhost:8000/predict