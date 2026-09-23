import { ChatOpenAI } from "@langchain/openai";

import { retrievalRouteSchema, RetrievalRoute } from "./schema";
import { loadDomainCatalog } from '../domain/domainCatalog ';

import "dotenv/config";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

/**
 *  Rutea una consulta de usuario a la categoría y tipo de proyecto más relevantes en el catálogo de dominio.
 * @param query 
 * @returns  Una promesa que resuelve a un objeto de ruta de recuperación que contiene la consulta reescrita, la categoría y el tipo de proyecto (si corresponde).
 */
async function routeQuery( query: string): Promise<RetrievalRoute> {

	const domainCatalog = await loadDomainCatalog();

  const structuredModel = model.withStructuredOutput(
    retrievalRouteSchema
  );

	const prompt = `
		You are a retrieval router for a closed-domain digital twin.

		Your job is to determine which parts of the knowledge base
		are relevant to the user's question.

		Available categories:
		${domainCatalog.categories.join(", ")}

		Available project types:
		${domainCatalog.projectTypes.join(", ")}

		Rules:
		${getRulesForQuery()}

		User question:
		${query}
	`;

  return structuredModel.invoke(prompt);
}

/**
 * Reglas para la generación de rutas de recuperación.
 * @returns 
 */
const getRulesForQuery = () => (
	`- Only use categories that exist in the provided catalog.
		- Only use project types that exist in the provided catalog.
		- You may select multiple categories when the question requires information from different sources.
		- Return null for category or projectType when no value applies; do not invent values.
		- Do not invent categories or project types.
		- Rewrite the user's question into a concise retrieval query.
		- Do not answer the user's question.`
)


/**
 *  Valida la ruta de recuperación generada por el modelo contra el catálogo de dominio.
 * @param route
 * @param catalog
 * @returns La ruta de recuperación validada.
 */
async function validateRoute(  route: RetrievalRoute ): Promise<RetrievalRoute> {

	const catalog = await loadDomainCatalog();


	// Validate the route against the domain catalog
  const invalidCategories = route.category?.filter(
    (category) => !catalog.categories.includes(category)
  ) ?? [];

	// Validate project types against the domain catalog
  const invalidProjectTypes = route.projectType?.filter(
    (projectType) => !catalog.projectTypes.includes(projectType)
  ) ?? [];

  if (invalidCategories.length > 0) {
    throw new Error(
      `Invalid categories: ${invalidCategories.join(", ")}`
    );
  }

  if (invalidProjectTypes.length > 0) {
    throw new Error(
      `Invalid project types: ${invalidProjectTypes.join(", ")}`
    );
  }

  return route;
}

async function getImportantDomainDocs(query: string): Promise<RetrievalRoute> {
	const docRoute 			 = await routeQuery(query);
	const validatedDocsRoute = await validateRoute(docRoute);

	return validatedDocsRoute;
};

/**
 * Obtengo los documentos más relevantes para la consulta dada ruteo.
 * @param query 
 * @returns 
 */
export async function getRouterResults (query: string) {
  const routerDomains = await getImportantDomainDocs(query);
  const categories = routerDomains.category ?? [];
  const projectTypes = routerDomains.projectType ?? [];

  return {categories, projectTypes};
};


