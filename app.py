import os, sys
import json
from flask import Flask, request, redirect, url_for, render_template
from werkzeug import secure_filename

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = set(['json'])

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/")
def index():
    if "filename" in request.args.keys():
        filename = request.args["filename"]
    else:
        filename = "File Not Uploaded"

    return render_template("main.html")

@app.route("/upload", methods=["POST"])
def upload():
    if request.method == "POST":
        fp = request.files["file"]
        # if UPLOAD_FOLDER directory does not exist, create it
        if not os.path.exists(app.config["UPLOAD_FOLDER"]):
            os.makedirs(app.config["UPLOAD_FOLDER"])

        # uploading the PCAP file
        if fp and allowed_file(fp.filename):
            filename = secure_filename(fp.filename)
            fp.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
            with open(os.path.join(app.config['UPLOAD_FOLDER'], filename), 'r') as fp:
                chats = json.loads(fp.readline())
                msgs = []
                for chat in chats:
                    msgs.append(chat['msg'])
            return msgs
    return None

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=12321)
