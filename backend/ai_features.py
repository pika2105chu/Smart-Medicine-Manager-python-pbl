import os
import requests
from rapidfuzz import fuzz

# Optional OCR imports — won't crash if not installed
try:
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

# ════════════════════════════════════════════
# Local Medicine Database
# ════════════════════════════════════════════

medicine_db = {
    "dolo 650": {
        "use":  "fever",
        "type": "paracetamol",
        "info": {
            "uses":         "Fever and mild pain relief",
            "side_effects": "Nausea, rare allergic reaction",
            "precautions":  "Do not exceed recommended dose. Avoid alcohol."
        }
    },
    "crocin": {
        "use":  "fever",
        "type": "paracetamol",
        "info": {
            "uses":         "Fever and body pain",
            "side_effects": "Rare skin rash",
            "precautions":  "Avoid overdose. Not for liver patients."
        }
    },
    "paracetamol": {
        "use":  "fever",
        "type": "paracetamol",
        "info": {
            "uses":         "Fever and mild pain relief",
            "side_effects": "Rare liver issues on overdose",
            "precautions":  "Do not take with alcohol"
        }
    },
    "brufen": {
        "use":  "pain",
        "type": "ibuprofen",
        "info": {
            "uses":         "Pain relief and inflammation",
            "side_effects": "Stomach irritation, nausea",
            "precautions":  "Take after food. Avoid in kidney disease."
        }
    },
    "ibuprofen": {
        "use":  "pain",
        "type": "ibuprofen",
        "info": {
            "uses":         "Pain, fever and inflammation",
            "side_effects": "Stomach upset, risk of bleeding",
            "precautions":  "Take with food. Avoid on empty stomach."
        }
    },
    "cetirizine": {
        "use":  "allergy",
        "type": "antihistamine",
        "info": {
            "uses":         "Allergy relief, runny nose, itching",
            "side_effects": "Drowsiness, dry mouth",
            "precautions":  "Avoid driving after use"
        }
    },
    "amoxicillin": {
        "use":  "infection",
        "type": "antibiotic",
        "info": {
            "uses":         "Bacterial infections — throat, ear, urinary",
            "side_effects": "Nausea, diarrhoea, rash",
            "precautions":  "Complete the full course. Avoid if penicillin-allergic."
        }
    },
    "azithromycin": {
        "use":  "infection",
        "type": "antibiotic",
        "info": {
            "uses":         "Respiratory, skin and ear infections",
            "side_effects": "Stomach upset, diarrhoea",
            "precautions":  "Complete the full course. Do not skip doses."
        }
    },
    "metformin": {
        "use":  "diabetes",
        "type": "biguanide",
        "info": {
            "uses":         "Type 2 diabetes management",
            "side_effects": "Nausea, diarrhoea, stomach upset",
            "precautions":  "Take with meals. Monitor kidney function regularly."
        }
    },
    "amlodipine": {
        "use":  "blood pressure",
        "type": "calcium channel blocker",
        "info": {
            "uses":         "Hypertension and chest pain (angina)",
            "side_effects": "Ankle swelling, flushing, dizziness",
            "precautions":  "Do not stop suddenly. Monitor blood pressure."
        }
    },
    "omeprazole": {
        "use":  "acidity",
        "type": "proton pump inhibitor",
        "info": {
            "uses":         "Acidity, GERD, stomach ulcers",
            "side_effects": "Headache, nausea, diarrhoea",
            "precautions":  "Take 30 minutes before meals."
        }
    },
    "pantoprazole": {
        "use":  "acidity",
        "type": "proton pump inhibitor",
        "info": {
            "uses":         "Acid reflux, gastric ulcers",
            "side_effects": "Headache, stomach pain",
            "precautions":  "Take before breakfast."
        }
    },
    "atorvastatin": {
        "use":  "cholesterol",
        "type": "statin",
        "info": {
            "uses":         "High cholesterol and prevention of heart disease",
            "side_effects": "Muscle pain, liver enzyme changes",
            "precautions":  "Avoid grapefruit juice. Regular liver tests."
        }
    },
    "aspirin": {
        "use":  "pain",
        "type": "salicylate",
        "info": {
            "uses":         "Pain, fever and blood thinning",
            "side_effects": "Stomach irritation, bleeding risk",
            "precautions":  "Avoid on empty stomach. Not for children under 16."
        }
    },
}

