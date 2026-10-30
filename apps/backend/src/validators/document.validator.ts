import { z } from 'zod';

export const KeyFactSchema = z.object({
  label: z.string().min(1, 'Key fact label is required'),
  value: z.string().min(1, 'Key fact value is required'),
  confidence: z.number().min(0).max(1).default(0.9),
});

export const DeadlineSchema = z.object({
  what: z.string().min(1, 'Deadline description is required'),
  date: z.string().min(1, 'Deadline date is required'),
});

export const RiskSchema = z.object({
  level: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  note: z.string().min(1, 'Risk note is required'),
});

export const DocumentAnalysisSchema = z.object({
  doc_type: z.string().min(1, 'Document type is required'),
  sender: z.string().min(1, 'Sender organization or authority is required'),
  plain_summary: z.string().min(1, 'Plain-language summary is required'),
  key_facts: z.array(KeyFactSchema).default([]),
  deadlines: z.array(DeadlineSchema).default([]),
  risks: z.array(RiskSchema).default([]),
  next_steps: z.array(z.string()).default([]),
  needs_human_check: z.array(z.string()).default([]),
});

export type KeyFact = z.infer<typeof KeyFactSchema>;
export type Deadline = z.infer<typeof DeadlineSchema>;
export type Risk = z.infer<typeof RiskSchema>;
export type DocumentAnalysis = z.infer<typeof DocumentAnalysisSchema>;

