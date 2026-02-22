# Palmer Living Reality - Real Estate Platform

A beautiful, colorful, and user-friendly full-stack real estate application built with Flask and React.

## 🌟 Features

### User Roles
- **Admin**: Full system control - verify tenants, manage all properties and rental agreements
- **Property Owner**: Add/edit properties for rent or sale, view and manage rental applications
- **Tenant**: Browse properties, apply for rentals (requires admin verification for new accounts)

### Core Features
- 🏠 Beautiful property listings (apartments, mansions, bungalows)
- 🔐 Secure role-based authentication
- ✅ Admin verification workflow for tenants
- 📋 Complete rental agreement management
- 🖼️ Property image galleries
- 🔍 Advanced search and filtering
- 📱 Fully responsive design
- ✨ Modern, colorful UI with smooth animations

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup (Flask)

```bash
# Navigate to server directory
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
flask db init
flask db migrate
flask db upgrade

# Seed demo data (optional but recommended)
python seed.py

# Start the server
python app.py
```

The server will run at `http://localhost:5555`

### Frontend Setup (React)

```bash
# Open a new terminal
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will run at `http://localhost:5173`

## 📋 Demo Accounts

| Role   | Username          | Password   | Notes                        |
|--------|-------------------|------------|------------------------------|
| Admin  | admin             | admin123   | Full system access           |
| Owner  | owner             | owner123   | Can manage properties        |
| Owner  | jane_properties   | jane123    | Second property owner        |
| Tenant | tenant            | tenant123  | Requires admin verification  |
| Tenant | verified_tenant   | tenant123  | Already verified             |

## 🎨 UI Highlights

- **Colorful Hero Section**: Eye-catching gradient backgrounds
- **Animated Cards**: Smooth hover effects on property cards
- **Responsive Grid**: Adapts beautifully to all screen sizes
- **Modern Forms**: Beautiful input fields with validation
- **Loading States**: Skeleton screens and spinners
- **Toast Notifications**: Feedback for user actions

## 📁 Project Structure

```
palmer-living-reality/
├── server/
│   ├── app.py              # Flask application with REST API
│   ├── models.py           # SQLAlchemy models (User, Property, RentalAgreement)
│   ├── config.py           # Configuration settings
│   ├── seed.py             # Demo data seeding script
│   ├── requirements.txt    # Python dependencies
│   └── migrations/         # Database migrations
├── client/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── PropertyCard.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Properties.jsx
│   │   │   ├── PropertyDetail.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── OwnerDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── context/        # React context
│   │   │   └── AuthContext.jsx
│   │   ├── services/       # API services
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/me` - Current user info

### Properties
- `GET /api/properties` - List all (public)
- `GET /api/properties/:id` - Get details (public)
- `POST /api/properties` - Create (owner/admin)
- `PUT /api/properties/:id` - Update (owner/admin)
- `DELETE /api/properties/:id` - Delete (owner/admin)

### Users
- `GET /api/users` - List all (admin)
- `GET /api/pending-tenants` - Get pending verifications
- `PUT /api/verify-tenant/:id` - Verify tenant (admin)

### Rental Agreements
- `GET /api/rental-agreements` - List (role-based)
- `POST /api/rental-agreements` - Create (tenant)
- `PUT /api/rental-agreements/:id` - Update (admin)

## 🛠️ Tech Stack

### Backend
- **Flask**: Web framework
- **SQLAlchemy**: ORM
- **Flask-Migrate**: Database migrations
- **Flask-RESTful**: REST API
- **Flask-CORS**: CORS support
- **Flask-Bcrypt**: Password hashing

### Frontend
- **React 18**: UI library
- **React Router v6**: Routing
- **Formik**: Form handling
- **Yup**: Validation
- **Axios**: HTTP client
- **Vite**: Build tool

## 🎯 Key Design Features

1. **Modern Color Scheme**: Beautiful indigo, emerald, and amber accents
2. **Smooth Animations**: Spring animations and transitions
3. **Card Hover Effects**: Lift and shadow on hover
4. **Responsive Design**: Mobile-first approach
5. **Accessible**: Good contrast ratios and keyboard navigation
6. **Loading States**: Visual feedback during data fetching

## 📝 License

MIT License - feel free to use this project for learning or as a starting point for your own applications!

## 🙏 Credits

- Property images from Unsplash
- Icons from Emoji Unicode
- Built as a learning project for Phase 4

---

Happy house hunting! 🏠✨

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5555',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})