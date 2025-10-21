# models/__init__.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
import uuid
from app import db

class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name = db.Column(db.String(255))
    account_type = db.Column(db.String(50), default='client')
    timezone = db.Column(db.String(50), default='UTC')
    encryption_public_key = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    memories = db.relationship('Memory', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    tags = db.relationship('Tag', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<UserProfile {self.display_name}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'display_name': self.display_name,
            'account_type': self.account_type,
            'created_at': self.created_at.isoformat()
        }


class Memory(db.Model):
    __tablename__ = 'memories'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('user_profiles.id', ondelete='CASCADE'), nullable=False)
    
    # Chronology
    memory_number = db.Column(db.Integer)
    year = db.Column(db.Integer)
    grade = db.Column(db.Integer)
    age = db.Column(db.Integer)
    date_precision = db.Column(db.String(20))
    
    # Content (encrypted)
    encrypted_content = db.Column(db.Text, nullable=False)
    encryption_key_id = db.Column(db.String(100), nullable=False)
    
    # Metadata
    confidence_level = db.Column(db.Integer)
    emotional_valence = db.Column(db.Integer)
    emotional_intensity = db.Column(db.Integer)
    body_sensations = db.Column(JSONB)
    
    # Status
    visibility = db.Column(db.String(20), default='private')
    is_sealed = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    versions = db.relationship('MemoryVersion', backref='memory', lazy='dynamic', cascade='all, delete-orphan')
    tags = db.relationship('Tag', secondary='memory_tags', backref='memories')
    perspectives = db.relationship('MemoryPerspective', backref='memory', lazy='dynamic', cascade='all, delete-orphan')
    
    __table_args__ = (
        db.CheckConstraint(
            '(year IS NOT NULL) OR (age IS NOT NULL) OR (grade IS NOT NULL)',
            name='valid_chronology'
        ),
        db.CheckConstraint(
            'confidence_level BETWEEN 1 AND 10',
            name='valid_confidence'
        ),
        db.CheckConstraint(
            'emotional_valence BETWEEN -5 AND 5',
            name='valid_valence'
        ),
    )
    
    def __repr__(self):
        return f'<Memory {self.id} - Year {self.year}>'
    
    def to_dict(self, include_content=True):
        data = {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'memory_number': self.memory_number,
            'year': self.year,
            'grade': self.grade,
            'age': self.age,
            'date_precision': self.date_precision,
            'confidence_level': self.confidence_level,
            'emotional_valence': self.emotional_valence,
            'emotional_intensity': self.emotional_intensity,
            'body_sensations': self.body_sensations,
            'visibility': self.visibility,
            'is_sealed': self.is_sealed,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'tags': [tag.to_dict() for tag in self.tags]
        }
        
        if include_content:
            data['encrypted_content'] = self.encrypted_content
            data['encryption_key_id'] = self.encryption_key_id
        
        return data


class MemoryVersion(db.Model):
    __tablename__ = 'memory_versions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    memory_id = db.Column(UUID(as_uuid=True), db.ForeignKey('memories.id', ondelete='CASCADE'), nullable=False)
    
    version_number = db.Column(db.Integer, nullable=False)
    encrypted_content = db.Column(db.Text, nullable=False)
    encryption_key_id = db.Column(db.String(100), nullable=False)
    change_note = db.Column(db.Text)
    
    confidence_level = db.Column(db.Integer)
    emotional_valence = db.Column(db.Integer)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('memory_id', 'version_number', name='unique_memory_version'),
    )
    
    def __repr__(self):
        return f'<MemoryVersion {self.memory_id} v{self.version_number}>'


class Tag(db.Model):
    __tablename__ = 'tags'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('user_profiles.id', ondelete='CASCADE'), nullable=False)
    
    name = db.Column(db.String(100), nullable=False)
    tag_type = db.Column(db.String(50))
    color = db.Column(db.String(20))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'name', name='unique_user_tag'),
    )
    
    def __repr__(self):
        return f'<Tag {self.name}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'tag_type': self.tag_type,
            'color': self.color
        }


# Association table for many-to-many relationship
memory_tags = db.Table('memory_tags',
    db.Column('memory_id', UUID(as_uuid=True), db.ForeignKey('memories.id', ondelete='CASCADE'), primary_key=True),
    db.Column('tag_id', UUID(as_uuid=True), db.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)


class MemoryPerspective(db.Model):
    __tablename__ = 'memory_perspectives'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    memory_id = db.Column(UUID(as_uuid=True), db.ForeignKey('memories.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('user_profiles.id', ondelete='CASCADE'), nullable=False)
    
    encrypted_content = db.Column(db.Text, nullable=False)
    encryption_key_id = db.Column(db.String(100), nullable=False)
    
    confidence_level = db.Column(db.Integer)
    emotional_valence = db.Column(db.Integer)
    
    their_year = db.Column(db.Integer)
    their_age = db.Column(db.Integer)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('memory_id', 'user_id', name='unique_memory_perspective'),
    )


class AIInsight(db.Model):
    __tablename__ = 'ai_insights'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('user_profiles.id', ondelete='CASCADE'), nullable=False)
    
    insight_type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    related_memory_ids = db.Column(ARRAY(UUID(as_uuid=True)), default=[])
    
    user_rating = db.Column(db.Integer)
    is_helpful = db.Column(db.Boolean)
    user_notes = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    dismissed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'insight_type': self.insight_type,
            'title': self.title,
            'description': self.description,
            'related_memory_ids': [str(mid) for mid in self.related_memory_ids] if self.related_memory_ids else [],
            'created_at': self.created_at.isoformat()
        }


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('user_profiles.id', ondelete='SET NULL'))
    
    action = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(50), nullable=False)
    resource_id = db.Column(UUID(as_uuid=True))
    
    details = db.Column(JSONB)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<AuditLog {self.action} on {self.resource_type}>'