// Vercel Serverless Function: Generate Conversation
// Supports both user-provided API keys and server-side fallback
// Security hardened with input validation and sanitized errors

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topicPrompt, systemPrompt, userApiKey, model, responseType } = req.body;

    // Validate input types and lengths
    if (!topicPrompt || typeof topicPrompt !== 'string' || topicPrompt.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid topic prompt' });
    }
    
    if (!systemPrompt || typeof systemPrompt !== 'string' || systemPrompt.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid system prompt' });
    }

    // Validate input lengths to prevent abuse
    if (topicPrompt.length > 2000) {
      return res.status(400).json({ error: 'Topic prompt too long (max 2000 characters)' });
    }

    if (systemPrompt.length > 20000) {
      return res.status(400).json({ error: 'System prompt too long' });
    }

    // Validate user API key if provided
    if (userApiKey && (typeof userApiKey !== 'string' || userApiKey.length > 200)) {
      return res.status(400).json({ error: 'Invalid API key format' });
    }

    // Validate and select model (whitelist approach for security)
    const allowedModels = ['gemini-3-flash-preview', 'gemini-2.5-flash-preview-09-2025'];
    const selectedModel = allowedModels.includes(model) ? model : 'gemini-3-flash-preview';

    // Use user's API key if provided, otherwise fall back to server key
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('No API key available');
      return res.status(500).json({ 
        error: 'No API key configured. Please provide your own API key in settings.' 
      });
    }

    // Build generation config based on response type
    const generationConfig = responseType === 'text' 
      ? {} // Plain text output
      : { responseMimeType: 'application/json' }; // JSON output (default)

    // Call Gemini API with selected model
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: topicPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      
      // Log full error server-side for debugging
      console.error('Gemini API error:', {
        status: response.status,
        error: errorData
      });
      
      // Return sanitized error to client (no details exposed)
      if (response.status === 401 || response.status === 403) {
        return res.status(401).json({ 
          error: 'Invalid API key. Please check your settings.' 
        });
      } else if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Please try again later.' 
        });
      } else {
        return res.status(500).json({ 
          error: 'Failed to generate conversation. Please try again.' 
        });
      }
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.candidates || !Array.isArray(data.candidates)) {
      console.error('Invalid  response structure');
      return res.status(500).json({ 
        error: 'Invalid response from AI service. Please try again.' 
      });
    }
    
    // Return the conversation data
    return res.status(200).json(data);

  } catch (error) {
    // Log full error server-side
    console.error('Server error:', {
      message: error.message,
      stack: error.stack
    });
    
    // Return generic error to client (no details exposed)
    return res.status(500).json({ 
      error: 'An unexpected error occurred. Please try again.' 
    });
  }
}
