import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
from pymongo import MongoClient

# MongoDB connection
client = MongoClient("mongodb://localhost:27017")
db = client["coding_platform"]
performance = db["performances"]

data = list(performance.find({}, {"_id": 0}))

if len(data) < 3:
    raise ValueError("Not enough performance data to train ML model")

df = pd.DataFrame(data)

# Keep only required columns
required_cols = ["accuracy", "avgTime", "wrongAttempts", "difficultyAttempted"]
df = df[required_cols]

# Normalize difficulty labels
df["difficultyAttempted"] = df["difficultyAttempted"].str.lower()

# Encode difficulty
difficulty_map = {
    "easy": 0,
    "medium": 1,
    "hard": 2
}

df["difficultyAttempted"] = df["difficultyAttempted"].map(difficulty_map)

# ❗ Remove rows with NaN (VERY IMPORTANT)
df = df.dropna()

# Split features and target
X = df[["accuracy", "avgTime", "wrongAttempts"]]
y = df["difficultyAttempted"]

# Train model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X, y)
joblib.dump(model, "model.pkl")
print("Model trained & saved successfully")
