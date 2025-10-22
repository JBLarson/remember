# routes/memories.py
from flask import Blueprint, request, jsonify
#from models import MemoryVersion, Tag, AuditLog
from app import db
from models import Memory, MemoryVersion, AuditLog
from middleware.auth_middleware import require_auth
from sqlalchemy.exc import IntegrityError
from datetime import datetime

bp = Blueprint('memories', __name__)
#bp = Blueprint('memories', __name__, strict_slashes=False)


@bp.route('/', methods=['GET'])
@require_auth
def get_memories(current_user):
    """Get all memories for current user"""
    # Parse query params
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    year = request.args.get('year', type=int)
    
    # Build query using SQLAlchemy
    query = Memory.query.filter_by(user_id=current_user.id)
    
    if year:
        query = query.filter_by(year=year)
    
    # Order by chronology
    query = query.order_by(
        Memory.year.desc().nullslast(),
        Memory.age.desc().nullslast()
    )
    
    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'memories': [m.to_dict() for m in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages
    })


@bp.route('/', methods=['POST'])
@require_auth
def create_memory(current_user):
    """Create new memory"""
    data = request.get_json()
    
    # Validate
    if not data.get('encrypted_content'):
        return jsonify({'error': 'Encrypted content required'}), 400
    
    try:
        # Create memory object
        memory = Memory(
            user_id=current_user.id,
            encrypted_content=data['encrypted_content'],
            encryption_key_id=data['encryption_key_id'],
            year=data.get('year'),
            age=data.get('age'),
            grade=data.get('grade'),
            date_precision=data.get('date_precision', 'approximate'),
            confidence_level=data.get('confidence_level'),
            emotional_valence=data.get('emotional_valence'),
            emotional_intensity=data.get('emotional_intensity'),
            body_sensations=data.get('body_sensations')
        )
        
        # Handle tags
        if 'tag_ids' in data:
            tags = Tag.query.filter(
                Tag.id.in_(data['tag_ids']),
                Tag.user_id == current_user.id
            ).all()
            memory.tags = tags
        
        # Save
        db.session.add(memory)
        db.session.commit()
        
        # Audit log
        audit = AuditLog(
            user_id=current_user.id,
            action='memory_created',
            resource_type='memory',
            resource_id=memory.id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(audit)
        db.session.commit()
        
        return jsonify({
            'message': 'Memory created',
            'memory': memory.to_dict()
        }), 201
        
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({'error': 'Database integrity error'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<uuid:memory_id>', methods=['PUT'])
@require_auth
def update_memory(current_user, memory_id):
    """Update existing memory"""
    memory = Memory.query.filter_by(
        id=memory_id,
        user_id=current_user.id
    ).first_or_404()
    
    data = request.get_json()
    
    # Update fields - handle None/null values explicitly
    if 'encrypted_content' in data:
        memory.encrypted_content = data['encrypted_content']
    
    # For nullable fields, always update even if None
    memory.year = data.get('year')
    memory.age = data.get('age')
    memory.grade = data.get('grade')
    
    if 'confidence_level' in data:
        memory.confidence_level = data['confidence_level']
    if 'emotional_valence' in data:
        memory.emotional_valence = data['emotional_valence']
    
    memory.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Memory updated',
        'memory': memory.to_dict()
    })


@bp.route('/<uuid:memory_id>/timeline', methods=['GET'])
@require_auth
def get_memory_timeline(current_user, memory_id):
    """Get version history for a memory"""
    memory = Memory.query.filter_by(
        id=memory_id,
        user_id=current_user.id
    ).first_or_404()
    
    versions = MemoryVersion.query.filter_by(
        memory_id=memory.id
    ).order_by(MemoryVersion.version_number.asc()).all()
    
    return jsonify({
        'memory_id': str(memory.id),
        'current': memory.to_dict(),
        'versions': [{
            'version_number': v.version_number,
            'change_note': v.change_note,
            'created_at': v.created_at.isoformat()
        } for v in versions]
    })






@bp.route('/<uuid:memory_id>', methods=['DELETE'])
@require_auth
def delete_memory(current_user, memory_id):
    """Delete a memory"""
    memory = Memory.query.filter_by(
        id=memory_id,
        user_id=current_user.id
    ).first_or_404()
    
    db.session.delete(memory)
    db.session.commit()
    
    return jsonify({
        'message': 'Memory deleted'
    })