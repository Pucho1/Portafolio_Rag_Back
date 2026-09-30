import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

import { LangfuseClient, type Evaluator, type ExperimentTask } from "@langfuse/client";

import { runChain }         from "../src/chain/chain";
import type { ChainResult } from "../src/chain/chain";
import { judgeCriteria }    from "../src/evaluación/judge/judge";
import { langFuseCallBack, shutdownTracing } from "../src/observability/langfuse";

type ExperimentInput = {
  query: string;
  criterio: string;
};


type EvaluatorValues = {
  input: ExperimentInput;
  output: ChainResult;
};

type CaseDataType = {
  id: string;
  query: string;
  tipo: string;
  criterio_exito: string;
  estado_ultima_evaluacion: string;
  riesgo_si_falla: string;
  nota_tecnica?: string;
};

type GenerationEvalDataset = {
  descripcion: string;
  fecha_creacion: string;
  nota_importante: string;
  casos: CaseDataType[];
};


function isExperimentInput(value: unknown): value is ExperimentInput {
  return typeof value === "object"
    && value !== null
    && "query" in value
    && typeof value.query === "string"
    && "criterio" in value
    && typeof value.criterio === "string";
}



// Initialize client
const langfuse = new LangfuseClient();


// Define your task function
const myTask: ExperimentTask<ExperimentInput, ChainResult> = async (item) => {
  if (!isExperimentInput(item.input)) {
    throw new TypeError("El item del experimento debe incluir query y criterio.");
  }

  const handler = langFuseCallBack("eval-script", "eval-user");

  const response = await runChain(item.input.query, { callbacks: [handler] });

  return response;
};

const evaluator: Evaluator<ExperimentInput, ChainResult> = async ({ input, output }: EvaluatorValues) => {

  const juicio = await judgeCriteria(
    output.context,
    output.answer,
    input.criterio
  );

  return {
    name: "cumple_criterio",
    value: juicio.cumpleCriterio ? 1 : 0,
    comment: juicio.fragmentosProblematicos.join("\n"),
  };
}; 

const getexperimentData = ( dataset: GenerationEvalDataset ) => {
    const experimentData = dataset.casos.map((caso) => ({
        input: {
            query: caso.query,
            criterio: caso.criterio_exito,
        },
    }));

    return experimentData;
};


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
        evaluators: [evaluator],
        runName: getGitVersion()
    })

    console.log(await result.format());

  } finally { // da igual que pase quiero los tracer 

  await shutdownTracing();
}

};


main().catch((error) => {
  console.error(error);
  process.exit(1);
});