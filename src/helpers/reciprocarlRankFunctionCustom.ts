import { Document } from "@langchain/core/documents";

	const getDocumentKey = (doc: Document): string =>
  	`${doc.metadata.source}:${doc.metadata.headers?.join(">")}:${doc.pageContent}`;


export const reciprocalRankFusion = (  
    vectorResults: Document[],
    bm25Results: Document[],
    k = 60, 
): Document[] => {
  const scores = new Map< string,  { score: number; document: Document } >();

  const processResults = (results: Document[]) => {
    results.forEach((doc, index) => {
      const rank = index + 1;
      const key = getDocumentKey(doc);

      const current = scores.get(key);

      if (current) {
        current.score += 1 / (k + rank);
      } else {
        scores.set(key, {
          score: 1 / (k + rank),
          document: doc,
        });
      }
    });
  };

  processResults(vectorResults);
  processResults(bm25Results);

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ document }) => document);
};