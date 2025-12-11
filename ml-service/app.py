from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import pandas as pd
import numpy as np
import joblib
import os
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Agrobreez ML Service", version="2.0.0")

class Telemetry(BaseModel):
    machine_id: int
    metrics: Dict[str, float]

class PredictionResponse(BaseModel):
    machine_id: int
    failure_risk: float
    risk_level: str
    confidence: float
    factors: Dict[str, float]

class TrainingData(BaseModel):
    features: List[Dict[str, float]]
    labels: List[int]

# Global model variables
model = None
scaler = None
feature_columns = ['vibration', 'oil_level', 'temperature', 'pressure', 'rpm']

def load_model():
    global model, scaler
    try:
        if os.path.exists('models/predictive_model.pkl'):
            model = joblib.load('models/predictive_model.pkl')
            scaler = joblib.load('models/scaler.pkl')
            logger.info("Loaded existing model and scaler")
        else:
            # Initialize with default model
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                class_weight='balanced'
            )
            scaler = StandardScaler()
            logger.info("Initialized new model and scaler")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        scaler = StandardScaler()

def save_model():
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/predictive_model.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')
    logger.info("Model and scaler saved")

def extract_features(telemetry: Dict[str, float]) -> np.ndarray:
    """Extract features from telemetry data"""
    features = []
    for col in feature_columns:
        value = telemetry.get(col, 0.0)
        features.append(float(value))
    return np.array(features).reshape(1, -1)

def calculate_risk_factors(telemetry: Dict[str, float]) -> Dict[str, float]:
    """Calculate individual risk factors"""
    factors = {}

    # Vibration risk
    vib = telemetry.get('vibration', 0)
    if vib > 90:
        factors['vibration'] = 1.0
    elif vib > 70:
        factors['vibration'] = 0.7
    elif vib > 50:
        factors['vibration'] = 0.4
    else:
        factors['vibration'] = 0.1

    # Oil level risk
    oil = telemetry.get('oil_level', 100)
    if oil < 10:
        factors['oil_level'] = 1.0
    elif oil < 25:
        factors['oil_level'] = 0.8
    elif oil < 50:
        factors['oil_level'] = 0.5
    else:
        factors['oil_level'] = 0.0

    # Temperature risk
    temp = telemetry.get('temperature', 25)
    if temp > 100:
        factors['temperature'] = 1.0
    elif temp > 80:
        factors['temperature'] = 0.6
    elif temp > 60:
        factors['temperature'] = 0.3
    else:
        factors['temperature'] = 0.0

    # Pressure risk
    pressure = telemetry.get('pressure', 50)
    if pressure > 150 or pressure < 20:
        factors['pressure'] = 0.8
    elif pressure > 120 or pressure < 30:
        factors['pressure'] = 0.4
    else:
        factors['pressure'] = 0.0

    # RPM risk
    rpm = telemetry.get('rpm', 1500)
    if rpm > 3000 or rpm < 500:
        factors['rpm'] = 0.6
    elif rpm > 2500 or rpm < 800:
        factors['rpm'] = 0.3
    else:
        factors['rpm'] = 0.0

    return factors

def get_risk_level(risk_score: float) -> str:
    """Convert risk score to risk level"""
    if risk_score >= 0.8:
        return "critical"
    elif risk_score >= 0.6:
        return "high"
    elif risk_score >= 0.4:
        return "medium"
    elif risk_score >= 0.2:
        return "low"
    else:
        return "normal"

@app.on_event("startup")
async def startup_event():
    load_model()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post('/predict', response_model=PredictionResponse)
async def predict(telemetry: Telemetry):
    try:
        if not model:
            # Fallback to rule-based system
            factors = calculate_risk_factors(telemetry.metrics)
            risk_score = min(1.0, sum(factors.values()) / len(factors))
            return PredictionResponse(
                machine_id=telemetry.machine_id,
                failure_risk=round(risk_score, 3),
                risk_level=get_risk_level(risk_score),
                confidence=0.5,
                factors=factors
            )

        # ML-based prediction
        features = extract_features(telemetry.metrics)
        features_scaled = scaler.transform(features)

        # Get prediction probability
        proba = model.predict_proba(features_scaled)[0]
        risk_score = float(proba[1])  # Probability of failure (class 1)

        # Calculate confidence based on prediction certainty
        confidence = abs(proba[0] - proba[1])

        # Calculate risk factors
        factors = calculate_risk_factors(telemetry.metrics)

        return PredictionResponse(
            machine_id=telemetry.machine_id,
            failure_risk=round(risk_score, 3),
            risk_level=get_risk_level(risk_score),
            confidence=round(confidence, 3),
            factors=factors
        )

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post('/train')
async def train_model(training_data: TrainingData):
    try:
        if len(training_data.features) != len(training_data.labels):
            raise HTTPException(status_code=400, detail="Features and labels length mismatch")

        # Convert to DataFrame
        df = pd.DataFrame(training_data.features)
        df = df[feature_columns]  # Ensure correct column order
        labels = np.array(training_data.labels)

        # Scale features
        features_scaled = scaler.fit_transform(df)

        # Train model
        model.fit(features_scaled, labels)

        # Save model
        save_model()

        # Calculate accuracy
        accuracy = model.score(features_scaled, labels)

        return {
            "message": "Model trained successfully",
            "accuracy": round(accuracy, 3),
            "samples": len(training_data.features)
        }

    except Exception as e:
        logger.error(f"Training error: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.get('/model-info')
async def get_model_info():
    if not model:
        return {"model_loaded": False}

    return {
        "model_loaded": True,
        "model_type": type(model).__name__,
        "feature_columns": feature_columns,
        "n_estimators": getattr(model, 'n_estimators', None),
        "max_depth": getattr(model, 'max_depth', None)
    }

# Backward compatibility endpoint
@app.post('/predict-legacy')
async def predict_legacy(telemetry: Telemetry):
    """Legacy endpoint for backward compatibility"""
    result = await predict(telemetry)
    return {
        "machine_id": result.machine_id,
        "failure_risk": result.failure_risk
    }
