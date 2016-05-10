from pymongo import MongoClient

client = MongoClient("mongodb://localhost/gnr")
db = client["gnr"]

def getSong(dj, index):
    return db["songs"].find({"dj": dj, "index": index})[0]

def getAllData():
    result = []
    cursor = db["currents"].find()
    for doc in cursor:
        result.append({"index": doc["index"], "dj": doc["dj"], "time": doc["time"]})
    return result

def updateDj(dj, length):
    highestIndex = db["songs"].find({"dj": dj}).count()
    data = db["currents"].find({"dj": dj})[0]
    new_time = data["time"] + 1
    index = data["index"]
    if new_time > length:
        new_time = 0
        index = index + 1

    if index > highestIndex - 1:
        index = 0

    db["currents"].update_one({"dj": dj}, {
        "$set": {
            "index": index,
            "dj": dj,
            "time": new_time
        }
    })

    return index
