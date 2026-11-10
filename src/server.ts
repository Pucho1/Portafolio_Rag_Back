import { initApp } from "./bootstrap";
import express, { type ErrorRequestHandler } from "express";
import type { Server } from "node:http";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { langFuseCallBack, shutdownTracing } from "./observability/langfuse";
import { runChain } from "./chain/chain";
import {
    INTERNAL_ERROR_MESSAGE,
    INVALID_REQUEST_MESSAGE,
    NOT_FOUND_MESSAGE,
    STATUS_BY_OUTCOME,
    type ChatResponse,
} from "./http/contract";
import { ipLimiter } from "./http/rateLimit";

const DEFAULT_PORT = 3000;

// Plazo propio para cerrar, por debajo de los 30 s que Docker espera antes del SIGKILL
const SHUTDOWN_TIMEOUT_MS = 25_000;

// 600 caracteres × 4 bytes (peor caso de UTF-8) son unos 2,4 KB; el resto es margen para el JSON que los envuelve
const JSON_BODY_LIMIT = "8kb";

// Solo la forma del cuerpo: la longitud la valida guardedChain dentro de la cadena, una sola fuente de verdad
const ChatRequestSchema = z.object({ question: z.string() });


/**
 * Extrae el status de un error de cliente (4xx), como los que lanza body-parser.
 * @param err Error recibido por el manejador de errores.
 * @returns El status si es un número entre 400 y 499, o undefined en cualquier otro caso.
 */
const clientErrorStatus = (err: unknown): number | undefined => {
    if (typeof err !== "object" || err === null) return undefined;

    const candidate = "status" in err ? err.status : "statusCode" in err ? err.statusCode : undefined;
    if (typeof candidate !== "number") return undefined;

    return candidate >= 400 && candidate <= 499 ? candidate : undefined;
};

/**
 * Último middleware: los errores de cliente devuelven su 4xx; el resto, un 500 genérico.
 * Nunca envía err.message ni el stack: el detalle solo va al log.
 */
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err); // la respuesta ya empezó: que la cierre Express

    const status = clientErrorStatus(err);

    if (status !== undefined) {
        const type = typeof err === "object" && err !== null && "type" in err ? ` ${String(err.type)}` : "";
        console.warn(`[http] client error ${status}${type}`);
        res.status(status).json({ answer: INVALID_REQUEST_MESSAGE, outcome: "invalid_input", truncated: false } satisfies ChatResponse);
        return;
    }

    console.error("[http] unhandled error:", err);
    res.status(500).json({ answer: INTERNAL_ERROR_MESSAGE, outcome: "error", truncated: false } satisfies ChatResponse);
};


/**
 * Lee el puerto del entorno (Twelve-Factor, factor III).
 * Sin PORT se usa DEFAULT_PORT; un valor que no sea un entero entre 1 y 65535 es un error de configuración.
 * @returns El puerto en el que escuchará el servidor.
 * @throws Error si PORT está definida pero no es un puerto válido.
 */
const readPort = (): number => {
    const raw = process.env.PORT;
    if (raw === undefined) return DEFAULT_PORT;

    const port = Number(raw);
    if (!/^\d+$/.test(raw) || port < 1 || port > 65535) {
        throw new Error(`Invalid PORT: "${raw}"`);
    }

    return port;
};


async function main() {

    const port = readPort(); // dentro de main para que un PORT inválido termine en main().catch

    console.log("[server] indexing...");
    const indexStart = performance.now();

    await initApp(); // tracing + carga del corpus antes de aceptar peticiones

    console.log(`[server] index ready in ${Math.round(performance.now() - indexStart)}ms`);

    const app = express();

    // El limitador va primero para no leer el cuerpo de una petición que se va a rechazar.
    // Sin try/catch: Express 5 manda al errorHandler las promesas rechazadas de los handlers async
    app.post("/chat", ipLimiter, express.json({ limit: JSON_BODY_LIMIT }), async (req, res) => {
        const parsed = ChatRequestSchema.safeParse(req.body);

        if (!parsed.success) {
            console.log("[http] invalid request body");
            res.status(400).json({ answer: INVALID_REQUEST_MESSAGE, outcome: "invalid_input", truncated: false } satisfies ChatResponse);
            return;
        }

        // Un handler nuevo por petición: cada una es su propia sesión en Langfuse
        const handler = langFuseCallBack(randomUUID(), "anonymous");
        const result  = await runChain(parsed.data.question, { callbacks: [handler] });
        const status  = STATUS_BY_OUTCOME[result.outcome];

        // Campos uno a uno: context, grounding y question no salen del servidor
        const body: ChatResponse = { answer: result.answer, outcome: result.outcome, truncated: result.truncated };

        console.log(`[http] POST /chat -> ${status} ${result.outcome}`);
        res.status(status).json(body);
    });

    // 404 en JSON para cualquier otra ruta
    app.use((req, res) => {
        res.status(404).json({ answer: NOT_FOUND_MESSAGE, outcome: "invalid_input", truncated: false } satisfies ChatResponse);
    });

    app.use(errorHandler);

    // Abre el puerto; el error de listen (p. ej. EADDRINUSE) se rechaza para que llegue a main().catch
    const server = await new Promise<Server>((resolve, reject) => {
        const httpServer = app.listen(port, (error?: Error) => {
            if (error) return reject(error);
            resolve(httpServer);
        });
    });

    console.log(`[server] listening on ${port}`);

    let shuttingDown = false;

    /**
     * Apagado ordenado: deja de aceptar peticiones, espera a las que están en curso
     * hasta SHUTDOWN_TIMEOUT_MS y envía las trazas pendientes antes de salir.
     * @param signal Señal recibida, para el log.
     */
    const shutdown = async (signal: NodeJS.Signals) => {
        if (shuttingDown) return; // una segunda señal no repite el apagado
        shuttingDown = true;

        console.log(`[server] ${signal} received, shutting down`);

        const closed = new Promise<"closed">((resolve) => server.close((error) => {
            if (error) console.error("[server] http server close failed:", error);
            resolve("closed");
        }));
        const timeout = new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), SHUTDOWN_TIMEOUT_MS));

        const winner = await Promise.race([closed, timeout]);

        if (winner === "closed") console.log("[server] http server closed");
        else console.log(`[server] shutdown timeout after ${SHUTDOWN_TIMEOUT_MS}ms, forcing`);

        try {
            await shutdownTracing(); // envía a Langfuse los spans pendientes
            console.log("[server] tracing flushed");
            console.log("[server] exit 0");
            process.exit(0);
        } catch (error) {
            console.error("[server] tracing flush failed:", error);
            process.exit(1);
        }
    };

    process.on("SIGTERM", shutdown); // Docker / plataforma
    process.on("SIGINT",  shutdown); // Ctrl+C en local
}

main().catch((error) => {
    console.error("[server] fatal:", error);
    process.exit(1);
})
