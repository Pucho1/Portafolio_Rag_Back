// Utilidades de Server-Sent Events para POST /chat/stream. No tiene efectos secundarios al importarse.
// Solo se emiten estados de progreso y la respuesta ya verificada: nunca contenido sin verificar.

import type { ServerResponse } from "node:http";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { RunnableLambda }      from "@langchain/core/runnables";
import type { Serialized }     from "@langchain/core/load/serializable";
import type { ChainValues }    from "@langchain/core/utils/types";

import { RUN_NAMES } from "../chain/chain";
import type { Stage, StreamEventName } from "./contract";

/**
 * Abre la respuesta como stream de eventos. A partir de aquí el código de estado ya no se puede cambiar.
 * @param res Respuesta HTTP.
 */
export const openEventStream = (res: ServerResponse): void => {
    res.writeHead(200, {
        "Content-Type":      "text/event-stream",
        "Cache-Control":     "no-cache",
        // Evita que un proxy acumule los eventos y los entregue todos al final
        "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
};

/**
 * Escribe un evento SSE. Si la respuesta ya se cerró o el cliente se fue, no hace nada.
 * @param res Respuesta HTTP abierta con openEventStream.
 * @param event Nombre del evento.
 * @param data Carga del evento; se serializa como JSON.
 */
export const sendEvent = (res: ServerResponse, event: StreamEventName, data: unknown): void => {
    if (res.writableEnded || res.destroyed) return;

    // JSON.stringify garantiza que data no contiene saltos de línea, que partirían el evento
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

/**
 * Traduce los pasos de la cadena a estados de progreso públicos.
 * Solo anuncia la recuperación ("searching") y la generación ("writing"). El router, el grounding y la
 * corrección no emiten nada: desde fuera, verificar y corregir son parte de "writing". Anunciar la
 * corrección sería un oráculo de alucinaciones: le diría al cliente qué preguntas hacen inventar al modelo.
 * No depende de Express: recibe una función emit.
 */
export class StageCallbackHandler extends BaseCallbackHandler {
    name = "stage-callback-handler";

    // Sin esto, LangChain puede ejecutar el callback en segundo plano y el estado llegaría después de la respuesta
    awaitHandlers = true;

    private readonly emitted = new Set<Stage>();

    constructor(private readonly emit: (stage: Stage) => void) {
        super();
    }

    /**
     * Emite cada estado como mucho una vez por petición.
     * @param stage Estado que se quiere anunciar.
     */
    private emitOnce(stage: Stage): void {
        if (this.emitted.has(stage)) return;
        this.emitted.add(stage);
        this.emit(stage);
    }

    // Los .d.ts de @langchain/core 1.2.9 declaran otro orden (runType 4.º, runName 7.º). El real es el de
    // callbacks/manager.js: parentRunId 4.º, runType 7.º y runName 8.º. Es el mismo orden del que ya depende
    // NamedCallbackHandler en observability/langfuse.ts (lee parentRunId en args[3]).
    // checkStageEvents() lo comprueba al arrancar por si una actualización lo cambia.
    override handleChainStart(
        _chain:        Serialized,
        _inputs:       ChainValues,
        _runId:        string,
        _parentRunId?: string,
        _tags?:        string[],
        _metadata?:    Record<string, unknown>,
        _runType?:     string,
        runName?:      string,
    ): void {
        if (runName === RUN_NAMES.retrieval) this.emitOnce("searching");
        else if (runName === RUN_NAMES.getAnswer) this.emitOnce("writing");
    }
}

/**
 * Comprueba que StageCallbackHandler recibe el runName donde lo espera, con un runnable trivial.
 * Sin llamadas de red ni a ningún modelo: sirve para detectar al arrancar que una actualización
 * de @langchain/core ha cambiado el orden de los argumentos de handleChainStart.
 * @returns true si se emitió "searching" para un run llamado RUN_NAMES.retrieval.
 */
export async function checkStageEvents(): Promise<boolean> {
    const stages: Stage[] = [];
    const probe = RunnableLambda.from((input: string) => input).withConfig({ runName: RUN_NAMES.retrieval });

    await probe.invoke("stage-check", { callbacks: [new StageCallbackHandler((stage) => stages.push(stage))] });

    return stages.includes("searching");
}
