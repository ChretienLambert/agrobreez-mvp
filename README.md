# Agrobreez Predictive Maintenance MVP

Agrobreez is an IoT-based predictive maintenance system designed for agricultural machinery. This MVP demonstrates a full-stack application that collects sensor telemetry data from machines via MQTT, stores it in a PostgreSQL database, provides a REST API for data access, and uses machine learning to predict potential failures.

## Architecture Overview

The system consists of the following microservices:

- **Frontend**: React application built with Vite, providing a dashboard to view machine status and sensor readings.
- **Backend**: Node.js/Express API server that handles MQTT message ingestion, database operations, and REST endpoints.
- **ML Service**: Python FastAPI service for predictive maintenance algorithms.
- **Database**: PostgreSQL for storing machine metadata and sensor readings.
- **MQTT Broker**: Mosquitto for real-time telemetry data ingestion.

## Features

- Real-time sensor data collection via MQTT
- Machine status monitoring and dashboard
- Historical sensor readings visualization
- Predictive failure risk assessment using machine learning
- Docker containerization for easy deployment

## Technology Stack

- **Frontend**: React 18, Vite, Axios
- **Backend**: Node.js, Express, MQTT.js, PostgreSQL
- **ML Service**: Python, FastAPI, scikit-learn
- **Database**: PostgreSQL
- **Messaging**: MQTT (Mosquitto)
- **Containerization**: Docker, Docker Compose

## Quick Start (Mac)

1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
2. (Optional) Install mosquitto client for testing:
   ```bash
   brew install mosquitto
   ```
3. From repo root run:
   ```bash
   docker compose up --build
   ```

## Services

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **ML Service**: http://localhost:8000/predict

## API Endpoints

### Backend API

- `GET /api/machines` - Retrieve list of all machines
- `GET /api/readings/:machineId` - Get sensor readings for a specific machine (last 200 entries)

### ML Service

- `POST /predict` - Predict failure risk based on telemetry data
  - Body: `{"machine_id": int, "metrics": {"vibration": float, "oil_level": float, ...}}`
  - Response: `{"machine_id": int, "failure_risk": float}`

## MQTT Topics

- Subscribe: `agro/+/telemetry` (where + is machine ID)
- Message format: `{"metric": "vibration", "value": 75.5, "ts": "2023-12-01T10:00:00Z"}`

## Database Schema

### machines
- id (SERIAL PRIMARY KEY)
- name (TEXT)
- last_seen (TIMESTAMP)
- status (TEXT)

### sensor_readings
- id (SERIAL PRIMARY KEY)
- machine_id (INTEGER)
- ts (TIMESTAMP)
- metric (TEXT)
- value (DOUBLE PRECISION)

## Development

Each service can be run independently for development:

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### ML Service
```bash
cd ml-service
pip install -r requirements.txt
uvicorn app:app --reload
```

## Testing MQTT

With mosquitto client installed:
```bash
mosquitto_pub -h localhost -t "agro/1/telemetry" -m '{"metric": "vibration", "value": 85.2}'
```

## Future Enhancements

- Advanced ML models for more accurate predictions
- Real-time alerts and notifications
- User authentication and authorization
- Historical data analytics and reporting
- Mobile app companion
- Integration with external weather APIs for environmental factors
