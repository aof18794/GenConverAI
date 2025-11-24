// Vercel Serverless Function: Chat with AI about conversation
// Allows users to ask questions about the current conversation

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userMessage, conversationData, targetLanguage, userApiKey } = req.body;

    // Validate input
    if (!userMessage || !conversationData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (typeof userMessage !== 'string' || userMessage.length > 1000) {
      return res.status(400).json({ error: 'Invalid message format or too long' });
    }

    if (typeof conversationData !== 'object') {
      return res.status(400).json({ error: 'Invalid conversation data' });
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

    // Build context from conversation
    const language = targetLanguage === 'japanese' ? 'Japanese' : 'English';
    const level = conversationData.level || 'N/A';
    
    // Build conversation context
    let contextText = `Current Conversation (${language} - Level ${level}):\n\n`;
    contextText += `Title: ${conversationData.title}\n`;
    contextText += `Situation: ${conversationData.situation}\n\n`;
    
    // Add dialogue
    contextText += `Dialogue:\n`;
    conversationData.dialogue?.forEach((line, idx) => {
      contextText += `${idx + 1}. ${line.speaker}: ${line.text}\n`;
      if (line.en) contextText += `   English: ${line.en}\n`;
      if (line.th) contextText += `   Thai: ${line.th}\n`;
    });
    
    // Add vocabulary
    if (conversationData.vocabulary?.length > 0) {
      contextText += `\n\nVocabulary:\n`;
      conversationData.vocabulary.forEach((v, idx) => {
        contextText += `${idx + 1}. ${v.word}`;
        if (v.reading) contextText += ` (${v.reading})`;
        contextText += ` - ${v.meaning_en}`;
        if (v.meaning_th) contextText += ` / ${v.meaning_th}`;
        contextText += `\n`;
      });
    }
    
    // Add grammar
    if (conversationData.grammar?.length > 0) {
      contextText += `\n\nGrammar Points:\n`;
      conversationData.grammar.forEach((g, idx) => {
        contextText += `${idx + 1}. ${g.point}\n`;
        contextText += `   ${g.explanation_en}\n`;
      });
    }

    // Build system prompt
    const systemPrompt = `You are a helpful ${language} language learning assistant. The user is studying ${language} at ${level} level.

${contextText}

Instructions:
- Answer the user's questions about this conversation
- Provide clear, concise explanations in a friendly tone
- Use both English and Thai in your responses when helpful
- Give specific examples from the conversation when relevant
- Encourage the learner
- If asked about vocabulary, provide:
  * Clear definition
  * Example sentences
  * Common usage patterns
- If asked about grammar, provide:
  * Simple explanation
  * Examples from the conversation
  * Additional practice examples

Keep responses concise but informative (2-4 paragraphs maximum).`;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt }]
            },
            {
              parts: [{ text: userMessage }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      
      console.error('Gemini API error:', {
        status: response.status,
        error: errorData
      });
      
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
          error: 'Failed to get response. Please try again.' 
        });
      }
    }

    const data = await response.json();

    // Validate response
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid API response structure');
      return res.status(500).json({ 
        error: 'Invalid response from AI service. Please try again.' 
      });
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    return res.status(200).json({
      message: aiResponse
    });

  } catch (error) {
    console.error('Server error:', {
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      error: 'An unexpected error occurred. Please try again.' 
    });
  }
}
