import fs from "node:fs/promises";
import path from "node:path";

import { Document } from "@langchain/core/documents";

import { getRetrieverResult } from "../src/retriveal";

/** Comprueba si una palabra aparece dentro de un texto, sin distinguir mayúsculas. */
function containsWord(text: string, word: string): boolean {
  return text.toLocaleLowerCase().includes(word.toLocaleLowerCase());
}

async function main() {
  const filePath = path.resolve(process.cwd(), "eval", "retrieval_eval_dataset.json");
  const contents = await fs.readFile(filePath, { encoding: "utf8" });
  const dataset  = JSON.parse(contents);

  console.log(`\nEvaluando ${dataset.queries.length} casos de retrieval...\n`);

  // for...of en vez de .map(): no estamos transformando el array en otro array,
  // estamos recorriendo cada caso para hacer algo con él (llamar al retriever,
  // comparar, imprimir). .map() es para "uno a uno, dame un nuevo array" — aquí
  // no queremos ningún array de salida, solo efectos (logs).
  for (const testCase of dataset.queries) {
    const documents: Document[] = await getRetrieverResult(testCase.query);
    const text = documents.map((doc) => doc.pageContent).join("\n\n");

    // .every(): necesitamos que TODAS las keywords obligatorias estén presentes,
    // no basta con que aparezca una sola (por eso no es .some()).
    const pasa = testCase.keywords_obligatorias.every((keyword: string) =>
      containsWord(text, keyword)
    );

    const faltantes = testCase.keywords_obligatorias.filter(
      (keyword: string) => !containsWord(text, keyword)
    );

    console.log(`[${pasa ? "PASS" : "FAIL"}] ${testCase.id}`);
    console.log(`  query: "${testCase.query}"`);
    if (!pasa) {
      console.log(`  faltan: ${faltantes.join(", ")}`);
    }
    console.log("");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});