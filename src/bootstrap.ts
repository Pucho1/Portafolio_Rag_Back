import { registerTracing } from "./observability/langfuse";
import { retrievalStore }        from "./retriveal/store";

import "dotenv/config";


export async function initApp(): Promise<void>{
    registerTracing();
    await retrievalStore.init();
};



