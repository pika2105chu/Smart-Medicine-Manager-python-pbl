from medicine import add_medicine, view_medicines, search_medicine, update_medicine

def menu():
    while True:
        print("\n==== Smart Medicine Manager ====")
        print("1. Add Medicine")
        print("2. View Medicines")
        print("3. Search Medicine")
        print("4. Update Medicine")
        print("5. Exit")

        choice = input("Enter your choice: ")

        if choice == "1":
            add_medicine()

        elif choice == "2":
            view_medicines()

        elif choice == "3":
            search_medicine()

        elif choice == "4":
            update_medicine()

        elif choice == "5":
            print("Exiting... Stay healthy! 😊")
            break

        else:
            print("Invalid choice. Try again.")

menu()