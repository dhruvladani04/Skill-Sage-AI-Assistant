const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Load skills from CSV file on startup
let topSkills = [];
try {
  const csvData = fs.readFileSync(path.join(__dirname, 'top_500_skills.csv'), 'utf8');
  topSkills = csvData.split(',').map(skill => skill.trim());
  console.log(`Successfully loaded ${topSkills.length} skills from CSV.`);
} catch (error) {
  console.error('Could not read top_500_skills.csv. Skill extraction will be limited.', error);
}

// Middleware to parse JSON bodies and serve static files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize the Google Gemini AI client
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in the environment variables.');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemPrompt = `You are SkillSage, an AI-powered career and learning assistant. Your job is to analyze a user's profile against a master skill list and provide a detailed learning plan.

**Your Task:**
1.  Analyze the user's current skills, their goals, and/or their project description.
2.  Compare the user's current skills with the requirements of their goal/project, using the provided master skill list.
3.  Identify the key skills the user is MISSING. These skills **must** come from the master list.
4.  Generate a detailed, step-by-step learning roadmap to acquire these missing skills.

**Output Format (Strict):**
You MUST format your response in two distinct sections using the following markdown template. Do NOT add any other text, greetings, or explanations.

### Missing Skills
[Provide a comma-separated list of ONLY the skill names you identified. For example: SkillA, SkillB, SkillC]

### Learning Roadmap
1.  **Step 1: [Step Title]**
    -   **Focus:** Briefly describe the core concept of this step.
    -   **Action:** Provide a concrete, actionable task (e.g., "Complete the 'Intro to X' course on Coursera," "Build a small project using Y," "Read the official documentation for Z").
    -   **Goal:** Explain what the user will be able to do after this step.
2.  **Step 2: [Step Title]**
    -   **Focus:** ...
    -   **Action:** ...
    -   **Goal:** ...
(Continue with as many steps as necessary)`;

// API endpoint to get skill recommendations
app.post('/api/get-recommendations', async (req, res) => {
  try {
    const { role, experience, skills, goals, project } = req.body;

    // Basic validation
    if (!role || !experience || !skills) {
      return res.status(400).json({ error: 'Profile information (role, experience, skills) is required.' });
    }

    // Construct the user prompt from the input
    let userPrompt = `Here is the master list of skills to use for your analysis:
[${topSkills.join(', ')}]

---

Based on that list, please analyze my profile below and recommend the skills I am missing for my goals/project.

1. **My Profile**
   - Current role/title: "${role}"
   - Years of experience: "${experience}"
   - Current skills: "${skills}"`;

    if (goals) {
      userPrompt += `
2. **My Goals**
   - "${goals}"`;
    }

    if (project) {
      userPrompt += `
3. **Project Description**
   - ${project}
   - Ask: “Which new skills do I need to build this project, and how should I get started?”`;
    }

    // Get the generative model with the system instruction
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
    });

    // Generate content
    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ recommendation: text });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to get recommendations from the AI. Please check the server logs.' });
  }
});

// Serve the main HTML file for any other GET request
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});