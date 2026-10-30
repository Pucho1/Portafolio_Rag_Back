import fs           from "node:fs/promises";
import path         from "node:path";

import { langFuseCallBack, registerTracing, shutdownTracing } from "../src/observability/langfuse";
import { GroundingResult, verifyAnswerQuery } from "../src/grounding/grounding";
import {
  Eval,
  GroundingCaseTipo,
  GroundingDataset,
  GroundingDatasetSchema,
  GroundingEval,
  GroundingExpectedResult,
  GroundingInput,
  GroundingMetadata,
  RunGroundingEval
} from "./types";
import { ExperimentTask, LangfuseClient, type ExperimentItemResult } from "@langfuse/client";
import { getGitVersion } from './eval-shared';

type ItemResult = ExperimentItemResult<GroundingInput, GroundingExpectedResult, GroundingMetadata>;


// Initialize client
const langfuse = new LangfuseClient();


// item.item puede ser también un DatasetItem de Langfuse, cuyo metadata no está tipado.
const meta = (item: ItemResult) => item.item.metadata as GroundingMetadata | undefined;

// Igual que metadata: en un DatasetItem, expectedOutput tampoco está tipado.
const expected = (item: ItemResult) => item.item.expectedOutput as GroundingExpectedResult | undefined;

/** Sin un isGrounded booleano el caso es error: nunca se da por bueno ni por fallido sin información. */
const hasVerdict = (item: ItemResult) => typeof item.output?.isGrounded === "boolean";

/** Identifica un caso en los comentarios: id y familia. */
const describe = (item: ItemResult) => `${meta(item)?.caseId} (${meta(item)?.familia})`;

/**
 * Proporción de casos de un tipo, excluyendo los errores, marcados como isGrounded false.
 * @returns La tasa (0 si no hay casos) y un comentario con los casos cuyo veredicto no es el esperado.
 */
const flaggedRate = (itemResults: ItemResult[], tipo: GroundingCaseTipo) => {
  const cases   = itemResults.filter((item) => meta(item)?.tipo === tipo && hasVerdict(item));
  const flagged = cases.filter((item) => item.output.isGrounded === false);
  const wrong   = cases.filter((item) => item.output.isGrounded !== expected(item)?.isGrounded);

  return {
    value:   cases.length === 0 ? 0 : flagged.length / cases.length,
    comment: `${flagged.length}/${cases.length}` + (wrong.length ? ` → fallos: ${wrong.map(describe).join(", ")}` : ""),
  };
};

/**
 * Métricas agregadas del verificador de grounding.
 * - detection_rate:   alucinaciones marcadas como isGrounded false (cuanto más alta, mejor).
 * - false_alarm_rate: respuestas fieles marcadas como isGrounded false (cuanto más baja, mejor).
 * - error_count:      casos sin veredicto o descartados por Langfuse al lanzar la tarea; quedan
 *                     fuera de las tasas.
 * @param expectedIds Ids de todos los casos del dataset, para detectar los descartados.
 */
const groundingMetrics = (expectedIds: string[]): RunGroundingEval => async ({ itemResults }) => {
  const present = new Set(itemResults.map((item) => meta(item)?.caseId));
  const missing = expectedIds.filter((id) => !present.has(id));
  const errors  = itemResults.filter((item) => !hasVerdict(item)).map(describe);

  return [
    { name: "detection_rate",   ...flaggedRate(itemResults, "alucinacion") },
    { name: "false_alarm_rate", ...flaggedRate(itemResults, "fiel") },
    {
      name:    "error_count",
      value:   errors.length + missing.length,
      comment: [...errors, ...missing.map((id) => `${id} (descartado)`)].join(", "),
    },
  ];
};


const groundingEvaluator: GroundingEval = async ({ output, expectedOutput }) => {
  if (typeof output?.isGrounded !== "boolean" || !expectedOutput) return [];

  return {
    name:    "veredicto_correcto",
    value:   output.isGrounded === expectedOutput.isGrounded ? 1 : 0,
    comment: JSON.stringify(output.claims),
  };
};


const getexperimentData = (dataset: GroundingDataset) => {

  const resutl = dataset.casos.map((caso) => ({
    input:          { context: dataset.contextos[caso.contexto], answer: caso.answer },
    expectedOutput: caso.resultado_esperado,
    metadata:       { caseId: caso.id, tipo: caso.tipo, familia: caso.familia },
  }));

  return resutl;
}


const task: ExperimentTask<GroundingInput, GroundingExpectedResult, GroundingMetadata> = async ({ input }) => {
  const handler = langFuseCallBack("grounding-script", "eval-user", "rag-portafolio-grounding");
  return verifyAnswerQuery(input as GroundingInput, { callbacks: [handler] });
};


/**
 * Script manual para probar la clasificación del groundin (dev:evalgrounding).
 */
async function main (){

  
  // Sin el provider registrado, el CallbackHandler genera spans que no llegan a Langfuse
  registerTracing();

  const filePath = path.resolve(process.cwd(), "eval", "grounding_eval_dataset.json");
  const contents = await fs.readFile(filePath, { encoding: "utf8" });
  const dataset  = GroundingDatasetSchema.parse(JSON.parse(contents));

  const experimentData = getexperimentData(dataset);
  
  try {
 

    const result  = await langfuse.experiment.run({
        name: "Rag digital twin Miguel - grounding",
        description: "Batería de ataques contra la respuesta del genarador del gemelo digital (GROUNDING)",
        data: experimentData,
        task,
        evaluators: [ groundingEvaluator ],
        runEvaluators: [ groundingMetrics(dataset.casos.map((caso) => caso.id)) ],
        runName: getGitVersion()
    })

      console.log("esta es la salida del grounding ======>", JSON.stringify(result, null, 2));


  } finally { // envía los spans pendientes antes de que termine el proceso
    await shutdownTracing();
  }
};


main().catch((error) => {
  console.error(error);
  process.exit(1);
});



