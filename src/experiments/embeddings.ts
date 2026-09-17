import { OpenAIEmbeddings }   from "@langchain/openai";
import { MemoryVectorStore }  from "@langchain/classic/vectorstores/memory";
import { BM25Retriever } 	    from "@langchain/community/retrievers/bm25";
import { Document }           from "@langchain/core/documents";
import { CohereRerank }       from "@langchain/cohere";

import { ingestDoc }  from "../ingestion/ingestion";
import { reciprocalRankFusion }   from "./helpers/reciprocarlRankFunctionCustom";

import "dotenv/config";
import { getImportantDomainDocs } from "../routing/router";

/**
 * Creo el modelo de embeddings de OpenAI para poder generar embeddings de texto.
 */
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

const vectorStore = new MemoryVectorStore(embeddings);

async function main() {
	const queries = [
    "¿Qué tecnologías utiliza Miguel para desarrollar aplicaciones frontend?",
    "¿Dónde ha trabajado profesionalmente Miguel?",
    "¿Qué proyectos ha realizado Miguel relacionados con IA?",
  ];



	const chunks = await ingestDoc();

	// const texts 	 = chunks.map((chunk) => chunk.pageContent); // Extraigo el contenido de los chunks para generar los embeddings
	// const vectors  = await embeddings.embedDocuments(texts); // Genero los embeddings de los textos



  // ---- --- VECTOR STORE --------
	// Este paso ya me crea el vectorStore con los embeddings generados a partir de los chunks de texto que le estoy pasando. 
	// No es necesario pasarle los vectores generados en la línea anterior, 
	// ya que el vectorStore se encarga de generar los embeddings internamente a partir de los documentos que le pasamos.
	await vectorStore.addDocuments(chunks); 


  
	//  ------BM25  RETRIEVER-------
	// (Best Matching 25) es un algoritmo de recuperación de información basado en el modelo de espacio vectorial.
	//  BM25 es una mejora del modelo de espacio vectorial tradicional, que tiene en cuenta la frecuencia de los términos 
	//  y la longitud de los documentos para calcular la relevancia de un documento con respecto a una consulta.
	





  //  ------COHERE RERANKER-------
  // Cohere Rerank es un modelo de reordenamiento de resultados de búsqueda que utiliza técnicas de aprendizaje profundo 
  // para mejorar la relevancia de los resultados devueltos por un motor de búsqueda. 
  // El modelo se entrena utilizando un conjunto de datos de consultas y documentos relevantes, 
  // y aprende a asignar puntuaciones a los documentos en función de su relevancia para una consulta dada.

  const cohereRerank = new CohereRerank({
		apiKey: process.env.COHERE_API_KEY,
		model: "rerank-multilingual-v3.0",
	});

  const getContentPreview = (
    doc: Document,
    length = 120
  ): string => {
    const content = doc.pageContent.replace(/\s+/g, " ").trim();

    return content.length > length
      ? `${content.slice(0, length)}...`
      : content;
  };

	/**
   * Obtiene la etiqueta para un documento dado.
   * @param doc - El documento del cual se desea obtener la etiqueta.
   * @returns  - Una cadena que representa la etiqueta del documento. Si el documento tiene encabezados, se concatenan con " > ".
   */
  const getDocumentLabel = (doc: Document): string => {
    const headers = doc.metadata.headers;

    if (Array.isArray(headers) && headers.length > 0) {
      return headers.join(" > ");
    }

    return "Sin contexto";
  };

  const logDocuments = (
    title: string,
    documents: Document[]
  ) => {
    console.log(`\n--- ${title} ---`);

  documents.forEach((doc, index) => {
    console.log( JSON.stringify(doc, null, 2)   );

    console.log(
      `   content: ${getContentPreview(doc)}`
    );
  });
  };

  const logRRF = (results: Document[]) => {
    console.log("\n--- HYBRID / RRF ---");

    results.forEach((doc, index) => {
      console.log(    console.log( JSON.stringify(doc, null, 2)   ))

    });
  };


	for (const query of queries) {

    console.log("\n");
    console.log("==============================================");
    console.log(`QUERY: ${query}`);
    console.log("==============================================");

    const routerResult = await getImportantDomainDocs(query);

    console.log("\n--- ROUTER RESULT ---");
    console.log(`Query: ${routerResult.query}`);
    console.log(`Category: ${routerResult.category}`);
    console.log(`Project Type: ${routerResult.projectType}`);

    const categories = routerResult.category ?? [];
    const projectTypes = routerResult.projectType ?? [];

    const retrieverResult = vectorStore.asRetriever({
      searchKwargs: {
        fetchK: 10,
      },
      k: 6,
      filter: (doc) => {
        const categoryMatches =
          categories.length === 0 || categories.includes(doc.metadata.category);
        const projectTypeMatches =
          projectTypes.length === 0 || projectTypes.includes(doc.metadata.projectType);

        return categoryMatches && projectTypeMatches;
      },
    });

    const filteredDocuments = chunks.filter(
      (doc) => {
        const categoryMatches =
          categories.length === 0 || categories.includes(doc.metadata.category);
        const projectTypeMatches =
          projectTypes.length === 0 || projectTypes.includes(doc.metadata.projectType);
        return categoryMatches && projectTypeMatches;
      }
    );

  
    const bm25Retriever = BM25Retriever.fromDocuments(filteredDocuments, {
      k: 6,
    });
    


    const [vectorResults, bm25Results] = await Promise.all([
      retrieverResult.invoke(query),
      bm25Retriever.invoke(query),
    ]);

    logDocuments("VECTOR", vectorResults);

    logDocuments("BM25", bm25Results);

    const hybridResults = reciprocalRankFusion(
      vectorResults,
      bm25Results,
    );

    logRRF(hybridResults);

    const rerankedDocuments = await cohereRerank.rerank(
      hybridResults,
      query,
      { topN: 5 }
    );

    console.log("\n--- RERANKER ---");

    rerankedDocuments.forEach((result, index) => {
      const document = hybridResults[result.index];

      console.log(
        `${index + 1}. ${getDocumentLabel(document)} | score: ${result.relevanceScore.toFixed(4)}`
      );
    });
  }


};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

