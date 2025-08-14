import os
from flask import current_app as app, request, jsonify
from werkzeug.utils import secure_filename
from .models import Upload
from .extensions import db

ALLOWED_EXTENSIONS = {'txt', 'ts', 'js'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Routes (registered by import in create_app) ---

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)

            # Handle duplicate filenames
            counter = 1
            base_filename = filename
            upload_dir = app.config['UPLOAD_FOLDER']
            while os.path.exists(os.path.join(upload_dir, filename)):
                name, ext = os.path.splitext(base_filename)
                filename = f"{name}_{counter}{ext}"
                counter += 1

            save_path = os.path.join(upload_dir, filename)
            file.save(save_path)

            # Save to DB
            new_upload = Upload(filename=filename)
            db.session.add(new_upload)
            db.session.commit()

            return jsonify({'message': f'File {filename} uploaded successfully'}), 201
        else:
            return jsonify({'error': 'File type not allowed'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Upload Failed: {str(e)}'}), 500

@app.get('/uploads')
def list_uploads():
    uploads = Upload.query.order_by(Upload.upload_time.desc()).all()
    files = [{
        'id': u.id,
        'filename': u.filename,
        'upload_time': u.upload_time.isoformat()
    } for u in uploads]
    return jsonify(files)

@app.get('/')
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
