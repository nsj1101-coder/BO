import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKeySetting = await prisma.systemSetting.findUnique({ where: { key: "claude_api_key" } });
  if (!apiKeySetting?.value) {
    return NextResponse.json({ error: "API 키가 저장되지 않았습니다. 먼저 저장해주세요." }, { status: 400 });
  }

  const modelSetting = await prisma.systemSetting.findUnique({ where: { key: "claude_model" } });
  const model = modelSetting?.value || "claude-sonnet-4-20250514";

  try {
    const client = new Anthropic({ apiKey: apiKeySetting.value });
    const message = await client.messages.create({
      model,
      max_tokens: 50,
      messages: [{ role: "user", content: "Say OK" }],
    });

    const text = message.content.find((c) => c.type === "text");
    return NextResponse.json({ message: `${model} 모델 응답 확인 완료` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
