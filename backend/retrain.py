import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score
import joblib
import os

print(" AgriMind Model Retraining \n")

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# Look for dataset in common locations
for candidate in [
    os.path.join(BASE_DIR, "../crop_recommendation.csv"),
    os.path.join(BASE_DIR, "crop_recommendation.csv"),
    os.path.expanduser("~/crop_recommendation.csv"),
]:
    if os.path.exists(candidate):
        DATA_PATH = candidate
        break
else:
    print("ERROR: crop_recommendation.csv not found.")
    print("Place it in the AgriMind folder and run again.")
    exit(1)

print(f"Loading: {DATA_PATH}")
df = pd.read_csv(DATA_PATH)
print(f"Shape: {df.shape} | Crops: {df['label'].nunique()}\n")

X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
y = df['label']

encoder = LabelEncoder()
y_enc   = encoder.fit_transform(y)

scaler  = StandardScaler()
X_sc    = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_sc, y_enc, test_size=0.2, random_state=42, stratify=y_enc
)

print("Training...")
model = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

acc = accuracy_score(y_test, model.predict(X_test))
print(f"Accuracy: {acc*100:.2f}%\n")

os.makedirs(MODEL_DIR, exist_ok=True)
joblib.dump(model,   os.path.join(MODEL_DIR, "crop_model.pkl"))
joblib.dump(scaler,  os.path.join(MODEL_DIR, "crop_scaler.pkl"))
joblib.dump(encoder, os.path.join(MODEL_DIR, "crop_label_encoder.pkl"))

print("Models saved to backend/models/")
print("Restart uvicorn to load new models.")
