
'use server';
/**
 * @fileOverview A Genkit flow to perform a search-like query using Gemini.
 *
 * - searchWithGemini - A function that handles the search query.
 * - SearchWithGeminiInput - The input type for the searchWithGemini function.
 * - SearchWithGeminiOutput - The return type for the searchWithGemini function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchWithGeminiInputSchema = z.object({
  query: z.string().describe('The search query or question from the user.'),
});
export type SearchWithGeminiInput = z.infer<typeof SearchWithGeminiInputSchema>;

const SearchWithGeminiOutputSchema = z.object({
  searchResult: z.string().describe('The answer or summary found for the search query.'),
});
export type SearchWithGeminiOutput = z.infer<typeof SearchWithGeminiOutputSchema>;

export async function searchWithGemini(input: SearchWithGeminiInput): Promise<SearchWithGeminiOutput> {
  return searchWithGeminiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchWithGeminiPrompt',
  input: {schema: SearchWithGeminiInputSchema},
  output: {schema: SearchWithGeminiOutputSchema},
  prompt: `You are a helpful AI assistant. The user wants to find information about the following topic.
Provide a concise and informative answer based on their query.

User Query: {{{query}}}

Based on this query, provide a helpful searchResult.`,
});

const searchWithGeminiFlow = ai.defineFlow(
  {
    name: 'searchWithGeminiFlow',
    inputSchema: SearchWithGeminiInputSchema,
    outputSchema: SearchWithGeminiOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
