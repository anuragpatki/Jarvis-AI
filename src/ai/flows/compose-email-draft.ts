// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview An email composition AI agent.
 *
 * - composeEmailDraft - A function that handles the email composition process.
 * - ComposeEmailDraftInput - The input type for the composeEmailDraft function.
 * - ComposeEmailDraftOutput - The return type for the composeEmailDraft function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ComposeEmailDraftInputSchema = z.object({
  recipient: z
    .string()
    .email()
    .describe('The email address of the recipient.'),
  subject: z.string().describe('The subject line of the email.'),
  intention: z.string().describe('The purpose or intention of the email.'),
});

export type ComposeEmailDraftInput = z.infer<typeof ComposeEmailDraftInputSchema>;

const ComposeEmailDraftOutputSchema = z.object({
  emailDraft: z.string().describe('The AI-generated email draft.'),
});

export type ComposeEmailDraftOutput = z.infer<typeof ComposeEmailDraftOutputSchema>;

export async function composeEmailDraft(input: ComposeEmailDraftInput): Promise<ComposeEmailDraftOutput> {
  return composeEmailDraftFlow(input);
}

const prompt = ai.definePrompt({
  name: 'composeEmailDraftPrompt',
  input: {schema: ComposeEmailDraftInputSchema},
  output: {schema: ComposeEmailDraftOutputSchema},
  prompt: `You are an AI email assistant. Your job is to compose a draft email based on the provided information.

  Recipient: {{{recipient}}}
  Subject: {{{subject}}}
  Intention: {{{intention}}}

  Compose a complete email draft that fulfills the intention. Be polite and professional.
  `,
});

const composeEmailDraftFlow = ai.defineFlow(
  {
    name: 'composeEmailDraftFlow',
    inputSchema: ComposeEmailDraftInputSchema,
    outputSchema: ComposeEmailDraftOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
