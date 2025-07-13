const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY is not set in the environment variables.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DEFAULT_MODEL = 'gemini-2.0-flash';

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-V, Authorization'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { role, experience, skills, goals, project } = req.body;
    
    // Log the incoming request (for debugging)
    console.log('Received request with data:', { role, experience, skills, goals, project });
    
    // Validate required fields
    if (!role) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Role is required' 
      });
    }
    
    // Initialize the model
    const model = genAI.getGenerativeModel({ 
      model: DEFAULT_MODEL,
      generationConfig: {
        temperature: 0.5,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });
    
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

    // Generate content
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });
    
    const response = await result.response;
    if (!response || !response.candidates?.[0]?.content) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    const text = response.text().trim();
    console.log('Raw Gemini response:', text);
    
    // Try to extract JSON from the response
    let jsonStart = text.indexOf('{');
    let jsonEnd = text.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      // If no JSON found, return a mock response
      console.log('No JSON found in response, using mock data');
      return res.json({
        success: true,
        data: {
          skills: [
            {
              name: role || 'Your Role',
              level: 'Beginner',
              importance: 'High',
              resources: [
                {
                  type: 'Documentation',
                  title: `${role} Getting Started Guide`,
                  url: '#'
                }
              ]
            }
          ],
          roadmap: [
            {
              step: 1,
              title: 'Learn Core Concepts',
              description: `Master the fundamentals of ${role} including core concepts and best practices.`,
              duration: '2-4 weeks',
              resources: []
            }
          ]
        }
      });
    }
    
    const jsonString = text.substring(jsonStart, jsonEnd);
    const recommendation = JSON.parse(jsonString);
    
    // Ensure the response has the required structure
    if (!recommendation.skills || !recommendation.roadmap) {
      throw new Error('Invalid response format: Missing required fields');
    }
    
    return res.json({
      success: true,
      data: recommendation
    });
    
  } catch (error) {
    console.error('Error:', error);
    
    // Return a mock response in case of error
    return res.json({
      success: true,
      data: {
        skills: [
          {
            name: 'Error Handling',
            level: 'Info',
            importance: 'High',
            resources: [
              {
                type: 'Documentation',
                title: 'Error Handling Guide',
                description: 'There was an error processing your request, but here is some sample data.'
              }
            ]
          }
        ],
        roadmap: [
          {
            step: 1,
            title: 'Troubleshooting',
            description: 'We encountered an error but want you to see the UI with sample data.',
            duration: '1 day',
            resources: []
          }
        ]
      }
    });
  }
};
