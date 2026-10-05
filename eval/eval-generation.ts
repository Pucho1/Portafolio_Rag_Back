import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

import { LangfuseClient, type Evaluator, type ExperimentTask } from "@langfuse/client";

import { runChain }         from "../src/chain/chain";
import type { ChainOutcome, ChainResult } from "../src/chain/chain";
import { judgeCriteria }    from "../src/evaluación/judge/judge";
import { langFuseCallBack, shutdownTracing } from "../src/observability/langfuse";


type CaseInput    = { query: string };
type CaseMetadata = { caseId: string; tipo: string; criterio: string };

type ExpectedResult = { outcome: ChainOutcome };

type Task = ExperimentTask<CaseInput, ExpectedResult, CaseMetadata>;
type Eval = Evaluator<CaseInput, ExpectedResult, CaseMetadata>;


type CaseDataType = {
  id: string;
  query: string;
  tipo: string;
  criterio_exito: string;
  estado_ultima_evaluacion: string;
  riesgo_si_falla: string;
  nota_tecnica?: string;
  resultado_esperado: ExpectedResult;
};

type GenerationEvalDataset = {
  descripcion: string;
  fecha_creacion: string;
  nota_importante: string;
  casos: CaseDataType[];
};

// Initialize client
const langfuse = new LangfuseClient();


/**
 *  Ejecuta la consulta del usuario a través de la cadena de procesamiento y devuelve el resultado.
 *  @param query Consulta escrita por el usuario.
 *  @param config Configuración de ejecución de LangChain.
 *  @returns El resultado final con la pregunta, el contexto y la respuesta generada.
 */
const myTask: Task = async ({input }) => {
  if (!input || typeof input !== "object" ||
      !("query" in input) ||
      typeof input.query !== "string") 
  {
    throw new TypeError("El item del experimento debe incluir query.");
  }

  const handler = langFuseCallBack("eval-script", "eval-user");

  const response = await runChain(input.query, { callbacks: [handler] });

  return response;
};

/**
 * Evaluador para casos que no son deterministas
 * @param param0 
 * @returns Devuelve un objeto con el nombre del evaluador, el valor (1 o 0) y un comentario con los fragmentos problemáticos.
 */
const evaluator: Eval = async ({ output, metadata, input }) => {

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
const deterministicEvaluator: Eval = async ({ output, expectedOutput }) => {
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
 * Obtiene los datos de entrada para el experimento a partir del dataset de evaluación.
 * @param dataset 
 * @returns Un array de objetos con la consulta, el criterio de éxito y los metadatos del caso.
 */
const getexperimentData = ( dataset: GenerationEvalDataset )  => {
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
 *  Obtiene la versión actual del repositorio Git para usarla como nombre de ejecución en Langfuse.
 *  @returns La versión de Git en formato string, o "unknown" si no se puede determinar.
 */
const getGitVersion = (): string => {
  try {
    return execSync("git describe --always --dirty", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"], // silencia el stderr de git
    }).trim();
  } catch {
    return process.env.GIT_VERSION ?? "unknown";
  }
}


async function main() {
  const filePath = path.resolve(process.cwd(), "eval", "generation_eval_dataset.json");
  const contents = await fs.readFile(filePath, { encoding: "utf8" });
  const dataset: GenerationEvalDataset = JSON.parse(contents);
  const experimentData = getexperimentData(dataset);

  console.log(`\nEvaluando ${dataset.casos.length} la respuesta del llm...\n`);

  try{  
    const result  = await langfuse.experiment.run({
        name: "Rag digital twin Miguel Test",
        description: "Testing Rag For gigital twin",
        data: experimentData,
        task: myTask,
        evaluators: [ evaluator , deterministicEvaluator ],
        runName: getGitVersion()
    })

    console.log(await result.format());
    // console.log( JSON.stringify( result, null, 2 ) );

  } finally { // da igual que pase quiero los tracer 

  await shutdownTracing();
}

};


main().catch((error) => {
  console.error(error);
  process.exit(1);
});