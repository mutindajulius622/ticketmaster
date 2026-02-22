# Ticket Master - Event Ticketing & Management Platform

A full-stack event ticketing and management application built with Flask, React, PostgreSQL, and PayPal integration.

## 🌟 Features

### Authentication & Authorization
- JWT Bearer token authentication
- Role-based access control (Admin, Organizer, Attendee)
- Secure registration and login

### Event Management
- Organizers can create, update, and delete events
- Flexible ticket types: Early Bird, VIP, Regular
- Real-time ticket availability
- Event search by category, location, and tags
- Event reviews and ratings

### Ticketing System
- Seamless ticket purchasing
- QR code generation for tickets
- Ticket validation for event staff
- Purchase history and receipt downloads

### Payment Integration
- PayPal payment processing
- Secure order creation and capture
- Webhook support for real-time updates
- Refund management

### Admin Features
- User management (ban, promote, deactivate)
- Event moderation and approval
- Platform analytics and reporting
- Revenue tracking

## 🛠️ Tech Stack

### Backend
- **Framework**: Flask 2.3+
- **Database**: PostgreSQL 15
- **Authentication**: JWT (PyJWT)
- **ORM**: SQLAlchemy
- **Validation**: Marshmallow
- **Payment**: PayPal REST API integration

### Frontend
- **Library**: React 18
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Notifications**: React Toastify

### Deployment
- **Backend**: Docker + Gunicorn
- **Frontend**: Docker + Serve
- **Orchestration**: Docker Compose

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)
- PayPall Sandbox/Production credentials

## 🚀 Getting Started

### Backend Setup

1. **Clone and navigate to backend directory:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Initialize database:**
```bash
flask db upgrade
# Or manually create tables:
flask shell
> db.create_all()
> exit()
```

6. **Run development server:**
```bash
python wsgi.py
# Server runs on http://localhost:5000
```

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
# Default configuration should work for local development
```

4. **Start development server:**
```bash
npm start
# Application runs on http://localhost:3000
```

## 🐳 Docker Setup

1. **Build and start all services:**
```bash
docker-compose up -d
```

2. **Access services:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - Database: localhost:5432

3. **Stop services:**
```bash
docker-compose down
```

## 📚 API Documentation

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+254712345678",
  "role": "attendee"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": { ... }
}
```

### Event Endpoints

#### List Events
```
GET /api/events?page=1&limit=10&category=music&search=term
```

#### Get Event Details
```
GET /api/events/{eventId}
```

#### Create Event
```
POST /api/events
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Amazing Concert",
  "description": "...",
  "category": "music",
  "location": "Nairobi, Kenya",
  "start_date": "2024-12-31T18:00:00",
  "end_date": "2024-12-31T23:00:00",
  "tags": ["music", "live", "concert"]
}
```

### Ticket Endpoints

#### Get User Tickets
```
GET /api/tickets
Authorization: Bearer {token}
```

#### Purchase Tickets
```
POST /api/tickets
Authorization: Bearer {token}
Content-Type: application/json

{
  "ticket_type_id": "type-id",
  "quantity": 2,
  "payment_method": "paypal"
}
```

### Payment Endpoints

#### Create PayPal Order
```
POST /api/payments/paypal/create-order
Authorization: Bearer {token}
Content-Type: application/json

{
  "payment_id": "payment-id"
}
```

#### Capture PayPal Order
```
POST /api/payments/paypal/capture-order
Authorization: Bearer {token}
Content-Type: application/json

{
  "order_id": "PayPal-order-id"
}
```

## 🔐 Security Features

- ✅ JWT authentication with expiration
- ✅ Password hashing with bcrypt
- ✅ CORS protection
- ✅ Input validation and sanitization
- ✅ Role-based access control
- ✅ Rate limiting (recommended)
- ✅ SQL injection prevention (ORM)

## 📊 Database Schema

### Main Tables
- `users` - User accounts and profiles
- `events` - Event listings
- `ticket_types` - Ticket pricing tiers
- `tickets` - Individual tickets
- `payments` - Payment transactions
- `reviews` - Event reviews and ratings
- `saved_events` - User's saved events

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📝 Project Structure

```
ticket-Master/
├── backend/
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── schemas/         # Data validation
│   │   ├── middleware/      # Custom middleware
│   │   └── utils/           # Utility functions
│   ├── migrations/          # Database migrations
│   ├── tests/               # Test files
│   ├── requirements.txt     # Python dependencies
│   └── wsgi.py              # Application entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── redux/           # State management
│   │   ├── services/        # API services
│   │   ├── styles/          # CSS/Tailwind
│   │   ├── utils/           # Utility functions
│   │   ├── App.js           # Main app component
│   │   └── index.js         # Entry point
│   ├── public/              # Static files
│   └── package.json         # Node dependencies
│
└── docker-compose.yml       # Docker configuration
```

## 🔄 Development Workflow

1. **Backend Development**
   - Modify models in `app/models/`
   - Create routes in `app/routes/`
   - Add services in `app/services/`
   - Write tests in `tests/`

2. **Frontend Development**
   - Create components in `src/components/`
   - Build pages in `src/pages/`
   - Manage state in `src/redux/`
   - Style with Tailwind CSS

3. **Testing**
   - Run backend tests: `pytest`
   - Run frontend tests: `npm test`

## 🚢 Deployment

### Production Checklist
- [ ] Update `.env` with production values
- [ ] Set `FLASK_ENV=production`
- [ ] Use strong `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Configure CORS origins
- [ ] Set up HTTPS/SSL
- [ ] Configure database backups
- [ ] Set up monitoring and logging
- [ ] Configure PayPal production credentials

### Deploy with Docker Compose
```bash
docker-compose -f docker-compose.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📞 Support

For support, email support@ticketmaster.com or create an issue in the repository.

## 🙏 Acknowledgments

- Flask and Flask-SQLAlchemy communities
- React and Redux communities
- Tailwind CSS
- PayPal REST API

---

**Built with ❤️ for event enthusiasts**
