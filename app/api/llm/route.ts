import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { provider, model, prompt, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: `API key for ${provider} is missing.` }, { status: 400 });
    }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return NextResponse.json({ text: data.choices[0].message.content });
    } else if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return NextResponse.json({ text: data.content[0].text });
    }

    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
