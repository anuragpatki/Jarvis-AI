'use server';

/**
 * @fileOverview Generates a Google Docs document based on a user's request.
 *
 * - generateGoogleDoc - A function that handles the Google Doc generation process.
 * - GenerateGoogleDocInput - The input type for the generateGoogleDoc function.
 * - GenerateGoogleDocOutput - The return type for the generateGoogleDoc function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGoogleDocInputSchema = z.object({
  topic: z.string().describe('The topic to generate the Google Doc about.'),
});
export type GenerateGoogleDocInput = z.infer<typeof GenerateGoogleDocInputSchema>;

const GenerateGoogleDocOutputSchema = z.object({
  documentContent: z.string().describe('The generated content of the Google Doc.'),
});
export type GenerateGoogleDocOutput = z.infer<typeof GenerateGoogleDocOutputSchema>;

export async function generateGoogleDoc(input: GenerateGoogleDocInput): Promise<GenerateGoogleDocOutput> {
  return generateGoogleDocFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGoogleDocPrompt',
  input: {schema: GenerateGoogleDocInputSchema},
  output: {schema: GenerateGoogleDocOutputSchema},
  prompt: `You are an expert in creating Google Docs documents.

  Based on the topic provided, generate content for a Google Doc summarizing the topic.

  Topic: {{{topic}}}`,
});

const generateGoogleDocFlow = ai.defineFlow(
  {
    name: 'generateGoogleDocFlow',
    inputSchema: GenerateGoogleDocInputSchema,
    outputSchema: GenerateGoogleDocOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
