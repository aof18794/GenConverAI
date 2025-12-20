import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { topicPrompt, systemPrompt, userApiKey, model, responseType } = await request.json();

    // Validate input types and lengths
    if (!topicPrompt || typeof topicPrompt !== 'string' || topicPrompt.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid topic prompt' }, { status: 400 });
    }
    
    if (!systemPrompt || typeof systemPrompt !== 'string' || systemPrompt.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid system prompt' }, { status: 400 });
    }

    // Validate input lengths to prevent abuse
    if (topicPrompt.length > 2000) {
      return NextResponse.json({ error: 'Topic prompt too long (max 2000 characters)' }, { status: 400 });
    }

    if (systemPrompt.length > 20000) {
      return NextResponse.json({ error: 'System prompt too long' }, { status: 400 });
    }

    // Validate user API key if provided
    if (userApiKey && (typeof userApiKey !== 'string' || userApiKey.length > 200)) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
    }

    // Validate and select model (whitelist approach for security)
    const allowedModels = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    const selectedModel = allowedModels.includes(model) ? model : 'gemini-3-flash-preview';

    // Use user's API key if provided, otherwise fall back to server key
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('No API key available');
      return NextResponse.json({ 
        error: 'No API key configured. Please provide your own API key in settings.' 
      }, { status: 500 });
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
      
      console.error('Gemini API error:', {
        status: response.status,
        error: errorData
      });
      
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ 
          error: 'Invalid API key. Please check your settings.' 
        }, { status: 401 });
      } else if (response.status === 429) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded. Please try again later.' 
        }, { status: 429 });
      } else {
        return NextResponse.json({ 
          error: 'Failed to generate conversation. Please try again.' 
        }, { status: 500 });
      }
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.candidates || !Array.isArray(data.candidates)) {
      console.error('Invalid response structure');
      return NextResponse.json({ 
        error: 'Invalid response from AI service. Please try again.' 
      }, { status: 500 });
    }
    
    // Return the conversation data
    return NextResponse.json(data);

  } catch (error) {
    console.error('Server error:', error);
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.' 
    }, { status: 500 });
  }
}
