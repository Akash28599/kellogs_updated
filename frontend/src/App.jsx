import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiDownload, FiRefreshCw, FiCheck, FiHeart, FiZap, FiArrowLeft, FiShare2, FiX, FiPhone, FiMail, FiDollarSign, FiAlertCircle, FiEye, FiTool, FiSearch, FiVolume2, FiSun, FiHome, FiActivity } from 'react-icons/fi';
import { GiCook, GiAlarmClock, GiJuggler, GiBookCover, GiNightSleep } from 'react-icons/gi';
import axios from 'axios';
import './App.css';
import './Wizard.css';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';

const API_URL = 'http://localhost:5000';

// Theme icon mapping
const themeIcons = {
  'captain-early-riser': GiAlarmClock,
  'the-cheerleader-in-chief': FiZap,
  'the-disciplinarian': FiAlertCircle,
  'the-dreamer': GiNightSleep,
  'the-economizer': FiDollarSign,
  'the-emotional-responder': FiHeart,
  'the-fashion-police-': FiEye,
  'the-fix-it-fairy': FiTool,
  'the-human-alarm': GiAlarmClock,
  'the-lie-detector': FiSearch,
  'the-never-rest': FiRefreshCw,
  'the-noise-rader': FiVolume2,
  'the-nourisher-': GiCook,
  'the-prayer-warrior-': FiSun,
  'the-prophet': FiActivity,
  'the-safe-place': FiHome,
  'the-silent-sacrificer': FiHeart,
  // Fallbacks
  'time-champion': GiAlarmClock,
  'multi-tasker': GiJuggler,
  'masterchef': GiCook,
  'homework-hero': GiBookCover,
  'bedtime-guardian': GiNightSleep
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: 'white' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [resultBlobUrl, setResultBlobUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [viewState, setViewState] = useState('landing');
  const [userEmail, setUserEmail] = useState('');

  // NEW: Write Her Story state
  const [momStory, setMomStory] = useState('');

  // NEW: Share Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePhone, setSharePhone] = useState('');
  const [shareEmail, setShareEmail] = useState('');

  // Navigation
  const handleStartData = () => {
    setViewState('login');
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = (email) => {
    setUserEmail(email);
    setViewState('wizard');
    window.scrollTo(0, 0);
  };

  const handleBackToLanding = () => {
    setViewState('landing');
  };

  const handleGoHome = () => {
    setViewState('landing');
    handleReset();
  };

  // Fetch themes
  const fetchThemes = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/themes`);
      if (response.data.success) {
        setThemes(response.data.themes);
        setError('');
      } else {
        setError('Failed to load themes data.');
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
         setError('Cannot connect to server. Please ensure backend is running on port 5000.');
      } else {
         setError('Failed to load themes. Try refreshing.');
      }
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError('');
    
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setUploadedFile(response.data.file);
      }
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      setUploadedImage(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  });

  // Select theme
  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
    setResultImage(null);
    setError('');
  };

  // Word count helper
  const getWordCount = (text) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  // Generate face swap — called from Step 3 (Write Story) now
  const handleGenerate = async () => {
    if (!selectedTheme || !uploadedFile) {
      setError('Please select a theme and upload an image.');
      return;
    }

    setIsLoading(true);
    setCurrentStep(4); // Loading step
    setLoadingMessage('Preparing your superhero transformation...');
    setError('');

    try {
      setLoadingMessage('Working magic with AI face swap...');
      
      const response = await axios.post(`${API_URL}/api/face-swap`, {
        sourceImage: uploadedFile.path,
        themeId: selectedTheme.id,
        story: momStory // send story along
      }, { timeout: 120000 });

      if (response.data.success) {
        setResultImage(`${API_URL}${response.data.result.imageUrl}`);
        setResultBlobUrl(response.data.result.blobUrl || '');
        setCurrentStep(5); // Result step
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('The grid is busy. Please try again in a moment. (Timeout)');
      } else {
        setError(err.response?.data?.message || 'Face swap failed. Please try again.');
      }
      setCurrentStep(3); // Back to story step on error
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Download result
  const handleDownload = async () => {
    if (!resultImage) return;
    
    try {
      const response = await fetch(resultImage);
      const blob = await response.blob();
      
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `kelloggs-super-mom-${selectedTheme?.id || 'result'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.target = '_blank';
      link.download = `kelloggs-super-mom.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Share handler
  const handleShareSubmit = async () => {
    // Determine which URL to share (prefer public Blob URL, fallback to local)
    const urlToShare = resultBlobUrl || resultImage;

    try {
      // 1. Share via SMS (required)
      await axios.post(`${API_URL}/api/share`, {
        channel: 'phone',
        identifier: sharePhone,
        imageUrl: urlToShare
      });

      // 2. Share via Email (optional)
      if (shareEmail) {
        await axios.post(`${API_URL}/api/share`, {
          channel: 'email',
          identifier: shareEmail,
          imageUrl: urlToShare
        });
      }

      alert(`Shared successfully! Link sent to ${sharePhone}${shareEmail ? ' and ' + shareEmail : ''}`);
      setShowShareModal(false);
      setSharePhone('');
      setShareEmail('');
    } catch (err) {
      console.error('Share error:', err);
      alert('Failed to share. Please try again.');
    }
  };

  // Reset
  const handleReset = () => {
    setSelectedTheme(null);
    setUploadedImage(null);
    setUploadedFile(null);
    setResultImage(null);
    setResultBlobUrl('');
    setError('');
    setCurrentStep(1);
    setIsLoading(false);
    setMomStory('');
    setShowShareModal(false);
  };

  // Conditional Rendering
  if (viewState === 'login') {
    return <LoginPage onBack={handleBackToLanding} onLogin={handleLoginSuccess} />;
  }

  if (viewState === 'landing') {
    return (
      <div className="app" style={{ background: 'transparent' }}>
        <main className="main" style={{ width: '100%', height: '100%' }}>
          <LandingPage onStart={handleStartData} />
        </main>
      </div>
    );
  }

  // WIZARD VIEW
  // Updated: 5 steps now
  const stepLabels = ['Upload Photo', 'Select Theme', 'Write Her Story', 'Generating', 'Result'];
  
  // Handle back navigation per step
  const handleBack = () => {
    if (currentStep === 1) {
      handleGoHome();
    } else if (currentStep <= 3) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="app-wizard">
      {/* ---- Wizard Header ---- */}
      <header className="wizard-header">
        <button className="wizard-back-btn" onClick={handleBack}>
          <FiArrowLeft /> Back
        </button>
        <div className="kelloggs-logo">Kellogg's</div>
        <div className="wizard-step-indicator">
          <span className="wizard-step-badge">{currentStep}</span>
          <span>{stepLabels[currentStep - 1]}</span>
          <div className="wizard-user-avatar">
            {uploadedImage ? (
              <img src={uploadedImage} alt="User" />
            ) : (
              <span>👤</span>
            )}
          </div>
        </div>
      </header>

      {/* Floating decorations */}
      <span className="wizard-star" style={{ top: '120px', left: '30px', fontSize: '1.2rem', color: '#FFC700' }}>⭐</span>
      <span className="wizard-star" style={{ bottom: '60px', left: '40px', fontSize: '0.9rem', color: '#4FC3F7' }}>⭐</span>
      <span className="wizard-star" style={{ top: '200px', right: '40px', fontSize: '1.4rem', color: '#FF69B4' }}>★</span>
      <span className="wizard-star" style={{ bottom: '80px', right: '30px', fontSize: '1.1rem', color: '#FFC700' }}>⭐</span>

      <div className="wizard-card">
        <AnimatePresence mode='wait'>
          
          {/* STEP 1: UPLOAD PHOTO */}
          {currentStep === 1 && (
            <motion.div
              key="step1-upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="upload-page-title">Upload Your Mother's Photo</h2>
              <p className="upload-page-subtitle">Choose a clear, front-facing image for best results</p>

              {error && (
                <div style={{ color: '#F60945', marginBottom: '1rem', padding: '12px 16px', background: '#FFF0F3', borderRadius: '12px', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}

              <div 
                {...getRootProps()} 
                className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
              >
                <input {...getInputProps()} />
                {uploadedImage ? (
                  <div className="upload-preview-container">
                    <img 
                      src={uploadedImage} 
                      alt="Preview" 
                    />
                    <p className="upload-change-text">Click to change photo</p>
                  </div>
                ) : (
                  <>
                    <div className="upload-zone-icon">⬆️</div>
                    <h3 className="upload-zone-title">Drag & Drop Your Photo Here</h3>
                    <p className="upload-zone-subtitle">or click to browse from your device</p>
                    <div className="upload-zone-formats">
                      🖼️ JPG, PNG supported
                    </div>
                  </>
                )}
              </div>

              <div className="tips-card">
                <div className="tips-card-title">🖼️ Tips for best results:</div>
                <ul>
                  <li>Use a clear, well-lit photo</li>
                  <li>Face should be visible and front-facing</li>
                  <li>Higher resolution images work better</li>
                  <li>Avoid group photos or busy backgrounds</li>
                </ul>
              </div>

              {uploadedFile && (
                <div style={{ marginTop: '28px' }}>
                  <button 
                    className="btn-kelloggs"
                    onClick={() => setCurrentStep(2)}
                  >
                    Next: Select Theme <FiCheck />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: SELECT THEME */}
          {currentStep === 2 && (
            <motion.div
              key="step2-theme"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="upload-page-title">Choose Your <span className="title-red">Superhero Persona</span></h2>
              <p className="upload-page-subtitle">Select the superpower that best describes your mom</p>
              
              {error && (
                <div style={{ color: '#F60945', marginBottom: '1rem', padding: '12px 16px', background: '#FFF0F3', borderRadius: '12px', fontSize: '0.9rem' }}>
                  {error} <br/>
                  <button onClick={fetchThemes} style={{ marginTop: '0.5rem', textDecoration: 'underline', border: 'none', background: 'transparent', cursor: 'pointer', color: '#F60945' }}>Retry</button>
                </div>
              )}

              {themes.length === 0 && !error && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                  <p>Loading themes...</p>
                </div>
              )}

              <div className="theme-grid">
                {themes.map((theme) => {
                  const IconComponent = themeIcons[theme.id] || GiAlarmClock;
                  return (
                    <div 
                      key={theme.id}
                      className={`theme-option ${selectedTheme?.id === theme.id ? 'selected' : ''}`}
                      onClick={() => handleThemeSelect(theme)}
                    >
                      <IconComponent className="theme-icon-lg" />
                      <h3 style={{ marginBottom: '0.5rem', fontWeight: '800', fontFamily: 'Poppins, sans-serif' }}>{theme.title}</h3>
                      <p style={{ fontSize: '0.88rem', color: '#888' }}>{theme.subtitle}</p>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn-kelloggs secondary" onClick={() => setCurrentStep(1)}>
                  <FiArrowLeft /> Back
                </button>
                <button 
                  className="btn-kelloggs"
                  disabled={!selectedTheme}
                  onClick={() => setCurrentStep(3)}
                >
                  Next: Write Her Story <FiCheck />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: WRITE HER STORY (NEW) */}
          {currentStep === 3 && (
            <motion.div
              key="step3-story"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="story-step">
                <div className="story-icon">✨</div>
                <h2 className="upload-page-title">Tell Us About <span className="title-red">Your Mom</span></h2>
                <p className="upload-page-subtitle">Share what makes her special in 150 words or less</p>

                {error && (
                  <div style={{ color: '#F60945', marginBottom: '1rem', padding: '12px 16px', background: '#FFF0F3', borderRadius: '12px', fontSize: '0.9rem' }}>
                    {error}
                  </div>
                )}

                <div className="story-textarea-wrapper">
                  <textarea
                    className="story-textarea"
                    placeholder="Write about your mom... What makes her special? Share her superpowers, her love, her sacrifices, or a favorite memory. Let the world know why she's your hero!"
                    value={momStory}
                    onChange={(e) => {
                      const words = e.target.value.trim().split(/\s+/);
                      if (e.target.value.trim() === '' || words.length <= 150) {
                        setMomStory(e.target.value);
                      }
                    }}
                    rows={6}
                  />
                  <div className="story-word-count">
                    {getWordCount(momStory)} / 150 words
                  </div>
                </div>

                <p className="story-helper-text">
                  ✏️ {getWordCount(momStory) === 0 ? 'Start writing to see your word count' : `${getWordCount(momStory)} word${getWordCount(momStory) !== 1 ? 's' : ''} written`}
                </p>

                {/* Writing Tips */}
                <div className="writing-tips-card">
                  <div className="writing-tips-title">💡 Writing Tips</div>
                  <ul>
                    <li>Share a <strong>special memory</strong> or moment that shows her love</li>
                    <li>Describe her unique <strong>superpowers</strong> (cooking, advice, humor, etc.)</li>
                    <li>Express what she <strong>means to you</strong> and your family</li>
                    <li>Keep it heartfelt and genuine - <strong>authenticity matters!</strong></li>
                  </ul>
                </div>

                <div style={{ marginTop: '28px', textAlign: 'center' }}>
                  <button 
                    className="btn-kelloggs"
                    disabled={getWordCount(momStory) < 1}
                    onClick={handleGenerate}
                  >
                    Continue to Generate <FiZap />
                  </button>
                  {getWordCount(momStory) < 1 && (
                    <p style={{ color: '#F60945', fontSize: '0.85rem', marginTop: '8px' }}>
                      Please write at least 1 word to continue
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: LOADING / GENERATING */}
          {currentStep === 4 && (
            <motion.div
              key="step4-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ position: 'fixed', inset: 0, zIndex: 100 }}
            >
              <div className="loading-view">
                <div className="loading-header">
                  <div className="kelloggs-logo">Kellogg's</div>
                </div>

                <span className="loading-sparkle" style={{ top: '15%', left: '12%', fontSize: '1.2rem', color: '#FFC700' }}>✦</span>
                <span className="loading-sparkle" style={{ top: '25%', right: '15%', fontSize: '1.5rem', color: '#FFD700', animationDelay: '1s' }}>✦</span>
                <span className="loading-sparkle" style={{ bottom: '20%', left: '8%', fontSize: '1rem', color: '#FFC700', animationDelay: '2s' }}>✦</span>
                <span className="loading-sparkle" style={{ bottom: '15%', right: '10%', fontSize: '1.3rem', color: '#FFD700', animationDelay: '0.5s' }}>✦</span>

                <div className="loading-wrapper">
                  <div className="loading-card">
                    <div className="loading-icon">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        style={{ display: 'inline-block' }}
                      >
                        ✦
                      </motion.span>
                    </div>

                    <h2 className="loading-title">Creating Your Super Mom</h2>
                    <p className="loading-subtitle">💪 {loadingMessage || 'Adding super strength'}</p>

                    <div className="loading-progress-row">
                      <span className="loading-progress-label">Progress</span>
                    </div>
                    <div className="loading-progress-bar">
                      <motion.div 
                        className="loading-progress-fill"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3.5 }}
                      />
                    </div>

                    {selectedTheme && (
                      <div className="loading-theme-card">
                        <div className="loading-theme-title">{selectedTheme.title}</div>
                        <div className="loading-theme-subtitle">{selectedTheme.subtitle}</div>
                      </div>
                    )}

                    <div className="loading-dots">
                      <span className="loading-dot"></span>
                      <span className="loading-dot"></span>
                      <span className="loading-dot active"></span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: RESULT */}
          {currentStep === 5 && resultImage && (
            <motion.div
              key="step5-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="result-page">
                <h2 className="result-title">Meet Your <span className="title-red">Super Mom</span>!</h2>
                <p className="result-subtitle">Here's your AI-generated superhero transformation</p>

                {/* Theme info banner */}
                {selectedTheme && (
                  <div className="result-theme-banner">
                    <div className="result-theme-icon">
                      {(() => {
                        const IconComponent = themeIcons[selectedTheme.id] || GiAlarmClock;
                        return <IconComponent size={28} color="#F60945" />;
                      })()}
                    </div>
                    <div className="result-theme-name">{selectedTheme.title}</div>
                    <div className="result-theme-desc">{selectedTheme.subtitle}</div>
                  </div>
                )}

                {/* Side-by-side photos */}
                <div className="result-photos">
                  <div className="result-photo-card">
                    <div className="result-photo-label original">Original Photo</div>
                    <img src={uploadedImage} alt="Original" />
                  </div>
                  <div className="result-photo-card">
                    <div className="result-photo-label ai-generated">AI - Generated</div>
                    <img src={resultImage} alt="Superhero Result" />
                  </div>
                </div>

                {/* Buttons */}
                <div className="result-buttons">
                  <button className="result-btn primary" onClick={handleDownload}>
                    <FiDownload size={14} /> DOWNLOAD IMAGE
                  </button>
                  <button className="result-btn" onClick={() => setShowShareModal(true)}>
                    <FiShare2 size={14} /> SHARE
                  </button>
                  <button className="result-btn" onClick={handleReset}>
                    <FiRefreshCw size={14} /> TRY ANOTHER PHOTO
                  </button>
                </div>

                {/* Superhero Features */}
                <div className="result-features">
                  <h3 className="result-features-title">Superhero Features Added</h3>
                  <div className="result-features-grid">
                    <div className="result-feature-item">
                      <div className="result-feature-icon">🦸</div>
                      <div className="result-feature-name">Hero Costume</div>
                      <div className="result-feature-desc">Bold colors and iconic superhero outfit</div>
                    </div>
                    <div className="result-feature-item">
                      <div className="result-feature-icon">💪</div>
                      <div className="result-feature-name">Dynamic Pose</div>
                      <div className="result-feature-desc">Confident, powerful superhero stance</div>
                    </div>
                    <div className="result-feature-item">
                      <div className="result-feature-icon">✨</div>
                      <div className="result-feature-name">Cape & Details</div>
                      <div className="result-feature-desc">Flowing cape and heroic accessories</div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="result-cta">
                  <h3 className="result-cta-title">Love the result? Create more!</h3>
                  <p className="result-cta-desc">Transform more photos and share the superhero magic with family</p>
                  <button className="result-cta-btn" onClick={handleReset}>
                    CREATE ANOTHER SUPER MOM
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ===== SHARE MODAL ===== */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            className="share-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              className="share-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="share-modal-close" onClick={() => setShowShareModal(false)}>
                <FiX size={20} />
              </button>

              <div className="share-modal-icon">🔗</div>
              <h3 className="share-modal-title">Share Your Image</h3>
              <p className="share-modal-subtitle">Please provide your phone number to continue</p>

              <div className="share-form">
                <div className="share-input-group">
                  <label><FiPhone size={14} /> Phone Number <span style={{ color: '#F60945' }}>*</span></label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={sharePhone}
                    onChange={(e) => setSharePhone(e.target.value)}
                    required
                  />
                </div>

                <div className="share-input-group">
                  <label><FiMail size={14} /> Email Address <span style={{ color: '#888', fontWeight: 400 }}>(Optional)</span></label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                  />
                </div>

                <button 
                  className="share-submit-btn"
                  onClick={handleShareSubmit}
                  disabled={!sharePhone}
                >
                  Get Share Link via SMS/Email
                </button>

                <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '10px' }}>Or share directly:</p>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Check out my Kellogg's Super Mom transformation! ${resultBlobUrl || resultImage}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="share-submit-btn"
                      style={{ background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}
                    >
                      Share on WhatsApp
                    </a>
                </div>

                <p className="share-disclaimer">
                  🔒 Your information is safe and will only be used for this service
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="wizard-footer">
        <p>Made with ❤️ for Mother's Day • Kellogg's {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
