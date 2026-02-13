
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const sharp = require('sharp');
// Manual .env load
const dotenv = require('dotenv');
const dotenvPath = path.join(__dirname, '.env');
if (fs.existsSync(dotenvPath)) {
  try {
    // ROBUST .ENV LOADER (Handles UTF-16 LE BOM)
    let envContentBuffer = fs.readFileSync(dotenvPath);
    let envContent = '';

    // Detect UTF-16 LE (FF FE)
    if (envContentBuffer.length >= 2 && envContentBuffer[0] === 0xFF && envContentBuffer[1] === 0xFE) {
      envContent = envContentBuffer.toString('ucs2');
      console.log('📝 Detected UTF-16 LE encoding for .env');
    } else {
      envContent = envContentBuffer.toString('utf8');
    }

    // Remove BOM character if present
    if (envContent.charCodeAt(0) === 0xFEFF) {
      envContent = envContent.slice(1);
    }

    const envConfig = dotenv.parse(envContent);
    for (const k in envConfig) {
      process.env[k] = envConfig[k];
    }
    console.log(`✅ Loaded .env manually (${Object.keys(envConfig).length} keys found)`);

    if (!process.env.SMTP_USER) {
      console.warn('⚠️ SMTP_USER missing after load. Check .env file format.');
    }

  } catch (err) {
    console.error('Error parsing .env:', err);
  }
} else {
  console.log('⚠️ .env file not found:', dotenvPath);
}
const nodemailer = require('nodemailer');
const axios = require('axios');
const { Pool } = require('pg');
const { BlobServiceClient } = require('@azure/storage-blob');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🔧 DB Config Check:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  db: process.env.DB_NAME,
  passLength: process.env.DB_PASS ? process.env.DB_PASS.length : 0
});

// ---- PostgreSQL Connection (Local Dev Hardcoded Fallback) ----
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'postgres', // Default to 'postgres' system DB
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'Akashkk99@',
});

// ---- Azure Blob Storage Connection ----
let blobContainerClient;
try {
  const AZURE_CONN_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (AZURE_CONN_STRING) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONN_STRING);
    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'tgkmdaccontainer';
    blobContainerClient = blobServiceClient.getContainerClient(containerName);
    console.log(`✅ Azure Blob Storage connected (Container: ${containerName})`);
  } else {
    console.warn('⚠️ AZURE_STORAGE_CONNECTION_STRING missing. Blob upload disabled.');
  }
} catch (err) {
  console.error('❌ Azure Blob Storage init error:', err.message);
}

