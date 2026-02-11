import { DOCUMENT_EXTRACTOR_SYSTEM_PROMPT, PROMPT_GENERATOR_SYSTEM_PROMPT, PROMPT_FORMATTER_SYSTEM_PROMPT } from '@/lib/aiPromptAgents';
import type { AgentPromptProfile, DocumentExtractionResult, PromptGenerationResult } from '@/types/aiPrompt';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-4';
const TEMPERATURE = 0.2; // Low temperature for accuracy

/**
 * Agent A: Document Extractor
 * Extracts structured business profile from document text
 */
export async function extractDocumentProfile(
  extractedText: string
): Promise<DocumentExtractionResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: DOCUMENT_EXTRACTOR_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Extract business information from this document:\n\n${extractedText}`,
        },
      ],
      temperature: TEMPERATURE,
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from AI');
  }

  try {
    const result = JSON.parse(content);
    return {
      extractedProfile: result,
      missingFields: result.missingFields || [],
    };
  } catch (parseError) {
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Agent B: Prompt Generator
 * Generates final prompt from structured profile, or returns clarification questions
 */
export async function generatePromptFromProfile(
  profile: Partial<AgentPromptProfile>
): Promise<PromptGenerationResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: PROMPT_GENERATOR_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Generate a prompt from this business profile:\n\n${JSON.stringify(profile, null, 2)}`,
        },
      ],
      temperature: TEMPERATURE,
      response_format: { type: 'json_object' },
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from AI');
  }

  try {
    return JSON.parse(content);
  } catch (parseError) {
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Agent C: Prompt Formatter
 * Formats raw unstructured prompt into structured format
 */
export async function formatRawPrompt(
  rawPrompt: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: PROMPT_FORMATTER_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Format this prompt:\n\n${rawPrompt}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}
