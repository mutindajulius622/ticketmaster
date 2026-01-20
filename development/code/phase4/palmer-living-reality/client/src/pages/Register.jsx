import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const validationSchema = Yup.object({
    username: Yup.string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be less than 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .required('Username is required'),
    email: Yup.string()
      .email('Invalid email format')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[0-9]/, 'Password must contain at least one number')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Please confirm your password'),
    role: Yup.string()
      .oneOf(['tenant', 'owner', 'admin'], 'Please select a role')
      .required('Please select a role'),
    phone: Yup.string()
      .matches(/^[0-9+\-\s]+$/, 'Invalid phone number format')
      .optional()
  });

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    const { confirmPassword, ...userData } = values;
    
    const result = await register(userData);
    
    if (result.success) {
      if (values.role === 'tenant') {
        navigate('/dashboard?message=verification-pending');
      } else if (values.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      setErrors({ form: result.error });
    }
    setSubmitting(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '450px' }}>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join Palmer Living Reality today</p>

        <Formik
          initialValues={{ 
            username: '', 
            email: '', 
            password: '', 
            confirmPassword: '',
            role: 'tenant',
            phone: ''
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, values }) => (
            <Form>
              {errors.form && (
                <div className="alert alert-error">{errors.form}</div>
              )}

              <div className="form-group">
                <label htmlFor="role" className="form-label">I am a *</label>
                <Field as="select" name="role" id="role" className="form-select">
                  <option value="tenant">Tenant (Looking to rent)</option>
                  <option value="owner">Property Owner (List properties)</option>
                  <option value="admin">Administrator (System management)</option>
                </Field>
                <ErrorMessage name="role" component="div" className="form-error" />
              </div>

              <div className="form-group">
                <label htmlFor="username" className="form-label">Username *</label>
                <Field 
                  type="text" 
                  name="username" 
                  id="username"
                  className={`form-input ${errors.username ? 'error' : ''}`}
                  placeholder="Choose a username"
                />
                <ErrorMessage name="username" component="div" className="form-error" />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address *</label>
                <Field 
                  type="email" 
                  name="email" 
                  id="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="your@email.com"
                />
                <ErrorMessage name="email" component="div" className="form-error" />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">Phone Number</label>
                <Field 
                  type="tel" 
                  name="phone" 
                  id="phone"
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="+1 234 567 8900"
                />
                <ErrorMessage name="phone" component="div" className="form-error" />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password *</label>
                <Field 
                  type="password" 
                  name="password" 
                  id="password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Create a strong password"
                />
                <ErrorMessage name="password" component="div" className="form-error" />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  Must be at least 6 characters with uppercase, lowercase, and number
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
                <Field 
                  type="password" 
                  name="confirmPassword" 
                  id="confirmPassword"
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm your password"
                />
                <ErrorMessage name="confirmPassword" component="div" className="form-error" />
              </div>

              {values.role === 'tenant' && (
                <div className="alert alert-info">
                  <strong>Note:</strong> As a tenant, your account will require admin verification 
                  before you can apply for rental properties.
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary btn-lg" 
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </Form>
          )}
        </Formik>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

