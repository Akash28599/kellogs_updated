import React from 'react';
import './LandingPage.css';
import heroImage from '../assets/hero-replacement.png';

const LandingPage = ({ onStart }) => {
  return (
    <div className="landing-page">

      {/* ============ NAVBAR ============ */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">Kellogg's</div>
        <button className="landing-nav-btn" onClick={onStart}>
          Get Started
        </button>
      </nav>

      {/* ============ HERO SECTION ============ */}
      <section className="landing-hero">
        {/* Floating Star Decorations */}
        <span className="star-decoration star-1">⭐</span>
        <span className="star-decoration star-2">⭐</span>
        <span className="star-decoration star-3">✦</span>
        <span className="star-decoration star-4">⭐</span>
        <span className="star-decoration star-5">⭐</span>
        <span className="star-decoration star-6">★</span>

        {/* Hero Content */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-icon">✦</span>
            Powered by AI Technology
          </div>

          <h1 className="hero-title">
            Turn Your Mom Into a
            <span className="hero-title-highlight">Superhero</span>
          </h1>

          <p className="hero-subtitle">
            Celebrate the everyday heroes in our lives. Transform photos into 
            amazing superhero portraits with Kellogg's!
          </p>

          <button className="hero-cta" onClick={onStart}>
            Create Your Superhero Now
            <span className="hero-cta-arrow">→</span>
          </button>
        </div>

        {/* Hero Image Card — shows full body — INSIDE hero section per Figma but rendered below hero text */}
      </section>

      {/* ============ HERO IMAGE CARD (separate from hero, with spacing) ============ */}
      <div className="hero-image-wrapper">
        <div className="hero-image-section">
          <div className="hero-image-card-simple" style={{ width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 16px 50px rgba(0,0,0,0.25)' }}>
            <img
              src={heroImage}
              alt="The Alarm Hero - Superhero Mom"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          {/* Side stars on the card section */}
          <div className="hero-stars">
            <span className="star-left">⭐</span>
            <span className="star-right">★</span>
          </div>
        </div>
      </div>

      {/* ============ HOW TO ENTER ============ */}
      <section className="section-how-to-enter">
        <div className="section-header">
          <h2>How to Enter</h2>
          <p>Follow these steps to join the contest and win!</p>
        </div>

        <div className="how-to-enter-grid">
          {/* 1. Follow Us */}
          <div className="enter-card enter-card-blue">
            <span className="enter-badge">1</span>
            <h3>Follow Us</h3>
            <p>@KellogsNigeria on social media</p>
            <div className="enter-card-icon">📱</div>
          </div>

          {/* 2. Upload Photo */}
          <div className="enter-card enter-card-purple">
            <span className="enter-badge">2</span>
            <h3>Upload Photo</h3>
            <p>Choose your mom's best picture</p>
            <div className="enter-card-icon">📷</div>
          </div>

          {/* 3. Write Her Story */}
          <div className="enter-card enter-card-pink">
            <span className="enter-badge">3</span>
            <h3>Write Her Story</h3>
            <p>Share 150 words about your mom</p>
            <div className="enter-card-icon">✏️</div>
          </div>

          {/* 4. Select Hero */}
          <div className="enter-card enter-card-red">
            <span className="enter-badge">4</span>
            <h3>Select Hero</h3>
            <p>Pick her superhero character</p>
            <div className="enter-card-icon">🦸‍♀️</div>
          </div>

          {/* 5. Share & Tag */}
          <div className="enter-card enter-card-green">
            <span className="enter-badge">5</span>
            <h3>Share & Tag</h3>
            <p>#KelloggsMorningHero</p>
            <div className="enter-card-icon">🏷️</div>
          </div>

          {/* 6. Win Prizes */}
          <div className="enter-card enter-card-gold">
            <span className="enter-badge">6</span>
            <h3>Win Prizes</h3>
            <p>Most engagement wins!</p>
            <div className="enter-card-icon">🏆</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <button className="hero-cta" onClick={onStart}>
            Start Creating Now
            <span className="hero-cta-arrow">→</span>
          </button>
        </div>
      </section>

      {/* ============ READY TO CREATE CTA ============ */}
      <section className="section-cta">
        <span className="cta-star cta-star-1">⭐</span>
        <span className="cta-star cta-star-2">⭐</span>
        <h2>Ready to Create Your Superhero?</h2>
        <p>Join thousands celebrating their everyday heroes with Kellogg's</p>
        <button className="cta-btn" onClick={onStart}>
          Get Started Now
          <span>→</span>
        </button>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="landing-footer">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <div className="footer-brand-logo">Kellogg's</div>
            <p className="footer-brand-desc">
              Celebrate the everyday superhero in your life. Transform your mom's photo into amazing superhero art with our AI-powered platform.
            </p>
            <div className="footer-love">
              💛 Made with love for all the super moms
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4>Contact Us</h4>
            <a href="mailto:support@kelloggs.com" className="footer-contact-email">support@kelloggs.com</a>
            <a href="https://www.kelloggs.com.ng" className="footer-contact-web" target="_blank" rel="noreferrer">www.kelloggs.com.ng</a>
            <div className="footer-follow-label">Follow Us</div>
            <div className="footer-socials">
              <a href="#" className="footer-social-icon" aria-label="Facebook">f</a>
              <a href="#" className="footer-social-icon" aria-label="Instagram">📷</a>
              <a href="#" className="footer-social-icon" aria-label="Twitter">𝕏</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Kellogg's. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
