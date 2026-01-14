"""
Database models for the Late Show application.

Models:
- Episode: Represents a TV show episode
- Guest: Represents a guest on the show
- Appearance: Represents a guest's appearance on an episode (junction table)
"""
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship

db = SQLAlchemy()

class Episode(db.Model):
    """Model representing a TV show episode."""
    __tablename__ = 'episodes'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(20), nullable=False)
    number = db.Column(db.Integer, nullable=False)
    
    # Relationship: An episode has many appearances
    appearances = relationship('Appearance', back_populates='episode', 
                                cascade='all, delete-orphan')
    
    def to_dict(self, include_appearances=False):
        """Convert episode to dictionary for JSON serialization."""
        data = {
            'id': self.id,
            'date': self.date,
            'number': self.number
        }
        
        if include_appearances:
            data['appearances'] = [appearance.to_dict() for appearance in self.appearances]
        
        return data


class Guest(db.Model):
    """Model representing a guest on the show."""
    __tablename__ = 'guests'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    occupation = db.Column(db.String(100), nullable=False)
    
    # Relationship: A guest has many appearances
    appearances = relationship('Appearance', back_populates='guest',
                               cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert guest to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'name': self.name,
            'occupation': self.occupation
        }


class Appearance(db.Model):
    """Model representing a guest's appearance on an episode."""
    __tablename__ = 'appearances'
    
    id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False)
    episode_id = db.Column(db.Integer, db.ForeignKey('episodes.id', ondelete='CASCADE'), nullable=False)
    guest_id = db.Column(db.Integer, db.ForeignKey('guests.id', ondelete='CASCADE'), nullable=False)
    
    # Relationships
    episode = relationship('Episode', back_populates='appearances')
    guest = relationship('Guest', back_populates='appearances')
    
    # Validations
    __table_args__ = (
        db.CheckConstraint('rating >= 1 AND rating <= 5', name='rating_check'),
    )
    
    def to_dict(self):
        """Convert appearance to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'rating': self.rating,
            'episode_id': self.episode_id,
            'guest_id': self.guest_id,
            'episode': {
                'id': self.episode.id,
                'date': self.episode.date,
                'number': self.episode.number
            },
            'guest': {
                'id': self.guest.id,
                'name': self.guest.name,
                'occupation': self.guest.occupation
            }
        }

