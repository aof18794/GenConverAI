import { NextRequest, NextResponse } from 'next/server';

interface Character {
  name: string;
  gender: string;
}

interface DialogueLine {
  speaker: string;
  text: string;
}

interface ConversationData {
  dialogue: DialogueLine[];
}

export async function POST(request: NextRequest) {
  try {
    const { conversationData, charactersData, userApiKey } = await request.json();

    // Validate input exists
    if (!conversationData || !charactersData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate input types
    if (typeof conversationData !== 'object' || typeof charactersData !== 'object') {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Validate arrays
    if (!Array.isArray(conversationData.dialogue) || !Array.isArray(charactersData)) {
      return NextResponse.json({ error: 'Invalid data structure' }, { status: 400 });
    }

    // Validate reasonable limits
    if (conversationData.dialogue.length > 100) {
      return NextResponse.json({ error: 'Conversation too long (max 100 lines)' }, { status: 400 });
    }

    if (charactersData.length > 10) {
      return NextResponse.json({ error: 'Too many characters (max 10)' }, { status: 400 });
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

    // Helper functions
    const getGender = (speaker: string, characters: Character[]): string => {
      const char = characters.find(c => c.name === speaker);
      return char ? char.gender : 'male';
    };

    const getVoiceName = (gender: string): string => {
      return gender.toLowerCase() === 'female' ? 'Puck' : 'Kore';
    };

    // Build speaker markup with proper escaping
    let speakerMarkup = '';
    conversationData.dialogue.forEach((line: DialogueLine) => {
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
    const speakerVoiceConfigs = charactersData.map((char: Character) => ({
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
      
      console.error('Gemini TTS API error:', {
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
          error: 'Failed to generate audio. Please try again.' 
        }, { status: 500 });
      }
    }

    const data = await response.json();

    // Validate response
    if (!data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
      console.error('Invalid TTS response structure');
      return NextResponse.json({ 
        error: 'Invalid response from audio service. Please try again.' 
      }, { status: 500 });
    }

    // Return the audio data
    const rawBase64 = data.candidates[0].content.parts[0].inlineData.data;
    const cleanBase64 = rawBase64.replace(/\s/g, '');
    
    return NextResponse.json({
      audioData: cleanBase64
    });

  } catch (error) {
    console.error('Server error:', error);
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.' 
    }, { status: 500 });
  }
}
