import { z } from "zod";

const inDomain = z.object({
  queryIntention: z.literal("in_domain"),
  reason: z.string().min(1),
  query: z.string().min(1, "La consulta no puede estar vacía"),
  category: z.array(z.string()).min(1).nullable(),
  projectType: z.array(z.string()).min(1).nullable(),
});

const outOfDomain = z.object({
  queryIntention: z.literal("out_of_domain"),
  reason: z.string().min(1),
});

const manipulationAttempt = z.object({
  queryIntention: z.literal("manipulation_attempt"),
  reason: z.string().min(1),
});

export const retrievalRouteSchema = z.object({
  decision: z.union([inDomain, outOfDomain, manipulationAttempt]),
});


export type RetrievalRoute = z.infer<typeof retrievalRouteSchema>;
export type RouteDecision = RetrievalRoute["decision"];

export type QueryInput   = { query: string };
export type RoutedInput  = { question: string; decision: RouteDecision };
export type RouterOutput = QueryInput & { routerResult: RoutedInput };