"""
Palmer Living Reality Server Package

A Flask-based backend server for managing property rentals with
authentication, property listings, rental agreements, and M-Pesa payment integration.
"""

__version__ = "1.0.0"
__author__ = "Palmer Living Reality Team"

# Import main application components
from .main import app, db
from .config import Config

__all__ = [
    'app',
    'db',
    'Config'
]



