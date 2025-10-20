# middleware/auth_middleware.py
from functools import wraps
from flask import request, jsonify
import jwt
import os

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization'}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(
                token,
                os.getenv('SUPABASE_JWT_SECRET'),
                algorithms=['HS256'],
                audience='authenticated'
            )
            
            user_id = payload.get('sub')
            
            from models import UserProfile
            current_user = UserProfile.query.get(user_id)
            
            if not current_user:
                return jsonify({'error': 'User not found'}), 404
            
            return f(current_user, *args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
    
    return decorated_function