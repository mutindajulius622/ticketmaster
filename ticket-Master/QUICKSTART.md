# Quick Start Guide - Ticket Master

## 🚀 5-Minute Setup

### Option 1: Using Docker (Recommended)

```bash
# Navigate to project root
cd ticket-Master

# Start all services
docker-compose up -d

# Services will be available at:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Database: localhost:5432
```

### Option 2: Local Development

#### Backend Setup (Terminal 1)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Configure PostgreSQL connection in .env
python wsgi.py
```

#### Frontend Setup (Terminal 2)
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

## 🔐 First Time Setup

1. **Create Admin User**
   - Register with role "admin" (if allowed)
   - Or use database shell:
   ```bash
   flask shell
   admin = User(email="admin@example.com", role="admin", ...)
   db.session.add(admin)
   db.session.commit()
   ```

2. **Configure PayPal**
   - Update `.env` with PayPal credentials
   - Get credentials from PayPal Developer Dashboard
   - Use Sandbox credentials for testing

3. **Set JWT Secrets**
   - Generate strong secrets for production
   - Update in `.env`

## 📚 Key Endpoints to Test

### 1. Authentication
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "role": "attendee"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### 2. Events
```bash
# Get all events
curl http://localhost:5000/api/events

# Create event (requires auth token)
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Conference 2024",
    "description": "A gathering of tech enthusiasts",
    "category": "technology",
    "location": "Nairobi, Kenya",
    "start_date": "2024-12-31T09:00:00",
    "end_date": "2024-12-31T17:00:00"
  }'
```

## 🧪 Testing Features

### User Flows to Try

1. **Attendee Flow**
   - Register as attendee
   - Browse events
   - Book tickets
   - Make payment
   - View purchased tickets

2. **Organizer Flow**
   - Register as organizer
   - Create event
   - Set ticket types and pricing
   - View ticket sales
   - Manage attendees

3. **Admin Flow**
   - Login as admin
   - View all users
   - Manage event approvals
   - View analytics
   - Handle user reports

## 📁 Important Files

| File | Purpose |
|------|---------|
| `backend/.env` | Backend configuration |
| `frontend/.env` | Frontend configuration |
| `backend/app/models/__init__.py` | Database models |
| `backend/app/routes/` | API endpoints |
| `frontend/src/redux/` | State management |
| `docker-compose.yml` | Docker configuration |

## 🔧 Common Issues

### PostgreSQL Connection Error
```
Solution: Ensure PostgreSQL is running and DATABASE_URL is correct
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### CORS Error
```
Solution: Check CORS_ORIGINS in backend .env
Should include your frontend URL
```

### Token Expired
```
Solution: Login again to get new token
JWT_EXPIRATION_HOURS can be adjusted in config.py
```

## 📖 Next Steps

1. **Customize Styling**: Modify `frontend/src/styles/index.css`
2. **Add More Features**: Follow the established patterns in routes/
3. **Deploy**: Use provided Docker configuration
4. **Integrate Payment**: Configure PayPal credentials
5. **Add Tests**: Follow TDD approach

## 🎯 Development Tips

- Use Redux DevTools browser extension for state debugging
- Use Postman/Insomnia for API testing
- Check browser console for frontend errors
- Check backend logs for server errors
- Use database browser (pgAdmin) to inspect DB

## 📞 Getting Help

1. Check README.md for full documentation
2. Review code comments and docstrings
3. Check existing GitHub issues
4. Create new issue with detailed description

---

**Ready to build amazing events? Let's go! 🚀**
