export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;

  const systemPrompt = `You are Pahi, the friendly AI support assistant for Tiny Cactii, a live plant nursery based in Assam, India, founded by Anubhav Duarah. Your personality is warm, helpful, and caring. Use plant emojis occasionally. Keep answers concise. If unsure, direct users to WhatsApp +916900528070 or email tinycactiiii@gmail.com`;

  const geminiMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: geminiMessages,
          generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    if (!text) return res.status(500).json({ error: 'No response from Gemini' });

    return res.status(200).json({
      choices: [{ message: { role: 'assistant', content: text } }]
    });

  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
