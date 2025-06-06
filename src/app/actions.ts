
// src/app/actions.ts
'use server';

import { composeEmailDraft, type ComposeEmailDraftInput } from '@/ai/flows/compose-email-draft';
import { generateGoogleDoc } from '@/ai/flows/generate-google-doc';
import { searchWithGemini } from '@/ai/flows/search-with-gemini-flow.ts';
import { generateImage } from '@/ai/flows/generate-image-flow';


export type ProcessVoiceCommandOutput =
  | { type: 'googleDoc'; content: string; topic: string }
  | { type: 'emailComposeIntent' }
  | { type: 'youtubeSearch'; query: string }
  | { type: 'geminiSearch'; query: string; result: string }
  | { type: 'imageGenerated'; imageDataUri: string; prompt: string }
  | { type: 'mapsSearch'; query: string }
  | { type: 'openWebsiteSearch'; query: string }
  | { type: 'unknown'; message: string; transcript: string }
  | { type: 'error'; message: string };

export type HandleComposeEmailOutput =
  | { type: 'emailDraft'; draft: string }
  | { type: 'error'; message: string };

export async function processVoiceCommand(transcript: string): Promise<ProcessVoiceCommandOutput> {
  const lowerTranscript = transcript.toLowerCase();

  // "Open [website/term]" command - should be fairly specific
  if (lowerTranscript.startsWith('open ')) {
    const query = transcript.substring('open '.length).trim();
    if (query) {
      return { type: 'openWebsiteSearch', query };
    }
  }

  if ((lowerTranscript.includes('generate') || lowerTranscript.includes('create')) && (lowerTranscript.includes('document') || lowerTranscript.includes('doc'))) {
    const match = lowerTranscript.match(/(?:generate|create)(?: a| an)? (?:document|doc) (?:about|on) (.+)/);
    const topic = match && match[1] ? match[1].trim() : transcript.replace(/(generate|create) (a|an)? (document|doc) (about|on)/gi, '').trim();
    if (topic) {
      try {
        const result = await generateGoogleDoc({ topic });
        return { type: 'googleDoc', content: result.documentContent, topic };
      } catch (error) {
        console.error("Error generating Google Doc:", error);
        return { type: 'error', message: 'Failed to generate document content.' };
      }
    }
  }

  if (lowerTranscript.includes('email') || lowerTranscript.includes('mail') || lowerTranscript.includes('compose')) {
     if(lowerTranscript.includes('email') || lowerTranscript.includes('mail') || (lowerTranscript.includes('compose') && lowerTranscript.includes('email'))){
        return { type: 'emailComposeIntent' };
     }
  }

  // YouTube Search
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
    if (query === lowerTranscript) { // If no pattern matched, try to clean up common words
        query = query.replace(/search|find|look up|on youtube|youtube|for/gi, "").trim();
    }

    if (query) {
      return { type: 'youtubeSearch', query };
    }
  }

  // Google Maps Search
  const mapKeywords = [
    'search for (.+) on maps?',
    'find (.+) on (?:google )?maps?',
    'where is (.+)',
    'show me (.+) on the map',
    'map of (.+)',
    'navigate to (.+)',
    'directions to (.+)'
  ];

  for (const keywordPattern of mapKeywords) {
    const regex = new RegExp(keywordPattern, 'i');
    const match = lowerTranscript.match(regex);
    if (match && match[1]) {
      const query = match[1].trim();
      if (query) {
        return { type: 'mapsSearch', query };
      }
    }
  }
  // A more general "maps" command if it includes "map" or "maps" and some query
   if (lowerTranscript.includes(' map') || lowerTranscript.includes(' maps')) {
    let query = transcript;
    // Attempt to extract query by removing common map-related phrases if specific patterns didn't catch it
    query = query.replace(/search for|find|where is|show me|on the map|on maps|on google maps|map of|navigate to|directions to/gi, "").trim();
    query = query.replace(/maps?$/i, "").trim(); // Remove 'map' or 'maps' from the end
    if (query) {
      return { type: 'mapsSearch', query };
    }
  }


  // Image Generation
  const imageKeywords = [
    // With "an" or "a"
    'create an image of', 'create a image of',
    'generate an image of', 'generate a image of',
    'make an image of', 'make a image of',
    'draw an image of', 'draw a image of',
    'create a picture of', 'generate a picture of',
    'make a picture of', 'draw a picture of',
    'create a photo of', 'generate a photo of',
    'make a photo of', 'draw a photo of',
    'show me an image of', 'show me a picture of', 'show me a photo of',
    'i want an image of', 'i want a picture of', 'i want a photo of',
    // Without "an" or "a"
    'create image of',
    'generate image of',
    'make image of',
    'draw image of',
    'create picture of',
    'generate picture of',
    'make picture of',
    'draw picture of',
    'create photo of',
    'generate photo of',
    'make photo of',
    'draw photo of',
    'show me image of',
    'show me picture of',
    'show me photo of',
    'i want image of',
    'i want picture of',
    'i want photo of',
  ];
  for (const keyword of imageKeywords) {
    if (lowerTranscript.startsWith(keyword + ' ')) {
      const prompt = transcript.substring(keyword.length + 1).trim();
      if (prompt) {
        try {
          const result = await generateImage({ prompt });
          return { type: 'imageGenerated', imageDataUri: result.imageDataUri, prompt: result.prompt };
        } catch (error) {
          console.error("Error generating image:", error);
          return { type: 'error', message: `Failed to generate image for "${prompt}". Error: ${(error as Error).message}` };
        }
      }
    }
  }

  // Gemini Search - Catches "search for", "what is", "tell me about" etc.
  const searchKeywords = ['search for', 'what is', 'what are', 'tell me about', 'who is', 'who are', 'explain', 'define'];
  for (const keyword of searchKeywords) {
    if (lowerTranscript.startsWith(keyword + ' ')) {
      // Ensure this is not a map search query being misidentified
      if (mapKeywords.some(mapKeyword => lowerTranscript.match(new RegExp(mapKeyword.replace('(.+)', keyword + ' (.+)'))))) {
        continue;
      }
      const query = transcript.substring(keyword.length + 1).trim();
      if (query) {
        try {
          const result = await searchWithGemini({ query });
          return { type: 'geminiSearch', query, result: result.searchResult };
        } catch (error) {
          console.error("Error with Gemini search:", error);
          return { type: 'error', message: `Failed to search for "${query}".` };
        }
      }
    }
  }

  // A more general "search" or "find" command as a fallback if no specific keywords like "what is" were used
  if (lowerTranscript.startsWith('search ') || lowerTranscript.startsWith('find ')) {
    // Ensure this is not a map search query being misidentified
     if (mapKeywords.some(mapKeyword => lowerTranscript.match(new RegExp(mapKeyword.replace('(.+)', transcript.substring(transcript.indexOf(' ') + 1).trim()))))) {
        // Handled by map search
     } else {
        const query = transcript.substring(transcript.indexOf(' ') + 1).trim();
        if (query) {
            try {
            const result = await searchWithGemini({ query });
            return { type: 'geminiSearch', query, result: result.searchResult };
            } catch (error) {
            console.error("Error with general Gemini search:", error);
            return { type: 'error', message: `Failed to search for "${query}".` };
            }
        }
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

