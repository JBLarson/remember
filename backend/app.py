# app.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config
import logging
import os

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Configure logging based on environment variable
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    
    if log_level == 'QUIET':
        # Suppress SQLAlchemy and Werkzeug noise
        logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
        logging.getLogger('werkzeug').setLevel(logging.WARNING)
        app.logger.setLevel(logging.ERROR)
    elif log_level == 'DEBUG':
        # Verbose logging including SQL queries
        logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
        logging.getLogger('werkzeug').setLevel(logging.DEBUG)
        app.logger.setLevel(logging.DEBUG)
    else:
        # Default: INFO - show HTTP requests but not SQL
        logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
        logging.getLogger('werkzeug').setLevel(logging.INFO)
        app.logger.setLevel(logging.INFO)
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, origins=["http://localhost:5173"])
    
    # Register blueprints
    from routes import memories
    app.register_blueprint(memories.bp, url_prefix='/api/memories')
    
    return app

if __name__ == '__main__':
    app = create_app()
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    app.run(debug=debug_mode, port=5000)