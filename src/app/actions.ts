
// src/app/actions.ts
'use server';

import { composeEmailDraft, type ComposeEmailDraftInput } from '@/ai/flows/compose-email-draft';
import { generateGoogleDoc } from '@/ai/flows/generate-google-doc';
// EmailFormSchema and EmailFormData are now in src/lib/schemas.ts
// Zod is not directly used here anymore for EmailFormSchema definition
// import { z } from 'zod'; 

// Types are fine to export
export type ProcessVoiceCommandOutput =
  | { type: 'googleDoc'; content: string; topic: string }
  | { type: 'emailComposeIntent' }
  | { type: 'youtubeSearch'; query: string }
  | { type: 'unknown'; message: string; transcript: string }
  | { type: 'error'; message: string };

export type HandleComposeEmailOutput = 
  | { type: 'emailDraft'; draft: string }
  | { type: 'error'; message: string };

export async function processVoiceCommand(transcript: string): Promise<ProcessVoiceCommandOutput> {
  const lowerTranscript = transcript.toLowerCase();

  if ((lowerTranscript.includes('generate') || lowerTranscript.includes('create')) && (lowerTranscript.includes('document') || lowerTranscript.includes('doc'))) {
    const match = lowerTranscript.match(/(?:generate|create)(?: a| an)? (?:document|doc) (?:about|on) (.+)/);
    const topic = match && match[1] ? match[1].trim() : transcript; // Fallback to full transcript if specific topic extraction fails
    try {
      const result = await generateGoogleDoc({ topic });
      return { type: 'googleDoc', content: result.documentContent, topic };
    } catch (error) {
      console.error("Error generating Google Doc:", error);
      return { type: 'error', message: 'Failed to generate document content.' };
    }
  }

  if (lowerTranscript.includes('email') || lowerTranscript.includes('mail') || lowerTranscript.includes('compose')) {
     if(lowerTranscript.includes('email') || lowerTranscript.includes('mail') || (lowerTranscript.includes('compose') && lowerTranscript.includes('email'))){
        return { type: 'emailComposeIntent' };
     }
  }
  
  if (lowerTranscript.includes('youtube') && (lowerTranscript.includes('search') || lowerTranscript.includes('find') || lowerTranscript.includes('look up'))) {
    let query = lowerTranscript;
    const patterns = [
        /(?:search|find|look up) (?:on youtube |youtube )?for (.+)/,
        /(?:search|find|look up) (.+) on youtube/,
        /youtube (.+)/ 
    ];
    
    for (const pattern of patterns) {
        const match = lowerTranscript.match(pattern);
        if (match && match[1]) {
            query = match[1].trim();
            break;
        }
    }
     // Fallback if specific extraction failed but keywords present
    if (query === lowerTranscript) {
        query = query.replace(/search|find|look up|on youtube|youtube|for/gi, "").trim();
    }

    if (query) {
      return { type: 'youtubeSearch', query };
    }
  }
  
  return { type: 'unknown', message: "I'm not sure how to handle this request.", transcript };
}

export async function handleComposeEmail(data: ComposeEmailDraftInput): Promise<HandleComposeEmailOutput> {
  try {
    const result = await composeEmailDraft(data);
    return { type: 'emailDraft', draft: result.emailDraft };
  } catch (error) {
    console.error("Error composing email:", error);
    return { type: 'error', message: 'Failed to compose email draft.' };
  }
}
