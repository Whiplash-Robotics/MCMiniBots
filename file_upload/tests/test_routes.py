import io
import os

def test_upload_success(client, app):
    data = {"file": (io.BytesIO(b"hello"), "hello.txt")}
    r = client.post("/upload", data=data, content_type="multipart/form-data")
    assert r.status_code == 201
    body = r.get_json()
    assert body and "uploaded successfully" in body["message"]

    # verify file exists on disk
    upload_dir = app.config["UPLOAD_FOLDER"]
    assert any(name.startswith("hello") and name.endswith(".txt")
               for name in os.listdir(upload_dir))

def test_upload_rejects_disallowed_extension(client):
    data = {"file": (io.BytesIO(b"nope"), "malware.exe")}
    r = client.post("/upload", data=data, content_type="multipart/form-data")
    assert r.status_code == 400
    assert "not allowed" in r.get_json()["error"].lower()

def test_upload_requires_file_field(client):
    r = client.post("/upload", data={}, content_type="multipart/form-data")
    assert r.status_code == 400
    assert "no file part" in r.get_json()["error"].lower()

def test_upload_renames_on_duplicate(client, app):
    # First upload
    r1 = client.post("/upload",
                     data={"file": (io.BytesIO(b"a"), "dup.txt")},
                     content_type="multipart/form-data")
    assert r1.status_code == 201

    # Second upload with same name → should rename to dup_1.txt
    r2 = client.post("/upload",
                     data={"file": (io.BytesIO(b"b"), "dup.txt")},
                     content_type="multipart/form-data")
    assert r2.status_code == 201

    # Check both files exist
    files = sorted(os.listdir(app.config["UPLOAD_FOLDER"]))
    assert "dup.txt" in files
    assert any(f.startswith("dup_") and f.endswith(".txt") for f in files)

def test_list_uploads(client):
    r = client.get("/uploads")
    assert r.status_code == 200
    assert isinstance(r.get_json(), list)
