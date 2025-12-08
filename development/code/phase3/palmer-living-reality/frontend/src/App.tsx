import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Loader from './components/common/Loader.tsx';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';
import NotFound from './pages/NotFound/NotFound';

// Lazy load pages for better performance
const Login = React.lazy(() => import('./pages/Auth/Login.tsx'));
const Register = React.lazy(() => import('./pages/Auth/Register.tsx'));
const ForgotPassword = React.lazy(() => import('./pages/Auth/ForgotPassword.tsx'));
const ResetPassword = React.lazy(() => import('./pages/Auth/ResetPassword.tsx'));

const Welcome = React.lazy(() => import('./pages/Welcome.tsx'));
const Dashboard = React.lazy(() => import('./pages/Dashboard.tsx'));
const Properties = React.lazy(() => import('./pages/Properties/Properties.tsx'));
const PropertyDetails = React.lazy(() => import('./pages/Properties/PropertyDetails.tsx'));
const AddProperty = React.lazy(() => import('./pages/Properties/AddProperty.tsx'));
const EditProperty = React.lazy(() => import('./pages/Properties/EditProperty.tsx'));

const Tenants = React.lazy(() => import('./pages/Tenants/Tenants.tsx'));
const TenantDetails = React.lazy(() => import('./pages/Tenants/TenantDetails.tsx'));

const Leases = React.lazy(() => import('./pages/Leases/Leases.tsx'));
const CreateLease = React.lazy(() => import('./pages/Leases/CreateLease.tsx'));
const LeaseDetails = React.lazy(() => import('./pages/Leases/LeaseDetails.tsx'));

const Payments = React.lazy(() => import('./pages/Payments/Payments.tsx'));
const MakePayment = React.lazy(() => import('./pages/Payments/MakePayment.tsx'));
const PaymentHistory = React.lazy(() => import('./pages/Payments/PaymentHistory.tsx'));

const Maintenance = React.lazy(() => import('./pages/Maintenance/Maintenance.tsx'));
const CreateTicket = React.lazy(() => import('./pages/Maintenance/CreateTicket.tsx'));
const TicketDetails = React.lazy(() => import('./pages/Maintenance/TicketDetails.tsx'));

const Listings = React.lazy(() => import('./pages/Listings/Listings.tsx'));
const ListingDetails = React.lazy(() => import('./pages/Listings/ListingDetails.tsx'));

const Reports = React.lazy(() => import('./pages/Reports/Reports.tsx'));

const Profile = React.lazy(() => import('./pages/Profile/Profile.tsx'));
const Settings = React.lazy(() => import('./pages/Settings/Settings.tsx'));

// Create query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  redirectTo = '/login'
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (only for non-authenticated users)
interface PublicRouteProps {
  children: React.ReactNode;
  restricted?: boolean;
  redirectTo?: string;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  restricted = false,
  redirectTo = '/dashboard'
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (user && restricted) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

// App Routes Component
function AppRoutes() {
  const { user } = useAuth();

  // Define accessible roles for each route
  const adminRoles = ['admin'];
  const ownerManagerRoles = ['admin', 'property_owner', 'property_manager'];
  const allRoles = ['admin', 'property_owner', 'property_manager', 'tenant', 'buyer', 'leasing_agent', 'maintenance_staff'];

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute restricted>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute restricted>
            <Register />
          </PublicRoute>
        } />
        
        <Route path="/forgot-password" element={
          <PublicRoute restricted>
            <ForgotPassword />
          </PublicRoute>
        } />
        
        <Route path="/reset-password/:token" element={
          <PublicRoute restricted>
            <ResetPassword />
          </PublicRoute>
        } />
        
        {/* Public Listings (accessible without login) */}
        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetails />} />

        {/* Protected Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Properties Routes */}
        <Route path="/properties" element={
          <ProtectedRoute allowedRoles={ownerManagerRoles}>
            <Layout>
              <Properties />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/properties/add" element={
          <ProtectedRoute allowedRoles={ownerManagerRoles}>
            <Layout>
              <AddProperty />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/properties/:id" element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <PropertyDetails />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/properties/:id/edit" element={
          <ProtectedRoute allowedRoles={ownerManagerRoles}>
            <Layout>
              <EditProperty />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Tenants Routes */}
        <Route path="/tenants" element={
          <ProtectedRoute allowedRoles={ownerManagerRoles}>
            <Layout>
              <Tenants />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/tenants/:id" element={
          <ProtectedRoute allowedRoles={ownerManagerRoles}>
            <Layout>
              <TenantDetails />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Leases Routes */}
        <Route path="/leases" element={
          <ProtectedRoute allowedRoles={ownerManagerRoles}>
            <Layout>
              <Leases />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/leases/create" element={
          <ProtectedRoute allowedRoles={ownerManagerRoles}>
            <Layout>
              <CreateLease />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/leases/:id" element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <LeaseDetails />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Payments Routes */}
        <Route path="/payments" element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <Payments />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/payments/make" element={
          <ProtectedRoute allowedRoles={['tenant']}>
            <Layout>
              <MakePayment />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/payments/history" element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <PaymentHistory />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Maintenance Routes */}
        <Route path="/maintenance" element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <Maintenance />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/maintenance/create" element={
          <ProtectedRoute allowedRoles={['tenant', ...ownerManagerRoles]}>
            <Layout>
              <CreateTicket />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/maintenance/:id" element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <TicketDetails />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Reports Routes (Admin/Owner/Manager only) */}
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={ownerManagerRoles}>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Profile & Settings */}
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } />

        {/* 404 Page */}
        <Route path="*" element={
          user ? (
            <Layout>
              <NotFound />
            </Layout>
          ) : (
            <NotFound />
          )
        } />
      </Routes>
    </>
  );
}

// Main App Component
function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Perform any initialization here
    const initializeApp = async () => {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('access_token');
        if (token) {
          // Validate token or refresh if needed
          // This would typically call an API endpoint
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Initializing application..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Suspense 
              fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <Loader size="lg" />
                </div>
              }
            >
              <AppRoutes />
            </Suspense>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '16px',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                  style: {
                    background: '#ef4444',
                  },
                },
                loading: {
                  duration: Infinity,
                },
              }}
            />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