// Auto-create tables on startup
const initDB = async () => {
  try {
    console.log(`🔌 Connecting to DB: ${process.env.DB_NAME || 'postgres'} on ${process.env.DB_HOST || 'localhost'}...`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        identifier VARCHAR(255) UNIQUE NOT NULL,
        channel VARCHAR(20) NOT NULL DEFAULT 'email',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        user_identifier VARCHAR(255) NOT NULL,
        source_image_path VARCHAR(500),
        theme_id VARCHAR(100),
        theme_name VARCHAR(200),
        mom_story TEXT,
        result_image_path VARCHAR(500),
        result_blob_url VARCHAR(1000),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Shares tracking table (wrapped in try-catch for existing type conflicts)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS shares (
          id SERIAL PRIMARY KEY,
          submission_id INTEGER REFERENCES submissions(id) ON DELETE SET NULL,
          share_channel VARCHAR(20) NOT NULL,
          recipient VARCHAR(255),
          image_url VARCHAR(1000),
          share_link VARCHAR(1000),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } catch (shareErr) {
      if (shareErr.code === '42P07' || shareErr.code === '42710') {
        console.log('ℹ️ Shares table already exists, skipping.');
      } else {
        console.warn('⚠️ Shares table warning:', shareErr.message);
      }
    }

    // Ensure column exists (migration for existing table)
    try {
      await pool.query('ALTER TABLE submissions ADD COLUMN result_blob_url VARCHAR(1000)');
    } catch (e) {
      if (e.code !== '42701') {
        console.log('Notice: Column result_blob_url check:', e.message);
      }
    }

    console.log('✅ PostgreSQL connected & tables ready (users, submissions, shares)');
  } catch (err) {
    // Auto-create DB if missing (Error 3D000)
    if (err.code === '3D000' || err.message.includes('does not exist')) {
      const dbName = process.env.DB_NAME || 'mom';
      console.log(`⚠️ Database "${dbName}" not found. Attempting to create...`);
      try {
        const adminPool = new Pool({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASS || 'Akashkk99@',
          database: 'postgres'
        });
        await adminPool.query(`CREATE DATABASE "${dbName}"`);
        await adminPool.end();
        console.log(`✅ Database "${dbName}" created successfully. Retrying initialization...`);
        return initDB();
      } catch (createErr) {
        console.error('❌ Failed to auto-create database. Is "postgres" DB accessible?', createErr.message);
      }
    } else {
      console.error('❌ PostgreSQL init error:', err.message);
      console.log('   Server will continue without DB. Submissions will NOT be saved.');
    }
  }
};

initDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/results', express.static(path.join(__dirname, 'results')));
app.use('/templates', express.static(path.join(__dirname, 'templates')));

// Ensure directories exist
const dirs = ['uploads', 'results', 'templates', 'models'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Multer configuration for file uploads — optimized for traffic
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,                    // Only 1 file per request
    fieldSize: 10 * 1024 * 1024  // Field value size limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// Active upload tracking for concurrency control
let activeUploads = 0;
const MAX_CONCURRENT_UPLOADS = 20;

// DYNAMIC THEME LOADER
// Scan templates folder for images and generate themes on the fly
// ------------------------------------------------------------------
// AUTHENTICATION & OTP
// ------------------------------------------------------------------

// Simple in-memory store for OTPs (Production should use Redis/DB)
const otpStore = new Map();

// Helper: Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper: Send SMS via Termii
const sendTermiiSMS = async (phoneNumber, otp) => {
  try {
    const cleanPhone = phoneNumber.replace(/^\+/, ''); // Remove leading + if present
    const data = {
      to: cleanPhone,
      from: "N-Alert", // Default generic sender ID for Termii
      sms: `Your Kellogg's Super Mom verification code is: ${otp}. Valid for 10 minutes.`,
      type: "plain",
      channel: "dnd", // Use DND channel for better delivery in Nigeria
      api_key: process.env.SMSAPI_APIKEY,
    };

    const response = await axios.post(`${process.env.SMSAPI_BASEURL}/api/sms/send`, data);
    return response.data;
  } catch (error) {
    console.error('Termii SMS Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to send SMS');
  }
};

// Helper: Send Email via Azure SMTP
const sendAzureEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT, // 587
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"Kellogg's Super Mom" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: "Your Verification Code - Kellogg's Super Mom",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #D31245;">Kellogg's Super Mom</h2>
          <p>Hello,</p>
          <p>Your verification code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 5px; color: #333;">${otp}</h1>
          <p>This code is valid for 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('SMTP Email Error:', error);
    throw new Error('Failed to send Email');
  }
};

// Endpoint: Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { channel, identifier } = req.body; // channel: 'email' | 'phone', identifier: email or phone number

  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Identifier (email or phone) is required' });
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

  // Store OTP
  otpStore.set(identifier, { otp, expiresAt });
  console.log(`Generated OTP for ${identifier}: ${otp}`); // For debugging

  try {
    if (channel === 'email') {
      await sendAzureEmail(identifier, otp);
    } else if (channel === 'phone') {
      await sendTermiiSMS(identifier, otp);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid channel' });
    }

    res.json({ success: true, message: `OTP sent to ${identifier}` });

  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification code. Please try again.' });
  }
});

// Helper: Send Generic SMS
const sendGenericSMS = async (phoneNumber, message) => {
  try {
    const cleanPhone = phoneNumber.replace(/^\+/, '');
    const data = {
      to: cleanPhone,
      from: "N-Alert", // Termii default
      sms: message,
      type: "plain",
      channel: "dnd",
      api_key: process.env.SMSAPI_APIKEY,
    };
    await axios.post(`${process.env.SMSAPI_BASEURL}/api/sms/send`, data);
  } catch (error) {
    console.error('Termii SMS Share Error:', error.response?.data || error.message);
  }
};

