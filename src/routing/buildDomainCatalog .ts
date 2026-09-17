import { Document } from "@langchain/core/documents";

import fs           from "node:fs/promises";
import path         from "node:path";


type DomainCatalog = {
  categories: string[];
  projectTypes: string[];
  generatedAt: string;
};


/**
 *  Construye un catálogo de dominio a partir de un array de documentos.
 *  @param documents - Un array de documentos a partir del cual se construye el catálogo.
 *  @returns Un objeto de tipo DomainCatalog que contiene las categorías y tipos de proyecto únicos encontrados en los documentos, así como la fecha de generación del catálogo.
 */
export function buildDomainCatalog(documents: Document[]): DomainCatalog {
  const categories = new Set<string>();
  const projectTypes = new Set<string>();

  for (const doc of documents) {
    if (doc.metadata.category) categories.add(doc.metadata.category);
    if (doc.metadata.projectType) projectTypes.add(doc.metadata.projectType);
  }

  return {
    categories: [...categories].sort(),
    projectTypes: [...projectTypes].sort(),
    generatedAt: new Date().toISOString(),
  };
};

export async function persistDomainCatalog(catalog: DomainCatalog) {
  const outPath = path.resolve(process.cwd(), "data", "domainCatalog.json");
  await fs.writeFile(outPath, JSON.stringify(catalog, null, 2), "utf-8");

  console.log(`Domain catalog persisted at: ${outPath}`);
};