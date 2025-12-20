import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userMessage, conversationData, targetLanguage, userApiKey } = await request.json();

    // Validate input
    if (!userMessage || !conversationData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (typeof userMessage !== 'string' || userMessage.length > 1000) {
      return NextResponse.json({ error: 'Invalid message format or too long' }, { status: 400 });
    }

    if (typeof conversationData !== 'object') {
      return NextResponse.json({ error: 'Invalid conversation data' }, { status: 400 });
    }

    // Validate user API key if provided
    if (userApiKey && (typeof userApiKey !== 'string' || userApiKey.length > 200)) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
    }

    // Use user's API key if provided, otherwise fall back to server key
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('No API key available');
      return NextResponse.json({ 
        error: 'No API key configured. Please provide your own API key in settings.' 
      }, { status: 500 });
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
    conversationData.dialogue?.forEach((line: { speaker: string; text: string; en?: string; th?: string }, idx: number) => {
      contextText += `${idx + 1}. ${line.speaker}: ${line.text}\n`;
      if (line.en) contextText += `   English: ${line.en}\n`;
      if (line.th) contextText += `   Thai: ${line.th}\n`;
    });
    
    // Add vocabulary
    if (conversationData.vocabulary?.length > 0) {
      contextText += `\n\nVocabulary:\n`;
      conversationData.vocabulary.forEach((v: { word: string; reading?: string; meaning_en: string; meaning_th?: string }, idx: number) => {
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
      conversationData.grammar.forEach((g: { point: string; explanation_en: string }, idx: number) => {
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
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
        return NextResponse.json({ 
          error: 'Invalid API key. Please check your settings.' 
        }, { status: 401 });
      } else if (response.status === 429) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded. Please try again later.' 
        }, { status: 429 });
      } else {
        return NextResponse.json({ 
          error: 'Failed to get response. Please try again.' 
        }, { status: 500 });
      }
    }

    const data = await response.json();

    // Validate response
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid API response structure');
      return NextResponse.json({ 
        error: 'Invalid response from AI service. Please try again.' 
      }, { status: 500 });
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    return NextResponse.json({
      message: aiResponse
    });

  } catch (error) {
    console.error('Server error:', error);
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.' 
    }, { status: 500 });
  }
}
