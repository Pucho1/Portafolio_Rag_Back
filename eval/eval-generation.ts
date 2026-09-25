import fs from "node:fs/promises";
import path from "node:path";

import { runChain } from "../src/chain/chain";
import { judgeCriteria } from "../src/evaluación/judge/judge";


async function main(){
    const filePath = path.resolve(process.cwd(), "eval", "generation_eval_dataset.json");
    const contents = await fs.readFile(filePath, { encoding: "utf8" });
    const dataset  = JSON.parse(contents);

    console.log(`\nEvaluando ${dataset.casos.length} la respuesta del llm...\n`);
    
    for ( const ownCase of dataset.casos){

        const {context, answer} = await runChain(ownCase.query);

        const judgeCriteriaAnswer = await judgeCriteria(context, answer, ownCase.criterio_exito)

        console.log(JSON.stringify({judgeCriteriaAnswer}, null, 2))
    }

}



main().catch((error) => {
  console.error(error);
  process.exit(1);
});