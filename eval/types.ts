import { z } from "zod";
import { Evaluator, ExperimentTask } from "@langfuse/client";
import { ChainOutcome } from "../src/chain/chain";


const OUTCOMES = ["answered", "rejected", "invalid_input", "error"] as const satisfies readonly ChainOutcome[];

export const ExpectedResultSchema = z.object({
  outcomes_validos: z.array(z.enum(OUTCOMES)).min(1),
});

export const EvalCaseSchema = z.object({
  id:                       z.string(),
  query:                    z.string(),
  tipo:                     z.string(),
  familia:                  z.string().optional(),
  criterio:                 z.string(),
  requiere_juez:            z.boolean(),
  resultado_esperado:       ExpectedResultSchema,
  estado_ultima_evaluacion: z.string().optional(),
  riesgo_si_falla:          z.string().optional(),
  nota_tecnica:             z.string().optional(),
});

export const EvalDatasetSchema = z.object({
  descripcion:     z.string(),
  fecha_creacion:  z.string(),
  nota_importante: z.string(),
  casos:           z.array(EvalCaseSchema).min(1),
});

export type ExpectedResult = z.infer<typeof ExpectedResultSchema>;
export type EvalCase       = z.infer<typeof EvalCaseSchema>;
export type EvalDataset    = z.infer<typeof EvalDatasetSchema>;

export type CaseInput    = { query: string };
export type CaseMetadata = { caseId: string; tipo: string; criterio: string; requiereJuez: boolean };

export type Task = ExperimentTask<CaseInput, ExpectedResult, CaseMetadata>;
export type Eval = Evaluator<CaseInput, ExpectedResult, CaseMetadata>;
