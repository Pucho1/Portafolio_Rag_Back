import fs                         from "node:fs/promises";
import path                       from "node:path";
import { splitMarkdownDocuments } from "./splitter";
import { buildDomainCatalog, persistDomainCatalog } from "../domain/domainCatalog ";


import { Document }        from "@langchain/core/documents";
import { TextLoader }      from "@langchain/classic/document_loaders/fs/text";
import { MultiFileLoader } from "@langchain/classic/document_loaders/fs/multi_file";


type metadataKeys =  "category" | "projectType" ;

// Permite sugerir/autocompletar esas dos claves, pero acepta cualquier string
type Metadata = {
  [K in metadataKeys]?: any;
} & {
  [key: string]: any;
};



/**
 * Resuelve los metadatos para un archivo dado.
 * @param filePath 
 * @param dataRoot 
 * @returns Un objeto de metadatos que contiene la categoría y el tipo de proyecto (si corresponde) del archivo.
 */
function resolveMetadata(filePath: string, dataRoot: string): Metadata {
  const relativePath = path.relative(dataRoot, filePath);
  const segments = relativePath.split(path.sep).filter(Boolean);

  if (segments.length === 0) {
    return { category: "unknown" };
  }

  if (segments[0].toLowerCase() === "projects") {
    const projectFile = segments[segments.length - 1];

    if (!projectFile) {
      return { category: "project" };
    }

    const projectType = path.basename(projectFile, path.extname(projectFile));
    return {
      category: "project",
      projectType: projectType.toLowerCase(),
    };
  }

  const fileName = path.basename(segments[0], path.extname(segments[0])).toLowerCase();
  return {
    category: fileName || "unknown",
  };
}

/**
 * Colecciona todos los archivos Markdown en un directorio dado y sus subdirectorios.
 * @param rootDir - El directorio raíz desde el cual comenzar la búsqueda de archivos Markdown.
 * @returns Una promesa que resuelve a un array de rutas de archivos para todos los archivos Markdown encontrados.
 */
async function collectMarkdownFiles(rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 *  Enriquece los metadatos de un array de documentos con información adicional basada en la ruta del archivo.
 *  @param documents - Un array de documentos a enriquecer.
 *  @param dataDir - El directorio raíz de datos desde el cual se resuelven los metadatos.
 *  @returns Un nuevo array de documentos con metadatos enriquecidos.
 */
function enrichDocumentMetadata(documents: Document[], dataDir: string): Document[] {

   const enrichedDocuments = documents.map((doc) => {
    const source = typeof doc.metadata.source === "string" 
      ? doc.metadata.source 
      : ""
    ;

    const metadata = resolveMetadata(source, dataDir);

    return new Document({
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        ...metadata,
      },
    });
  });

  return enrichedDocuments;
}

/**
 * Carga documentos Markdown desde el directorio de datos.
 * @returns Una promesa que resuelve a un array de documentos.
 */
async function loadDocuments(markdownFiles: string[], dataDir: string): Promise<Document[]> {

  const loader = new MultiFileLoader(markdownFiles, {
    ".md": (filePath: string) => new TextLoader(filePath),
  }); // Crea un cargador de múltiples archivos para los archivos Markdown encontrados

  const documents = await loader.load();

  return documents;
}

export async function ingestDoc(): Promise<{ chunks: Document[]; parents: Map<string, Document> }> {

  const dataDir = path.resolve(process.cwd(), "data"); // Directorio raíz de datos
  const markdownFiles = await collectMarkdownFiles(dataDir); // Obtengo todas las rutas  y subrutas de archivos Markdown

  const documentsLoders = await loadDocuments(markdownFiles, dataDir);

  const enrichedDocuments = enrichDocumentMetadata(documentsLoders, dataDir);

  const catalog = buildDomainCatalog(enrichedDocuments);
  await persistDomainCatalog(catalog);


  const {chunks, parents} = await splitMarkdownDocuments(enrichedDocuments);


  return {  chunks, parents };
}

ingestDoc().catch((error) => {
  console.error("Error en la ingestión contextual:", error);
  process.exit(1);
});
