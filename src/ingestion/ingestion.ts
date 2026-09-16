import fs from "node:fs/promises";
import path from "node:path";
import { Document } from "@langchain/core/documents";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { MultiFileLoader } from "@langchain/classic/document_loaders/fs/multi_file";
import { splitMarkdownDocuments } from "./splitter";


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
 * Carga y divide documentos Markdown desde el directorio de datos.
 * @returns Una promesa que resuelve a un array de documentos divididos en chunks.
 */
export async function loadAndSplitDocuments(): Promise<Document[]> {
  const dataDir = path.resolve(process.cwd(), "data");
  const markdownFiles = await collectMarkdownFiles(dataDir);

  const loader = new MultiFileLoader(markdownFiles, {
    ".md": (filePath: string) => new TextLoader(filePath),
  });

  const documents = await loader.load();

  const enrichedDocuments = documents.map((doc) => {
    const source = typeof doc.metadata.source === "string" ? doc.metadata.source : "";

    const metadata = resolveMetadata(source, dataDir);

    return new Document({
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        ...metadata,
      },
    });
  });

  console.log(`Número de Documents originales: ${enrichedDocuments.length}`);


  const chunks = await splitMarkdownDocuments(enrichedDocuments);

  return chunks;
}

async function main() {

  const chunks = await loadAndSplitDocuments();
 

  console.log(`Número total de chunks finales: ${chunks.length}`);
}

main().catch((error) => {
  console.error("Error en la ingestión contextual:", error);
  process.exit(1);
});
