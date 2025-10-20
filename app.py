from flask import Flask
from flask_cors import CORS
from supabase import create_client
import os

app = Flask(__name__)
app.config.from_object('config.Config')

# CORS configuration (restrict to your frontend domain in production)
CORS(app, origins=["http://localhost:3000"])

# Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')  # Use service key for backend
)

# Register blueprints
from routes import auth, memories, tags, insights, professional
app.register_blueprint(auth.bp, url_prefix='/api/auth')
app.register_blueprint(memories.bp, url_prefix='/api/memories')
app.register_blueprint(tags.bp, url_prefix='/api/tags')
app.register_blueprint(insights.bp, url_prefix='/api/insights')
app.register_blueprint(professional.bp, url_prefix='/api/professional')

if __name__ == '__main__':
    app.run(debug=True, port=5000)