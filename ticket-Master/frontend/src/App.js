import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import SavedEventsPage from './pages/SavedEventsPage';
import SearchPage from './pages/SearchPage';
import SeatSelection from './pages/SeatSelection';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Footer from './components/Footer';

// Redux
import { checkAuth } from './redux/slices/authSlice';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {isAuthenticated && <Navigation />}
      
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/venues/:venueId/seatmap" element={<SeatSelection />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />

          {/* Protected Routes */}
          <Route
            path="/checkout/:ticketTypeId"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-events"
            element={
              <ProtectedRoute>
                <SavedEventsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Not Found */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {isAuthenticated && <Footer />}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

export default App;
