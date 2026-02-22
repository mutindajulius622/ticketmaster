# Database Fixes - Todo List

## Bugs to Fix

### 1. setup_db.py - `UnboundLocalError: local variable 'db' referenced before assignment`
- [x] Add SQLAlchemy import and initialize db
- [x] Fix migrate initialization
- [x] Fix helper function parameters

### 2. seed.py - `ModuleNotFoundError: No module named 'app'`
- [x] Fix import path from 'app' to 'main'

### 3. create_admin.py - Same import issue
- [x] Fix import path from 'app' to 'main'

### 4. migrate_user_names.py - Same import issue
- [x] Fix import path from 'app' to 'main'

## Files to Edit
- [x] /home/palmer/development/code/phase4/palmer-living-reality/server/setup_db.py
- [x] /home/palmer/development/code/phase4/palmer-living-reality/server/seed.py
- [x] /home/palmer/development/code/phase4/palmer-living-reality/server/create_admin.py
- [x] /home/palmer/development/code/phase4/palmer-living-reality/server/migrate_user_names.py

## Testing
Run these commands to test:
```bash
python -m server.setup_db
python -m server.seed
python -m server.create_admin
python -m server.migrate_user_names
```

