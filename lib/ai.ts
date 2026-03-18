import { GoogleGenAI } from '@google/genai';
import { Settings } from './db';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

async function callLLM(prompt: string, model: string, settings: Settings) {
  if (model.startsWith('gemini')) {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || '';
  } else if (model.startsWith('gpt')) {
    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'openai', model, prompt, apiKey: settings.openaiKey })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text;
  } else if (model.startsWith('claude')) {
    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'anthropic', model, prompt, apiKey: settings.anthropicKey })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text;
  }
  return '';
}

export async function generateSummary(transcript: string, settings: Settings) {
  const style = settings.summaryStyle;
  const customPrompt = settings.customPrompts?.[0]?.prompt; // Assuming first custom prompt if any

  let prompt = '';
  if (style === 'default') {
    prompt = `Summarize the following meeting transcript. Include: Key points, Decisions, Action items, Questions, and Notes.\n\nTranscript:\n${transcript}`;
  } else if (style === 'short') {
    prompt = `Provide a brief, concise summary of the following meeting transcript.\n\nTranscript:\n${transcript}`;
  } else if (style === 'long') {
    prompt = `Provide a detailed, comprehensive summary of the following meeting transcript.\n\nTranscript:\n${transcript}`;
  } else if (style === 'bullet points only') {
    prompt = `Summarize the following meeting transcript using only bullet points.\n\nTranscript:\n${transcript}`;
  } else if (style === 'custom' && customPrompt) {
    prompt = `${customPrompt}\n\nTranscript:\n${transcript}`;
  } else {
    prompt = `Summarize the following meeting transcript.\n\nTranscript:\n${transcript}`;
  }

  return callLLM(prompt, settings.summaryModel, settings);
}

export async function askLiveQuestion(transcript: string, questionType: string, customQuestion: string | undefined, settings: Settings) {
  let prompt = '';
  if (questionType === 'missed') {
    prompt = `Based on the following meeting transcript, what did I just miss in the last few minutes? Summarize the most recent topics.\n\nTranscript:\n${transcript}`;
  } else if (questionType === 'summarize_2m') {
    prompt = `Summarize the last 2 minutes of the following meeting transcript.\n\nTranscript:\n${transcript}`;
  } else if (questionType === 'smart_question') {
    prompt = `Based on the following meeting transcript, suggest a smart, insightful question I could ask right now to drive the conversation forward.\n\nTranscript:\n${transcript}`;
  } else if (questionType === 'action_items') {
    prompt = `What are the action items discussed so far in the following meeting transcript?\n\nTranscript:\n${transcript}`;
  } else if (questionType === 'custom' && customQuestion) {
    prompt = `${customQuestion}\n\nTranscript:\n${transcript}`;
  } else {
    return '';
  }

  return callLLM(prompt, settings.liveModel, settings);
}

export async function transcribeAudioChunk(audioBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      const base64EncodeString = base64data.split(',')[1];
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: audioBlob.type || 'audio/webm',
                  data: base64EncodeString,
                },
              },
              {
                text: 'Transcribe this audio. If there are multiple speakers, label them as Speaker 1, Speaker 2, etc. Only output the transcription.',
              },
            ],
          },
        });
        resolve(response.text || '');
      } catch (error) {
        console.error('Transcription error:', error);
        resolve(''); // Return empty string on error to not break the flow
      }
    };
    reader.onerror = reject;
  });
}
