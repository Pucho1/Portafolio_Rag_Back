import { z } from "zod";

export const retrievalRouteSchema = z.object({
  query: z.string().min(1, "La consulta no puede estar vacía"),
  category: z.array(z.string()).optional(),
  projectType: z.array(z.string()).optional(),
});


export type RetrievalRoute = z.infer<typeof retrievalRouteSchema>;