# ════════════════════════════════════════════
# Fuzzy Search
# ════════════════════════════════════════════

def fuzzy_search(query):
    if not query:
        return None
    query = query.lower().strip()
    best_match  = None
    best_score  = 0
    for med in medicine_db:
        score = fuzz.partial_ratio(query, med)
        if score > best_score and score > 60:
            best_score  = score
            best_match  = med
    return best_match

# ════════════════════════════════════════════
# OpenFDA API fallback
# ════════════════════════════════════════════

def fetch_from_openfda(name):
    url = f"https://api.fda.gov/drug/label.json?search=openfda.brand_name:{name}&limit=1"
    try:
        res    = requests.get(url, timeout=5)
        result = res.json()["results"][0]
        return {
            "uses":     result.get("indications_and_usage", ["Not available"])[0],
            "warnings": result.get("warnings", ["Not available"])[0],
        }
    except Exception:
        return None

# ════════════════════════════════════════════
# Medicine Info
# ════════════════════════════════════════════

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

# ════════════════════════════════════════════
# Suggest Medicine
# ════════════════════════════════════════════

problem_map = {
    "fever":            ["dolo 650", "crocin", "paracetamol"],
    "headache":         ["dolo 650", "brufen"],
    "pain":             ["brufen", "ibuprofen"],
    "body pain":        ["brufen", "ibuprofen"],
    "allergy":          ["cetirizine"],
    "cold":             ["cetirizine"],
    "runny nose":       ["cetirizine"],
    "infection":        ["amoxicillin", "azithromycin"],
    "throat infection": ["amoxicillin"],
    "acidity":          ["omeprazole", "pantoprazole"],
    "diabetes":         ["metformin"],
    "blood pressure":   ["amlodipine"],
    "hypertension":     ["amlodipine"],
    "cholesterol":      ["atorvastatin"],
}

def suggest_medicine(problem):
    if not problem:
        return {"suggestions": [], "note": "Please describe your problem."}
    problem = problem.lower().strip()
    for key, suggestions in problem_map.items():
        if key in problem or problem in key:
            return {
                "suggestions": suggestions,
                "note":        "Commonly used medicines. Always consult a doctor before taking."
            }
    return {
        "suggestions": [],
        "note":        "No suggestion found for that problem. Please consult a doctor."
    }

# ════════════════════════════════════════════
# Warning System
# ════════════════════════════════════════════

def check_warnings(new_med, existing_meds):
    if not new_med:
        return ["⚠️ No medicine name provided"]

    match_new = fuzzy_search(new_med)
    if not match_new:
        return ["⚠️ Medicine not in database — no interaction data available"]

    new_type = medicine_db[match_new]["type"]
    new_use  = medicine_db[match_new]["use"]
    warnings = []

    for med in existing_meds:
        if not med:
            continue
        match_existing = fuzzy_search(med)
        # skip if it matched the same medicine (self-comparison)
        if not match_existing or match_existing == match_new:
            continue
        existing_type = medicine_db[match_existing]["type"]
        existing_use  = medicine_db[match_existing]["use"]

        if existing_type == new_type:
            warnings.append(
                f"⚠️ '{med}' has the same composition ({new_type}) as {new_med} — possible duplication"
            )
        elif existing_use == new_use:
            warnings.append(
                f"⚠️ '{med}' is used for the same purpose ({new_use}) as {new_med} — consult your doctor"
            )

    return warnings if warnings else ["✅ No conflicts found with your current medicines"]

# ════════════════════════════════════════════
# OCR — Scan prescription image
# ════════════════════════════════════════════

def extract_medicines_from_image(image_path):
    if not OCR_AVAILABLE:
        return {
            "error":               "OCR not available. Run: pip install pytesseract Pillow",
            "detected_medicines":  []
        }

    # Set tesseract path only on Windows if the binary exists
    if os.name == "nt":
        win_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(win_path):
            pytesseract.pytesseract.tesseract_cmd = win_path

    try:
        img       = Image.open(image_path)
        text      = pytesseract.image_to_string(img)
        words     = text.split()
        detected  = []
        for word in words:
            match = fuzzy_search(word)
            if match and match not in detected:
                detected.append(match)
        return {
            "raw_text":           text,
            "detected_medicines": detected
        }
    except Exception as e:
        return {
            "error":               str(e),
            "detected_medicines":  []
        }
