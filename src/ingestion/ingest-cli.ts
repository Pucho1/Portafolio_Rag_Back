import { ingestDoc } from "./ingestion";

// Punto de entrada de la ingesta (dev:ingestion). ingestion.ts no se ejecuta al importarse:
// store.ts lo importa y, si lo hiciera, el servidor lanzaría la ingesta dos veces a la vez.
ingestDoc().catch((error) => {
  console.error("Error en la ingestión contextual:", error);
  process.exit(1);
});
