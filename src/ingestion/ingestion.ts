import fs from "node:fs/promises";
import path from "node:path";
import { Document } from "@langchain/core/documents";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { MultiFileLoader } from "@langchain/classic/document_loaders/fs/multi_file";
import { splitMarkdownDocuments } from "./splitter";

function resolveMetadata(filePath: string, dataRoot: string): Record<string, string> {
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

  // let hasta100 = 0;
  // let de101a200 = 0;
  // let de201a300 = 0;
  // let de301a400 = 0;
  // let de401a500 = 0;
  // let mas500 = 0;

  // for (const chunk of chunks) {
  //   const length = chunk.pageContent.length;

  //   if (length <= 100) hasta100++;
  //   else if (length <= 200) de101a200++;
  //   else if (length <= 300) de201a300++;
  //   else if (length <= 400) de301a400++;
  //   else if (length <= 500) de401a500++;
  //   else mas500++;
  // }

  // console.log(`0-100: ${hasta100}`);
  // console.log(`101-200: ${de101a200}`);
  // console.log(`201-300: ${de201a300}`);
  // console.log(`301-400: ${de301a400}`);
  // console.log(`401-500: ${de401a500}`);
  // console.log(`>500: ${mas500}`);

  // const groupedChunks = new Map<string, Document[]>();

  // for (const chunk of chunks) {
  //   const headers = Array.isArray(chunk.metadata.headers) ? chunk.metadata.headers : [];
  //   const key = headers.join(" > ");
  //   const bucket = groupedChunks.get(key) ?? [];
  //   bucket.push(chunk);
  //   groupedChunks.set(key, bucket);
  // }

  // for (const [index, chunk] of chunks.entries()) {
  //   if (chunk.pageContent.length > 500) {
  //     console.log("\n--- Chunk > 500 ---");
  //     console.log(`índice: ${index}`);
  //     console.log(`longitud: ${chunk.pageContent.length}`);
  //     console.log("metadata:");
  //     console.log(JSON.stringify(chunk.metadata, null, 2));
  //     console.log("pageContent:");
  //     console.log(chunk.pageContent);
  //   }
  // }
}

main().catch((error) => {
  console.error("Error en la ingestión contextual:", error);
  process.exit(1);
});
