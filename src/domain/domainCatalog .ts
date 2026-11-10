import { Document } from "@langchain/core/documents";

import fs           from "node:fs/promises";
import path         from "node:path";
import { z }        from "zod";


// El catálogo se lee de disco: se valida al cargarlo, no basta con anotar el tipo de JSON.parse
export const DomainCatalogSchema = z.object({
  categories:       z.array(z.string()),
  projectTypes:     z.array(z.string()),
  generatedAt:      z.string(),
  topicsByCategory: z.record(z.string(), z.array(z.string())),
});

export type DomainCatalog = z.infer<typeof DomainCatalogSchema>;


/**
 *  Construye un catálogo de dominio a partir de los Parents que genera el splitter.
 *  Los temas son los parentTitle: así "sección" significa lo mismo aquí que en el splitter, sin volver a parsear el Markdown.
 *  @param parents - Los Parents de splitMarkdownDocuments, con category, projectType y parentTitle en sus metadatos.
 *  @returns Un objeto de tipo DomainCatalog que contiene las categorías y tipos de proyecto únicos, los temas de cada categoría ordenados y sin duplicados, y la fecha de generación del catálogo.
 */
export function buildDomainCatalog(parents: Iterable<Document>): DomainCatalog {
  const categories = new Set<string>();
  const projectTypes = new Set<string>();
  const topicsByCategory = new Map<string, Set<string>>();

  for (const doc of parents) {
    const { category, projectType, parentTitle } = doc.metadata;

    if (category) categories.add(category);
    if (projectType) projectTypes.add(projectType);

    if (category && parentTitle) {
      if (!topicsByCategory.has(category)) topicsByCategory.set(category, new Set());
      topicsByCategory.get(category)!.add(parentTitle);
    }
  }

  return {
    categories: [...categories].sort(),
    projectTypes: [...projectTypes].sort(),
    generatedAt: new Date().toISOString(),
    topicsByCategory: Object.fromEntries(
      [...topicsByCategory]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, topics]) => [category, [...topics].sort((a, b) => a.localeCompare(b, "es"))])
    ),
  };
};

/**
 *  Persiste el catálogo de dominio en un archivo JSON.
 *  @param catalog - El catálogo de dominio a persistir.
 *  @returns Una promesa que se resuelve cuando el catálogo ha sido escrito en el archivo.
 *  @throws Error si ocurre un problema al escribir el archivo.
 *  @remarks El catálogo se guarda en la ruta "data/domainCatalog.json" relativa al directorio de trabajo actual.
 */
export async function persistDomainCatalog(catalog: DomainCatalog) {
  const outPath = path.resolve(process.cwd(), "data", "domainCatalog.json");
  await fs.writeFile(outPath, JSON.stringify(catalog, null, 2), "utf-8");
};

/**
 *  Carga y valida el catálogo de dominio persistido en "data/domainCatalog.json".
 *  @returns El catálogo validado.
 *  @throws Error si el archivo no cumple DomainCatalogSchema (por ejemplo, un catálogo antiguo sin topicsByCategory).
 */
export async function loadDomainCatalog(): Promise<DomainCatalog> {
  const catalogPath = path.resolve(
    process.cwd(),
    "data",
    "domainCatalog.json"
  );

  const content = await fs.readFile(catalogPath, "utf-8");
  const parsed  = DomainCatalogSchema.safeParse(JSON.parse(content));

  if (!parsed.success) {
    throw new Error(
      `El catálogo de dominio (${catalogPath}) no es válido o está desactualizado. ` +
      `Regenéralo con "npm run dev:ingestion".\n${z.prettifyError(parsed.error)}`
    );
  }

  return parsed.data;
}