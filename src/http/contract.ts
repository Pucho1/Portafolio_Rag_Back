// Contrato público de la API: tipos, mensajes y códigos HTTP. No tiene efectos secundarios.
// Se separa de server.ts porque server.ts llama a main() al importarse: así otros módulos
// (como el limitador) pueden usar el contrato sin arrancar el servidor.

import type { ChainOutcome } from "../chain/chain";

export const INVALID_REQUEST_MESSAGE = "La petición no tiene el formato esperado. Envía un JSON con el campo \"question\" de tipo texto.";
export const NOT_FOUND_MESSAGE       = "La ruta solicitada no existe.";
export const INTERNAL_ERROR_MESSAGE  = "Ha ocurrido un error inesperado. Inténtalo de nuevo más tarde.";
export const RATE_LIMIT_MESSAGE      = "Has hecho demasiadas preguntas seguidas. Espera un momento y vuelve a intentarlo.";
export const CAPACITY_MESSAGE        = "El servicio ha alcanzado su capacidad por hoy. Vuelve a intentarlo más tarde.";

// Respuesta pública: nunca expone context, grounding ni question
export type ChatResponse = { answer: string; outcome: ChainOutcome; truncated: boolean };

// El Record obliga al compilador a exigir un código HTTP para cada outcome, también para los que se añadan
export const STATUS_BY_OUTCOME: Record<ChainOutcome, number> = {
    answered:      200,
    rejected:      200,
    invalid_input: 400,
    error:         503,
};
