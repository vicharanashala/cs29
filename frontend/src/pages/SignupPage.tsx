import React, { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthModal } from '../components/auth/GoogleAuthModal';
import { OtpVerification } from '../components/auth/OtpVerification';
import '../styles/auth.css';

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Google Auth & OTP states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingCv, setPendingCv] = useState('');

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCvFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    // Simulate API request/check
    setTimeout(() => {
      setIsLoading(false);
      setPendingName(name);
      setPendingEmail(email);
      setPendingCv(cvFileName);
      setShowOtp(true);
    }, 800);
  };

  const handleOtpVerifySuccess = async () => {
    setIsLoading(true);
    try {
      await signup(pendingName, pendingEmail, 'student', pendingCv);
      navigate({ to: '/faq' });
    } catch (_err) {
      setError('Failed to create account');
      setShowOtp(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSelectAccount = async (googleEmail: string, googleName: string) => {
    setIsLoading(true);
    try {
      await signup(googleName, googleEmail, 'student');
      navigate({ to: '/faq' });
    } catch (_err) {
      setError('Google Registration failed');
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
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Join the Vicharanashala community</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>

              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name *</label>
                <input 
                  id="name"
                  type="text" 
                  className="form-input" 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address *</label>
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
                <label className="form-label" htmlFor="password">Password *</label>
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

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password *</label>
                <input 
                  id="confirmPassword"
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cv">Upload CV (Optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    id="cv"
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label 
                    htmlFor="cv" 
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'background 0.2s',
                      display: 'inline-block'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  >
                    Choose File
                  </label>
                  {cvFileName && <span style={{ fontSize: '12px', color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{cvFileName}</span>}
                </div>
              </div>

              {error && <div className="form-error">{error}</div>}

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? 'Processing registration...' : 'Sign Up'}
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
              Already have an account? 
              <Link to="/login">Sign in</Link>
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

export default SignupPage;
