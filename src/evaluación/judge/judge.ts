import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI }         from "@langchain/openai";

import z from "zod";

// temperature: 0, igual que en router.ts — reduce varianza entre corridas del mismo caso,
// crítico para un juez que se usa en regresión (comparar versiones del sistema)
const judgeModel = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
});

// Creo el esquema en el cual el modelo me devolvera la respuesta.
export const faithfulnessSchema = z.object({
  esFiel: z.boolean(),
  afirmacionesNoRespaldadas: z.array(z.string()),
});


const JUDGE_SYSTEM_PROMPT = `
    Eres un juez de FIDELIDAD (faithfulness) para un sistema RAG. Tu única tarea es
    verificar si cada afirmación factual de una RESPUESTA está respaldada literalmente
    por el CONTEXTO proporcionado.

    REGLAS:
    - Marca como no respaldada cualquier afirmación (dato, fecha, nombre, tecnología,
    cifra) que no aparezca en el CONTEXTO, o que lo contradiga.
    - NO evalúes estilo, organización, claridad ni si la respuesta es la "mejor forma"
    de presentar la información. Una respuesta puede estar mal organizada y seguir
    siendo 100% fiel — eso no es tu trabajo, solo juzgas fidelidad a los hechos.
    - Frases de cortesía, transiciones o disculpas ("no tengo esa información",
    "puedo ayudarte con...") no cuentan como afirmaciones a verificar.
    - Si esFiel es true, afirmacionesNoRespaldadas debe ser un array vacío.
    - En afirmacionesNoRespaldadas, cita la frase LITERAL de la respuesta que no
    encuentra respaldo (no la resumas ni la parafrasees).
`;

const judgeHumanTemplate = `
    <context>{context}</context>

    <answer>{answer}</answer>
`;

// creo una plkantilla del prompt sobre la cual despues dinamicamente se susutityllen los valores
const judgePrompt = ChatPromptTemplate.fromMessages([
  ["system", JUDGE_SYSTEM_PROMPT],
  ["human", judgeHumanTemplate],
]);

const structuredJudge = judgeModel.withStructuredOutput(faithfulnessSchema);

/**
 * 
 * @param context 
 * @param answer 
 * @returns 
 */
export async function judgeFaithfulness(  context: string,  answer: string): Promise<z.infer<typeof faithfulnessSchema>> {
  const formattedPrompt = await judgePrompt.invoke({ context, answer });
  return structuredJudge.invoke(formattedPrompt);
}