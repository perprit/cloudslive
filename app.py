import os, sys
import json
from flask import Flask, request, redirect, url_for, render_template
from werkzeug import secure_filename

UPLOAD_FOLDER = "uploaded"
ALLOWED_EXTENSIONS = set(['json', 'text'])

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/")
def index():
    return render_template("main.html")

@app.route("/upload", methods=["POST"])
def upload():
    if request.method == "POST":
        fp = request.files["file"]
        # if UPLOAD_FOLDER directory does not exist, create it
        if not os.path.exists(app.config["UPLOAD_FOLDER"]):
            os.makedirs(app.config["UPLOAD_FOLDER"])

        # uploading a chat list
        if fp and allowed_file(fp.filename):
            filename = secure_filename(fp.filename)
            fp.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
            with open(os.path.join(app.config['UPLOAD_FOLDER'], filename), 'rb') as fp:
                chats = json.loads(fp.readline().decode())
            return json.dumps(chats)
    return None

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=12321)
