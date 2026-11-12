import cors from "cors";

// Orígenes de Vite en local: `npm run dev` (5173) y `npm run preview` (4173)
export const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:4173"];

// Cuánto puede cachear el navegador la respuesta al preflight, en segundos
const PREFLIGHT_MAX_AGE_S = 600;

/**
 * Convierte la lista de orígenes permitidos del entorno en un array.
 * Formato: orígenes separados por comas, p. ej. "https://miportafolio.vercel.app,http://localhost:5173".
 * Sin la variable se usan los orígenes locales de Vite.
 * @param raw Valor de la variable de entorno, o undefined si no está definida.
 * @returns Los orígenes permitidos, sin espacios ni barra final.
 * @throws Error si algún valor no es un origen http(s) válido (esquema + host + puerto opcional, sin ruta).
 */
export const parseAllowedOrigins = (raw: string | undefined): string[] => {
    if (raw === undefined || raw.trim() === "") return DEFAULT_ALLOWED_ORIGINS;

    return raw.split(",").map((value) => {
        const candidate = value.trim().replace(/\/$/, "");

        let url: URL;
        try {
            url = new URL(candidate);
        } catch {
            throw new Error(`Invalid ALLOWED_ORIGINS entry: "${candidate}"`);
        }

        // Un origen no lleva ruta: "https://a.com/chat" sería un error de configuración, no un origen
        if (!["http:", "https:"].includes(url.protocol) || url.origin !== candidate) {
            throw new Error(`Invalid ALLOWED_ORIGINS entry: "${candidate}"`);
        }

        return candidate;
    });
};

/**
 * Crea el middleware CORS. No lee process.env: los orígenes llegan como parámetro,
 * para que el módulo no tenga efectos secundarios al importarse.
 * Un origen no permitido no recibe cabeceras CORS y el navegador bloquea la petición.
 * Las peticiones sin cabecera Origin (curl, otro servidor) no las limita CORS: para eso están los limitadores.
 * @param allowedOrigins Orígenes exactos que pueden llamar a la API desde un navegador.
 * @returns Middleware de Express que también responde a los preflight OPTIONS.
 */
export const createCorsMiddleware = (allowedOrigins: string[]) => {
    const allowed = new Set(allowedOrigins);

    return cors({
        origin: (origin, callback) => callback(null, origin === undefined || allowed.has(origin)),
        methods:        ["POST"],
        allowedHeaders: ["Content-Type"],
        // El cliente necesita leer Retry-After de los 429 y 503 para saber cuánto esperar
        exposedHeaders: ["Retry-After"],
        maxAge:         PREFLIGHT_MAX_AGE_S,
    });
};
