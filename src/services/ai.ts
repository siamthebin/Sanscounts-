import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function summarizeEmail(body: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize the following email in 1-2 short sentences:\n\n${body}`,
    });
    return response.text || 'Could not generate summary.';
  } catch (error) {
    console.error('Error summarizing email:', error);
    return 'Error generating summary.';
  }
}

export async function generateReply(originalEmailBody: string, tone: string = 'professional'): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a ${tone} reply to the following email:\n\n${originalEmailBody}`,
    });
    return response.text || '';
  } catch (error) {
    console.error('Error generating reply:', error);
    return '';
  }
}
