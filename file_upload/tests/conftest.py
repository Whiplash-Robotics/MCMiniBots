import os
import tempfile
import pytest
from app import create_app
from app.extensions import db

@pytest.fixture(scope="session")
def _tmp_upload_dir():
    # Real directory on disk (lets you assert files are written)
    with tempfile.TemporaryDirectory(prefix="uploads_") as d:
        yield d  # auto-cleaned

@pytest.fixture(scope="session")
def app(_tmp_upload_dir):
    """
    Build a fresh Flask app for tests with:
    - Temporary upload dir
    - SQLite (file-based) test DB
    - TESTING flag enabled
    """
    test_db_path = os.path.join(_tmp_upload_dir, "test.sqlite")
    cfg = {
        "TESTING": True,
        "UPLOAD_FOLDER": _tmp_upload_dir,
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{test_db_path}",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "MAX_CONTENT_LENGTH": 16 * 1024 * 1024,
    }
    app = create_app(testing=True, config=cfg)

    # If your create_app doesn't call db.create_all(), do it here:
    with app.app_context():
        db.create_all()

    return app

@pytest.fixture
def client(app):
    return app.test_client()
