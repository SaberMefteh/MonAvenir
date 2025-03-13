require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const courseRoutes = require('./routes/courses');
const videoUploadRoutes = require('./routes/videoUpload');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const auth = require('./middleware/auth');
const jwt = require('jsonwebtoken');

console.log('MONGO_URI:', process.env.MONGO_URI ? 'exists' : 'missing');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('mongoose', mongoose);

// Security middleware
app.use(helmet()); // Set security headers
app.use(xss()); // Sanitize inputs against XSS
app.use(mongoSanitize()); // Sanitize inputs against NoSQL injection

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Range'
  ],
  exposedHeaders: [
    'Content-Length', 
    'Content-Range', 
    'Content-Disposition', 
    'Accept-Ranges'
  ]
}));

// Configuration du rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Retourne `RateLimit-*` headers
  legacyHeaders: false, // Désactive les `X-RateLimit-*` headers
});

// Appliquer le rate limiter à toutes les routes
app.use(limiter);

// More aggressive rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 login/signup requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again after an hour'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// Add security headers for video streaming
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

// Body parsers
app.use(express.json({ limit: '500mb' })); // Increased limit for JSON body
app.use(express.urlencoded({ extended: true, limit: '500mb' })); // Increased limit for URL-encoded body
app.use(bodyParser.json({ limit: '500mb' }));

// Configure upload limits
app.use((req, res, next) => {
  // Set timeout to 10 minutes for large uploads
  req.setTimeout(10 * 60 * 1000);
  res.setTimeout(10 * 60 * 1000);
  next();
});

// Create upload directories if they don't exist
const createUploadDirectories = () => {
  const uploadPaths = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/images'),
    path.join(__dirname, 'uploads/documents'),
    path.join(__dirname, 'uploads/videos'),
  ];
  
  uploadPaths.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
        console.log(`Created directory: ${dir}`);
      } else {
        // Ensure directory has correct permissions
        fs.chmodSync(dir, 0o755);
      }
      
      // Test write permissions by creating and removing a test file
      const testFile = path.join(dir, '.test-write-permission');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log(`Directory ${dir} is writable`);
    } catch (err) {
      console.error(`Error with directory ${dir}: ${err.message}`);
    }
  });
};

createUploadDirectories();

// Configuration pour les fichiers statiques
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Credentials', 'true');
  }
}));

// Serve static files from public directory with proper CORS headers
app.use('/images', (req, res, next) => {
  // Set CORS headers for images
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
  next();
}, express.static(path.join(__dirname, 'public/images')));

// Serve course banner images
app.use('/uploads', auth, (req, res, next) => {
  // Set CORS headers for images
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Add a route to check if a file exists
app.get('/check-file', auth, (req, res) => {
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(400).json({ exists: false, message: 'No file path provided' });
  }
  
  // Normalize the path to prevent directory traversal attacks
  const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  if (normalizedPath !== filePath) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  const fullPath = path.join(__dirname, normalizedPath);
  const exists = fs.existsSync(fullPath);
  
  res.json({
    exists,
    path: normalizedPath,
    fullPath,
    message: exists ? 'File exists' : 'File does not exist'
  });
});

// Add a debug route for video files
app.get('/api/debug/video/:filename', auth, (req, res) => {
  const filename = req.params.filename;
  
  // Validate filename to prevent path traversal
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
    return res.status(400).json({ message: 'Invalid filename' });
  }
  
  const videoPath = path.join(__dirname, 'uploads', 'videos', filename);
  
  // Check if file exists
  const exists = fs.existsSync(videoPath);
  let stats = null;
  let readable = false;
  
  if (exists) {
    try {
      stats = fs.statSync(videoPath);
      // Check if file is readable
      fs.accessSync(videoPath, fs.constants.R_OK);
      readable = true;
    } catch (err) {
      console.error(`Error accessing video file: ${err.message}`);
    }
  }
  
  res.json({
    filename,
    exists,
    path: videoPath,
    stats: stats ? {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    } : null,
    readable,
    message: exists ? (readable ? 'File exists and is readable' : 'File exists but is not readable') : 'File does not exist'
  });
});

