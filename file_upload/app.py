import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from datetime import datetime

# --- Config ---
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

# --- App Init ---
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Use psycopg2 (default driver for PostgreSQL)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://devuser:devpass@localhost:5432/devdb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- DB Model ---
class Upload(db.Model):
    __tablename__ = 'uploads'
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    upload_time = db.Column(db.DateTime, default=datetime.utcnow)

# --- Utility ---
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
        new_upload = Upload(filename=filename)
        db.session.add(new_upload)
        db.session.commit()

        return jsonify({'message': f'File {filename} uploaded successfully'})
    else:
        return jsonify({'error': 'File type not allowed'}), 400

@app.route('/uploads', methods=['GET'])
def list_uploads():
    uploads = Upload.query.order_by(Upload.upload_time.desc()).all()
    files = [{
        'id': upload.id,
        'filename': upload.filename,
        'upload_time': upload.upload_time.isoformat()
    } for upload in uploads]
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
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000)
