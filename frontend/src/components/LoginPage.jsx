import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiLock, FiMail, FiPhone, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './LoginPage.css';
import kelloggsLogo from '../assets/kelloggs-logo.png';

const API_URL = 'http://localhost:5000';

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const LoginPage = ({ onBack, onLogin }) => {
  const [activeTab, setActiveTab] = useState('phone');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('identifier');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load Google Identity Services script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);
  
  // WebOTP API for Automatic SMS Detection
  useEffect(() => {
    if ('OTPCredential' in window && step === 'otp') {
      const ac = new AbortController();
      
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: ac.signal
      }).then(otp => {
        setOtp(otp.code);
        // Optional: Auto-submit if we're confident
        // onLogin(identifier); 
      }).catch(err => {
        // Silently fail for unsupported devices (Desktop/iOS)
        if (err.name !== 'InvalidStateError') {
             console.debug('WebOTP Auto-read skipped:', err.message);
        }
      });
      
      return () => {
        ac.abort();
      };
    }
  }, [step]);

  const handleGoogleLogin = () => {
    if (!window.google || !GOOGLE_CLIENT_ID) {
      setError('Google Sign-In is not configured yet. Please use Email or Phone login.');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCallback,
    });

    window.google.accounts.id.prompt();
  };

  const handleGoogleCallback = async (response) => {
    if (response.credential) {
      setLoading(true);
      setError('');
      try {
        const res = await axios.post(`${API_URL}/api/auth/google`, {
          credential: response.credential
        });
        if (res.data.success) {
          onLogin(res.data.email || 'google-user');
        } else {
          setError(res.data.message || 'Google login failed');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Google login failed. Try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!identifier) return;

    setLoading(true);
    setError('');

    try {
      if (activeTab === 'email' && !identifier.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }
      if (activeTab === 'phone' && identifier.length < 8) {
        throw new Error('Please enter a valid phone number.');
      }

      const response = await axios.post(`${API_URL}/api/auth/send-otp`, {
        channel: activeTab,
        identifier: identifier
      });

      if (response.data.success) {
        // Dev Mode Helper: Show OTP immediately
        if (response.data.debugOtp) {
             console.log("🐛 DEBUG OTP:", response.data.debugOtp);
             alert(`DEBUG MODE: Your OTP is ${response.data.debugOtp}`);
        }
        setStep('otp');
      } else {
        setError(response.data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        identifier: identifier,
        otp: otp
      });

      if (response.data.success) {
        onLogin(identifier);
      } else {
        setError(response.data.message || 'Invalid OTP.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIdentifier('');
    setOtp('');
    setStep('identifier');
    setError('');
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <button className="back-btn" onClick={onBack}>
          <FiArrowLeft /> Back
        </button>
        <img src={kelloggsLogo} alt="Kellogg's" className="login-logo" />
      </header>

      <div className="login-container">
        <AnimatePresence mode='wait'>
          <motion.div 
            key={step}
            className="login-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="avatar-icon">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
            </div>
            
            <h1>{step === 'identifier' ? 'Welcome Back!' : 'Verify Code'}</h1>
            <p className="subtitle">
              {step === 'identifier' 
                ? <>Sign in to create your <span>Super Mom</span></>
                : <>We sent a code to <span>{identifier}</span></>}
            </p>



            {error && (
              <div className="error-message" style={{ color: '#F60945', background: '#FFF0F3', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            {step === 'identifier' ? (
              <>
                <form onSubmit={handleSendOtp}>
                  <div className="input-group">
                    <label>{activeTab === 'email' ? 'Email Address' : 'Phone Number'}</label>
                    <div className="input-wrapper">
                      {activeTab === 'email' ? <FiMail className="input-icon" /> : <FiPhone className="input-icon" />}
                      <input 
                        type={activeTab === 'email' ? "email" : "tel"} 
                        placeholder={activeTab === 'email' ? "your.email@example.com" : "e.g. +234 800 000 0000"}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required 
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-login" disabled={loading}>
                    {loading ? 'SENDING...' : 'SEND CODE'}
                  </button>
                </form>

                {/* Google Sign-In Button */}
                <button className="btn-google" onClick={handleGoogleLogin} disabled={loading} style={{ marginTop: '1rem' }}>
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Switch to Email/Phone Link */}
                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                    <span>{activeTab === 'phone' ? 'Prefer email?' : 'Prefer phone?'} </span>
                    <button 
                        onClick={() => handleTabChange(activeTab === 'phone' ? 'email' : 'phone')}
                        style={{ background: 'none', border: 'none', color: '#F60945', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                    >
                        {activeTab === 'phone' ? 'Login with Email' : 'Login with Phone'}
                    </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="input-group">
                  <label>Verification Code</label>
                  <div className="input-wrapper">
                    <FiLock className="input-icon" />
                    <input 
                      type="text" 
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required 
                      disabled={loading}
                      style={{ letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 'bold' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-login" disabled={loading}>
                  {loading ? 'VERIFYING...' : 'VERIFY & LOGIN'}
                </button>

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                   <button 
                    type="button" 
                    onClick={() => setStep('identifier')}
                    style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
                   >
                     Wrong {activeTab}? Change it
                   </button>
                   <br/>
                   <button 
                    type="button" 
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', color: '#F60945', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 'bold', marginTop: '8px' }}
                   >
                     Resend Code <FiRefreshCw style={{ display: 'inline', marginLeft: '4px' }}/>
                   </button>
                </div>
              </form>
            )}

            <div className="secure-badge">
              <FiLock style={{ marginRight: '6px' }} /> Your data is safe & secure
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="login-footer">Don't have an account? Sign up is automatic!</p>
      </div>
    </div>
  );
};

export default LoginPage;
