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
3. From repo root run (all services):
   ```bash
   docker compose up --build
   ```

If you prefer to run services individually during development, see the "Development" section below.

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

Notes:
- The frontend is a Vite + React SPA. It serves at `http://localhost:5173` by default.
- If another process is using port 5173, Vite will choose an alternate port (check the terminal output).
- The app uses a small demo auth flow: logging in stores `auth_token` and `auth_user` in `localStorage` (see `frontend/src/components/Login.jsx`).
- Sample machines and telemetry simulation live in `frontend/src/services/machinesService.js` (use the "Start Simulation" button in the NavBar to populate the dashboard with fake telemetry).
- To create a sample machine via the UI use `Add Machine` (route `/machines/new`).
- Environment variable: you can set `VITE_BACKEND_URL` to point the frontend to a backend other than `http://localhost:3000`.

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

If the backend is configured to subscribe to `agro/+/telemetry`, published messages will be ingested and may show up in the dashboard when the ingestion pipeline is wired to persist or forward readings to the frontend.

## Implementation notes (for contributors / noobs)

- Frontend structure:
   - `frontend/src/main.jsx` — React entry point (mounts the app).
   - `frontend/src/App.jsx` — Router setup and high-level layout (NavBar + Routes).
   - `frontend/src/components/` — UI components (Dashboard, MachineDetail, Login, NavBar, MachineForm, ProtectedRoute).
   - `frontend/src/services/api.js` — Axios wrappers for `machinesAPI` and `authAPI`.
   - `frontend/src/services/machinesService.js` — local sample data, save/load, and simulator functions.

- Backend structure:
   - `backend/src/routes.js` — Express routes (auth and API endpoints).
   - `backend/src/middleware/auth.js` — authentication helpers used by routes.

- ML service:
   - `ml-service/app.py` — small FastAPI/Flask app placeholder for predictive endpoints. See `ml-service/test_ml.py` for a simple test example.

## Common troubleshooting

- If you see import errors in the frontend inside Docker (e.g. missing `react-router-dom`), ensure you rebuilt the frontend image after changing `package.json` and that `.dockerignore` does not copy the host `node_modules` into the container. Rebuild with:
   ```bash
   docker compose build --no-cache frontend
   docker compose up -d frontend
   ```
- If ports conflict between host dev server and container, stop the container dev server or run the host dev server on a different port.

## Next steps and ideas

- Replace demo auth with JWT issued by the backend and store it securely (cookies or secure localStorage with expiry).
- Implement persistent machine CRUD endpoints in the backend that persist to Postgres and use real MQTT ingestion for telemetry.
- Add automated tests for frontend components and end-to-end (Cypress) tests for user flows.

If you'd like, I can add a short `CONTRIBUTING.md` with local dev steps and common troubleshooting commands.

## Future Enhancements

- Advanced ML models for more accurate predictions
- Real-time alerts and notifications
- User authentication and authorization
- Historical data analytics and reporting
- Mobile app companion
- Integration with external weather APIs for environmental factors
