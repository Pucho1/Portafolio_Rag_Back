import { CallbackHandler } from "@langfuse/langchain";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeTracerProvider }    from "@opentelemetry/sdk-trace-node";


// se contruye la infraestructura para el servidor de observabilidad y se le indica que el que analice los resultados sera langfuse
export function registerTracing(): void{
    new NodeTracerProvider({ spanProcessors: [new LangfuseSpanProcessor()]}).register()
};


// función fábrica que crea una instancia nueva por invocación
export const langFuseCallBack = (sessionId: string, userId: string) => {
    return new CallbackHandler({ sessionId, userId });
}