// Debug middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mongodb: mongoose.connection.readyState === 1 
  });
});

// Routes
app.use('/api/courses', courseRoutes);
app.use('/api/courses', videoUploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Add a direct route for video streaming
app.get('/api/stream/:filename', auth, (req, res) => {
  const { filename } = req.params;
  const videoPath = path.join(__dirname, 'uploads/videos', filename);

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ message: 'Video not found' });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });

    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });

    fs.createReadStream(videoPath).pipe(res);
  }
});

// Error handling for file uploads
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File is too large. Maximum size is 500MB' 
      });
    }
    return res.status(400).json({ 
      message: 'File upload error', 
      error: err.message 
    });
  }
  next(err);
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    status: err.status
  });

  // Gérer les erreurs CORS
  if (err.name === 'CORSError') {
    return res.status(403).json({
      message: 'CORS error',
      details: err.message,
      code: 'CORS_ERROR'
    });
  }

  // Gérer les erreurs de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      details: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  // Erreur par défaut
  res.status(err.status || 500).json({
    message: err.message || 'Une erreur est survenue sur le serveur',
    code: err.code || 'SERVER_ERROR',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle 404s
app.use((req, res) => {
  console.log('404 for URL:', req.url);
  res.status(404).json({ message: 'Route not found' });
});

// Add a debug route for checking file existence
app.get('/api/debug/file', auth, (req, res) => {
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(400).json({ exists: false, message: 'No file path provided' });
  }
  
  // Normalize the path to prevent directory traversal attacks
  const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(__dirname, normalizedPath);
  
  try {
    const exists = fs.existsSync(fullPath);
    let fileInfo = null;
    
    if (exists) {
      const stats = fs.statSync(fullPath);
      fileInfo = {
        size: stats.size,
        isDirectory: stats.isDirectory(),
        created: stats.birthtime,
        modified: stats.mtime,
        permissions: stats.mode.toString(8).slice(-3)
      };
    }
    
    res.json({
      exists,
      path: filePath,
      fullPath: fullPath,
      info: fileInfo,
      message: exists ? 'File exists' : 'File does not exist'
    });
  } catch (error) {
    res.status(500).json({
      exists: false,
      path: filePath,
      fullPath: fullPath,
      error: error.message,
      message: 'Error checking file'
    });
  }
});

// Add a specific route for PDF files
app.get('/api/pdf/:filename', auth, (req, res) => {
  const filename = req.params.filename;
  
  // Validate filename to prevent path traversal
  if (!/^[a-zA-Z0-9_\-\.]+\.pdf$/.test(filename)) {
    return res.status(400).json({ message: 'Invalid filename' });
  }
  
  const pdfPath = path.join(__dirname, 'uploads', 'documents', filename);
  
  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF file not found: ${pdfPath}`);
    return res.status(404).json({ message: 'PDF not found' });
  }
  
  try {
    const stat = fs.statSync(pdfPath);
    
    // Handle range requests
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(pdfPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/pdf',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Authorization',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      });
      
      file.pipe(res);
    } else {
      // Set appropriate headers for PDF
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': stat.size,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Authorization',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Accept-Ranges': 'bytes'
      });
      
      // Stream the PDF file
      const stream = fs.createReadStream(pdfPath);
      stream.pipe(res);
      
      stream.on('error', (error) => {
        console.error(`Error streaming PDF: ${error.message}`);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming PDF' });
        }
      });
    }
  } catch (error) {
    console.error(`Error serving PDF: ${error.message}`);
    res.status(500).json({ message: 'Error serving PDF' });
  }
});

// Add a middleware to set Access-Control-Allow-Credentials
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Start server and connect to MongoDB
const startServer = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'your_connection_string_here';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

startServer();


