import { z } from "zod";
import { DomainCatalog } from "../domain/domainCatalog ";


/**
 *  Construye un esquema de validación para la ruta de recuperación basado en el catálogo de dominio proporcionado.
 *  @param catalog - El catálogo de dominio que contiene las categorías y tipos de proyecto válidos.
 *  @returns Un esquema Zod que valida la estructura de la ruta de recuperación.
 */
export function buildRouteSchema(catalog: DomainCatalog) {
  const category    = z.enum(catalog.categories   as [string, ...string[]]); // Asegura que haya al menos un elemento en el array
  const projectType = z.enum(catalog.projectTypes as [string, ...string[]]); // Asegura que haya al menos un elemento en el array

  const inDomain = z.object({
    queryIntention: z.literal("in_domain"),
    reason:         z.string().min(1),
    query:          z.string().min(1),
    category:       z.array(category).min(1).nullable(), // Asegura que haya al menos un elemento en el array
    projectType:    z.array(projectType).min(1).nullable(), // Asegura que haya al menos un elemento en el array
  });

  const outOfDomain = z.object({
    queryIntention: z.literal("out_of_domain"),
    reason: z.string().min(1),
  });

  const manipulationAttempt = z.object({
    queryIntention: z.literal("manipulation_attempt"),
    reason: z.string().min(1),
  });

  // Devuelve un esquema que valida la estructura de la ruta de recuperación, asegurando que la decisión sea una de las tres posibles: in_domain, out_of_domain o manipulation_attempt.
  return z.object({
    decision: z.union([inDomain, outOfDomain, manipulationAttempt]),
  });
}

type RouterFailure = { decision: { queryIntention: "router_error" } }


export type RetrievalRoute = z.infer<ReturnType<typeof buildRouteSchema>>; // lee el esquema Zod y genera el tipo TS equivalente automáticamente
export type RouteDecision = RetrievalRoute["decision"]; // obtengo directamente los valores de la propiedad decision del tipo RetrievalRoute

export type QueryInput   = { query: string };
export type RouterResult  = {decision: RouteDecision };
export type RouterOutput = QueryInput & { routerResult: RouterResult | RouterFailure };