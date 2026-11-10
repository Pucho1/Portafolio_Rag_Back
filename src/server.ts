import { initApp } from "./bootstrap";
import express from "express";
import type { Server } from "node:http";

import { shutdownTracing } from "./observability/langfuse";

const DEFAULT_PORT = 3000;

// Plazo propio para cerrar, por debajo de los 30 s que Docker espera antes del SIGKILL
const SHUTDOWN_TIMEOUT_MS = 25_000;


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
