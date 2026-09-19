import { createHash } from "node:crypto";

import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

type ParentSection = {
  title: string;
  headers: string[];
  content: string;
  metadata: Record<string, unknown>;
};

export type SplitResult = {
  parents: Map<string, Document>;
  chunks: Document[];
};

const PARENT_LEVEL = 2;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400,
  chunkOverlap: 50,
});

/**
 * Extrae los Parents del documento.
 *
 * Convención del corpus:
 *
 * #  -> documento raíz
 * ## -> Parent
 * ### / #### -> contenido perteneciente al Parent
 */
function extractParentSections(  markdown: string,  originalMetadata: Record<string, unknown>,): ParentSection[] {
  const lines = markdown.split(/\r?\n/);

  const sections: ParentSection[] = [];

  let currentParent: ParentSection | null = null;
  let childHeaders: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/);

    if (!match || isMarkdownHorizontalRule(line)) {
      if (currentParent) {
        currentParent.content += `${line}\n`;
      }

      continue;
    }

    const level = match[1].length;
    const title = normalizeHeader(match[2]);

    // ## inicia un nuevo Parent.
    if (level === PARENT_LEVEL) {
      if (currentParent?.content.trim()) {
        sections.push(currentParent);
      }

      childHeaders = [];

      currentParent = {
        title,
        headers: [title],
        content: "",
        metadata: {
          ...originalMetadata,
          parentTitle: title,
          parentLevel: PARENT_LEVEL,
        },
      };

      continue;
    }

    // ### / #### pertenecen al Parent actual.
    if (level > PARENT_LEVEL && currentParent) {
      childHeaders = childHeaders.slice(0, level - PARENT_LEVEL - 1);

      childHeaders.push(title);

      currentParent.content += `\n${"#".repeat(level)} ${title}\n`;

      continue;
    }

    // # es únicamente el root del documento.
    // No crea Parents.
  }

  if (currentParent?.content.trim()) {
    sections.push(currentParent);
  }

  return sections;
}

function normalizeHeader(raw: string): string {
  return raw
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/\s*#+\s*$/, "")
    .replace(/\s+/g, " ");
}

/**
 * Genera un ID estable para el Parent.
 *
 * La identidad depende de la fuente y de su estructura,
 * no de la posición del Parent en el array.
 */
function createParentId(  metadata: Record<string, unknown>,  title: string,): string {
  const source = String(metadata.source ?? "unknown");

  const structuralIdentity = `${source}::${title}`;

  return createHash("sha256")
    .update(structuralIdentity)
    .digest("hex");
}

function createParentDocument(  section: ParentSection,): Document {
  const parentId = createParentId(
    section.metadata,
    section.title,
  );

  return new Document({
    pageContent: section.content.trim(),

    metadata: {
      ...section.metadata,

      parentId,

      parentTitle: section.title,

      parentLevel: PARENT_LEVEL,

      isParent: true,
    },
  });
}

function withContext(  content: string,  headers: string[],): string {
  const context = headers.length
    ? `Contexto: ${headers.join(" > ")}\n\n`
    : "";

  return `${context}${content.trim()}`;
}

async function createChildren(  parent: Document,): Promise<Document[]> {
  const splitDocuments = await splitter.splitDocuments([
    new Document({
      pageContent: parent.pageContent,
      metadata: parent.metadata,
    }),
  ]);

  return splitDocuments.map((chunk) => {
    const parentTitle = String(
      parent.metadata.parentTitle ?? "",
    );

    return new Document({
      pageContent: withContext(
        chunk.pageContent,
        [parentTitle],
      ),

      metadata: {
        ...chunk.metadata,

        parentId: parent.metadata.parentId,

        parentTitle,

        isParent: false,
      },
    });
  });
}

export async function splitMarkdownDocuments(  documents: Document[],): Promise<SplitResult> {
  const parents = new Map<string, Document>();
  const chunks: Document[] = [];

  for (const document of documents) {
    const sections = extractParentSections(
      document.pageContent,
      (document.metadata ?? {}) as Record<string, unknown>,
    );

    for (const section of sections) {
      const parent = createParentDocument(section);

      const parentId = String(
        parent.metadata.parentId,
      );

      parents.set(parentId, parent);

      const children = await createChildren(parent);

      chunks.push(...children);
    }
  }

  return {
    parents,
    chunks,
  };
}

function isMarkdownHorizontalRule(  line: string,): boolean {
  return /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line);
}