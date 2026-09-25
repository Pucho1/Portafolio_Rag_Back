import { Document } from "@langchain/core/documents";

import { getHibridResults } from "./hibrid";
import { getParentsInfo }   from "./parents";
import { getReRankedDoc }   from "./reranked";
import { getRouterResults } from "../routing/router";
import { retrievalStore }   from "./store";



export async function getRetrieverResult(query: string): Promise<Document[]> {

  console.log("query ======>: ", query)



  const chunks      = await retrievalStore.getChunks();
  const parents     = await retrievalStore.getParents();
  const vectorStore = await retrievalStore.getVectorStore();


  const {categories, projectTypes} = await getRouterResults(query);
  const hybridResults              = await getHibridResults(query, categories, projectTypes, chunks, vectorStore);
  const rerankedDocuments          = await getReRankedDoc(hybridResults, query);
  const finalResponsefromParents   = getParentsInfo(rerankedDocuments, hybridResults, parents );


  console.log("\n--- CONTEXTO FINAL (post-PDR) ---");
  finalResponsefromParents.forEach((doc, i) => {
    console.log(`${i + 1}. [${doc.metadata.category}] ${doc.metadata.parentTitle ?? doc.metadata.headers} (${doc.pageContent.length} chars)`);
  });

  return finalResponsefromParents;
};