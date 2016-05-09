import sys
sys.dont_write_bytecode = True
from threading import Thread
import requests
import dbmanage
import time
import json
import isodate


with open("config.js") as f:
    data = f.readlines()[1]
    token = data.replace('"', "")
    token = token.replace(" ", "")
    token = token.replace("token", " ")
    token = token.replace(":", " ")
    token = token.replace(",", " ")

def get_length_of_song(id):
    url = "https://www.googleapis.com/youtube/v3/videos?id=" + id + "&part=snippet,contentDetails&key=" + token
    r = requests.get(url)
    dur = isodate.parse_duration(json.dumps(r.json()["items"][0]["contentDetails"]["duration"]).replace('"', ""))
    return dur.total_seconds()

def manage_dj(dj):
    print("New thread started for %s" % dj)
    while(True):
        index = 0
        prevIndex = 0
        song = dbmanage.getSong(dj, index)
        song_length = get_length_of_song(song["url"].replace("https://www.youtube.com/watch?v=", ""))
        while(True):
            time.sleep(1)
            index = dbmanage.updateDj(dj, song_length)
            if index != prevIndex:
                prevIndex = index
                break

def main():
    for i in ["Three Dog", "Mr. New Vegas", "Travis Lonely Miles"]:
        t = Thread(target=manage_dj, args=(i,))
        t.start()

if __name__ == "__main__":
    main()
