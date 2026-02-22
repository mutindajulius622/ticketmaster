# SQLAlchemy Error Fix Plan

## Error Reference
- SQLAlchemy Error: https://sqlalche.me/e/20/e3q8
- Issue: SQLAlchemy 2.0 compatibility and code structure issues

## Identified Problems

### 1. server/app.py - Duplicate Code
**Problem**: The file contains duplicate code - main app code AND then a repeated copy at the end
**Fix**: Remove duplicate sections, keep only one clean copy

### 2. server/app.py - Inquiry Model Issues
**Problem**: Inquiry model references Property and User relationships but:
- Missing proper import for Inquiry class
- Relationship backrefs may not be properly defined
**Fix**: Add Inquiry import and ensure relationships are properly defined

### 3. server/models/index.py - SQLAlchemy 2.0 Compatibility
**Problem**: SQLAlchemy 2.0 has stricter session/query handling
**Fix**: 
- Ensure `db.init_app()` is called properly
- Use `db.session` context properly
- Update validators for 2.0 style

### 4. Circular Import Issues
**Problem**: Circular imports between app.py, models/index.py, urls/__init__.py
**Fix**: Reorder imports and ensure proper module loading

### 5. Duplicate Route Files
**Problem**: Both `urls/__init__.py` and `urls/urls.py` contain identical route initialization
**Fix**: Keep only `urls/__init__.py`, remove `urls/urls.py`

## Implementation Steps

### Step 1: Clean up server/app.py
- [ ] Remove duplicate code sections at end of file
- [ ] Add Inquiry import from models
- [ ] Fix api.add_resource order (Inquiries should come before other routes)

### Step 2: Fix server/models/index.py
- [ ] Add Inquiry model import handling
- [ ] Ensure proper table definition order (property_amenities before models)
- [ ] Verify all relationships have proper backrefs

### Step 3: Clean up server/urls/__init__.py
- [ ] Remove duplicate file server/urls/urls.py
- [ ] Add Inquiry routes to the import and initialization

### Step 4: Verify database initialization
- [ ] Check server/__init__.py for proper db initialization
- [ ] Ensure all models are properly loaded

## Files to Modify

1. `server/app.py` - Main Flask application file
2. `server/models/index.py` - SQLAlchemy models
3. `server/urls/__init__.py` - Route initialization
4. `server/urls/urls.py` - To be removed (duplicate)

## Testing After Fix

1. Run `python -c "from server.app import app; print('Import successful')"`
2. Run database migrations
3. Test API endpoints

