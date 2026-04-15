from storage import load_data, save_data

def add_medicine(medicine):
    data = load_data()
    data.append(medicine)
    save_data(data)
    return "Medicine added"

def view_medicines():
    return load_data()

def delete_medicine(name):
    data = load_data()
    data = [m for m in data if m["name"].lower() != name.lower()]
    save_data(data)
    return "Medicine deleted"

def search_medicine(keyword):
    data = load_data()
    return [m for m in data if keyword.lower() in m["name"].lower()]

def update_medicine(name, new_data):
    data = load_data()
    for m in data:
        if m["name"].lower() == name.lower():
            m.update(new_data)
    save_data(data)
    return "Medicine updated"