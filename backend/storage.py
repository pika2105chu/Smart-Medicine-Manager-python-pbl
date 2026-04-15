import json
import os

file_path = os.path.join(os.path.dirname(__file__), "data.json")

def load_data():
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except:
        return []

def save_data(data):
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)