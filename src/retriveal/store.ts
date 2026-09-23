import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';


import "dotenv/config";

/**
 * Creo el modelo de embeddings de OpenAI para poder generar embeddings de texto.
 */
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

export const vectorStore = new MemoryVectorStore(embeddings);
