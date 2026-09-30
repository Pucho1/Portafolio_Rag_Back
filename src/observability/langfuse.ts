import { CallbackHandler }       from "@langfuse/langchain";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeTracerProvider }    from "@opentelemetry/sdk-trace-node";



let provider: NodeTracerProvider | null = null;

/**
 * Se contruye la infraestructura para el servidor de observabilidad y se le indica que el que analice los resultados sera langfuse
 */
export function registerTracing(): void {
    if (provider) return; // ya registrado: no crear un segundo proveedor
    provider = new NodeTracerProvider({ spanProcessors: [new LangfuseSpanProcessor()] });
    provider.register();
}

/**
 * 
 */
export async function shutdownTracing(): Promise<void> {
    await provider?.shutdown();
}



// función fábrica que crea una instancia nueva por invocación
export const langFuseCallBack = (sessionId: string, userId: string) => {
    return new CallbackHandler({ sessionId, userId });
}
