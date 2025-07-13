document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const form = document.getElementById('profile-form');
  const resultsContainer = document.getElementById('results-container');
  const outputContent = document.getElementById('output-content');
  const skillsOutput = document.querySelector('.skills-container');
  const roadmapOutput = document.querySelector('.roadmap-steps');
  const loader = document.getElementById('loader');
  const startLearningBtn = document.getElementById('start-learning-btn');
  const modifyPlanBtn = document.getElementById('modify-plan-btn');
  
  // Initialize animations
  initAnimations();
  createFloatingShapes();
  
  // Form submission handler
  form.addEventListener('submit', handleFormSubmit);
  
  // Button event listeners
  if (modifyPlanBtn) {
    modifyPlanBtn.addEventListener('click', () => {
      resultsContainer.classList.add('hidden');
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
  
  // Start Learning button in the form
  if (startLearningBtn) {
    startLearningBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showComingSoon('Start Learning');
    });
  }
  
  // Save as PDF button in results
  const savePdfBtn = document.getElementById('save-pdf');
  if (savePdfBtn) {
    savePdfBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showComingSoon('Save as PDF');
    });
  }
  
  // Start Learning button in results
  const startLearningResultsBtn = document.getElementById('start-learning');
  if (startLearningResultsBtn) {
    startLearningResultsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showComingSoon('Start Learning');
    });
  }
  
  // Function to show coming soon message
  function showComingSoon(feature) {
    const notification = document.createElement('div');
    notification.className = 'coming-soon-notification';
    notification.textContent = `${feature} - Coming Soon!`;
    document.body.appendChild(notification);
    
    // Add show class to trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove notification after animation
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // Initialize tooltips
  initTooltips();
  
  // Initialize form field animations
  initFormFieldAnimations();
  
  // Functions
  function initAnimations() {
    // Add animation class to form groups with delay
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
      group.style.animationDelay = `${0.1 * index}s`;
    });
  }
  
  function createFloatingShapes() {
    const shapes = document.querySelectorAll('.shape');
    if (!shapes.length) return;
    
    shapes.forEach((shape, index) => {
      // Random position
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const size = 100 + Math.random() * 200;
      const duration = 20 + Math.random() * 20;
      const delay = Math.random() * 5;
      
      // Apply styles
      shape.style.width = `${size}px`;
      shape.style.height = `${size}px`;
      shape.style.left = `${posX}px`;
      shape.style.top = `${posY}px`;
      shape.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;
      
      // Add keyframes for floating animation
      const keyframes = `
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, 10px) rotate(5deg); }
          50% { transform: translate(0, 20px) rotate(0deg); }
          75% { transform: translate(-10px, 10px) rotate(-5deg); }
        }
      `;
      
      // Add keyframes to head
      const style = document.createElement('style');
      style.innerHTML = keyframes;
      document.head.appendChild(style);
    });
  }
  
  function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(el => {
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = el.getAttribute('data-tooltip');
      document.body.appendChild(tooltip);
      
      el.addEventListener('mouseenter', (e) => {
        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
      });
      
      el.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
      });
    });
  }
  
  function initFormFieldAnimations() {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      // Add focus/blur effects
      input.addEventListener('focus', (e) => {
        const parent = e.target.closest('.form-field');
        if (parent) parent.classList.add('focused');
      });
      
      input.addEventListener('blur', (e) => {
        const parent = e.target.closest('.form-field');
        if (parent) parent.classList.remove('focused');
      });
      
      // Add floating label effect
      input.addEventListener('input', (e) => {
        const parent = e.target.closest('.form-field');
        if (parent) {
          if (e.target.value) {
            parent.classList.add('has-value');
          } else {
            parent.classList.remove('has-value');
          }
        }
      });
    });
  }
  
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitButton = form.querySelector('button[type="submit"]');
    const loader = document.getElementById('loader');
    submitButton.disabled = true;
    
    try {
      loader.classList.add('visible');
      
      const formData = new FormData(form);
      const data = {
        role: formData.get('role') || 'Not specified',
        experience: formData.get('experience') || 'Not specified',
        skills: formData.get('skills') || 'Not specified',
        goals: formData.get('goals') || 'Not specified',
        project: formData.get('project') || 'Not specified',
      };
  
      if (!data.role || data.role === 'Not specified') {
        throw new Error('Please select a role');
      }
  
      // Determine the API URL based on the current environment
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const baseUrl = isProduction 
        ? 'https://skill-sage-ai-assistant.vercel.app'
        : 'http://localhost:3000';
      const apiUrl = `${baseUrl}/api/generate-recommendation`;
      
      // Make API call to the appropriate backend
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
  
      // First check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server returned ${response.status}: ${response.statusText}. ${text.substring(0, 100)}...`);
      }
      
      // Parse the response as JSON
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || `Server error: ${response.status}`);
      }
      
      // Check if the response has the expected structure
      if (!responseData.success || !responseData.data) {
        console.error('Unexpected response format:', responseData);
        throw new Error('Received an unexpected response format from the server');
      }
  
      // Display the recommendations from the data property
      displayRecommendations(responseData.data);
  
      resultsContainer.classList.remove('hidden');
      outputContent.classList.remove('hidden');
      
      setTimeout(() => {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (error) {
      console.error('API Error:', error);
      showError(error);
    } finally {
      loader.classList.remove('visible');
      setTimeout(() => submitButton.disabled = false, 500);
    }
  }
  
  function displayRecommendations(recommendationText) {
    // Clear previous results
    if (skillsOutput) skillsOutput.innerHTML = '';
    if (roadmapOutput) roadmapOutput.innerHTML = '';
    
    if (!recommendationText) {
      console.error('No recommendation data provided');
      showError(new Error('No recommendation data was received. Please try again.'));
      return;
    }
    
    if (!Array.isArray(recommendationText.skills) || !Array.isArray(recommendationText.roadmap)) {
      console.error('Invalid recommendation data structure:', recommendationText);
      showError(new Error('The recommendation data is not in the expected format. Please try again.'));
      return;
    }
    
    // Display skills with resources
    recommendationText.skills.forEach(skill => {
      const skillEl = document.createElement('div');
      skillEl.className = 'skill-card';
      
      let resourcesHtml = '';
      if (skill.resources && skill.resources.length > 0) {
        resourcesHtml = `
          <div class="resources-dropdown">
            <button class="btn-text resources-toggle">
              <i class="fas fa-book"></i> Learning Resources
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="resources-list">
              ${skill.resources.map(resource => `
                <a href="${resource.url}" target="_blank" class="resource-item" data-type="${resource.type.toLowerCase()}">
                  <span class="resource-type">${resource.type}:</span>
                  <span class="resource-title">${resource.title}</span>
                  <i class="fas fa-external-link-alt"></i>
                </a>
              `).join('')}
            </div>
          </div>
        `;
      }
      
      skillEl.innerHTML = `
        <div class="skill-header">
          <h3>${skill.name}</h3>
          <span class="skill-level">${skill.level} • ${skill.importance} Priority</span>
        </div>
        ${resourcesHtml}
      `;
      
      skillsOutput.appendChild(skillEl);
    });
    
    // Display roadmap steps with resources
    recommendationText.roadmap.forEach(step => {
      const stepEl = document.createElement('div');
      stepEl.className = 'roadmap-step';
      
      let resourcesHtml = '';
      if (step.resources && step.resources.length > 0) {
        resourcesHtml = `
          <div class="resources-dropdown">
            <button class="btn-text resources-toggle">
              <i class="fas fa-book"></i> Recommended Resources
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="resources-list">
              ${step.resources.map(resource => `
                <a href="${resource.url}" target="_blank" class="resource-item" data-type="${resource.type.toLowerCase()}">
                  <span class="resource-type">${resource.type}:</span>
                  <span class="resource-title">${resource.title}</span>
                  <i class="fas fa-external-link-alt"></i>
                </a>
              `).join('')}
            </div>
          </div>
        `;
      }
      
      stepEl.innerHTML = `
        <div class="step-number">${step.step}</div>
        <div class="step-content">
          <h4>${step.title}</h4>
          <p class="step-description">${step.description}</p>
          <div class="step-footer">
            <span class="step-duration"><i class="far fa-clock"></i> ${step.duration}</span>
            ${resourcesHtml}
          </div>
        </div>
      `;
      
      roadmapOutput.appendChild(stepEl);
    });
    
    // Add event listeners for resource toggles
    document.querySelectorAll('.resources-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = toggle.nextElementSibling;
        const icon = toggle.querySelector('.fa-chevron-down');
        
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        icon.classList.toggle('rotated');
      });
    });
    
    // Initialize tooltips for the new elements
    initTooltips();
  }
  
  function showError(error) {
    // Ensure we have a valid error message
    const errorMessage = error?.message || 'An unknown error occurred. Please try again.';
    
    // Create error element
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <div>
        <h4>Something went wrong</h4>
        <p>${errorMessage}</p>
      </div>
    `;
    
    // Add to DOM
    const form = document.getElementById('profile-form');
    if (form) {
      // Remove any existing error messages
      const existingError = form.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
      
      // Insert new error message at the top of the form
      form.insertBefore(errorEl, form.firstChild);
      
      // Scroll to the error message
      setTimeout(() => {
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      // Fallback to alert if we can't find the form
      alert(`Error: ${errorMessage}`);
    }
    
    // Log the full error to console for debugging
    console.error('Error:', error);
    
    outputContent.innerHTML = '';
    outputContent.appendChild(errorEl);
    outputContent.classList.remove('hidden');
  }
  
  function generateMockRecommendation(data) {
    // Define learning resources that can be reused
    const learningResources = {
      'React': [
        { type: 'Documentation', title: 'Official React Docs', url: 'https://reactjs.org/docs/getting-started.html' },
        { type: 'Tutorial', title: 'React Official Tutorial', url: 'https://reactjs.org/tutorial/tutorial.html' },
        { type: 'Video', title: 'React Crash Course', url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8' }
      ],
      'Node.js': [
        { type: 'Documentation', title: 'Node.js Official Docs', url: 'https://nodejs.org/en/docs/' },
        { type: 'Tutorial', title: 'Node.js Crash Course', url: 'https://www.youtube.com/watch?v=fBNz5xF-Kx4' },
        { type: 'Article', title: 'Node.js Best Practices', url: 'https://github.com/goldbergyoni/nodebestpractices' }
      ],
      'TypeScript': [
        { type: 'Documentation', title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/' },
        { type: 'Tutorial', title: 'TypeScript in 5 minutes', url: 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html' },
        { type: 'Video', title: 'TypeScript Crash Course', url: 'https://www.youtube.com/watch?v=BCg4U1FzODs' }
      ]
    };

    // Return a properly structured object with skills and roadmap
    return {
      skills: [
        { 
          name: 'React', 
          level: 'Intermediate', 
          importance: 'High',
          resources: learningResources['React']
        },
        { 
          name: 'Node.js', 
          level: 'Intermediate', 
          importance: 'High',
          resources: learningResources['Node.js']
        },
        { 
          name: 'TypeScript', 
          level: 'Beginner', 
          importance: 'Medium',
          resources: learningResources['TypeScript']
        },
        { 
          name: 'MongoDB', 
          level: 'Beginner', 
          importance: 'Medium',
          resources: [
            { type: 'Documentation', title: 'MongoDB Manual', url: 'https://docs.mongodb.com/manual/' },
            { type: 'Tutorial', title: 'MongoDB University', url: 'https://university.mongodb.com/' }
          ]
        }
      ],
      roadmap: [
        {
          step: 1,
          title: 'Master Core Concepts',
          description: 'Build a strong foundation by learning the core concepts and fundamentals.',
          duration: '2-4 weeks',
          resources: [
            { type: 'Article', title: 'JavaScript Fundamentals', url: 'https://javascript.info/first-steps' },
            { type: 'Video', title: 'JavaScript Crash Course', url: 'https://www.youtube.com/watch?v=hdI2bqOjy3c' }
          ]
        },
        {
          step: 2,
          title: 'Build Interactive UIs with React',
          description: 'Learn to build dynamic user interfaces with React components and hooks.',
          duration: '3-5 weeks',
          resources: learningResources['React']
        },
        {
          step: 3,
          title: 'Develop Backend with Node.js',
          description: 'Create server-side applications and APIs using Node.js and Express.',
          duration: '4-6 weeks',
          resources: learningResources['Node.js']
        },
        {
          step: 4,
          title: 'Full-Stack Project',
          description: 'Combine all your skills to build and deploy a full-stack application.',
          duration: '4-6 weeks',
          resources: [
            { type: 'Tutorial', title: 'Full-Stack Project Guide', url: 'https://www.freecodecamp.org/learn' },
            { type: 'Video', title: 'MERN Stack Tutorial', url: 'https://www.youtube.com/watch?v=PBTYxXADG_k' }
          ]
        }
      ]
    };
  }
});