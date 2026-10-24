import fs           from "node:fs/promises";
import path         from "node:path";

import { LangfuseClient } from "@langfuse/client";

import { shutdownTracing }       from "../src/observability/langfuse";
import { EvalDatasetSchema }     from "./types";
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
  const filePath = path.resolve(process.cwd(), "eval", "generation_eval_dataset.json");
  const contents = await fs.readFile(filePath, { encoding: "utf8" });
  const dataset  = EvalDatasetSchema.parse(JSON.parse(contents));


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