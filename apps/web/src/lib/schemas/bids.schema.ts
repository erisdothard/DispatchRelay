import { z } from 'zod';

export const SubmitBidInputSchema = z.object({
  loadId: z.string().uuid(),
  carrierId: z.string().uuid(),
  companyId: z.string().uuid().nullable(),
  companyName: z.string().min(1),
  amountUsd: z.number().positive(),
  notes: z.string().optional(),
});

export const CounterOfferInputSchema = z.object({
  bidId: z.string().uuid(),
  amountUsd: z.number().positive(),
  notes: z.string().optional(),
});

export type SubmitBidInput = z.infer<typeof SubmitBidInputSchema>;
export type CounterOfferInput = z.infer<typeof CounterOfferInputSchema>;
