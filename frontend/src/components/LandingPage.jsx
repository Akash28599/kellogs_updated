import React from 'react';
import { FiUpload, FiDownload, FiStar, FiHeart, FiPlay, FiInstagram, FiTwitter, FiFacebook, FiCheck, FiZap as FiPowerLightning } from 'react-icons/fi';
import { GiCook, GiPowerLightning } from 'react-icons/gi';
import './LandingPage.css';

const LandingPage = ({ onStart }) => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content fade-in-up">
            <h1 className="hero-title">
              Turn Your <br />
              <span className="text-red">Mom</span> <br />
              Into a <br />
              <span className="text-gold">SUPERHERO</span>
            </h1>
            
            <p className="hero-subtitle">
              Celebrate Nigerian moms with AI-powered superhero transformations.
              <br />
              <strong>Upload. Transform. Download.</strong> It's that simple!
            </p>
            
            <button className="btn btn-primary btn-lg pulse-animation" onClick={onStart}>
              <FiPowerLightning className="btn-icon" />
              START CREATING FREE
            </button>
            
            <div className="hero-badges">
              <span className="badge"><FiPlay /> Instant Results</span>
              <span className="badge"><FiHeart /> Made in Nigeria</span>
              <span className="badge"><FiStar /> 100% Free</span>
            </div>
          </div>
          
          <div className="hero-image-container fade-in-left">
            <div className="main-image-wrapper">
<img 
                src="https://images.unsplash.com/photo-1504194921103-f8b80cadd5e4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Nigerian Mom" 
                className="main-hero-image" 
              />
              <div className="floating-badge badge-top-left">
                 <span style={{color: '#D31245', fontWeight: 'bold'}}>NG</span> Proudly <br/> Nigerian
              </div>
              
              <div className="floating-card top-right">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80" alt="Mom & Baby" />
              </div>
              <div className="floating-card bottom-left">
                <img src="https://images.unsplash.com/photo-1505935428862-770b6f24f629?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80" alt="Kids Eating" />
              </div>
              <div className="floating-card bottom-right choco-card">
                <div className="choco-content">
                  <span className="choco-icon">🍫</span>
                  <strong>CHOCOS</strong>
                  <small>Fuel for Champions</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header text-center">
            <h2>How It <span className="text-red">Works</span></h2>
            <p>Transform your mom into a superhero in just 3 simple steps</p>
          </div>
          
          <div className="steps-row">
            <div className="step-card">
              <div className="step-pill red-pill">Chocos Energy!</div>
              <div className="step-number-bg">01</div>
              <div className="step-icon red-bg">
                <FiUpload />
              </div>
              <h3>Upload Photo</h3>
              <p>Choose a clear, front-facing photo of your mother</p>
            </div>
            
            <div className="step-card">
              <div className="step-number-bg">02</div>
              <div className="step-icon gold-bg">
                <FiStar />
              </div>
              <h3>AI Generate</h3>
              <p>Our AI transforms her into a superhero with cape and costume</p>
            </div>
            
            <div className="step-card">
              <div className="step-pill brown-pill">Delicious Chocos</div>
              <div className="step-number-bg">03</div>
              <div className="step-icon brown-bg">
                <FiDownload />
              </div>
              <h3>Download & Share</h3>
              <p>Get your high-quality superhero image instantly</p>
            </div>
          </div>
          
          <div className="text-center mt-xl">
            <button className="btn btn-secondary btn-lg" onClick={onStart}>
              <FiStar className="btn-icon" />
              GET STARTED FREE
            </button>
          </div>
        </div>
      </section>

      {/* Powered By Section */}
      <section className="powered-by">
        <div className="container">
          <div className="section-header text-center">
            <h2>Powered by <span className="text-red">Kellogg's</span></h2>
            <p>The same energy that fuels your family's breakfast now brings you AI-powered fun!</p>
          </div>
          
          <div className="powered-grid">
            <div className="pill-badge top-center">Kellogg's Chocos 🥣</div>
            <div className="pill-badge right-float">Chocos Yum!</div>
            
            <div className="powered-image left">
              <img src="https://images.unsplash.com/photo-1524222717473-730000096953?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Cereal Bowl" />
              <div className="floating-badge badge-yellow">Fuel Your Day!</div>
            </div>
            <div className="powered-image right">
              <img src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Mom Baking" />
              <div className="floating-badge badge-red">Super Moms!</div>
            </div>
          </div>
          
          <div className="features-row">
            <div className="feature-item">
              <FiPowerLightning className="feature-icon text-red" />
              <h3>Instant</h3>
              <p>AI Generation</p>
            </div>
            <div className="feature-item">
              <GiCook className="feature-icon text-gold" />
              <h3>100%</h3>
              <p>Fun & Creative</p>
            </div>
            <div className="feature-item">
              <FiHeart className="feature-icon text-red" />
              <h3>Made with</h3>
              <p>Love for Moms</p>
            </div>
          </div>
        </div>
      </section>

      {/* Celebration Section */}
      <section className="celebration-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="text-white">Celebrating <span className="text-gold">Nigerian Moms</span></h2>
            <p className="text-white-dim">Every mom is a superhero in her own right. Now you can show her just how powerful she is!</p>
          </div>
          
          <div className="celebration-grid">
            <div className="celebration-card">
              <img src="https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" alt="Family Love" />
              <div className="card-overlay">
                <div className="card-heart"><FiHeart fill="white" /></div>
                <h3>Family Love</h3>
                <p>Celebrate the bond between mothers and children</p>
              </div>
            </div>
            
            <div className="celebration-card">
              <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" alt="Strength" />
              <div className="card-overlay">
                <div className="card-heart"><FiHeart fill="white" /></div>
                <h3>Strength & Grace</h3>
                <p>Honor the everyday superheroes in our lives</p>
              </div>
            </div>
            
            <div className="celebration-card">
              <img src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" alt="Pride" />
              <div className="card-overlay">
                <div className="card-heart"><FiHeart fill="white" /></div>
                <h3>Nigerian Pride</h3>
                <p>Proudly showcasing our beautiful Nigerian mothers</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-xl">
            <button className="btn btn-white btn-lg" onClick={onStart}>
              <FiPowerLightning className="btn-icon" />
              TRANSFORM YOUR MOM NOW
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-landing">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">Kellogg's</div>
              <p>Celebrate the everyday superhero in your life. Transform your mom's photo into amazing superhero art with our AI-powered platform.</p>
              <div className="footer-badge">
                <FiHeart fill="#FFB81C" /> Made with love for all the super moms
              </div>
            </div>
            
            <div className="footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#">How It Works</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
            
            <div className="footer-contact">
              <h4>Contact Us</h4>
              <ul>
                <li>support@kelloggs.com</li>
                <li>www.kelloggs.com.ng</li>
              </ul>
              <div className="social-icons">
                <a href="#"><FiFacebook /></a>
                <a href="#"><FiInstagram /></a>
                <a href="#"><FiTwitter /></a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2026 Kellogg Company. All rights reserved.</p>
            <p className="made-in">NG Made in Nigeria • Powered by AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
