import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response('API key not configured', { status: 500 });
  }

  const genai = new GoogleGenerativeAI(apiKey);

  const model = genai.getGenerativeModel({
    model: 'gemini-1.5-pro',
  });

  const requestBody = await request.json();
  const prompt = requestBody.body;

  const result = await model.generateContent(prompt);

  const response = result.response;

  const output = response?.text || 'No response from model';

  return new Response(output(), {
    headers: { 'Content-Type': 'application/json' },
  });
}