// Helper: Send Generic Email
const sendGenericEmail = async (email, subject, htmlContent) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT, // 587
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from: `"Kellogg's Super Mom" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: subject,
      html: htmlContent
    });
  } catch (error) {
    console.error('SMTP Share Email Error:', error);
  }
};

// ... (OTP helpers remain)

// Endpoint: Share via WhatsApp (generates wa.me link)
app.post('/api/share-whatsapp', async (req, res) => {
  const { phoneNumber, imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'Image URL is required' });
  }

  // Clean phone number — remove spaces, dashes, but keep + prefix
  let cleanPhone = (phoneNumber || '').replace(/[\s()-]/g, '');
  if (cleanPhone && !cleanPhone.startsWith('+')) {
    // Default to Nigeria (+234) if no country code
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '234' + cleanPhone.substring(1);
    }
  } else {
    cleanPhone = cleanPhone.replace(/^\+/, '');
  }

  const shareMessage = `🎉 Check out my Kellogg's Super Mom transformation!\n\n🦸‍♀️ My mom is a real superhero!\n\n👉 View Image: ${imageUrl}\n\n✨ Create yours at kelloggssuperstars.com`;

  // Generate WhatsApp deep link
  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  // Track share in DB
  try {
    await pool.query(
      `INSERT INTO shares (share_channel, recipient, image_url, share_link) VALUES ($1, $2, $3, $4)`,
      ['whatsapp', cleanPhone || 'direct', imageUrl, waLink]
    );
    console.log('📱 WhatsApp share tracked in DB');
  } catch (dbErr) {
    console.error('DB share track error:', dbErr.message);
  }

  res.json({
    success: true,
    whatsappLink: waLink,
    message: 'WhatsApp link generated successfully'
  });
});

// Endpoint: Share via Email
app.post('/api/share-email', async (req, res) => {
  const { email, imageUrl, themeName } = req.body;

  if (!email || !imageUrl) {
    return res.status(400).json({ success: false, message: 'Email and image URL are required' });
  }

  const htmlContent = `
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="background: linear-gradient(135deg, #F60945, #FF4D6D); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">Kellogg's Super Mom</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">🦸‍♀️ A Superhero Transformation</p>
      </div>
      <div style="padding: 30px 24px; text-align: center;">
        <h2 style="color: #222; margin-bottom: 8px;">Your Super Mom Portrait is Ready! ✨</h2>
        ${themeName ? `<p style="color: #888; font-size: 14px;">Theme: <strong>${themeName}</strong></p>` : ''}
        <p style="color: #555; line-height: 1.6;">Someone special created a superhero transformation for their mom using Kellogg's Super Mom Maker!</p>
        <a href="${imageUrl}" style="display: inline-block; background: #F60945; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0;">🖼️ View Image</a>
        <p style="color: #999; font-size: 13px;">Or copy this link: <a href="${imageUrl}" style="color: #F60945;">${imageUrl}</a></p>
      </div>
      <div style="background: #FFF0F3; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: #888; font-size: 13px; margin: 0;">Create your own Super Mom at <a href="https://kelloggssuperstars.com" style="color: #F60945; text-decoration: none; font-weight: bold;">kelloggssuperstars.com</a></p>
      </div>
    </div>
  `;

  try {
    await sendGenericEmail(email, "🦸‍♀️ Your Kellogg's Super Mom Portrait is Ready!", htmlContent);

    // Track share in DB
    try {
      await pool.query(
        `INSERT INTO shares (share_channel, recipient, image_url) VALUES ($1, $2, $3)`,
        ['email', email, imageUrl]
      );
      console.log('📧 Email share tracked in DB');
    } catch (dbErr) {
      console.error('DB share track error:', dbErr.message);
    }

    res.json({ success: true, message: `Image shared to ${email} successfully!` });
  } catch (err) {
    console.error('Share email error:', err);
    res.status(500).json({ success: false, message: 'Failed to send email. Please try again.' });
  }
});

