import React, { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../context/AuthContext';
import { GoogleAuthModal } from '../components/auth/GoogleAuthModal';
import { OtpVerification } from '../components/auth/OtpVerification';
import '../styles/auth.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Google Auth & OTP states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingRole, setPendingRole] = useState<Role>('student');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    // Simulate initial credentials check
    setTimeout(() => {
      setIsLoading(false);
      
      // Determine role automatically based on email
      const determinedRole: Role = email === 'admin@vins.in' ? 'admin' : 'student';

      // Transition to OTP verification screen
      setPendingEmail(email);
      setPendingRole(determinedRole);
      setShowOtp(true);
    }, 800);
  };

  const handleOtpVerifySuccess = async () => {
    setIsLoading(true);
    try {
      await login(pendingEmail);
      navigate({ to: pendingRole === 'admin' ? '/admin' : '/faq' });
    } catch (_err) {
      setError('Failed to authenticate');
      setShowOtp(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSelectAccount = async (googleEmail: string, _googleName: string) => {
    setIsLoading(true);
    try {
      // Hardcode admin role if logging in with the admin email
      const targetRole = googleEmail === 'admin@vins.in' ? 'admin' : 'student';
      await login(googleEmail);
      
      // Update name inside auth context if it's a new google user name
      // (AuthContext mockup handles basic split)
      navigate({ to: targetRole === 'admin' ? '/admin' : '/faq' });
    } catch (_err) {
      setError('Google Sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {showOtp ? (
          <OtpVerification
            email={pendingEmail}
            onVerify={handleOtpVerifySuccess}
            onBack={() => setShowOtp(false)}
          />
        ) : (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Sign in to your account to continue</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input 
                  id="email"
                  type="email" 
                  className="form-input" 
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <div className="form-actions">
                  <label className="form-label" htmlFor="password">Password</label>
                  <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                </div>
                <input 
                  id="password"
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <div className="form-error">{error}</div>}

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? 'Checking credentials...' : 'Sign In'}
              </button>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="google-auth-btn"
                onClick={() => setShowGoogleModal(true)}
                disabled={isLoading}
              >
                <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </form>

            <div className="auth-footer">
              Don't have an account? 
              <Link to="/signup">Sign up</Link>
            </div>
          </>
        )}
      </div>

      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSelectAccount={handleGoogleSelectAccount}
      />
    </div>
  );
};

export default LoginPage;
