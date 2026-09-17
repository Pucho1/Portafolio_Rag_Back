import { ChatOpenAI } from "@langchain/openai";

import { retrievalRouteSchema, RetrievalRoute } from "./schema";
import { DomainCatalog } 												from "../domain/domainCatalog ";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

export async function routeQuery( query: string, domainCatalog: DomainCatalog): Promise<RetrievalRoute> {

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
		- Only use categories that exist in the provided catalog.
		- Only use project types that exist in the provided catalog.
		- You may select multiple categories when the question requires information from different sources.
		- Do not invent categories or project types.
		- Rewrite the user's question into a concise retrieval query.
		- Do not answer the user's question.

		User question:
		${query}
	`;

  return structuredModel.invoke(prompt);
}

