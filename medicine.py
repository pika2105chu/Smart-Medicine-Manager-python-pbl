from storage import load_data, save_data

def add_medicine():
    data = load_data()

    name = input("Enter medicine name: ")
    reason = input("Reason for taking: ")
    dosage = input("Dosage: ")
    duration = input("Duration (days): ")
    frequency = input("Frequency (per day): ")
    notes = input("Additional notes: ")

    medicine = {
        "name": name,
        "reason": reason,
        "dosage": dosage,
        "duration": duration,
        "frequency": frequency,
        "notes": notes
    }

    data.append(medicine)
    save_data(data)

    print("✅ Medicine added successfully!\n")


def view_medicines():
    data = load_data()

    if not data:
        print("No medicines found.\n")
        return

    for i, med in enumerate(data, start=1):
        print(f"\nMedicine {i}:")
        for key, value in med.items():
            print(f"{key.capitalize()}: {value}")


def search_medicine():
    data = load_data()
    name = input("Enter medicine name to search: ")

    found = False

    for med in data:
        if med["name"].lower() == name.lower():
            print("\nMedicine Found:")
            for key, value in med.items():
                print(f"{key.capitalize()}: {value}")
            found = True

    if not found:
        print("❌ Medicine not found.\n")


def update_medicine():
    data = load_data()
    name = input("Enter medicine name to update: ")

    for med in data:
        if med["name"].lower() == name.lower():
            print("Enter new details:")

            med["reason"] = input("New reason: ")
            med["dosage"] = input("New dosage: ")
            med["duration"] = input("New duration: ")
            med["frequency"] = input("New frequency: ")
            med["notes"] = input("New notes: ")

            save_data(data)
            print("✅ Medicine updated successfully!\n")
            return

    print("❌ Medicine not found.\n")