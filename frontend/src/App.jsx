import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiDownload, FiRefreshCw, FiCheck, FiHeart, FiZap } from 'react-icons/fi';
import { GiCook, GiAlarmClock, GiJuggler, GiBookCover, GiNightSleep } from 'react-icons/gi';
import axios from 'axios';
import './App.css';
import './Wizard.css';
import ProfileMenu from './components/ProfileMenu';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';

const API_URL = 'http://localhost:5000';

// Theme icon mapping
const themeIcons = {
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
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [viewState, setViewState] = useState('landing'); // 'landing', 'login', 'wizard'
  const [userEmail, setUserEmail] = useState('');

  // Navigation Handlers
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
      console.log('Fetching themes from:', `${API_URL}/api/themes`);
      const response = await axios.get(`${API_URL}/api/themes`);
      console.log('Themes response:', response.data);
      if (response.data.success) {
        setThemes(response.data.themes);
        setError('');
      } else {
        console.error('Theme fetch failed success:false');
        setError('Failed to load themes data.');
      }
    } catch (err) {
      console.error('Failed to fetch themes:', err);
      // More friendly error message
      if (err.code === 'ERR_NETWORK') {
         setError('Cannot connect to server (Port 5000). Please ensure backend is running.');
      } else {
         setError('Failed to load themes. Try refreshing.');
      }
    }
  }, []);

  // Fetch themes on mount
  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError('');
    
    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setUploadedFile(response.data.file);
        // Do NOT advance to step 3 automatically, let user click "Generate"
        // setCurrentStep(3); 
        console.log('Image uploaded success:', response.data.file);
      }
    } catch (err) {
      console.error('Upload failed:', err);
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
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  // Select theme
  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
    setCurrentStep(2);
    setResultImage(null);
    setError('');
  };

  // Generate face swap
  const handleGenerate = async () => {
    if (!selectedTheme || !uploadedFile) {
      setError('Please select a theme and upload an image.');
      return;
    }

    setIsLoading(true);
    setCurrentStep(3); // Explicitly move to Loading Screen
    setLoadingMessage('Preparing your superhero transformation...');
    setError('');

    try {
      setLoadingMessage('Working magic with AI face swap...');
      
      // Set a client-side timeout (e.g., 50 seconds) to prevent infinite UI loading
      console.log('Sending request to backend:', `${API_URL}/api/face-swap`);
      const response = await axios.post(`${API_URL}/api/face-swap`, {
        sourceImage: uploadedFile.path,
        themeId: selectedTheme.id
      }, { timeout: 50000 }); // 50s timeout
      console.log('Backend response:', response.data);

      if (response.data.success) {
        setResultImage(`${API_URL}${response.data.result.imageUrl}`);
        setCurrentStep(4);
        if (response.data.demo) {
          // It's not really an error, just a fallback notice
          console.warn('Using fallback:', response.data.note);
        }
      }
    } catch (err) {
      console.error('Face swap failed:', err);
      // If client-side timeout or server error
      if (err.code === 'ECONNABORTED') {
        setError('The grid is busy. Please try again in a moment. (Timeout)');
      } else {
        setError(err.response?.data?.message || 'Face swap failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Download result
  const handleDownload = async () => {
    if (!resultImage) return;
    
    try {
      // Fetch the image as a blob to force download, overcoming cross-origin issues
      const response = await fetch(resultImage);
      const blob = await response.blob();
      
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `kelloggs-super-mom-${selectedTheme?.id || 'result'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback to simple link
      const link = document.createElement('a');
      link.href = resultImage;
      link.target = '_blank';
      link.download = `kelloggs-super-mom.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Reset to start
  const handleReset = () => {
    setSelectedTheme(null);
    setUploadedImage(null);
    setUploadedFile(null);
    setResultImage(null);
    setError('');
    setCurrentStep(1);
    setIsLoading(false);
  };

  // Generate floating hearts
  const generateHearts = () => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDelay: Math.random() * 15,
      size: 15 + Math.random() * 20
    }));
  };

  const hearts = generateHearts();

  // Conditional Rendering Logic
  if (viewState === 'login') {
    return (
        <div className="app">
             <div className="animated-bg" />
             <div className="hearts-container">
            {hearts.map(heart => (
            <span
                key={heart.id}
                className="heart"
                style={{
                left: `${heart.left}%`,
                animationDelay: `${heart.animationDelay}s`,
                fontSize: `${heart.size}px`
                }}
            >
                ❤️
            </span>
            ))}
        </div>
            <LoginPage onBack={handleBackToLanding} onLogin={handleLoginSuccess} />
        </div>
    );
  }

  if (viewState === 'landing') {
      return (
        <div className="app">
           {/* Landing Page does not have the animated BG on top necessarily, or it has its own style. 
               The original code had it globally. Keeping it consistent. */}
          <div className="animated-bg" />
          <div className="hearts-container">
            {hearts.map(heart => (
            <span
                key={heart.id}
                className="heart"
                style={{
                left: `${heart.left}%`,
                animationDelay: `${heart.animationDelay}s`,
                fontSize: `${heart.size}px`
                }}
            >
                ❤️
            </span>
            ))}
        </div>
        <main className="main">
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000 }}>
               <ProfileMenu 
                userImage={uploadedImage} 
                onHome={handleGoHome} 
                onCreate={handleStartData} 
                onLogout={() => window.location.reload()} 
              />
          </div>
          <LandingPage onStart={handleStartData} />
        </main>
        
        </div>
      );
  }

  // WIZARD VIEW
  return (
    <div className="app-wizard">
      <header className="wizard-header">
         <ProfileMenu 
            userImage={uploadedImage} 
            onHome={handleGoHome} 
            onCreate={handleReset} 
            onLogout={() => window.location.reload()} 
          />
        <div className="kelloggs-logo">Kellogg's</div>
      </header>

      {/* Progress Steps */}
      <div className="steps-progress">
        <div className={`step-item ${currentStep >= 1 ? 'active' : ''}`}>
          <div className="step-circle">1</div>
          <span>Select Theme</span>
        </div>
        <div className={`step-item ${currentStep >= 2 ? 'active' : ''}`}>
          <div className="step-circle">2</div>
          <span>Upload</span>
        </div>
        <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-circle">3</div>
          <span>Generate</span>
        </div>
        <div className={`step-item ${currentStep >= 4 ? 'active' : ''}`}>
          <div className="step-circle">4</div>
          <span>Result</span>
        </div>
      </div>

      <div className="wizard-card">
        <AnimatePresence mode='wait'>
          
          {/* STEP 1: SELECT THEME */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#E41E26' }}>Choose Your Mom's Superpower</h2>
              <p style={{ color: '#666', marginBottom: '2rem' }}>Select the theme that best fits her personality!</p>
              
              {error && (
                <div style={{ color: 'red', marginBottom: '1rem', padding: '1rem', background: '#ffe6e6', borderRadius: '8px' }}>
                  {error} <br/>
                  <button onClick={fetchThemes} style={{ marginTop: '0.5rem', textDecoration: 'underline', border: 'none', background: 'transparent', cursor: 'pointer' }}>Retry</button>
                </div>
              )}

              {themes.length === 0 && !error && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <p>Loading themes...</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>If this takes too long, please check if the backend server is running on port 5000.</p>
                </div>
              )}

              <div className="theme-grid">
                {console.log('Rendering themes:', themes)}
                {themes.map((theme) => {
                  const IconComponent = themeIcons[theme.id] || GiAlarmClock;
                  return (
                    <div 
                      key={theme.id}
                      className={`theme-option ${selectedTheme?.id === theme.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTheme(theme)}
                    >
                      <IconComponent className="theme-icon-lg" />
                      <h3 style={{ marginBottom: '0.5rem', fontWeight: '800' }}>{theme.title}</h3>
                      <p style={{ fontSize: '0.9rem', color: '#888' }}>{theme.subtitle}</p>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '3rem' }}>
                <button 
                  className="btn-kelloggs"
                  disabled={!selectedTheme}
                  style={{ opacity: selectedTheme ? 1 : 0.5 }}
                  onClick={() => setCurrentStep(2)}
                >
                  Next Step <FiCheck />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: UPLOAD PHOTO */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#E41E26' }}>Upload Her Photo</h2>
              <p style={{ color: '#666', marginBottom: '2rem' }}>Upload a clear, front-facing photo for the best superhero transformation.</p>

              <div 
                {...getRootProps()} 
                className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
                style={{ position: 'relative' }}
              >
                <input {...getInputProps()} />
                {uploadedImage ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img 
                      src={uploadedImage} 
                      alt="Preview" 
                      style={{ maxWidth: '300px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} 
                    />
                    <div style={{ marginTop: '1rem', color: '#888', fontStyle: 'italic' }}>
                      Click to change photo
                    </div>
                  </div>
                ) : (
                  <>
                    <FiUpload size={50} color="#E41E26" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Drag & drop or Click to Upload</h3>
                    <p style={{ fontSize: '0.9rem', color: '#aaa' }}>Supports JPG, PNG (Max 10MB)</p>
                  </>
                )}
              </div>

              <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-kelloggs secondary" onClick={() => setCurrentStep(1)}>
                  Back
                </button>
                <button 
                  className="btn-kelloggs"
                  disabled={!uploadedFile}
                  style={{ opacity: uploadedFile ? 1 : 0.5 }}
                  onClick={handleGenerate}
                >
                  Generate Superhero <FiZap />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: LOADING / GENERATE */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="loading-container"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                style={{ display: 'inline-block', marginBottom: '2rem' }}
              >
                <FiZap size={60} color="#F7C600" />
              </motion.div>
              
              <h2 style={{ color: '#E41E26', marginBottom: '1rem' }}>Creating your Super Mom...</h2>
              <p style={{ fontSize: '1.2rem', color: '#4A2C2A' }}>{loadingMessage || "Adding super strength 💪"}</p>
              
              <div className="progress-bar-container">
                <motion.div 
                  className="progress-bar-fill"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3.5 }}
                />
              </div>

              <div style={{ marginTop: '2rem', fontStyle: 'italic', color: '#aaa', fontSize: '0.9rem' }}>
                Please wait while our AI works its magic!
              </div>
            </motion.div>
          )}

          {/* STEP 4: RESULT */}
          {currentStep === 4 && resultImage && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h2 style={{ fontSize: '2.5rem', color: '#E41E26', marginBottom: '0.5rem' }}>Your Super Mom is Ready!</h2>
              <p style={{ color: '#666', marginBottom: '2rem' }}>She looks absolutely strong and amazing.</p>

              <div style={{ 
                display: 'flex', 
                gap: '2rem', 
                justifyContent: 'center', 
                flexWrap: 'wrap', 
                marginBottom: '3rem' 
              }}>
                <div style={{ flex: 1, minWidth: '300px', maxWidth: '400px' }}>
                  <div style={{ background: '#FFF6E5', padding: '1rem', borderRadius: '16px', height: '100%' }}>
                    <h4 style={{ marginBottom: '1rem', color: '#4A2C2A' }}>Original Photo</h4>
                    <img 
                      src={uploadedImage} 
                      alt="Original" 
                      style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }} 
                    />
                  </div>
                </div>
                
                <div style={{ flex: 1, minWidth: '300px', maxWidth: '400px' }}>
                  <div style={{ background: '#FFF6E5', padding: '1rem', borderRadius: '16px', height: '100%', border: '2px solid #F7C600' }}>
                    <h4 style={{ marginBottom: '1rem', color: '#E41E26' }}>Superhero Version 🦸‍♀️</h4>
                    <img 
                      src={resultImage} 
                      alt="Superhero Result" 
                      style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 10px 30px rgba(228, 30, 38, 0.2)' }} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn-kelloggs" onClick={handleDownload} style={{ fontSize: '1rem' }}>
                  Download Image <FiDownload />
                </button>
                <button className="btn-kelloggs secondary" onClick={handleReset}>
                  Try Another Photo <FiRefreshCw />
                </button>
              </div>

              <div style={{ marginTop: '2rem', color: '#E41E26', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <FiHeart fill="#E41E26" /> Share the love with #KelloggsSuperMom
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

       {/* Chocos Decoration */}
       <img 
         src="https://png.pngtree.com/png-vector/20230906/ourmid/pngtree-chocolate-cereal-balls-png-image_9997972.png" 
         alt="Chocos" 
         className="chocos-float" 
         style={{ bottom: '20px', left: '20px', transform: 'rotate(-20deg)' }} 
       />
       <img 
         src="https://png.pngtree.com/png-vector/20230906/ourmid/pngtree-chocolate-cereal-balls-png-image_9997972.png" 
         alt="Chocos" 
         className="chocos-float" 
         style={{ top: '100px', right: '20px', width: '80px', transform: 'rotate(45deg)' }} 
       />

      <footer className="footer" style={{ marginTop: '4rem', background: 'transparent' }}>
        <div className="container" style={{ color: '#4A2C2A' }}>
          <p>Made with ❤️ for Mother's Day • Kellogg's {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
