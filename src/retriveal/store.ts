import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { Document }          from '@langchain/core/documents';
import { OpenAIEmbeddings }  from '@langchain/openai';

import { ingestDoc } from '../ingestion/ingestion';
import "dotenv/config";


class RetrievalStore {

  private chunks: Document[] = [];
  private parents: Map<string, Document>= new Map();
  private initPromise: Promise<void> | null = null;

  /**
   * Creo el modelo de embeddings de OpenAI para poder generar embeddings de texto.
     */
  private readonly vectorStore: MemoryVectorStore =new MemoryVectorStore( 
    new OpenAIEmbeddings({
      model: "text-embedding-3-small",
    })
  )


  /**
   * 
   * @returns 
   */
  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.loadData(); // solo se crea la promesa la PRIMERA vez
    }
    return this.initPromise; // todas las llamadas siguientes devuelven la MISMA promesa
  };

  private async loadData(): Promise<void> {
    const { chunks, parents } = await ingestDoc();
    await this.vectorStore.addDocuments(chunks);

    this.chunks = chunks;
    this.parents = parents;
  };


  // getters async: garantizan que init() ya terminó antes de devolver el dato
  async getChunks(): Promise<Document[]> {
    await this.init(); // si ya se llamó antes, esto resuelve instantáneo
    return this.chunks;
  };

  async getParents(): Promise<Map<string, Document>> {
    await this.init();
    return this.parents;
  };

  async getVectorStore(): Promise<MemoryVectorStore> {
    await this.init();
    return this.vectorStore;
  };

};


export const retrievalStore = new RetrievalStore();

