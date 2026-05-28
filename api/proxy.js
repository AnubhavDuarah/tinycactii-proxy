export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const MODELS = [
    'google/gemma-2-9b-it:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'qwen/qwen-2-7b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
  ];

  const { messages } = req.body;

  for (const model of MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://www.tinycactii.shop',
          'X-Title': 'Tiny Cactii Support'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `You are Pahi, the friendly AI support assistant for Tiny Cactii, a live plant nursery based in Assam, India, founded by Anubhav Duarah. Your personality is warm, helpful, and caring. You speak in a friendly tone and occasionally use plant emojis. Keep answers concise and helpful. If unsure, direct users to WhatsApp +916900528070 or email tinycactiiii@gmail.com`
            },
            ...messages
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const data = await response.json();

      if (response.ok) {
        return res.status(200).json(data);
      }

      // 429 = rate limited, try next model
      if (response.status === 429) continue;

      // Other error, return it
      return res.status(response.status).json(data);

    } catch (err) {
      continue; // network error, try next model
    }
  }

  // All models failed
  return res.status(429).json({ error: 'All models are currently busy. Please try again in a moment.' });
}
