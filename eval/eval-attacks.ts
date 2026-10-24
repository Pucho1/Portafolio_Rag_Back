import path         from "node:path";
import fs           from "node:fs/promises";

import { LangfuseClient } from "@langfuse/client";

import { EvalDatasetSchema } from "./types";
import { shutdownTracing } from "../src/observability/langfuse";
import { 
  deterministicEvaluator,
  evaluator,
  getexperimentData,
  getGitVersion,
  myTask
} from "./eval-shared";



// Initialize client
const langfuse = new LangfuseClient();

async function main() {
  const filePath = path.resolve(process.cwd(), "eval", "attack_eval_dataset.json");
  const contents = await fs.readFile(filePath, { encoding: "utf8" });
  const dataset  = EvalDatasetSchema.parse(JSON.parse(contents));


  const experimentData = getexperimentData(dataset);

  console.log(`\nEvaluando ${dataset.casos.length} la respuesta del llm...\n`);

  try{  
    const result  = await langfuse.experiment.run({
        name: "Rag digital twin Miguel - ataques",
        description: "Batería de ataques (prompt injection / jailbreak) contra el gemelo digital",
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
}


main().catch((error) => {
  console.error(error);
  process.exit(1);
});