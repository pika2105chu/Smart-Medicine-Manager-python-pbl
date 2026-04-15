from flask import Flask, request, jsonify
import medicine

app = Flask(__name__)

@app.route('/add', methods=['POST'])
def add():
    data = request.json
    msg = medicine.add_medicine(data)
    return jsonify({"message": msg})

@app.route('/view', methods=['GET'])
def view():
    return jsonify(medicine.view_medicines())

@app.route('/delete/<name>', methods=['DELETE'])
def delete(name):
    msg = medicine.delete_medicine(name)
    return jsonify({"message": msg})

@app.route('/search/<keyword>', methods=['GET'])
def search(keyword):
    return jsonify(medicine.search_medicine(keyword))

@app.route('/update/<name>', methods=['PUT'])
def update(name):
    new_data = request.json
    msg = medicine.update_medicine(name, new_data)
    return jsonify({"message": msg})

if __name__ == '__main__':
    app.run(debug=True)