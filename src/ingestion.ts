import fs from "node:fs";
import path from "node:path";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

async function main() {
  console.log("Iniciando la ingestión de datos...\n");

  // 1. Leer el archivo Markdown usando Node.js
  const filePath = path.join(__dirname, "../data/perfil.md");
  const rawContent = fs.readFileSync(filePath, "utf-8");

  // 2. Crear un Documento de LangChain
  // Los metadatos son cruciales para que luego el Agente sepa la fuente de la información
  const rawDocument = new Document({
    pageContent: rawContent,
    metadata: {
      source: "perfil.md",
      type: "curriculum_y_proyectos"
    },
  });

  // 3. Configurar el Text Splitter
  // chunkSize: Cortamos en pedazos de ~400 caracteres
  // chunkOverlap: Solapamos 50 caracteres para no perder el contexto entre cortes
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 400,
    chunkOverlap: 50,
  });

  // 4. Ejecutar la división
  const chunks = await splitter.splitDocuments([rawDocument]);

  console.log(`¡Éxito! Se generaron ${chunks.length} fragmentos (chunks).\n`);

  // 5. Mostrar los resultados en la terminal para analizarlos
  chunks.forEach((chunk, index) => {
    console.log(`--- CHUNK #${index + 1} (${chunk.pageContent.length} caracteres) ---`);
    console.log(chunk.pageContent);
    console.log("--------------------------------------------------\n");
  });
}

// Ejecutar la función principal
main().catch(console.error);
