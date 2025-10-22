# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-prod')
    
    # SQLAlchemy - uses direct Postgres connection
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False  # Log SQL queries in development
    
    # Supabase - for auth verification
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')  # Found in Supabase dashboard
    
    # App config
    ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = ENV == 'development'