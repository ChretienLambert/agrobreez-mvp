from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Telemetry(BaseModel):
    machine_id: int
    metrics: dict

@app.post('/predict')
async def predict(t: Telemetry):
    vib = float(t.metrics.get('vibration', 0))
    oil = float(t.metrics.get('oil_level', 100))
    score = 0.0
    if vib > 80:
        score += 0.7
    if oil < 20:
        score += 0.4
    return {"machine_id": t.machine_id, "failure_risk": round(min(1.0, score), 3)}