
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { scenario, targetLanguage } = await req.json();

    let systemInstruction = "";

    if (targetLanguage === 'japanese') {
      systemInstruction = `
You are a helpful Japanese language practice partner. Your goal is to help the user practice speaking Japanese through a roleplay scenario.
Your persona: ${scenario || "A friendly Japanese local"}.
Current scenario: ${scenario || "General conversation"}.

Guidelines:
1. Speak natural, conversational Japanese appropriate for the scenario.
2. Adjust your difficulty to the user's level (assume beginner-intermediate unless shown otherwise).
3. If the user struggles, you can provide brief hints in simple English, but try to stay in character.
4. Keep responses relatively short to encourage back-and-forth dialogue.
5. React naturally to what the user says.
      `.trim();
    } else {
        systemInstruction = `
You are a helpful English language practice partner. Your goal is to help the user practice speaking English through a roleplay scenario.
Your persona: ${scenario || "A friendly local"}.
Current scenario: ${scenario || "General conversation"}.

Guidelines:
1. Speak natural, conversational English appropriate for the scenario.
2. Adjust your difficulty to the user's level.
3. Keep responses relatively short to encourage back-and-forth dialogue.
4. React naturally to what the user says.
      `.trim();
    }

    return NextResponse.json({ systemInstruction });
  } catch (error) {
    console.error('Error in roleplay-chat:', error);
    return NextResponse.json({ error: 'Failed to generate roleplay config' }, { status: 500 });
  }
}
