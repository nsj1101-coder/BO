import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { spawn } from "child_process";

interface McpResponse {
  result?: {
    content?: Array<{ type: string; text?: string }>;
  };
}

function callPencilMcp(method: string, params: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("MCP timeout")), 30000);

    // Find pencil MCP - it's a Claude Code built-in, so we call it via the MCP protocol
    // For server-side, we use a direct HTTP approach or spawn approach
    // Since pencil MCP runs as part of Claude Code, we need an alternative approach:
    // Parse the .pen file structure directly using its JSON-based format

    clearTimeout(timeout);
    reject(new Error("Pencil MCP is not available server-side. Use the extract-local endpoint instead."));
  });
}

// This endpoint reads .pen files directly since they are JSON-based internally
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filePath } = await req.json();

  try {
    // .pen files are actually structured data that pencil MCP reads
    // Since we can't call pencil MCP from the server, we provide a manual extraction API
    // The admin can use Claude Code conversation to extract and send the data

    return NextResponse.json({
      error: "자동 추출 불가",
      message: "pen 파일은 Pencil MCP를 통해서만 읽을 수 있습니다. Claude Code 대화에서 추출해주세요.",
      instruction: "Claude Code에게 다음과 같이 요청하세요: 'doc/pen/파일명.pen 파일을 읽어서 템플릿으로 변환해줘'",
    }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
