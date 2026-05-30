import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';

interface OtpVerificationProps {
  email: string;
  onVerify: () => void;
  onBack: () => void;
}

export const OtpVerification: React.FC<OtpVerificationProps> = ({
  email,
  onVerify,
  onBack,
}) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState(45);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const id = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [timer]);

  // Handle single digit input
  const handleChange = (index: number, value: string) => {
    // Only allow single numbers
    if (value && !/^\d+$/.test(value)) return;

    const newDigits = [...digits];
    // Keep only the last character entered
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError('');

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace or left/right arrow navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Clear previous input and focus it
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    }
  };

  // Handle pasting code (e.g. 123456)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const chars = pastedData.split('');
      setDigits(chars);
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = () => {
    setIsResending(true);
    setError('');
    // Simulate API call to resend OTP
    setTimeout(() => {
      setIsResending(false);
      setTimer(45);
      setResendStatus('A new code has been sent successfully!');
      setTimeout(() => setResendStatus(''), 4000);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join('');
    
    if (otp.length < 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    // Simulate OTP verification delay
    setTimeout(() => {
      setIsVerifying(false);
      if (otp === '123456') {
        onVerify();
      } else {
        setError('Invalid verification code. Please check your email.');
      }
    }, 1200);
  };

  return (
    <div className="otp-verification-card">
      <button type="button" className="otp-back-btn" onClick={onBack}>
        <ArrowLeft size={16} /> Back to details
      </button>

      <div className="otp-header">
        <div className="otp-icon-wrapper">
          <Mail size={24} className="otp-icon" />
        </div>
        <h2>Verify your email</h2>
        <p>We sent a 6-digit confirmation code to</p>
        <span className="otp-target-email">{email}</span>
      </div>

      <form onSubmit={handleSubmit} className="otp-form">
        <div className="otp-inputs-grid">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el as HTMLInputElement; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className={`otp-digit-input ${error ? 'has-error' : ''}`}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              autoFocus={idx === 0}
            />
          ))}
        </div>

        {error && (
          <div className="otp-error-message">
            <ShieldAlert size={14} />
            <span>{error}</span>
          </div>
        )}

        {resendStatus && (
          <div className="otp-success-message">
            <CheckCircle2 size={14} />
            <span>{resendStatus}</span>
          </div>
        )}

        <div className="otp-test-helper">
          💡 For testing, use the mock code: <strong>123456</strong>
        </div>

        <button 
          type="submit" 
          className="otp-submit-btn"
          disabled={isVerifying || digits.join('').length < 6}
        >
          {isVerifying ? 'Verifying Code...' : 'Confirm Verification'}
        </button>

        <div className="otp-resend-container">
          {timer > 0 ? (
            <span className="otp-timer-text">Resend verification code in <strong>{timer}s</strong></span>
          ) : (
            <button 
              type="button" 
              className="otp-resend-link" 
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                'Resend code'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default OtpVerification;
