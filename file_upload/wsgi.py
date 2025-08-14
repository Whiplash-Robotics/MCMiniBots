import os
from app import create_app

app = create_app(testing=os.getenv('FLASK_TESTING', 'false').lower() == 'true')

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
