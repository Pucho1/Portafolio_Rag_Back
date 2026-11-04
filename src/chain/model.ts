import { ChatOpenAI } from "@langchain/openai";

const GENERATION_MAX_TOKENS = 800
const GENERATION_TIMEOUT_MS = 15000
const GENERATION_MAX_RETRIES = 1

// Lo comparten la generación y la corrección: corregir es redactar, no juzgar.
export const generationModel = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  maxTokens: GENERATION_MAX_TOKENS,
  timeout: GENERATION_TIMEOUT_MS,
  maxRetries: GENERATION_MAX_RETRIES,
});
