import { Document } from "@langchain/core/documents";
import {
  RunnableConfig,
  RunnableLambda }          from "@langchain/core/runnables";

import { getHibridResults } from "./hibrid";
import { getParentsInfo }   from "./parents";
import { getReRankedDoc, RerankedDocs } from "./reranked";
import { retrievalStore }   from "./store";
import type { RouterOutput } from "../routing/schema";

type HybridOutput   = RouterOutput & { hybridResults: Document[] };
type RerankedOutput = HybridOutput & { rerankedDocuments: RerankedDocs[] };


export async function getRetrieverResult(input: RouterOutput, config?: RunnableConfig): Promise<Document[]> {

  console.log("query ======>: ", input.query)

  const chunks      = await retrievalStore.getChunks();
  const parents     = await retrievalStore.getParents();
  const vectorStore = await retrievalStore.getVectorStore();

  const decision = input.routerResult.decision;

  if (decision.queryIntention !== "in_domain") {
    return [];
  }

  const categories = decision.category ?? [];
  const projectTypes = decision.projectType ?? [];

  const hybridStep = RunnableLambda.from(
    async (input: RouterOutput, config?: RunnableConfig): Promise<HybridOutput> => ({
      ...input,
      hybridResults: await getHibridResults(
        input.query,
        categories,
        projectTypes,
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


  const retrievalChain = hybridStep
    .pipe(rerankStep)
    .pipe(parentsStep)
    .withConfig({ runName: "retrieval" });

  const finalResponsefromParents = await retrievalChain.invoke( input , config);


  console.log("\n--- CONTEXTO FINAL (post-PDR) ---");
  finalResponsefromParents.forEach((doc, i) => {
    console.log(`${i + 1}. [${doc.metadata.category}] ${doc.metadata.parentTitle ?? doc.metadata.headers} (${doc.pageContent.length} chars)`);
  });

  return finalResponsefromParents;
};
