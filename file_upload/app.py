import os
from flask import Flask, request, jsonify
import sqlite3
from werkzeug.utils import secure_filename

# --- Config ---
UPLOAD_FOLDER = 'uploads'
DB_PATH = os.path.join("db", "fileupload.db")
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

# --- App Init ---
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

# --- DB Helpers ---
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS uploads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# --- Utility ---
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Routes ---
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)

        # Save to DB
        conn = get_db()
        conn.execute('INSERT INTO uploads (filename) VALUES (?)', (filename,))
        conn.commit()
        conn.close()

        return jsonify({'message': f'File {filename} uploaded successfully'})
    else:
        return jsonify({'error': 'File type not allowed'}), 400

@app.route('/uploads', methods=['GET'])
def list_uploads():
    conn = get_db()
    cursor = conn.execute('SELECT * FROM uploads ORDER BY upload_time DESC')
    files = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(files)

@app.route('/', methods=['GET'])
def upload_form():
    return '''
    <!doctype html>
    <html>
      <head><title>Upload File</title></head>
      <body>
        <h1>Upload a File</h1>
        <form method="POST" action="/upload" enctype="multipart/form-data">
          <input type="file" name="file" required>
          <input type="submit" value="Upload">
        </form>
        <p><a href="/uploads">View uploaded files</a></p>
      </body>
    </html>
    '''

# --- Startup ---
if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
