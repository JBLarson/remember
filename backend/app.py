# app.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, origins=["http://localhost:5173"])
    
    # Register blueprints
    from routes import memories
    app.register_blueprint(memories.bp, url_prefix='/api/memories')
    
    """
    from routes import auth, memories, tags, insights
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(memories.bp, url_prefix='/api/memories')
    app.register_blueprint(tags.bp, url_prefix='/api/tags')
    app.register_blueprint(insights.bp, url_prefix='/api/insights')
    """
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)