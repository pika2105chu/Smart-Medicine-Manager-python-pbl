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
        print("-" * 30)


def search_medicine():
    data = load_data()
    query = input("Enter anything to search (name/reason/notes): ").lower()

    if not query:
        print("⚠️ Please enter something to search.\n")
        return

    found = False

    for med in data:
        combined_data = " ".join(str(value).lower() for value in med.values())

        if query in combined_data:
            print("\nMedicine Found:")
            for key, value in med.items():
                print(f"{key.capitalize()}: {value}")
            print("-" * 30)
            found = True

    if not found:
        print("❌ No matching medicine found.\n")


def update_medicine():
    data = load_data()
    query = input("Enter anything to find medicine to update: ").lower()

    matches = []

    for med in data:
        combined_data = " ".join(str(value).lower() for value in med.values())
        if query in combined_data:
            matches.append(med)

    if not matches:
        print("❌ No matching medicine found.\n")
        return

    # Show matches
    for i, med in enumerate(matches, start=1):
        print(f"\n{i}. {med['name']}")

    try:
        choice = int(input("Select medicine number to update: ")) - 1
    except:
        print("Invalid input.\n")
        return

    if 0 <= choice < len(matches):
        med = matches[choice]

        print("Enter new details:")

        med["reason"] = input("New reason: ")
        med["dosage"] = input("New dosage: ")
        med["duration"] = input("New duration: ")
        med["frequency"] = input("New frequency: ")
        med["notes"] = input("New notes: ")

        save_data(data)
        print("✅ Medicine updated successfully!\n")
    else:
        print("Invalid selection.\n")


def delete_medicine():
    data = load_data()
    query = input("Enter anything to find medicine to delete: ").lower()

    matches = []

    for med in data:
        combined_data = " ".join(str(value).lower() for value in med.values())
        if query in combined_data:
            matches.append(med)

    if not matches:
        print("❌ No matching medicine found.\n")
        return

    # Show matches
    for i, med in enumerate(matches, start=1):
        print(f"\n{i}. {med['name']}")

    try:
        choice = int(input("Select medicine number to delete: ")) - 1
    except:
        print("Invalid input.\n")
        return

    if 0 <= choice < len(matches):
        med = matches[choice]

        confirm = input(f"Are you sure you want to delete '{med['name']}'? (y/n): ").lower()

        if confirm == 'y':
            data.remove(med)
            save_data(data)
            print("🗑️ Medicine deleted successfully!\n")
        else:
            print("Deletion cancelled.\n")
    else:
        print("Invalid selection.\n")