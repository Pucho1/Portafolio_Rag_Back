import "dotenv/config";
import { OpenAIEmbeddings } from "@langchain/openai";
import { loadAndSplitDocuments } from "../ingestion/ingestion";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";



/**
 * Creo el modelo de embeddings de OpenAI para poder generar embeddings de texto.
 */
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

const vectorStore = new MemoryVectorStore(embeddings);

async function main() {

	const chunks = await loadAndSplitDocuments();

	const texts = chunks.map((chunk) => chunk.pageContent);

	const vectors = await embeddings.embedDocuments(texts);

	await vectorStore.addDocuments(chunks);

	console.log(`Indexed ${vectors.length} chunks.`);


	console.log("Dimensión:", vectors.map((v) => v.length));
	console.log("numero de vectores:", vectors.length);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});