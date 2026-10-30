import { z } from "zod";
import { Evaluator, ExperimentTask, RunEvaluator } from "@langfuse/client";
import { ChainOutcome } from "../src/chain/chain";


const OUTCOMES = ["answered", "rejected", "invalid_input", "error"] as const satisfies readonly ChainOutcome[];

// El tipo decide en qué métrica cuenta cada caso: una errata no puede pasar la validación.
export const CaseTipoSchema = z.enum([
  "ataque",
  "control_legitimo",
  "fidelidad_positiva",
  "limite_de_dominio",
  "limite_deterministico",
  "seguridad_basica",
]);

export const ExpectedResultSchema = z.object({
  outcomes_validos: z.array(z.enum(OUTCOMES)).min(1),
});

export const EvalCaseSchema = z.object({
  id:                       z.string(),
  query:                    z.string(),
  tipo:                     CaseTipoSchema,
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

export type CaseTipo       = z.infer<typeof CaseTipoSchema>;
export type ExpectedResult = z.infer<typeof ExpectedResultSchema>;
export type EvalCase       = z.infer<typeof EvalCaseSchema>;
export type EvalDataset    = z.infer<typeof EvalDatasetSchema>;



export type CaseInput    = { query: string };
export type CaseMetadata = { caseId: string; tipo: CaseTipo; familia?: string; criterio: string; requiereJuez: boolean };

export type Task    = ExperimentTask<CaseInput, ExpectedResult, CaseMetadata>;
export type Eval    = Evaluator<CaseInput, ExpectedResult, CaseMetadata>;
export type RunEval = RunEvaluator<CaseInput, ExpectedResult, CaseMetadata>;





// El tipo decide en qué métrica cuenta cada caso: detección (alucinacion) o falsa alarma (fiel).
export const GroundingCaseTipoSchema = z.enum(["fiel", "alucinacion"]);

export const GroundingExpectedResultSchema = z.object({
  isGrounded: z.boolean(),
});

export const GroundingCaseSchema = z.object({
  id:                 z.string(),
  tipo:               GroundingCaseTipoSchema,
  familia:            z.string(),
  contexto:           z.string(), // clave de `contextos` en el dataset
  answer:             z.string(),
  resultado_esperado: GroundingExpectedResultSchema,
  nota:               z.string(),
});

export const GroundingDatasetSchema = z.object({
  descripcion:     z.string(),
  fecha_creacion:  z.string(),
  nota_importante: z.string(),
  contextos:       z.record(z.string(), z.string()),
  casos:           z.array(GroundingCaseSchema).min(1),
}).superRefine((dataset, ctx) => {
  // Una errata en la clave dejaría el caso sin contexto contra el que verificar.
  dataset.casos.forEach((caso, index) => {
    if (!Object.hasOwn(dataset.contextos, caso.contexto)) {
      ctx.addIssue({
        code:    "custom",
        message: `El contexto "${caso.contexto}" no existe en contextos.`,
        path:    ["casos", index, "contexto"],
      });
    }
  });
});

export type GroundingCaseTipo       = z.infer<typeof GroundingCaseTipoSchema>;
export type GroundingExpectedResult = z.infer<typeof GroundingExpectedResultSchema>;
export type GroundingCase           = z.infer<typeof GroundingCaseSchema>;
export type GroundingDataset        = z.infer<typeof GroundingDatasetSchema>;

export type GroundingInput    = { context: string; answer: string };
export type GroundingMetadata = { caseId: string; tipo: GroundingCaseTipo; familia: string };

export type GroundingEval = Evaluator<GroundingInput, GroundingExpectedResult, GroundingMetadata>;

export type RunGroundingEval = RunEvaluator<GroundingInput, GroundingExpectedResult, GroundingMetadata>;
