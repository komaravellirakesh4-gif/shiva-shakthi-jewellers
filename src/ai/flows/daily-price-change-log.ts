
'use server';

/**
 * @fileOverview An AI agent that maintains a history of daily price changes for admin review and auditing purposes.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyPriceChangeLogInputSchema = z.object({
  date: z.string().describe('The date for which to generate the price change log. Format: YYYY-MM-DD.'),
  goldPrice24K: z.number().describe('The price of 24K gold for the given date.'),
  silverPrice: z.number().describe('The price of silver for the given date.'),
});
export type DailyPriceChangeLogInput = z.infer<typeof DailyPriceChangeLogInputSchema>;

const DailyPriceChangeLogOutputSchema = z.object({
  log: z.string().describe('A summary of the daily price changes, including the date and prices for 24K Gold and Silver.'),
});
export type DailyPriceChangeLogOutput = z.infer<typeof DailyPriceChangeLogOutputSchema>;

export async function generateDailyPriceChangeLog(input: DailyPriceChangeLogInput): Promise<DailyPriceChangeLogOutput> {
  return dailyPriceChangeLogFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailyPriceChangeLogPrompt',
  input: {schema: DailyPriceChangeLogInputSchema},
  output: {schema: DailyPriceChangeLogOutputSchema},
  prompt: `You are an AI assistant specializing in generating daily price change logs for KBS Jewellers.

  Generate a concise log summarizing the prices for the given date.

  Date: {{{date}}}
  24K Gold Price: {{{goldPrice24K}}}
  Silver Price: {{{silverPrice}}}

  The log should be informative and easy to understand for admin review and auditing purposes.
  Make sure to include the date and the prices for all items.
  `,
});

const dailyPriceChangeLogFlow = ai.defineFlow(
  {
    name: 'dailyPriceChangeLogFlow',
    inputSchema: DailyPriceChangeLogInputSchema,
    outputSchema: DailyPriceChangeLogOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
