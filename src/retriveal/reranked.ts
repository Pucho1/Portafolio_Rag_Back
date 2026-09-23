import { CohereRerank } from "@langchain/cohere";
import { Document } from "@langchain/core/documents";


export type RerankedDocs = { 
  index: number;
  relevanceScore: number
}

//  ------COHERE RERANKER-------
// Cohere Rerank es un modelo de reordenamiento de resultados de búsqueda que utiliza técnicas de aprendizaje profundo 
// para mejorar la relevancia de los resultados devueltos por un motor de búsqueda. 
// El modelo se entrena utilizando un conjunto de datos de consultas y documentos relevantes, 
// y aprende a asignar puntuaciones a los documentos en función de su relevancia para una consulta dada.
export async function getReRankedDoc (hybridResults: Document[], query: string): Promise<RerankedDocs[]> {

  const cohereRerank = new CohereRerank({
    apiKey: process.env.COHERE_API_KEY,
    model: "rerank-multilingual-v3.0",
  });


  const rerankedDocuments = await cohereRerank.rerank(
    hybridResults,
    query,
    { topN: 5 }
  );

  return rerankedDocuments;

}