import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

type Section = {
  headers: string[];
  level: number;
  content: string;
  metadata: Record<string, unknown>;
};

function extractMarkdownSections(markdown: string, originalMetadata: Record<string, unknown>): Section[] {
  const lines = markdown.split(/\r?\n/);
  const sections: Section[] = [];
  const activeHeaders: Record<number, string> = {};
  let currentSection: Section | null = null;

  for (const line of lines) {
    const match 			= line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/);
		const sectionBaja = isMarkdownHorizontalRule(line)

    if (match && !sectionBaja) {
      if (currentSection?.content.trim()) {
        sections.push(currentSection);
      }

      const level = match[1].length;
      const headerText = normalizeHeader(match[2]);

      for (const key of Object.keys(activeHeaders).map(Number)) {
        if (key >= level) {
          delete activeHeaders[key];
        }
      }

      activeHeaders[level] = headerText;

      const orderedHeaders = Object.keys(activeHeaders)
        .map(Number)
        .sort((a, b) => a - b)
        .map((key) => activeHeaders[key]);

      currentSection = {
        headers: orderedHeaders,
        level,
        content: "",
        metadata: {
          ...originalMetadata,
          headers: orderedHeaders,
          headerLevel: level,
        },
      };

      continue;
    }

    if (currentSection) {
      currentSection.content += `${line}\n`;
    }
  }

  if (currentSection?.content.trim()) {
    sections.push(currentSection);
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


function withContext(pageContent: string, headers: string[]): string {
  const contextText = headers.length > 0 ? `Contexto: ${headers.join(" > ")}\n\n` : "";
  return `${contextText}${pageContent.trim()}`;
}

function isMarkdownHorizontalRule(line: string): boolean {
  return /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line);
}


export async function splitMarkdownDocuments(documents: Document[]): Promise<Document[]> {
  const finalDocs: Document[] = [];
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 400,
    chunkOverlap: 50,
  });

  for (const document of documents) {
    const sections = extractMarkdownSections(
      document.pageContent,
      (document.metadata ?? {}) as Record<string, unknown>
    );

    for (const section of sections) {
      const sectionContent = section.content.trim();

      if (!sectionContent) continue;

      if (sectionContent.length <= 400) {
        finalDocs.push(
          new Document({
            pageContent: withContext(sectionContent, section.headers),
            metadata: {
              ...section.metadata,
              headers: section.headers,
              headerLevel: section.level,
            },
          })
        );
        continue;
      }

      const splitDocs = await splitter.splitDocuments([
        new Document({
          pageContent: sectionContent,
          metadata: {
            ...section.metadata,
            headers: section.headers,
            headerLevel: section.level,
          },
        }),
      ]);

      for (const splitDoc of splitDocs) {
        finalDocs.push(
          new Document({
            pageContent: withContext(splitDoc.pageContent, section.headers),
            metadata: {
              ...splitDoc.metadata,
              ...section.metadata,
              headers: section.headers,
              headerLevel: section.level,
            },
          })
        );
      }
    }
  }

  return finalDocs;
}