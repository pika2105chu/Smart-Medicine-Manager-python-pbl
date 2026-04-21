from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_features import (
    get_medicine_info,
    check_warnings,
    suggest_medicine,
    extract_medicines_from_image
)
import os

app = Flask(__name__)
CORS(app)  # FIX: added CORS so browser doesn't block requests from your HTML file

# ── AI Routes ──

@app.route("/medicine-info", methods=["POST"])
def medicine_info_route():
    data = request.json
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Medicine name is required"}), 400
    return jsonify(get_medicine_info(name))

@app.route("/suggest", methods=["POST"])
def suggest_route():
    data = request.json
    problem = data.get("problem", "").strip()
    if not problem:
        return jsonify({"error": "Problem description is required"}), 400
    return jsonify(suggest_medicine(problem))

@app.route("/check-warning", methods=["POST"])
def check_warning_route():
    data = request.json
    new_med = data.get("new_med", "").strip()
    existing_meds = data.get("existing_meds", [])
    if not new_med:
        return jsonify({"warnings": ["⚠️ No medicine name provided"]}), 400
    warnings = check_warnings(new_med, existing_meds)
    return jsonify({"warnings": warnings})

@app.route("/scan", methods=["POST"])
def scan():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    file = request.files["image"]
    path = "temp.png"
    file.save(path)
    result = extract_medicines_from_image(path)
    # FIX: clean up temp file after processing
    if os.path.exists(path):
        os.remove(path)
    return jsonify(result)

# ── Medicine CRUD Routes ──
# FIX: removed broken import of medicine.py functions
# Those functions use input() which doesn't work in a web context
# Replace with direct JSON-based storage below

from storage import load_data, save_data

@app.route('/add', methods=['POST'])
def add():
    data = request.json
    required = ["name", "reason", "dosage", "duration", "frequency"]
    if not all(data.get(k) for k in required):
        return jsonify({"message": "Missing required fields"}), 400
    medicines = load_data()
    medicines.append({
        "name": data["name"],
        "reason": data["reason"],
        "dosage": data["dosage"],
        "duration": data["duration"],
        "frequency": data["frequency"],
        "notes": data.get("notes", "")
    })
    save_data(medicines)
    return jsonify({"message": "Medicine added successfully"})

@app.route('/view', methods=['GET'])
def view():
    return jsonify(load_data())

@app.route('/delete/<name>', methods=['DELETE'])
def delete(name):
    medicines = load_data()
    updated = [m for m in medicines if m["name"].lower() != name.lower()]
    if len(updated) == len(medicines):
        return jsonify({"message": "Medicine not found"}), 404
    save_data(updated)
    return jsonify({"message": f"{name} deleted successfully"})

@app.route('/update/<name>', methods=['PUT'])
def update(name):
    medicines = load_data()
    data = request.json
    for m in medicines:
        if m["name"].lower() == name.lower():
            m.update({k: data[k] for k in data if k in m})
            save_data(medicines)
            return jsonify({"message": "Medicine updated successfully"})
    return jsonify({"message": "Medicine not found"}), 404

if __name__ == '__main__':
    app.run(debug=True)