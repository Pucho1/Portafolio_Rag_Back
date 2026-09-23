import { Document } from "@langchain/core/documents";
import { getHibridResults } from "./hibrid";
import { getParentsInfo } from "./parents";
import { getReRankedDoc } from "./reranked";
import { getRouterResults } from "../routing/router";


export async function getRetrieverResult(query: string): Promise<Document[]> {

  console.log("query ======>: ", query)
	
	// const {chunks, parents} = await ingestDoc();

  // ---- --- VECTOR STORE --------
	// Este paso ya me crea el vectorStore con los embeddings generados a partir de los chunks de texto que le estoy pasando. 
	// No es necesario pasarle los vectores generados en la línea anterior, 
	// ya que el vectorStore se encarga de generar los embeddings internamente a partir de los documentos que le pasamos.
	// await vectorStore.addDocuments(chunks);


  const {categories, projectTypes} = await getRouterResults(query);


  const hybridResults = await getHibridResults(query, categories, projectTypes, chunks)

  const rerankedDocuments = await getReRankedDoc(hybridResults, query);

  const finalResponsefromParents = getParentsInfo(rerankedDocuments, hybridResults, parents );


  console.log("\n--- CONTEXTO FINAL (post-PDR) ---");
  finalResponsefromParents.forEach((doc, i) => {
    console.log(`${i + 1}. [${doc.metadata.category}] ${doc.metadata.parentTitle ?? doc.metadata.headers} (${doc.pageContent.length} chars)`);
  });
  console.log(`\nTotal padres únicos: ${finalResponsefromParents.length}`);
  console.log(`Total chars en contexto: ${finalResponsefromParents.reduce((sum, d) => sum + d.pageContent.length, 0)}`);



  return finalResponsefromParents;
};