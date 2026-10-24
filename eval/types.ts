import { Evaluator, ExperimentTask } from "@langfuse/client";
import { ChainOutcome } from "../src/chain/chain";

export type CaseInput    = { query: string };
export type CaseMetadata = { caseId: string; tipo: string; criterio: string };

export type ExpectedResult = { outcome: ChainOutcome };

export type Task = ExperimentTask<CaseInput, ExpectedResult, CaseMetadata>;
export type Eval = Evaluator<CaseInput, ExpectedResult, CaseMetadata>;


export type CaseDataType = {
  id: string;
  query: string;
  tipo: string;
  criterio_exito: string;
  estado_ultima_evaluacion: string;
  riesgo_si_falla: string;
  nota_tecnica?: string;
  resultado_esperado: ExpectedResult;
};

export type GenerationEvalDataset = {
  descripcion: string;
  fecha_creacion: string;
  nota_importante: string;
  casos: CaseDataType[];
};