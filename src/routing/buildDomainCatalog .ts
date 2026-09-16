import { Document } from "@langchain/core/documents";

interface DomainCatalog {
  categories: string[];
  projectTypes: string[];
};

/**
 *  Construye un catálogo de dominios a partir de un array de documentos.
 *  @param documents - Un array de documentos a partir del cual se construirá el catálogo.
 *  @returns Un objeto que contiene las categorías y tipos de proyecto únicos encontrados en los documentos.
 */
export const buildDomainCatalog = (  documents: Document[]): DomainCatalog => {
  const categories = new Set<string>(); // ← eliminación de duplicados automaticamente
  const projectTypes = new Set<string>();

  for (const document of documents) {
    const { categories: category, projectType } = document.metadata;

    if (typeof category === "string") {
      categories.add(category);
    }

    if (typeof projectType === "string") {
      projectTypes.add(projectType);
    }
  }

  return {
    categories: [...categories],
    projectTypes: [...projectTypes],
  };
};