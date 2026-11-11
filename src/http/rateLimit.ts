import { rateLimit, type AugmentedRequest } from "express-rate-limit";

import { CAPACITY_MESSAGE, RATE_LIMIT_MESSAGE, type ChatResponse } from "./contract";

const IP_WINDOW_MS        = 60_000; // ventana de 1 minuto
const IP_LIMIT_PER_WINDOW = 10;     // peticiones por IP dentro de la ventana

// Límite global diario derivado del presupuesto: 50 $ / 30 días / 0,009 $ por respuesta = 185 respuestas al día.
// Es un techo de gasto en el peor caso, compartido por todas las IPs.
export const MONTHLY_BUDGET_USD  = 50;     // gasto máximo mensual aceptado en el peor caso
export const COST_PER_ANSWER_USD = 0.009;  // coste medido por respuesta verificada (router + embeddings + generación + verificador gpt-4o)
export const DEFAULT_GLOBAL_DAILY_LIMIT = Math.floor(MONTHLY_BUDGET_USD / 30 / COST_PER_ANSWER_USD); // 185
export const MAX_GLOBAL_DAILY_LIMIT     = 100_000;
const GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000;

// TODO(despliegue): configurar `trust proxy` en la app. Sin él, detrás de un proxy o balanceador
// req.ip será la IP del proxy y todos los usuarios compartirán el mismo contador.
export const ipLimiter = rateLimit({
    windowMs: IP_WINDOW_MS,
    limit:    IP_LIMIT_PER_WINDOW,

    // Retry-After solo se envía si las cabeceras estándar están activas
    standardHeaders: "draft-8",
    legacyHeaders:   false,

    handler: (req, res) => {
        console.warn(`[http] rate limit exceeded for ${req.ip}`);
        res.status(429).json({ answer: RATE_LIMIT_MESSAGE, outcome: "rejected", truncated: false } satisfies ChatResponse);
    },
});

/**
 * Crea el limitador global diario. No lee process.env: el límite llega como parámetro,
 * para que el módulo no tenga efectos secundarios al importarse.
 * @param limit Respuestas permitidas al día, sumando todas las IPs.
 * @returns Middleware que responde 503 cuando se agota el cupo diario.
 */
export const createGlobalLimiter = (limit: number) => rateLimit({
    windowMs: GLOBAL_WINDOW_MS,
    limit,

    // Todas las peticiones comparten un único contador
    keyGenerator: () => "global",

    // No se anuncia el cupo restante: sería un oráculo que le diría al atacante cuánto le falta para agotarlo
    standardHeaders: false,
    legacyHeaders:   false,

    handler: (req, res) => {
        // Con las cabeceras desactivadas la librería no pone Retry-After: se calcula a mano
        // La librería añade req.rateLimit, pero el handler recibe el Request de Express sin esa propiedad tipada
        const resetTime = (req as AugmentedRequest).rateLimit?.resetTime;
        const seconds   = resetTime
            ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
            : Math.ceil(GLOBAL_WINDOW_MS / 1000);

        res.setHeader("Retry-After", String(seconds));
        console.warn("[http] global daily budget exhausted");
        res.status(503).json({ answer: CAPACITY_MESSAGE, outcome: "error", truncated: false } satisfies ChatResponse);
    },
});
