import { rateLimit } from "express-rate-limit";

import { RATE_LIMIT_MESSAGE, type ChatResponse } from "./contract";

const IP_WINDOW_MS        = 60_000; // ventana de 1 minuto
const IP_LIMIT_PER_WINDOW = 10;     // peticiones por IP dentro de la ventana

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
