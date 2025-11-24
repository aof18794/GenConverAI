// Vercel Serverless Function: Generate Audio
// Supports both user-provided API keys and server-side fallback
// Security hardened with input validation and sanitized errors

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversationData, charactersData, userApiKey } = req.body;

    // Validate input exists
    if (!conversationData || !charactersData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate input types
    if (typeof conversationData !== 'object' || typeof charactersData !== 'object') {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // Validate arrays
    if (!Array.isArray(conversationData.dialogue) || !Array.isArray(charactersData)) {
      return res.status(400).json({ error: 'Invalid data structure' });
    }

    // Validate reasonable limits
    if (conversationData.dialogue.length > 100) {
      return res.status(400).json({ error: 'Conversation too long (max 100 lines)' });
    }

    if (charactersData.length > 10) {
      return res.status(400).json({ error: 'Too many characters (max 10)' });
    }

    // Validate user API key if provided
    if (userApiKey && (typeof userApiKey !== 'string' || userApiKey.length > 200)) {
      return res.status(400).json({ error: 'Invalid API key format' });
    }

    // Use user's API key if provided, otherwise fall back to server key
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('No API key available');
      return res.status(500).json({ 
        error: 'No API key configured. Please provide your own API key in settings.' 
      });
    }

    // Helper functions (same as frontend)
    const getGender = (speaker, characters) => {
      const char = characters.find(c => c.name === speaker);
      return char ? char.gender : 'male';
    };

    const getVoiceName = (gender) => {
      return gender.toLowerCase() === 'female' ? 'Puck' : 'Kore';
    };

    // Build speaker markup with proper escaping
    let speakerMarkup = '';
    conversationData.dialogue.forEach((line) => {
      if (!line.speaker || !line.text) {
        return; // Skip invalid lines
      }
      
      const gender = getGender(line.speaker, charactersData);
      const voiceName = getVoiceName(gender);
      
      // Basic HTML escaping to prevent injection
      const escapedText = String(line.text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
        
      speakerMarkup += `<speak><voice name="${voiceName}">${escapedText}</voice></speak>\\n`;
    });

    // Build voice config
    const speakerVoiceConfigs = charactersData.map(char => ({
      speaker: char.name,
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: getVoiceName(char.gender)
        }
      }
    }));

    // Call Gemini TTS API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: speakerMarkup }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: speakerVoiceConfigs
              }
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      
      // Log full error server-side for debugging
      console.error('Gemini TTS API error:', {
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
          error: 'Failed to generate audio. Please try again.' 
        });
      }
    }

    const data = await response.json();

    // Validate response
    if (!data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
      console.error('Invalid TTS response structure');
      return res.status(500).json({ 
        error: 'Invalid response from audio service. Please try again.' 
      });
    }

    // Return the audio data
    // Ensure no newlines in base64 string
    const rawBase64 = data.candidates[0].content.parts[0].inlineData.data;
    const cleanBase64 = rawBase64.replace(/\s/g, '');
    
    return res.status(200).json({
      audioData: cleanBase64
    });

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