// Legacy Share Endpoint (keep for backward compat)
app.post('/api/share', async (req, res) => {
  const { channel, identifier, imageUrl } = req.body;

  if (!identifier || !imageUrl) {
    return res.status(400).json({ success: false, message: 'Missing identifier or image URL' });
  }

  const message = `Check out my Kellogg's Super Mom transformation! ${imageUrl}`;
  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #D31245;">Your Super Mom Portrait is Ready!</h2>
      <p>Click the link below to view and download your transformation:</p>
      <p><a href="${imageUrl}" style="background: #D31245; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Image</a></p>
      <p>Or copy this link: ${imageUrl}</p>
    </div>
  `;

  try {
    if (channel === 'phone') {
      await sendGenericSMS(identifier, message);
    } else if (channel === 'email') {
      await sendGenericEmail(identifier, "Your Kellogg's Super Mom Portrait", htmlMessage);
    }
    res.json({ success: true, message: 'Shared successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to share.' });
  }
});

// Endpoint: Verify OTP (existing)
app.post('/api/auth/verify-otp', (req, res) => {
  const { identifier, otp } = req.body;

  if (!identifier || !otp) {
    return res.status(400).json({ success: false, message: 'Identifier and OTP are required' });
  }

  const storedData = otpStore.get(identifier);

  if (!storedData) {
    return res.status(400).json({ success: false, message: 'No OTP requested for this identifier' });
  }

  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(identifier);
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
  }

  if (storedData.otp === otp) {
    // OTP matches!
    otpStore.delete(identifier); // Clear used OTP
    return res.json({ success: true, message: 'Login successful', token: 'mock-jwt-token-12345' });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
  }
});


// Endpoint: Google OAuth Login
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google credential is required' });
  }

  try {
    // Decode the JWT token from Google (base64 payload)
    // For production, use google-auth-library to verify the token properly
    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());

    const email = payload.email;
    const name = payload.name;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Could not extract email from Google token' });
    }

    // Upsert user in DB
    try {
      await pool.query(
        `INSERT INTO users (identifier, channel) VALUES ($1, 'google') ON CONFLICT (identifier) DO NOTHING`,
        [email]
      );
    } catch (dbErr) {
      console.error('DB upsert error (Google):', dbErr.message);
    }

    console.log(`Google login: ${email} (${name})`);
    res.json({ success: true, message: 'Google login successful', email, name, token: 'mock-jwt-token-google' });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
});

app.get('/api/themes', (req, res) => {
  const templatesDir = path.join(__dirname, 'templates');

  // Default fallback if folder missing
  const defaultThemes = [{
    id: 'captain_early_riser',
    title: 'Captain Early Riser',
    subtitle: 'Hero of Morning Routines',
    template: 'captain_early_riser.png'
  }];

  if (!fs.existsSync(templatesDir)) {
    return res.json({ success: true, themes: defaultThemes });
  }

  // Read all files in templates directory
  fs.readdir(templatesDir, (err, files) => {
    if (err) {
      console.error("Error reading templates:", err);
      return res.json({ success: true, themes: defaultThemes });
    }

    // Filter for images (jpg, jpeg, png)
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

    if (imageFiles.length === 0) {
      return res.json({ success: true, themes: defaultThemes });
    }

    // Generate dynamic themes from filenames
    const dynamicThemes = imageFiles.map((file) => {
      // Remove extension
      const nameWithoutExt = file.replace(/\.(jpg|jpeg|png)$/i, '');

      // Convert "The_Cheerleader-in-Chief" -> "The Cheerleader in Chief"
      // Replace underscores/hyphens with spaces
      let title = nameWithoutExt.replace(/[_-]/g, ' ');

      // Capitalize Words (Simple implementation)
      function capitalize(str) {
        return str.replace(/\b\w/g, l => l.toUpperCase());
      }
      title = capitalize(title);

      // Create flexible ID
      const id = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '-');

      return {
        id: id,
        name: title,
        title: title,
        subtitle: 'Super Mom Power',
        description: 'Celebrating the amazing strength of mothers everywhere.',
        template: file,
        color: '#E41E26', // Kellogg's Red default
        templateUrl: `/templates/${file}`,
        templateExists: true
      };
    });

    res.json({ success: true, themes: dynamicThemes });
  });
});

// Get single theme
app.get('/api/themes/:id', (req, res) => {
  const themeId = req.params.id;

  // Construct filenames to check
  const pngPath = path.join(__dirname, 'templates', `${themeId}.png`);
  const jpgPath = path.join(__dirname, 'templates', `${themeId}.jpg`);

  let chosenFile = null;
  // Try to find the file based on ID
  // IF ID is "captian-early-riser", look for "captian_early_riser.png" (fuzzy match needed?)
  // Actually, let's keep it simple: assume ID matches filename roughly. But since we sanitize ID, we might lose info.

  // Better approach: Scan dir for matching sanitized ID again!
  try {
    const templatesDir = path.join(__dirname, 'templates');
    const files = fs.readdirSync(templatesDir);
    const match = files.find(f => {
      const idFromF = f.replace(/\.(jpg|jpeg|png)$/i, '').toLowerCase().replace(/[^a-z0-9]/g, '-');
      return idFromF === themeId;
    });

    if (match) chosenFile = match;
  } catch (e) {
    console.error(e);
  }

  if (!chosenFile) {
    return res.status(404).json({ success: false, message: 'Theme not found' });
  }

  res.json({
    success: true,
    theme: {
      id: themeId,
      template: chosenFile,
      templateUrl: `/templates/${chosenFile}`,
      templateExists: true
    }
  });
});

// Upload image — with concurrency control and auto-compression
app.post('/api/upload', (req, res, next) => {
  // Concurrency guard
  if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
    return res.status(503).json({ success: false, message: 'Server busy. Please try again in a moment.' });
  }
  activeUploads++;
  next();
}, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      activeUploads--;
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Auto-compress uploaded image using Sharp (saves disk space & speeds up face swap)
    const originalPath = req.file.path;
    const compressedName = `opt_${req.file.filename}`;
    const compressedPath = path.join(__dirname, 'uploads', compressedName);

    try {
      await sharp(originalPath)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(compressedPath);

      // Replace original with compressed version
      fs.unlinkSync(originalPath);
      fs.renameSync(compressedPath, originalPath);
      console.log(`📦 Compressed upload: ${req.file.filename}`);
    } catch (compressErr) {
      console.warn('⚠️ Compression skipped:', compressErr.message);
      // Keep original if compression fails
    }

    activeUploads--;

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    activeUploads--;
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
});

// Python Availability Check
let PYTHON_AVAILABLE = false;

const checkPythonAvailability = () => {
  const pythonPath = process.env.PYTHON_PATH || 'python';
  // Check if python exists and has insightface (our core requirement)
  const { exec } = require('child_process');

  // Specifically check Python 3.10 environment
  exec('py -3.10 -c "import insightface; print(\'ok\')"', (error, stdout, stderr) => {
    if (error) {
      console.log('⚠️ Python or OpenCV not found. Face swap will run in DEMO MODE (Instant Fallback).');
      console.log('   Error:', error.message);
      PYTHON_AVAILABLE = false;
    } else {
      console.log('✅ Python and OpenCV detected. AI Face Swap is ENABLED.');
      PYTHON_AVAILABLE = true;
    }
  });
};

// Check on startup
checkPythonAvailability();

// Face swap endpoint using local Python script
app.post('/api/face-swap', async (req, res) => {
  try {
    const { sourceImage, themeId, theme: themeName, story } = req.body;

    const targetThemeId = themeId || themeName;

    if (!sourceImage || !targetThemeId) {
      return res.status(400).json({
        success: false,
        message: 'Source image and theme ID are required'
      });
    }

    // DYNAMIC FILE LOOKUP
    // We cannot use 'themes.find' because 'themes' only has the default 5 hardcoded ones.
    // We must scan the directory to find the file that corresponds to 'targetThemeId'.

    let templateFilename = null;
    const templatesDir = path.join(__dirname, 'templates');
    const DEFAULT_TEMPLATE = 'captain_early_riser.png';

    // 1. Try to find match in directory
    try {
      if (fs.existsSync(templatesDir)) {
        const files = fs.readdirSync(templatesDir);
        // Match logic: sanitized filename (no ext) === targetThemeId
        const match = files.find(f => {
          const idFromF = f.replace(/\.(jpg|jpeg|png)$/i, '').toLowerCase().replace(/[^a-z0-9]/g, '-');
          return idFromF === targetThemeId;
        });
        if (match) templateFilename = match;
      }
    } catch (e) {
      console.error("Error searching templates dir:", e);
    }

    // 2. (Legacy fallback removed — dynamic scanning is primary)

    // 3. Ultimate Fallback
    if (!templateFilename) {
      console.log(`Theme ${targetThemeId} not found. Using default.`);
      templateFilename = DEFAULT_TEMPLATE;
    }

    let templatePath = path.join(__dirname, 'templates', templateFilename);

    // Final sanity check
    if (!fs.existsSync(templatePath)) {
      console.log(`Template file ${templateFilename} missing! Using emergency fallback.`);
      templatePath = path.join(__dirname, 'templates', DEFAULT_TEMPLATE);
      templateFilename = DEFAULT_TEMPLATE;
    }

    // Mock a 'theme' object for response
    const theme = {
      id: targetThemeId,
      template: templateFilename
    };

    // Get full paths
    const sourceImagePath = path.join(__dirname, sourceImage.replace(/^\//, ''));

    const resultFileName = `result_${uuidv4()}.png`;
    const resultPath = path.join(__dirname, 'results', resultFileName);

    // Check if files exist
    if (!fs.existsSync(sourceImagePath)) {
      return res.status(404).json({ success: false, message: 'Source image not found' });
    }

    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({
        success: false,
        message: `No template images found. Please add ${DEFAULT_TEMPLATE} to the templates folder.`
      });
    }

    // FAST PATH: If Python is not available, return fallback immediately
    if (!PYTHON_AVAILABLE) {
      console.log('Python not available. Skipping script for instant fallback.');
      try {
        fs.copyFileSync(templatePath, resultPath);
        return res.json({
          success: true,
          message: 'Face swap completed (Demo Mode - No AI)',
          result: {
            imageUrl: `/results/${resultFileName}`,
            theme: theme
          },
          demo: true,
          note: 'Running in instant demo mode because Python/OpenCV is not installed.'
        });
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Fallback failed.' });
      }
    }

    console.log('Starting face swap...');
    console.log('Source:', sourceImagePath);
    console.log('Template:', templatePath);
    console.log('Output:', resultPath);

    // Run Python face swap script
    // Run Python face swap script
    const pythonCommand = 'py';
    const scriptPath = path.join(__dirname, 'face_swap.py');
    console.log('🚀 Spawning Pro Face Swap Pipeline (InsightFace)...');

    const args = [
      '-3.10',
      scriptPath,
      '--source', sourceImagePath,
      '--target', templatePath,
      '--output', resultPath,
      '--cpu'
    ];

    const pythonProcess = spawn(pythonCommand, args);

    // Timeout handling
    const pythonTimeout = setTimeout(() => {
      console.log('Python script timed out (90s). Killing process...');
      pythonProcess.kill();
    }, 90000);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      const s = data.toString();
      stdoutData += s;
      console.log('[Python]:', s);
    });

    pythonProcess.stderr.on('data', (data) => {
      const s = data.toString();
      stderrData += s;
      console.error('[Python Error]:', s);
    });

    pythonProcess.on('close', async (code, signal) => {
      clearTimeout(pythonTimeout);
      console.log('Python process exited with code:', code, 'signal:', signal);

      if (code === 0 && fs.existsSync(resultPath)) {

        // Upload to Azure Blob Storage
        let blobUrl = null;
        if (blobContainerClient) {
          try {
            const blobName = path.basename(resultPath);
            const blockBlobClient = blobContainerClient.getBlockBlobClient(blobName);
            console.log('☁️ Uploading result to Azure Blob...');
            await blockBlobClient.uploadFile(resultPath);
            blobUrl = blockBlobClient.url;
            console.log('✅ Uploaded to Azure:', blobUrl);
          } catch (uploadErr) {
            console.error('❌ Azure upload failed:', uploadErr.message);
          }
        }

        res.json({
          success: true,
          message: 'Face swap completed successfully',
          result: {
            imageUrl: `/results/${resultFileName}`,
            blobUrl: blobUrl,
            theme: { id: targetThemeId }
          }
        });

        // Save submission to DB (async, non-blocking)
        try {
          await pool.query(
            `INSERT INTO submissions (user_identifier, source_image_path, theme_id, theme_name, mom_story, result_image_path, result_blob_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            ['anonymous', sourceImage, targetThemeId, targetThemeId, story || '', `/results/${resultFileName}`, blobUrl || '']
          );
          console.log('📝 Submission saved to DB (with Blob URL)');
        } catch (dbErr) {
          console.error('DB save error:', dbErr.message);
        }
      } else {
        // Fallback logic
        console.log('Python script failed. Using emergency template fallback.');
        try {
          if (!fs.existsSync(resultPath)) {
            fs.copyFileSync(templatePath, resultPath);
          }
          res.json({
            success: true,
            message: 'Face swap completed (Demo Mode - AI Failed)',
            result: {
              imageUrl: `/results/${resultFileName}`,
              theme: { id: targetThemeId }
            },
            note: 'AI processing failed. Showing template only.'
          });
        } catch (e) {
          if (!res.headersSent) res.status(500).json({ success: false, message: 'Server error' });
        }
      }
    });

    pythonProcess.on('error', (err) => {
      clearTimeout(pythonTimeout);
      console.error('Failed to spawn python:', err);
      if (!res.headersSent) res.status(500).json({ success: false, message: 'Failed to start subprocess' });
    });

  } catch (error) {
    console.error('Face swap error:', error);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Download result
app.get('/api/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'results', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ success: false, message: 'File not found' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// List uploaded files
app.get('/api/uploads', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    const files = fs.readdirSync(uploadsDir).map(file => ({
      name: file,
      url: `/uploads/${file}`
    }));
    res.json({ success: true, files });
  } catch (error) {
    res.json({ success: true, files: [] });
  }
});

