import { spawn, ChildProcess } from "child_process";
import path from "path";
import { readdir } from "fs/promises";

interface McpResponse {
  jsonrpc: string;
  id: number;
  result?: {
    content?: Array<{ type: string; text?: string }>;
  };
  error?: { code: number; message: string };
}

const MCP_PORT = 9124;
let mcpProcess: ChildProcess | null = null;
let sessionId: string | null = null;

async function findPencilBinary(): Promise<string> {
  const vsCodeExtDir = path.join(process.env.HOME || "", ".vscode", "extensions");
  const entries = await readdir(vsCodeExtDir);
  const pencilDirs = entries.filter((e) => e.startsWith("highagency.pencildev-")).sort().reverse();
  if (pencilDirs.length === 0) throw new Error("Pencil 확장이 설치되지 않았습니다.");
  return path.join(vsCodeExtDir, pencilDirs[0], "out", "mcp-server-darwin-arm64");
}

async function ensureMcpRunning(): Promise<void> {
  // Check if already running
  if (mcpProcess && !mcpProcess.killed) {
    try {
      const res = await fetch(`http://localhost:${MCP_PORT}/mcp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}) },
        body: JSON.stringify({ jsonrpc: "2.0", id: 0, method: "ping", params: {} }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return;
    } catch {}
  }

  // Start new process
  if (mcpProcess) {
    mcpProcess.kill();
    mcpProcess = null;
    sessionId = null;
  }

  const binary = await findPencilBinary();
  mcpProcess = spawn(binary, ["-http", `-http-port`, String(MCP_PORT), "-app", "visual_studio_code"], {
    stdio: ["pipe", "pipe", "pipe"],
    detached: false,
  });

  mcpProcess.on("exit", () => {
    mcpProcess = null;
    sessionId = null;
  });

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Initialize
  const initRes = await fetch(`http://localhost:${MCP_PORT}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "sjcms-admin", version: "1.0" },
      },
    }),
  });

  sessionId = initRes.headers.get("mcp-session-id");
  if (!sessionId) throw new Error("MCP 세션 ID를 받지 못했습니다.");
}

async function mcpCall(method: string, params: Record<string, unknown>): Promise<McpResponse> {
  await ensureMcpRunning();

  const res = await fetch(`http://localhost:${MCP_PORT}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
    signal: AbortSignal.timeout(30000),
  });

  return res.json() as Promise<McpResponse>;
}

export async function callPencilBatchGet(
  filePath: string,
  options: {
    nodeIds?: string[];
    readDepth?: number;
    searchDepth?: number;
    patterns?: Array<Record<string, unknown>>;
  } = {}
): Promise<{ content?: Array<{ text?: string }> }> {
  const result = await mcpCall("tools/call", {
    name: "batch_get",
    arguments: {
      filePath,
      readDepth: options.readDepth ?? 2,
      ...(options.nodeIds ? { nodeIds: options.nodeIds } : {}),
      ...(options.patterns ? { patterns: options.patterns } : {}),
      ...(options.searchDepth ? { searchDepth: options.searchDepth } : {}),
    },
  });

  if (result.error) throw new Error(result.error.message);
  return result.result as { content?: Array<{ text?: string }> };
}

// --- Extraction helpers ---

interface PenNode {
  id: string;
  name: string;
  type: string;
  children?: PenNode[] | string;
  content?: string;
  fill?: unknown;
  fontSize?: number;
  fontWeight?: string | number;
  layout?: string;
  gap?: number;
  padding?: number | number[];
  width?: number | string;
  height?: number | string;
  cornerRadius?: number;
  [key: string]: unknown;
}

interface ExtractedSection {
  name: string;
  category: string;
  texts: string[];
  images: string[];
  bgColor: string;
  layout: string;
  rawStructure: string;
}

function categorize(name: string): string {
  const l = name.toLowerCase();
  if (l.includes("header") || l.includes("nav")) return "header";
  if (l.includes("footer")) return "footer";
  if (l.includes("hero")) return "hero";
  if (l.includes("banner") || l.includes("cta")) return "banner";
  return "content";
}

function collectTexts(node: PenNode, out: string[], depth = 0): void {
  if (depth > 6) return;
  if (node.type === "text" && node.content) out.push(node.content);
  if (Array.isArray(node.children)) {
    for (const c of node.children) collectTexts(c as PenNode, out, depth + 1);
  }
}

function collectImages(node: PenNode, out: string[], depth = 0): void {
  if (depth > 6) return;
  const fill = node.fill as Record<string, unknown> | Array<Record<string, unknown>> | undefined;
  if (fill && typeof fill === "object" && !Array.isArray(fill) && fill.type === "image" && typeof fill.url === "string") {
    out.push(fill.url);
  }
  if (Array.isArray(fill)) {
    for (const f of fill) {
      if (f.type === "image" && typeof f.url === "string") out.push(f.url);
    }
  }
  if (Array.isArray(node.children)) {
    for (const c of node.children) collectImages(c as PenNode, out, depth + 1);
  }
}

function summarize(node: PenNode, depth = 0): string {
  if (depth > 3) return "";
  const indent = "  ".repeat(depth);
  let line = `${indent}[${node.type}] ${node.name || ""}`;
  if (node.type === "text" && node.content) line += `: "${node.content.slice(0, 80)}"`;
  if (node.fill && typeof node.fill === "object" && !Array.isArray(node.fill)) {
    const f = node.fill as Record<string, unknown>;
    if (f.type === "image") line += ` (img)`;
  }
  if (node.fontSize) line += ` f:${node.fontSize}`;
  if (node.fontWeight) line += ` w:${node.fontWeight}`;
  if (node.layout) line += ` layout:${node.layout}`;
  if (node.gap) line += ` gap:${node.gap}`;
  const lines = [line];
  if (Array.isArray(node.children)) {
    for (const c of node.children) {
      const s = summarize(c as PenNode, depth + 1);
      if (s) lines.push(s);
    }
  }
  return lines.join("\n");
}

function getBg(node: PenNode): string {
  if (typeof node.fill === "string") return node.fill;
  if (Array.isArray(node.fill)) {
    for (const f of node.fill as Array<Record<string, unknown>>) {
      if (typeof f === "string") return f;
    }
  }
  return "#FFFFFF";
}

export function extractSections(nodes: PenNode[]): ExtractedSection[] {
  return nodes.filter((n) => n.type === "frame").map((node) => {
    const texts: string[] = [];
    const images: string[] = [];
    collectTexts(node, texts);
    collectImages(node, images);
    return {
      name: node.name || "Section",
      category: categorize(node.name || ""),
      texts,
      images,
      bgColor: getBg(node),
      layout: node.layout || "none",
      rawStructure: summarize(node),
    };
  });
}
