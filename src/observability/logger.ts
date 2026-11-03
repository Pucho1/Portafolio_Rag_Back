const MAX_TEXT_LENGTH = 80;

const shorten = (text: string): string =>
    text.length > MAX_TEXT_LENGTH ? `${text.slice(0, MAX_TEXT_LENGTH)}…` : text;

/**
 * Escribe en consola lo fundamental de un paso de la cadena: [paso] "consulta" clave=valor ...
 * Todo va en una sola línea para que no se mezcle cuando el eval ejecuta varios casos en paralelo.
 * @param step  Nombre del paso, el mismo runName que aparece en la traza de Langfuse.
 * @param query Consulta del usuario, para saber a qué caso pertenece la línea.
 * @param data  Campos del paso; los textos largos se recortan.
 */
export const logStep = (step: string, query: string, data: Record<string, unknown>): void => {
    const fields = Object.entries(data)
        .map(([key, value]) => `${key}=${JSON.stringify(typeof value === "string" ? shorten(value) : value)}`)
        .join(" ");

    console.log(`[${step}] "${shorten(query)}" ${fields}`);
};
