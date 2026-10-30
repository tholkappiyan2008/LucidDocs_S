import { z } from 'zod';

export const askQuestionSchema = z.object({
  question: z
    .string({ required_error: 'Question is required' })
    .trim()
    .min(2, 'Question must be at least 2 characters long')
    .max(1000, 'Question must not exceed 1000 characters'),
  language: z.enum(['en', 'ta', 'te', 'hi']).default('en'),
});

export type AskQuestionInput = z.infer<typeof askQuestionSchema>;
