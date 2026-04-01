import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface PenNode {
  id: string;
  name: string;
  type: string;
  children?: PenNode[] | string;
  content?: string;
  fill?: string | Record<string, unknown> | Array<Record<string, unknown>>;
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  letterSpacing?: number;
  lineHeight?: number;
  width?: number | string;
  height?: number | string;
  padding?: number | number[];
  gap?: number;
  layout?: string;
  cornerRadius?: number;
  opacity?: number;
  justifyContent?: string;
  alignItems?: string;
  textAlign?: string;
  [key: string]: unknown;
}

interface ExtractedSection {
  name: string;
  category: string;
  texts: string[];
  images: string[];
  layout: string;
  bgColor: string;
  childCount: number;
  rawStructure: string;
}

function categorizeByName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("header") || lower.includes("nav") || lower.includes("gnb")) return "header";
  if (lower.includes("footer")) return "footer";
  if (lower.includes("hero") || lower.includes("main-visual") || lower.includes("visual")) return "hero";
  if (lower.includes("banner") || lower.includes("cta")) return "banner";
  return "content";
}

function extractTexts(node: PenNode, texts: string[], depth = 0): void {
  if (depth > 6) return;
  if (node.type === "text" && node.content) {
    texts.push(node.content);
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      extractTexts(child as PenNode, texts, depth + 1);
    }
  }
}

function extractImages(node: PenNode, images: string[], depth = 0): void {
  if (depth > 6) return;
  if (node.fill) {
    if (typeof node.fill === "object" && !Array.isArray(node.fill)) {
      const f = node.fill as Record<string, unknown>;
      if (f.type === "image" && typeof f.url === "string") images.push(f.url);
    }
    if (Array.isArray(node.fill)) {
      for (const f of node.fill) {
        if (f.type === "image" && typeof f.url === "string") images.push(f.url as string);
      }
    }
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      extractImages(child as PenNode, images, depth + 1);
    }
  }
}

function getBgColor(node: PenNode): string {
  if (typeof node.fill === "string") return node.fill;
  if (typeof node.fill === "object" && !Array.isArray(node.fill)) {
    const f = node.fill as Record<string, unknown>;
    if (f.type === "image") return "image-bg";
  }
  if (Array.isArray(node.fill)) {
    for (const f of node.fill) {
      if (typeof f === "string") return f;
    }
  }
  return "#FFFFFF";
}

function structureSummary(node: PenNode, depth = 0): string {
  if (depth > 3) return "";
  const indent = "  ".repeat(depth);
  let line = `${indent}[${node.type}] ${node.name || ""}`;
  if (node.type === "text" && node.content) {
    line += `: "${node.content.slice(0, 60)}"`;
  }
  if (node.fill && typeof node.fill === "object" && !Array.isArray(node.fill)) {
    const f = node.fill as Record<string, unknown>;
    if (f.type === "image") line += ` (img: ${(f.url as string).slice(0, 50)}...)`;
  }
  if (node.fontSize) line += ` font:${node.fontSize}`;
  if (node.fontWeight) line += ` weight:${node.fontWeight}`;
  if (node.width) line += ` w:${node.width}`;
  if (node.height) line += ` h:${node.height}`;
  if (node.layout) line += ` layout:${node.layout}`;
  if (node.gap) line += ` gap:${node.gap}`;
  if (node.padding) line += ` pad:${JSON.stringify(node.padding)}`;
  if (node.cornerRadius) line += ` radius:${node.cornerRadius}`;

  const lines = [line];
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      lines.push(structureSummary(child as PenNode, depth + 1));
    }
  }
  return lines.filter(Boolean).join("\n");
}

export function parsePenSections(topLevelNodes: PenNode[]): ExtractedSection[] {
  const sections: ExtractedSection[] = [];

  for (const node of topLevelNodes) {
    if (node.type !== "frame") continue;

    const texts: string[] = [];
    const images: string[] = [];
    extractTexts(node, texts);
    extractImages(node, images);

    sections.push({
      name: node.name || `Section ${sections.length + 1}`,
      category: categorizeByName(node.name || ""),
      texts,
      images,
      layout: node.layout || "none",
      bgColor: getBgColor(node),
      childCount: Array.isArray(node.children) ? node.children.length : 0,
      rawStructure: structureSummary(node),
    });
  }

  return sections;
}

export function buildClaudePrompt(sections: ExtractedSection[]): string {
  const sectionDescriptions = sections.map((s, i) => {
    return `
--- Section ${i + 1}: "${s.name}" (category: ${s.category}) ---
Background: ${s.bgColor}
Layout: ${s.layout}
Texts found:
${s.texts.map((t) => `  - "${t}"`).join("\n")}
Images found:
${s.images.map((img) => `  - ${img}`).join("\n") || "  (none)"}
Structure:
${s.rawStructure}
`;
  }).join("\n");

  return `You are a premium web developer converting a design system into production-quality HTML+Tailwind CSS.

Below is the structured data extracted from a .pen design file. Each section has its name, category, texts, images, background color, and layout structure.

YOUR JOB: Convert each section into beautiful, pixel-perfect HTML using Tailwind CSS classes.

DESIGN DATA:
${sectionDescriptions}

OUTPUT FORMAT: Return ONLY a valid JSON array. Each element must have:
- "name": The section name (Korean)
- "category": One of "header", "footer", "hero", "content", "banner", "general"
- "html": Complete, self-contained HTML using Tailwind CSS. Must be responsive (mobile-first).
- "css": Additional CSS if needed (usually empty string since Tailwind handles it)

CRITICAL RULES:
1. Use the EXACT text content from the design - do NOT make up or change any text
2. Use the EXACT image URLs from the design data - do NOT use placeholder images
3. Match the background colors from the design
4. Use Pretendard font family (font-family: 'Pretendard', sans-serif)
5. Make each section a self-contained <section> or <footer> or <header> tag
6. Use modern Tailwind classes: rounded-2xl, backdrop-blur, etc.
7. Make layouts responsive with flex/grid + responsive breakpoints (lg:, md:)
8. Pay attention to padding, gaps, and spacing from the structure data
9. For image backgrounds, use inline style with background-image
10. Output ONLY the JSON array - no markdown fences, no explanation

QUALITY STANDARD: The output should look like a premium, modern Korean medical/healthcare website. Think Toss-level design quality.`;
}
