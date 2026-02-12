import React, { useState } from 'react';
import { FiArrowLeft, FiLock, FiMail } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';
import './LoginPage.css';

const LoginPage = ({ onBack, onLogin }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      onLogin(email);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <button className="back-btn" onClick={onBack}>
          <FiArrowLeft /> Back
        </button>
        <div className="login-logo text-red">Kellogg's</div>
      </header>

      <div className="login-container">
        <motion.div 
          className="login-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="avatar-icon">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
          </div>
          
          <h1>Welcome Back!</h1>
          <p className="subtitle">Sign in to create your Super Mom</p>

          <div className="auth-tabs">
            <button className="tab active">Email</button>
            <button className="tab">Google</button>
            <button className="tab">Phone</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input 
                  type="email" 
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn-login">
              CONTINUE
            </button>
          </form>

          <div className="secure-badge">
            <FiLock /> Your data is safe & secure
          </div>
        </motion.div>

        <p className="login-footer">Don't have an account? Sign up is automatic!</p>
      </div>
    </div>
  );
};

export default LoginPage;
