import { CohereRerank }                   from "@langchain/cohere";
import { Document }                       from "@langchain/core/documents";
import { RunnableConfig, RunnableLambda } from "@langchain/core/runnables";

import { CohereClient } from "cohere-ai";

import "dotenv/config";


export type RerankedDocs = {
  index: number;
  relevanceScore: number  | null;
}

type RerankInput = {
  hybridResults: Document[];
  query: string;
}

const RERANK_TOP_N = 5; // Número de documentos a reordenar y devolver
const COHERE_TIMEOUT_S = 2;
const COHERE_MAX_RETRIES = 0;

const cohereClient = new CohereClient({ token:  process.env.COHERE_API_KEY, timeoutInSeconds: COHERE_TIMEOUT_S, maxRetries: COHERE_MAX_RETRIES });
const cohereRerank = new CohereRerank({
  client: cohereClient,
  model: "rerank-multilingual-v3.0",
});

// CohereRerank.rerank() no es un Runnable ni acepta callbacks, así que lo envuelvo en un
// RunnableLambda para que al invocarlo con el config aparezca como hijo en la traza.
const cohereRerankRunnable = RunnableLambda.from(
  ({ hybridResults, query }: RerankInput): Promise<RerankedDocs[]> =>
    cohereRerank.rerank(hybridResults, query, { topN: RERANK_TOP_N })
)
.withConfig({ runName: "cohere-rerank" })
.withFallbacks([
  RunnableLambda.from(
    ({ hybridResults }: RerankInput): RerankedDocs[] => {


      const rerankedDocs = hybridResults.slice(0, RERANK_TOP_N).map((_doc, index) => ({
        index,
        relevanceScore: null,
      }));
      return rerankedDocs;
    }
  ).withConfig({ runName: "cohere-rerank-fallback" })
]);

//  ------COHERE RERANKER-------
// Cohere Rerank es un modelo de reordenamiento de resultados de búsqueda que utiliza técnicas de aprendizaje profundo 
// para mejorar la relevancia de los resultados devueltos por un motor de búsqueda. 
// El modelo se entrena utilizando un conjunto de datos de consultas y documentos relevantes, 
// y aprende a asignar puntuaciones a los documentos en función de su relevancia para una consulta dada.
export async function getReRankedDoc (hybridResults: Document[], query: string, config?: RunnableConfig): Promise<RerankedDocs[]> {

  return cohereRerankRunnable.invoke({ hybridResults, query }, config);

}