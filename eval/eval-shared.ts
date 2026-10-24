import { execSync } from "node:child_process";

import { Eval, GenerationEvalDataset, Task } from "./types";
import { ChainResult, runChain }             from "../src/chain/chain";
import { langFuseCallBack }                  from "../src/observability/langfuse";
import { judgeCriteria }                     from "../src/evaluación/judge/judge";


/**
 * Obtiene los datos de entrada para el experimento a partir del dataset de evaluación.
 * @param dataset 
 * @returns Un array de objetos con la consulta, el criterio de éxito y los metadatos del caso.
 */
export const getexperimentData = ( dataset: GenerationEvalDataset )  => {
    const experimentData = dataset.casos.map((caso) => ({
        input: { query: caso.query },
        expectedOutput: caso.resultado_esperado,
        metadata: { 
          caseId:   caso.id,
          tipo:     caso.tipo,
          criterio: caso.criterio_exito,
        },
    }));

    return experimentData;
};


/**
 * Evaluador para casos que no son deterministas
 * @param param0 
 * @returns Devuelve un objeto con el nombre del evaluador, el valor (1 o 0) y un comentario con los fragmentos problemáticos.
 */
export const evaluator: Eval = async ({ output, metadata, input }) => {

  if (!metadata || metadata?.tipo === "limite_deterministico") return [];

  const result = output as ChainResult;

  const juicio = await judgeCriteria(
    result.context,
    result.answer,
    metadata.criterio
  );

  console.log(`\nEvaluando caso: "${input.query}" con criterio: "${metadata.criterio}"`);
  console.log(`Resultado del juicio: ${JSON.stringify(juicio, null, 2)}`);

  return {
    name: "cumple_criterio",
    value:   juicio.cumpleCriterio ? 1 : 0,
    comment: juicio.fragmentosProblematicos.join("\n"),
  };
}; 


/**
 * Evaluador para comparaciones determinísticas de la salida del LLM con el resultado esperado.
 * @param param0 
 * @returns Devuelve un objeto con el nombre del evaluador, el valor (1 o 0) y un comentario con la respuesta generada.
 */
export const deterministicEvaluator: Eval = async ({ output, expectedOutput }) => {
  if (!expectedOutput?.outcome) return [];

  const outcomeOk = output.outcome === expectedOutput.outcome;
  const contextOk = output.outcome === "answered" ? output.context.trim().length > 0 : output.context.trim() === "";

  const cumpleCriterio = outcomeOk && contextOk;

  return {
    name: "cumple_criterio_deterministico",
    value: cumpleCriterio ? 1 : 0,
    comment: output.answer,
  };
}


/**
 *  Ejecuta la consulta del usuario a través de la cadena de procesamiento y devuelve el resultado.
 *  @param query Consulta escrita por el usuario.
 *  @param config Configuración de ejecución de LangChain.
 *  @returns El resultado final con la pregunta, el contexto y la respuesta generada.
 */
export const myTask: Task = async ({input }) => {
  if (!input || typeof input !== "object" ||
      !("query" in input) ||
      typeof input.query !== "string") 
  {
    throw new TypeError("El item del experimento debe incluir query.");
  }

  const handler = langFuseCallBack("eval-script", "eval-user", "rag-portafolio-eval");

  const response = await runChain(input.query, { callbacks: [handler] });

  return response;
};


/**
 *  Obtiene la versión actual del repositorio Git para usarla como nombre de ejecución en Langfuse.
 *  @returns La versión de Git en formato string, o "unknown" si no se puede determinar.
 */
export const getGitVersion = (): string => {
  try {
    return execSync("git describe --always --dirty", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"], // silencia el stderr de git
    }).trim();
  } catch {
    return process.env.GIT_VERSION ?? "unknown";
  }
}