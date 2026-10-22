import { CallbackHandler }       from "@langfuse/langchain";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { propagateAttributes }   from "@langfuse/tracing";
import { NodeTracerProvider }    from "@opentelemetry/sdk-trace-node";



let provider: NodeTracerProvider | null = null;
const APP_TAG = "app:rag-portafolio";

type HandlerParams = ConstructorParameters<typeof CallbackHandler>[0];

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


/**
 * CallbackHandler que además fija el nombre de la traza, ya que el constructor oficial no lo permite.
 * Solo se aplica en el run raíz (sin parentRunId), que es donde el handler propaga los atributos de traza.
 */
class NamedCallbackHandler extends CallbackHandler {
    constructor(private readonly traceName: string, params: HandlerParams) {
        super(params);
    }

    override async handleChainStart(...args: Parameters<CallbackHandler["handleChainStart"]>): Promise<void> {
        const parentRunId = args[3];
        if (parentRunId) return super.handleChainStart(...args);
        return propagateAttributes({ traceName: this.traceName }, () => super.handleChainStart(...args));
    }
}

/**
 * Crea una instancia de CallbackHandler con un nombre de traza específico para agrupar los spans en langfuse.
 * @param sessionId Nombre de la sesión de evaluación, que se usará para agrupar los spans en langfuse.
 * @param userId    Nombre del usuario que ejecuta la evaluación, que se usará para agrupar los spans en langfuse.
 * @param traceName Nombre de la traza que se usará en langfuse.
 * @returns 
 */
export const langFuseCallBack = (sessionId: string, userId: string, traceName = "rag-portafolio") => {
    return new NamedCallbackHandler(traceName, { sessionId, userId, tags: [APP_TAG] });
}
