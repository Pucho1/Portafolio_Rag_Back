import { BM25Retriever } 	      from "@langchain/community/retrievers/bm25";
import { Document }             from "@langchain/core/documents";
import { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { MemoryVectorStore }    from '@langchain/classic/vectorstores/memory';

import { reciprocalRankFusion }   from "../helpers/reciprocarlRankFunctionCustom";

const getValues = (categories: string[], projectTypes: string[], doc: Document) => {

  const categoryMatches =
        categories.length === 0 || categories.includes(doc.metadata.category);
      const projectTypeMatches =
        projectTypes.length === 0 || projectTypes.includes(doc.metadata.projectType);
      return categoryMatches && projectTypeMatches;
};

async function hibridResult (  retrieverResult: VectorStoreRetriever,  bm25Retriever:  BM25Retriever,  query: string): Promise<Document[]> {
  
  const [vectorResults, bm25Results] = await Promise.all([
    retrieverResult.invoke(query),
    bm25Retriever.invoke(query),
  ]);

  const hybridResults = reciprocalRankFusion(
    vectorResults,
    bm25Results,
  );

  return hybridResults;
};


/**
 * 
 * @param query 
 * @param categories 
 * @param projectTypes 
 * @param chunks 
 * @returns 
 */
export async function getHibridResults(
  query: string,
  categories: string[],
  projectTypes: string[],
  chunks: Document[],
  vectorStore: MemoryVectorStore,
) {


   // filtro los documentos según la categoría y el tipo de proyecto obtenidos del router, para obtener los documentos más relevantes
  const filteredDocuments = chunks.filter(doc =>
    getValues(categories, projectTypes, doc)
  );

  // ------- SEMANTIC RETRIEVER
  // hago el retriever segun los filtros obtenidos del router, para obtener los documentos más relevantes 
  // según la categoría y el tipo de proyecto.
  const retrieverResult = vectorStore.asRetriever({
    k: 6,
    filter: (doc: Document) => getValues(categories, projectTypes, doc),
  });

  //  ------BM25  RETRIEVER-------
  // (Best Matching 25) es un algoritmo de recuperación de información basado en el modelo de espacio vectorial.
  //  BM25 es una mejora del modelo de espacio vectorial tradicional, que tiene en cuenta la frecuencia de los términos 
  //  y la longitud de los documentos para calcular la relevancia de un documento con respecto a una consulta.
  const bm25Retriever = BM25Retriever.fromDocuments(filteredDocuments, {
    k: 6,
  });

  const hibridDocs = await hibridResult(retrieverResult, bm25Retriever, query);

  return hibridDocs;
};
