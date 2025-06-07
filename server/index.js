const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const multer = require('multer');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const BACKEND_URL = 'https://gem-backend.onrender.com';
// Middleware
app.use(cors({ origin: 'https://gem-qp4aizuxz-scarredhands-projects.vercel.app' }));
app.use(express.json()); // Body parser

// // Configure multer
// const storage = multer.memoryStorage(); // Store files in memory
// const upload = multer({ storage });

// // Endpoint to handle file uploads
// app.post('/upload', upload.single('file'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).send('No file uploaded.');
//   }

//   // Process the uploaded file here
//   console.log('Uploaded file:', req.file);
//   res.send('File uploaded successfully.');
// });

const storage = multer.memoryStorage();
// Configure multer to accept a single file with the field name 'image'
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size (e.g., 10MB)
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image file.'), false);
    }
  }
}).single('image'); // This 'image' must match the field name in FormData from frontend

// Connect to MongoDB
connectDB();

// Gemini API model and key setup
// const MODEL_NAME = 'gemini-1.5-pro';
// const API_KEY = process.env.GOOGLE_API_KEY; // Make sure you have this in your .env file

// --- Gemini API Configuration ---
const MODEL_NAME = 'gemini-1.5-pro'; // Or 'gemini-1.5-pro' if your quota allows
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error("🔴 FATAL ERROR: GOOGLE_API_KEY is not defined in .env file.");
  process.exit(1); // Exit if API key is missing
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// --- API Endpoint: /generate_with_image ---
app.post('/generate_with_image', (req, res) => {
  // Use the 'upload' middleware to handle the file
  upload(req, res, async (err) => {
    // Handle multer errors (e.g., file too large, wrong file type)
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ error: `File upload error: ${err.message}` });
    } else if (err) {
      console.error('File filter error or unknown upload error:', err.message);
      return res.status(400).json({ error: err.message || 'File upload error' });
    }

    // --- Proceed if file upload (or no file) is successful ---
    try {
      const promptText = req.body.prompt || ""; // Get prompt from FormData
      const imageFile = req.file; // Access the uploaded file via req.file

      console.log("Received request on /generate_with_image");
      console.log("Prompt Text:", promptText);
      console.log("Image File:", imageFile ? { name: imageFile.originalname, type: imageFile.mimetype, size: imageFile.size } : "No image provided");

      // Ensure either a prompt or an image is provided
      if (!promptText && !imageFile) {
        return res.status(400).json({ error: 'Please provide a prompt or an image.' });
      }

      // Construct the parts for the Gemini API request
      const parts = [];
      if (promptText) {
        parts.push({ text: promptText });
      }
      if (imageFile) {
        parts.push({
          inline_data: {
            mime_type: imageFile.mimetype,
            data: imageFile.buffer.toString('base64') // Convert image buffer to Base64
          }
        });
      }

      // --- Generation Config and Safety Settings (same as your frontend example) ---
      const generationConfig = {
        temperature: 0.75,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      };
      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ];

      console.log(`Sending ${parts.length} part(s) to Gemini...`);

      // --- Call Gemini API ---
      const result = await model.generateContent({
        contents: [{ parts: parts }],
        generationConfig,
        safetySettings,
      });

      const geminiResponse = result.response;
      console.log("Full Gemini API Response Object:", JSON.stringify(geminiResponse, null, 2));

      // --- Process Gemini Response ---
      if (geminiResponse && geminiResponse.candidates && geminiResponse.candidates.length > 0 &&
          geminiResponse.candidates[0].content && geminiResponse.candidates[0].content.parts &&
          geminiResponse.candidates[0].content.parts.length > 0 && geminiResponse.candidates[0].content.parts[0].text) {
        
        const text = geminiResponse.candidates[0].content.parts[0].text;
        return res.json({ text: text }); // Send back the generated text
      } else {
        let finishReason = "N/A";
        let safetyRatingsInfo = "N/A";
        if (geminiResponse && geminiResponse.candidates && geminiResponse.candidates.length > 0 && geminiResponse.candidates[0].finishReason) {
          finishReason = geminiResponse.candidates[0].finishReason;
        }
        if (geminiResponse && geminiResponse.promptFeedback && geminiResponse.promptFeedback.safetyRatings) {
          safetyRatingsInfo = geminiResponse.promptFeedback.safetyRatings;
        } else if (geminiResponse && geminiResponse.candidates && geminiResponse.candidates.length > 0 && geminiResponse.candidates[0].safetyRatings) {
          safetyRatingsInfo = geminiResponse.candidates[0].safetyRatings;
        }
        console.error("Invalid or empty response structure from Gemini API.", { finishReason, safetyRatingsInfo });
        return res.status(500).json({ 
            error: 'Invalid or empty response from Gemini API.', 
            details: { 
                finishReason: finishReason, 
                safetyRatings: safetyRatingsInfo,
                // rawApiResponse: geminiResponse // Optionally send raw response for frontend debugging
            } 
        });
      }

    } catch (error) {
      console.error('Error calling Gemini API:', error.message);
      if (error.stack) console.error(error.stack);

      // Handle specific Gemini API errors if possible (e.g., quota errors)
      let statusCode = 500;
      let errorMessage = 'Failed to generate content.';
      if (error.message && error.message.includes('Quota')) { // Basic check for quota error
          statusCode = 429; // Too Many Requests
          errorMessage = 'API quota exceeded. Please try again later.';
      } else if (error.message && error.message.includes('SAFETY')) {
          statusCode = 400; // Bad Request (likely due to safety)
          errorMessage = 'Content generation blocked due to safety settings.';
      }
      
      // For SDK errors, details might be in error.errorDetails or error.response
      const errorDetails = error.errorDetails || (error.response ? error.response.data : null) || error.message;
      console.error('Gemini Error Details:', errorDetails);

      return res.status(statusCode).json({ error: errorMessage, details: errorDetails });
    }
  });
});


// Existing routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));

// Home route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Set the server port
const PORT = process.env.PORT || 5137;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// const express = require('express');
// const dotenv = require('dotenv');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const multer = require('multer'); 

// // Load environment variables
// dotenv.config();

// // Initialize Express app
// const app = express();

// // Middleware
// // app.use(cors());
// app.use(cors({ origin: 'http://localhost:5137' }));
// app.use(express.json()); // Body parser

// // Configure multer
// const storage = multer.memoryStorage(); // Store files in memory
// const upload = multer({ storage });

// // Endpoint to handle file uploads
// app.post('/upload', upload.single('file'), (req, res) => {
//     if (!req.file) {
//         return res.status(400).send('No file uploaded.');
//     }
    
//     // Here you can process the file, e.g., save it to a database or cloud storage
//     console.log('Uploaded file:', req.file);
//     res.send('File uploaded successfully.');
// });

// // Connect to MongoDB
// connectDB();

// // Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/chat', require('./routes/chat'));  

// // Home route
// app.get('/', (req, res) => {
//   res.send('API is running...');
// });

// // Set the server port
// const PORT = process.env.PORT || 5137;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
