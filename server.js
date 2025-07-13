require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://skill-sage-ai-assistant.vercel.app', // Your Vercel app URL
  'https://skill-sage-ai-assistant-dhruvladani.vercel.app' // Example with username
];

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY is not set in the environment variables.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Using the stable model version
const DEFAULT_MODEL = 'gemini-2.0-flash';

// Middleware to check API key on each request
app.use((req, res, next) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'API key not configured' 
    });
  }
  next();
});

app.post('/api/generate-recommendation', async (req, res) => {
  try {
    const { role, experience, skills, goals, project } = req.body;
    
    // Initialize the model with error handling
    let model;
    try {
      model = genAI.getGenerativeModel({ 
        model: DEFAULT_MODEL,
        generationConfig: {
          temperature: 0.5,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });
    } catch (modelError) {
      console.error('Error initializing model:', modelError);
      throw new Error(`Failed to initialize AI model: ${modelError.message}`);
    }
0    
    const prompt = `You are a career advisor AI. Analyze the following profile and create a personalized learning path.

User Profile:
- Role: ${role}
- Experience: ${experience}
- Current Skills: ${skills}
- Career Goals: ${goals}
- Project Idea: ${project}

Generate a response in the exact JSON format shown below. Only include the JSON object, no additional text or markdown formatting.

{
  "skills": [
    {
      "name": "JavaScript",
      "level": "Intermediate",
      "importance": "High",
      "resources": [
        {
          "type": "tutorial",
          "title": "JavaScript Modern Tutorial",
          "url": "https://javascript.info/"
        }
      ]
    }
  ],
  "roadmap": [
    {
      "step": 1,
      "title": "Learn Core Concepts",
      "description": "Master the fundamentals of ${role} including core concepts and best practices.",
      "duration": "2-4 weeks",
      "resources": [
        {
          "type": "course",
          "title": "${role} Fundamentals Course",
          "url": "#"
        }
      ]
    }
  ]
}

IMPORTANT: Only return valid JSON that matches this exact structure.`;

    const generationConfig = {
      temperature: 0.5,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });
    
    const response = await result.response;
    if (!response || !response.candidates || !response.candidates[0] || !response.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    const text = response.text().trim();
    
    // Clean up the response text to ensure it's valid JSON
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const jsonString = text.substring(jsonStart, jsonEnd);
    
    try {
      const recommendation = JSON.parse(jsonString);
      
      // Validate the response structure
      if (!recommendation.skills || !recommendation.roadmap) {
        throw new Error('Invalid response format: Missing required fields');
      }
      
      res.json(recommendation);
      
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      console.error('Response text:', text);
      throw new Error('Failed to parse AI response. Please try again.');
    }

  } catch (error) {
    console.error('Error generating recommendation:', error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ 
      error: 'Failed to generate recommendation',
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});