// List result files
app.get('/api/results', (req, res) => {
  try {
    const resultsDir = path.join(__dirname, 'results');
    const files = fs.readdirSync(resultsDir).map(file => ({
      name: file,
      url: `/results/${file}`
    }));
    res.json({ success: true, files });
  } catch (error) {
    res.json({ success: true, files: [] });
  }
});

// List all submissions from DB
app.get('/api/submissions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM submissions ORDER BY created_at DESC LIMIT 100');
    res.json({ success: true, submissions: result.rows });
  } catch (error) {
    console.error('Error fetching submissions:', error.message);
    res.json({ success: true, submissions: [] });
  }
});

// List all shares from DB
app.get('/api/shares', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shares ORDER BY created_at DESC LIMIT 100');
    res.json({ success: true, shares: result.rows });
  } catch (error) {
    console.error('Error fetching shares:', error.message);
    res.json({ success: true, shares: [] });
  }
});

// Cleanup old uploads (files older than 24 hours)
const cleanupOldUploads = () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const ONE_DAY = 24 * 60 * 60 * 1000;
  try {
    const files = fs.readdirSync(uploadsDir);
    let cleaned = 0;
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      if (Date.now() - stats.mtimeMs > ONE_DAY) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    });
    if (cleaned > 0) console.log(`🧹 Cleaned ${cleaned} old upload(s)`);
  } catch (err) {
    // Silent fail
  }
};

// Run cleanup every 6 hours
setInterval(cleanupOldUploads, 6 * 60 * 60 * 1000);
cleanupOldUploads(); // Run once on startup

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mother's Day Campaign Server running on port ${PORT}`);
  console.log(`📁 Templates directory: ${path.join(__dirname, 'templates')}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`📁 Results directory: ${path.join(__dirname, 'results')}`);
  // Scan templates folder for status
  const templatesDir = path.join(__dirname, 'templates');
  if (fs.existsSync(templatesDir)) {
    console.log('\n📋 Detected Templates:');
    const files = fs.readdirSync(templatesDir);
    files.forEach(file => {
      if (/\.(jpg|jpeg|png)$/i.test(file)) {
        console.log(`   ✅ ${file}`);
      }
    });
  }
  console.log('\n💡 To add templates, place PNG images in the templates folder.');
});
