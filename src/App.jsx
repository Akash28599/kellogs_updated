import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiDownload, FiRefreshCw, FiCheck, FiHeart, FiZap, FiArrowLeft, FiShare2, FiX, FiPhone, FiMail, FiDollarSign, FiAlertCircle, FiEye, FiTool, FiSearch, FiVolume2, FiSun, FiHome, FiActivity, FiCopy, FiCheckCircle } from 'react-icons/fi';
import { GiCook, GiAlarmClock, GiJuggler, GiBookCover, GiNightSleep } from 'react-icons/gi';
import { IoLogoWhatsapp } from 'react-icons/io5';
import axios from 'axios';
import './App.css';
import './Wizard.css';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import kelloggsLogo from './assets/kelloggs-logo.png';

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
  const [momName, setMomName] = useState('');
  const [momAlias, setMomAlias] = useState('');

  // Share Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePhone, setSharePhone] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [shareTab, setShareTab] = useState('whatsapp'); // 'whatsapp' | 'email'
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isFallback, setIsFallback] = useState(false); // Track if fallback template is used

  // Navigation
  const handleStartData = () => {
    setViewState('wizard');
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

  // Generate face swap — called from Step 2 (Select Theme) now
  const handleGenerate = async () => {
    console.log('Generating started...');
    if (!selectedTheme || !uploadedFile || !momName || !momAlias) {
      setError('Please fill in all required fields (Name, Alias, Photo) and select a theme.');
      return;
    }

    setIsLoading(true);
    setCurrentStep(3); // Loading step (Step 3)
    setLoadingMessage('Preparing your superhero transformation...');
    setError('');
    setIsFallback(false);

    try {
      setLoadingMessage('Queuing your superhero transformation...');
      console.log('Sending API request...');
      
      // Step 1: Submit job to queue
      const response = await axios.post(`${API_URL}/api/face-swap`, {
        sourceImage: uploadedFile.path,
        themeId: selectedTheme.id,
        story: momStory,
        momName: momName,
        momAlias: momAlias
      }, { timeout: 15000 });

      console.log('API Response:', response.data);

      if (response.data.success && response.data.jobId) {
        const jobId = response.data.jobId;
        setLoadingMessage('Working magic with AI face swap...');

        // Step 2: Poll for job completion
        const pollInterval = 3000; // 3 seconds
        const maxPolls = 40; // Max 2 minutes
        let polls = 0;

        const pollForResult = () => {
          return new Promise((resolve, reject) => {
            const checkStatus = async () => {
              polls++;
              try {
                const statusRes = await axios.get(`${API_URL}/api/status/${jobId}`);
                const jobData = statusRes.data;

                if (jobData.status === 'completed' && jobData.result) {
                  resolve(jobData.result);
                } else if (jobData.status === 'failed') {
                  reject(new Error(jobData.error || 'Job failed'));
                } else if (polls >= maxPolls) {
                  reject(new Error('Processing timed out'));
                } else {
                  // Update loading message
                  if (polls > 5) setLoadingMessage('Almost there... adding finishing touches...');
                  else if (polls > 2) setLoadingMessage('Creating your superhero card...');
                  setTimeout(checkStatus, pollInterval);
                }
              } catch (err) {
                if (polls >= maxPolls) {
                  reject(err);
                } else {
                  setTimeout(checkStatus, pollInterval);
                }
              }
            };
            checkStatus();
          });
        };

        const result = await pollForResult();
        setResultImage(`${API_URL}${result.imageUrl}`);
        setResultBlobUrl(result.blobUrl || '');
        setCurrentStep(4); // Result step (Step 4)

      } else {
        throw new Error(response.data.message || 'Failed to queue job');
      }
    } catch (err) {
      console.error('Generation Error:', err);
      
      // FALLBACK: Always produce an image (Use Template)
      if (selectedTheme && selectedTheme.templateUrl) {
         console.log('Using template fallback...');
         setResultImage(`${API_URL}${selectedTheme.templateUrl}`);
         setResultBlobUrl(''); 
         setIsFallback(true);
         setCurrentStep(4); // Go to Result
      } else {
         setError('Transformation failed. Please try a different photo.');
         setCurrentStep(2);
      }
    } finally {
      setLoadingMessage('');
      setIsLoading(false);
    }
  };

  // Login Return Handler
  const handleLoginBack = () => {
    // If we have a result, just close login overlay (go back to wizard)
    if (resultImage) {
      setViewState('wizard');
    } else {
      setViewState('landing');
    }
  };

  // Download result
  const handleDownload = async () => {
    if (!resultImage) return;

    // Login check
    if (!userEmail) {
      setViewState('login');
      return;
    }
    
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

  // WhatsApp share handler
  const handleWhatsAppShare = async (withPhone = false) => {
    // Login check
    if (!userEmail) {
      setViewState('login');
      return;
    }

    const urlToShare = resultBlobUrl || resultImage;
    setShareLoading(true);
    setShareSuccess('');

    try {
      const response = await axios.post(`${API_URL}/api/share-whatsapp`, {
        phoneNumber: withPhone ? sharePhone : '',
        imageUrl: urlToShare
      });

      if (response.data.success) {
        // Open WhatsApp link in new tab
        window.open(response.data.whatsappLink, '_blank');
        setShareSuccess('WhatsApp opened! 🎉');
        setTimeout(() => setShareSuccess(''), 3000);
      }
    } catch (err) {
      console.error('WhatsApp share error:', err);
      // Fallback: open wa.me directly
      const msg = encodeURIComponent(`🎉 Check out my Kellogg's Super Mom transformation!\n\n👉 ${urlToShare}\n\n✨ Create yours at kelloggssuperstars.com`);
      const fallbackLink = sharePhone
        ? `https://wa.me/${sharePhone.replace(/[^0-9]/g, '')}?text=${msg}`
        : `https://wa.me/?text=${msg}`;
      window.open(fallbackLink, '_blank');
    } finally {
      setShareLoading(false);
    }
  };

  // Email share handler
  const handleEmailShare = async () => {
    if (!shareEmail) return;
    const urlToShare = resultBlobUrl || resultImage;
    setShareLoading(true);
    setShareSuccess('');

    try {
      const response = await axios.post(`${API_URL}/api/share-email`, {
        email: shareEmail,
        imageUrl: urlToShare,
        themeName: selectedTheme?.title || ''
      });

      if (response.data.success) {
        setShareSuccess(`Sent to ${shareEmail}! 📧`);
        setShareEmail('');
        setTimeout(() => setShareSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Email share error:', err);
      setShareSuccess('Failed to send. Please try again.');
      setTimeout(() => setShareSuccess(''), 3000);
    } finally {
      setShareLoading(false);
    }
  };

  // Copy link handler
  const handleCopyLink = () => {
    const urlToShare = resultBlobUrl || resultImage;
    navigator.clipboard.writeText(urlToShare).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
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
    setMomName('');
    setMomAlias('');
    setShowShareModal(false);
    setShareSuccess('');
    setShareTab('whatsapp');
    setLinkCopied(false);
  };

  // Conditional Rendering
  // WIZARD VIEW
  // Updated: 4 steps now (Combined Upload + Story)
  const stepLabels = ['Upload & Story', 'Select Theme', 'Generating', 'Result'];
  
  // Handle back navigation per step
  const handleBack = () => {
    if (currentStep === 1) {
      handleGoHome();
    } else if (currentStep === 4) {
      setCurrentStep(2); // Back to Theme Selection
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="app-wizard">
      {/* Login Overlay - Preserves State */}
      {viewState === 'login' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#fff' }}>
          <LoginPage onBack={handleLoginBack} onLogin={handleLoginSuccess} />
        </div>
      )}

      {/* Landing Page View */}
      {viewState === 'landing' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#fff', overflowY: 'auto' }}>
           <LandingPage onStart={handleStartData} />
        </div>
      )}
      {/* ---- Wizard Header ---- */}
      <header className="wizard-header">
        <button className="wizard-back-btn" onClick={handleBack}>
          <FiArrowLeft /> Back
        </button>
        <img src={kelloggsLogo} alt="Kellogg's" className="kelloggs-logo" />
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

              <div className="story-section" style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '24px' }}>
                <h3 className="story-title" style={{ fontFamily: 'Poppins', fontWeight: '800', marginBottom: '16px' }}>
                  About Your Mother
                </h3>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#333', marginBottom: '6px' }}>Mother's Name <span style={{ color: '#F60945' }}>*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Mrs. Adebayo"
                      value={momName}
                      onChange={(e) => setMomName(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontFamily: 'Inter', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={(e) => e.target.style.borderColor = '#F60945'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#333', marginBottom: '6px' }}>What do you call her? <span style={{ color: '#F60945' }}>*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Mama, Mummy, Iya"
                      value={momAlias}
                      onChange={(e) => setMomAlias(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontFamily: 'Inter', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={(e) => e.target.style.borderColor = '#F60945'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                </div>

                <h3 className="story-title" style={{ fontFamily: 'Poppins', fontWeight: '800', marginBottom: '12px' }}>
                  Write Her Story <span style={{ fontSize: '0.9rem', fontWeight: '400', color: '#888' }}>(Optional)</span>
                </h3>
                <div className="story-textarea-wrapper">
                  <textarea
                    className="story-textarea"
                    placeholder="What makes your mom a superhero? Share a short message (max 150 words)..."
                    value={momStory}
                    onChange={(e) => {
                      const words = e.target.value.trim().split(/\s+/);
                      if (e.target.value.trim() === '' || words.length <= 150) {
                        setMomStory(e.target.value);
                      }
                    }}
                    rows={4}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', borderColor: '#ddd', fontFamily: 'Inter' }}
                  />
                  <div className="story-word-count" style={{ textAlign: 'right', fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                    {getWordCount(momStory)} / 150 words
                  </div>
                </div>
              </div>

              {uploadedFile && (
                <div style={{ marginTop: '28px' }}>
                  <button 
                    className="btn-kelloggs"
                    onClick={() => {
                        if (!momName.trim() || !momAlias.trim()) {
                            setError('Please enter your mother\'s name and alias.');
                            return;
                        }
                        setError('');
                        setCurrentStep(2);
                    }}
                  >
                    Next: Create Your Super Mom Now <FiCheck />
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
                  onClick={handleGenerate}
                >
                  Create Your Super Mom Now <FiZap />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: LOADING / GENERATING (Renumbered from 4) */}
          {currentStep === 3 && (
            <motion.div
              key="step3-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ position: 'fixed', inset: 0, zIndex: 100 }}
            >
              <div className="loading-view">
                <div className="loading-header">
                  <img src={kelloggsLogo} alt="Kellogg's" className="kelloggs-logo" />
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

          {/* STEP 4: RESULT (Greeting Card) */}
          {currentStep === 4 && resultImage && (
            <motion.div
              key="step4-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="result-page" style={{ maxWidth: '1000px', padding: '0 20px 40px' }}>
                <h2 className="result-title">Here is your <span className="title-red">Kellogg's Card</span>!</h2>
                <p className="result-subtitle">Download or Share this special card with your Super Mom</p>

                {/* Greeting Card Container */}
                {isFallback && (
                  <div style={{ textAlign: 'center', marginBottom: '20px', background: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '8px', border: '1px solid #ffeeba' }}>
                    <strong>⚠️ High Traffic Notice</strong>
                    <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>The AI is currently busy, so we're showing a preview template.</p>
                    <button 
                      onClick={handleGenerate} 
                      style={{ 
                        background: '#F60945', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '8px 16px', 
                        borderRadius: '20px', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginTop: '5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <FiRefreshCw /> Try AI Again
                    </button>
                  </div>
                )}
                <div className="greeting-card-display">
                  <img 
                    src={resultImage} 
                    alt="Super Mom Greeting Card"
                    style={{
                      width: '100%',
                      maxWidth: '800px',
                      borderRadius: '16px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                      display: 'block',
                      margin: '0 auto 30px'
                    }}
                  />
                </div>

                {/* Buttons */}
                <div className="result-buttons">
                  <button className="result-btn primary" onClick={handleDownload}>
                     <FiDownload size={16} /> DOWNLOAD CARD
                  </button>
                  <button className="result-btn whatsapp" onClick={() => { 
                    if (!userEmail) { setViewState('login'); return; }
                    setShowShareModal(true); 
                    setShareTab('whatsapp'); 
                  }}>
                    <IoLogoWhatsapp size={18} /> SHARE CARD
                  </button>
                  <button className="result-btn" onClick={() => { 
                    if (!userEmail) { setViewState('login'); return; }
                    setShowShareModal(true); 
                    setShareTab('email'); 
                  }}>
                     <FiShare2 size={16} /> MORE OPTIONS
                  </button>
                  <button className="result-btn" onClick={handleReset}>
                    <FiRefreshCw size={14} /> NEW CARD
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
              <h3 className="share-modal-title">Share Your Super Mom</h3>
              <p className="share-modal-subtitle">Choose how you want to share your creation</p>

              {/* Tab Switcher */}
              <div className="share-tabs">
                <button
                  className={`share-tab ${shareTab === 'whatsapp' ? 'active' : ''}`}
                  onClick={() => setShareTab('whatsapp')}
                >
                  <IoLogoWhatsapp size={16} /> WhatsApp
                </button>
                <button
                  className={`share-tab ${shareTab === 'email' ? 'active' : ''}`}
                  onClick={() => setShareTab('email')}
                >
                  <FiMail size={16} /> Email
                </button>
              </div>

              {/* Success Message */}
              {shareSuccess && (
                <div className="share-success-msg">
                  <FiCheckCircle size={16} /> {shareSuccess}
                </div>
              )}

              <div className="share-form">
                {/* WhatsApp Tab */}
                {shareTab === 'whatsapp' && (
                  <>
                    <div className="share-quick-action">
                      <button
                        className="share-whatsapp-direct-btn"
                        onClick={() => handleWhatsAppShare(false)}
                        disabled={shareLoading}
                      >
                        <IoLogoWhatsapp size={20} />
                        {shareLoading ? 'Opening...' : 'Share on WhatsApp Now'}
                      </button>
                      <p style={{ fontSize: '0.82rem', color: '#888', marginTop: '8px' }}>Opens WhatsApp with your image link ready to send</p>
                    </div>

                    <div className="share-divider">
                      <span>or send to a specific number</span>
                    </div>

                    <div className="share-input-group">
                      <label><FiPhone size={14} /> WhatsApp Number</label>
                      <input
                        type="tel"
                        placeholder="+234 800 000 0000"
                        value={sharePhone}
                        onChange={(e) => setSharePhone(e.target.value)}
                      />
                    </div>

                    <button
                      className="share-submit-btn whatsapp-btn"
                      onClick={() => handleWhatsAppShare(true)}
                      disabled={!sharePhone || shareLoading}
                    >
                      <IoLogoWhatsapp size={16} />
                      {shareLoading ? 'Sending...' : 'Send to This Number'}
                    </button>
                  </>
                )}

                {/* Email Tab */}
                {shareTab === 'email' && (
                  <>
                    <div className="share-input-group">
                      <label><FiMail size={14} /> Recipient Email <span style={{ color: '#F60945' }}>*</span></label>
                      <input
                        type="email"
                        placeholder="mom@email.com"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                      />
                    </div>

                    <button
                      className="share-submit-btn"
                      onClick={handleEmailShare}
                      disabled={!shareEmail || shareLoading}
                    >
                      <FiMail size={16} />
                      {shareLoading ? 'Sending...' : 'Send via Email'}
                    </button>
                  </>
                )}

                {/* Copy Link */}
                <div className="share-divider">
                  <span>or copy link</span>
                </div>

                <button
                  className="share-copy-btn"
                  onClick={handleCopyLink}
                >
                  {linkCopied ? <><FiCheckCircle size={14} /> Link Copied!</> : <><FiCopy size={14} /> Copy Image Link</>}
                </button>

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
