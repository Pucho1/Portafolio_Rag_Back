import { Document } from "@langchain/core/documents";
import { RerankedDocs } from "./reranked";


export function getParentsInfo(rerankedDocuments: RerankedDocs[], hybridResults: Document[], parents: Map<string, Document>){

      // Ahora, para cada documento rerankeado, obtengo su parentId y busco el documento padre correspondiente en el mapa de padres.
  const resolvedParent = rerankedDocuments.map((result) => {

    const winningChunk  = hybridResults[result.index];
    const parentId      = winningChunk.metadata.parentId as string | undefined;

    if (parentId && parents.has(parentId)) {
      return parents.get(parentId)!; // devuelvo el padre completo, no el chunk pequeño
    }

    return winningChunk; // si no tiene parentId (no debería pasar ahora, pero por seguridad), me quedo con el chunk
  });


  const uniqueParents = new Map<string, Document>();

  for (const doc of resolvedParent) {
    const id = (doc.metadata.parentId as string) ?? doc.metadata.source as string;
    uniqueParents.set(id, doc);
  }

  const finalContext = [...uniqueParents.values()];

  return finalContext;
}