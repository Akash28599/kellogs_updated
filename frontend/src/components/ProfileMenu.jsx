import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiHome, FiPlus, FiLogOut, FiChevronDown } from 'react-icons/fi';
import '../App.css'; // Or specific CSS

const ProfileMenu = ({ userImage, onHome, onCreate, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleAction = (action) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="profile-menu-container" ref={menuRef}>
      <motion.button 
        className={`profile-button ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="profile-image-container">
          {userImage ? (
            <img src={userImage} alt="Profile" className="profile-image" />
          ) : (
            <div className="profile-placeholder">
              <FiUser size={20} />
            </div>
          )}
        </div>
        <FiChevronDown className={`chevron-icon ${isOpen ? 'open' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="profile-dropdown"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="dropdown-item" onClick={() => handleAction(onHome)}>
              <FiHome size={18} />
              <span>Home</span>
            </div>
            <div className="dropdown-item" onClick={() => handleAction(onCreate)}>
              <FiPlus size={18} />
              <span>Create New</span>
            </div>
            <div className="dropdown-divider" />
            <div className="dropdown-item danger" onClick={() => handleAction(onLogout)}>
              <FiLogOut size={18} />
              <span>Logout</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileMenu;
