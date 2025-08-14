import os
from flask import Flask
from .extensions import db

DEFAULTS = {
    'UPLOAD_FOLDER': 'uploads',
    'MAX_CONTENT_LENGTH': 16 * 1024 * 1024,  # 16MB
}

def create_app(*, testing: bool = False, config: dict | None = None) -> Flask:
    app = Flask(__name__)

    # --- Base config ---
    app.config.update(DEFAULTS)
    app.config['TESTING'] = testing

    # DB URL (env first, then fallback)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL',
        'postgresql://devuser:devpass@localhost:5432/devdb'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Optional override from caller
    if config:
        app.config.update(config)

    # Ensure upload dir exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # --- Init extensions ---
    db.init_app(app)

    # --- Register routes (import binds decorators) ---
    with app.app_context():
        # Import after app exists so @app.route decorators attach to this instance
        from . import routes  # noqa: F401

        # Create tables if desired (keeps behavior close to your original script)
        # In real prod, use Alembic migrations; keep this for dev/POC.
        db.create_all()

    return app
