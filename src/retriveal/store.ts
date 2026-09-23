import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { Document }          from '@langchain/core/documents';
import { OpenAIEmbeddings }  from '@langchain/openai';

import { ingestDoc } from '../ingestion/ingestion';
import "dotenv/config";


/**
 * Mantiene en memoria los documentos ingeridos y su indice vectorial.
 *
 * La carga se realiza de forma perezosa: los datos no se ingieren al crear
 * la instancia, sino en la primera llamada a `init()` o a uno de los getters.
 * Las llamadas posteriores reutilizan la misma promesa de inicializacion.
 */
class RetrievalStore {

  /** Fragmentos usados para realizar busquedas vectoriales. */
  private chunks: Document[] = [];

  /** Documentos padre indexados por su identificador. */
  private parents: Map<string, Document>= new Map();

  /** Promesa compartida que evita ejecutar la ingesta mas de una vez. */
  private initPromise: Promise<void> | null = null;

  /**
   * Indice vectorial en memoria respaldado por embeddings de OpenAI.
   *
   * El modelo se usa para convertir los fragmentos de texto en vectores
   * antes de almacenarlos en `vectorStore`.
   */
  private readonly vectorStore: MemoryVectorStore =new MemoryVectorStore( 
    new OpenAIEmbeddings({
      model: "text-embedding-3-small",
    })
  )


  /**
   * Inicializa el almacenamiento si aun no se ha inicializado.
   * Es seguro llamar a este metodo varias veces: todas las llamadas esperan
   * la misma operacion de carga.
   */
  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.loadData(); // solo se crea la promesa la PRIMERA vez
    }
    return this.initPromise; // todas las llamadas siguientes devuelven la MISMA promesa
  };

  /**
   * Carga los datos desde el archivo de ingesta de documentos
   */
  private async loadData(): Promise<void> {
    const { chunks, parents } = await ingestDoc();
    await this.vectorStore.addDocuments(chunks);

    this.chunks = chunks;
    this.parents = parents;
  };


  /**
   * Devuelve los fragmentos ingeridos despues de completar la inicializacion.
   */
  async getChunks(): Promise<Document[]> {
    await this.init(); // si ya se llamó antes, esto resuelve instantáneo
    return this.chunks;
  };

  /**
   * Devuelve los documentos padre indexados por identificador.
   */
  async getParents(): Promise<Map<string, Document>> {
    await this.init();
    return this.parents;
  };

  /**
   * Devuelve el indice vectorial listo para ejecutar busquedas.
   */
  async getVectorStore(): Promise<MemoryVectorStore> {
    await this.init();
    return this.vectorStore;
  };

};


export const retrievalStore = new RetrievalStore();

