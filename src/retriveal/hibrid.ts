import { BM25Retriever } 	      from "@langchain/community/retrievers/bm25";
import { Document }             from "@langchain/core/documents";
import { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { MemoryVectorStore }    from '@langchain/classic/vectorstores/memory';
import { RunnableConfig }       from "@langchain/core/runnables";

import { reciprocalRankFusion }   from "../helpers/reciprocarlRankFunctionCustom";


 export type HybridResultsArgs = {
    query: string,
    routerResult: { categories: string[],    projectTypes: string[],}    
    chunks: Document[],
    vectorStore: MemoryVectorStore,
    config: RunnableConfig,
  }

  /**
  *  Filtra los documentos según las categorías y tipos de proyecto especificados.
  *  @param categories Categorías para filtrar los documentos.
  *  @param projectTypes Tipos de proyecto para filtrar los documentos.
  *  @returns  True si el documento coincide con las categorías y tipos de proyecto especificados, false en caso contrario.
  *  @remarks
  *  Si no se especifican categorías o tipos de proyecto, se consideran todos los documentos como válidos.
  */
const getValues = (categories: string[], projectTypes: string[], doc: Document) => {

  const categoryMatches =
    categories.length === 0 || categories.includes(doc.metadata.category);

  const projectTypeMatches =
    projectTypes.length === 0 || projectTypes.includes(doc.metadata.projectType);

  return categoryMatches && projectTypeMatches;
};

/**
 * Combina los resultados de dos recuperadores (vectorial y BM25) utilizando la fusión de rango recíproco para obtener un conjunto de documentos híbrido.
 * @param retrieverResult Resultado del recuperador vectorial.
 * @param bm25Retriever Resultado del recuperador BM25.
 * @param query Consulta de búsqueda.
 * @param config Configuración para la invocación de los recuperadores.
 * @returns Promise que resuelve en un array de documentos híbridos.
 */
async function hibridResult (  retrieverResult: VectorStoreRetriever,  bm25Retriever:  BM25Retriever,  query: string, config?: RunnableConfig): Promise<Document[]> {

  const [vectorResults, bm25Results] = await Promise.allSettled([
    retrieverResult.invoke(query, { ...config, runName: "vector-retriever" }),
    bm25Retriever.invoke(query, { ...config, runName: "bm25-retriever" }),
  ]);

  const hybridResults = reciprocalRankFusion(
    vectorResults?.status === "fulfilled" ? vectorResults.value : [],
    bm25Results?.status === "fulfilled" ? bm25Results.value : [],
  );

  return hybridResults;
};


/**
 * Obtiene los resultados híbridos combinando los resultados de un recuperador vectorial y un recuperador BM25, filtrando los documentos según las categorías y tipos de proyecto especificados.
 * @param query Consulta de búsqueda.
 * @param categories Categorías para filtrar los documentos. 
 * @param projectTypes Tipos de proyecto para filtrar los documentos.
 * @param chunks Chunks de documentos.
 * @returns Promise que resuelve en un array de documentos híbridos.
 */
export async function getHibridResults(
  query: string,
  categories: string[],
  projectTypes: string[],
  chunks: Document[],
  vectorStore: MemoryVectorStore,
  config?: RunnableConfig,
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

  const hibridDocs = await hibridResult(retrieverResult, bm25Retriever, query, config);

  return hibridDocs;
};
