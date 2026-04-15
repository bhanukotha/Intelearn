import sys
import joblib

# Load model
model = joblib.load("model.pkl")

# Read arguments safely
accuracy = float(sys.argv[1])
avgTime = float(sys.argv[2])
wrongAttempts = float(sys.argv[3])

X = [[accuracy, avgTime, wrongAttempts]]

prediction = model.predict(X)[0]

difficulty_map = {
    0: "easy",
    1: "medium",
    2: "hard"
}
print(difficulty_map[prediction])
