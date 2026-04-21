from rapidfuzz import fuzz
import requests
import os

# FIX: import pytesseract safely — won't crash if not installed
try:
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

# ── Local Medicine Dataset ──

medicine_db = {
    "dolo 650": {
        "use": "fever",
        "type": "paracetamol",
        "info": {
            "uses": "Fever and mild pain relief",
            "side_effects": "Nausea, rare allergy",
            "precautions": "Do not exceed recommended dose"
        }
    },
    "crocin": {
        "use": "fever",
        "type": "paracetamol",
        "info": {
            "uses": "Fever and body pain",
            "side_effects": "Rare skin rash",
            "precautions": "Avoid overdose"
        }
    },
    "brufen": {
        "use": "pain",
        "type": "ibuprofen",
        "info": {
            "uses": "Pain relief and inflammation",
            "side_effects": "Stomach irritation",
            "precautions": "Take after food"
        }
    },
    "cetirizine": {
        "use": "allergy",
        "type": "antihistamine",
        "info": {
            "uses": "Allergy relief",
            "side_effects": "Drowsiness",
            "precautions": "Avoid driving after use"
        }
    },
    "amoxicillin": {
        "use": "infection",
        "type": "antibiotic",
        "info": {
            "uses": "Bacterial infections",
            "side_effects": "Nausea, diarrhea",
            "precautions": "Complete full course"
        }
    },
    "paracetamol": {
        "use": "fever",
        "type": "paracetamol",
        "info": {
            "uses": "Fever and mild pain relief",
            "side_effects": "Rare liver issues on overdose",
            "precautions": "Do not take with alcohol"
        }
    }
}

# ── Fuzzy Search ──

def fuzzy_search(query):
    if not query:
        return None
    query = query.lower().strip()
    best_match = None
    highest_score = 0
    for med in medicine_db:
        score = fuzz.partial_ratio(query, med)
        if score > highest_score and score > 60:
            highest_score = score
            best_match = med
    return best_match

# ── OpenFDA API ──

def fetch_from_openfda(name):
    # FIX: added timeout so it doesn't hang forever
    url = f"https://api.fda.gov/drug/label.json?search=openfda.brand_name:{name}&limit=1"
    try:
        res = requests.get(url, timeout=5).json()
        result = res["results"][0]
        return {
            "uses": result.get("indications_and_usage", ["Not available"])[0],
            "warnings": result.get("warnings", ["Not available"])[0]
        }
    except Exception:
        return None

# ── Medicine Info ──

def get_medicine_info(name):
    if not name:
        return {"error": "No medicine name provided"}
    match = fuzzy_search(name)
    if match:
        return medicine_db[match]["info"]
    api_data = fetch_from_openfda(name)
    if api_data:
        return api_data
    return {"error": f"No information found for '{name}'"}

# ── Suggest Medicine ──

problem_map = {
    "fever": ["dolo 650", "crocin", "paracetamol"],
    "pain": ["brufen"],
    "allergy": ["cetirizine"],
    "cold": ["cetirizine"],
    "headache": ["dolo 650", "brufen"],
    "infection": ["amoxicillin"],
    "throat infection": ["amoxicillin"]
}

def suggest_medicine(problem):
    if not problem:
        return {"suggestions": [], "note": "Please describe your problem."}
    problem = problem.lower().strip()
    # FIX: check for partial matches too, not just exact keys
    for key in problem_map:
        if key in problem or problem in key:
            return {
                "suggestions": problem_map[key],
                "note": "Commonly used medicines. Always consult a doctor before taking."
            }
    return {"suggestions": [], "note": "No suggestion found. Please consult a doctor."}

# ── Warning System ──

def check_warnings(new_med, existing_meds):
    if not new_med:
        return ["⚠️ No medicine name provided"]
    match_new = fuzzy_search(new_med)
    if not match_new:
        return ["⚠️ Medicine not found in database — no warnings available"]
    warnings = []
    new_type = medicine_db[match_new]["type"]
    new_use = medicine_db[match_new]["use"]
    for med in existing_meds:
        if not med:
            continue
        match_existing = fuzzy_search(med)
        if match_existing and match_existing != match_new:  # FIX: skip self-comparison
            if medicine_db[match_existing]["type"] == new_type:
                warnings.append(f"⚠️ '{med}' has the same composition ({new_type})")
            elif medicine_db[match_existing]["use"] == new_use:
                warnings.append(f"⚠️ '{med}' is used for the same purpose ({new_use})")
    return warnings if warnings else ["✅ No major conflicts found"]

# ── OCR / Image Scan ──

def extract_medicines_from_image(image_path):
    # FIX: check if OCR is available before trying to use it
    if not OCR_AVAILABLE:
        return {"error": "OCR not available. Install pytesseract and Pillow.", "detected_medicines": []}

    # FIX: detect tesseract path automatically instead of hardcoding Windows path
    if os.name == 'nt':  # Windows
        tesseract_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
    # On Linux/Mac tesseract is usually in PATH already, no need to set path

    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        words = text.split()
        detected = []
        for word in words:
            match = fuzzy_search(word)
            if match and match not in detected:
                detected.append(match)
        return {
            "raw_text": text,
            "detected_medicines": detected
        }
    except Exception as e:
        return {"error": str(e), "detected_medicines": []}