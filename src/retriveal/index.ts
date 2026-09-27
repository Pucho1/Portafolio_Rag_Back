import { Document } from "@langchain/core/documents";
import {
  RunnableConfig,
  RunnableLambda }          from "@langchain/core/runnables";

import { getHibridResults } from "./hibrid";
import { getParentsInfo }   from "./parents";
import { getReRankedDoc, RerankedDocs } from "./reranked";
import { getRouterResults } from "../routing/router";
import { retrievalStore }   from "./store";

type RouterResult = {
  categories: string[],
  projectTypes: string[]
};

type QueryInput     = { query: string };
type RouterOutput   = QueryInput   & { routerResult: RouterResult };
type HybridOutput   = RouterOutput & { hybridResults: Document[] };
type RerankedOutput = HybridOutput & { rerankedDocuments: RerankedDocs[] };


export async function getRetrieverResult(query: string, config?: RunnableConfig): Promise<Document[]> {

  console.log("query ======>: ", query)

  const chunks      = await retrievalStore.getChunks();
  const parents     = await retrievalStore.getParents();
  const vectorStore = await retrievalStore.getVectorStore();


  // cada paso recibe el config del padre y se lo pasa a sus hijos, así langfuse anida las trazas
  const routerStep = RunnableLambda.from(
    async (input: QueryInput, config?: RunnableConfig): Promise<RouterOutput> => ({
      ...input,
      routerResult: await getRouterResults(input.query, config),
    })
  ).withConfig({ runName: "router" });


  const hybridStep = RunnableLambda.from(
    async (input: RouterOutput, config?: RunnableConfig): Promise<HybridOutput> => ({
      ...input,
      hybridResults: await getHibridResults(
        input.query,
        input.routerResult.categories,
        input.routerResult.projectTypes,
        chunks,
        vectorStore,
        config,
      ),
    })
  ).withConfig({ runName: "hybrid-search" });


  const rerankStep = RunnableLambda.from(
    async (input: HybridOutput, config?: RunnableConfig): Promise<RerankedOutput> => ({
      ...input,
      rerankedDocuments: await getReRankedDoc(input.hybridResults, input.query, config),
    })
  ).withConfig({ runName: "rerank" });


  const parentsStep = RunnableLambda.from(
    (input: RerankedOutput): Document[] =>
      getParentsInfo(input.rerankedDocuments, input.hybridResults, parents)
  ).withConfig({ runName: "resolve-parents" });


  const retrievalChain = routerStep
    .pipe(hybridStep)
    .pipe(rerankStep)
    .pipe(parentsStep)
    .withConfig({ runName: "retrieval" });

  const finalResponsefromParents = await retrievalChain.invoke({ query }, config);


  console.log("\n--- CONTEXTO FINAL (post-PDR) ---");
  finalResponsefromParents.forEach((doc, i) => {
    console.log(`${i + 1}. [${doc.metadata.category}] ${doc.metadata.parentTitle ?? doc.metadata.headers} (${doc.pageContent.length} chars)`);
  });

  return finalResponsefromParents;
};
