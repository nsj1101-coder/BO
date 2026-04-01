import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { callPencilBatchGet, extractSections } from "@/lib/pencil-mcp-client";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const { filePath, folderId } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const log = (step: string, detail: string, isError = false) => {
        const data = JSON.stringify({ step, detail, isError, time: new Date().toISOString() });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        console.log(`[pen-analyze] ${step}: ${detail}`);
      };

      try {
        // Step 0: Check API key
        log("설정 확인", "Claude API 키 조회 중...");
        const apiKeySetting = await prisma.systemSetting.findUnique({ where: { key: "claude_api_key" } });
        if (!apiKeySetting?.value) {
          log("오류", "Claude API 키가 설정되지 않았습니다. /settings에서 등록해주세요.", true);
          controller.close();
          return;
        }
        log("설정 확인", `API 키 확인 완료 (${apiKeySetting.value.slice(0, 10)}...)`);

        const modelSetting = await prisma.systemSetting.findUnique({ where: { key: "claude_model" } });
        const model = modelSetting?.value || "claude-sonnet-4-20250514";
        log("설정 확인", `모델: ${model}`);

        // Step 1: Read .pen file via Pencil MCP
        log("Pencil MCP", "MCP 서버 시작 및 .pen 파일 읽기 중...");
        log("Pencil MCP", `파일 경로: ${filePath}`);

        let topNodes;
        try {
          const topResult = await callPencilBatchGet(filePath, { readDepth: 2 });
          const topContent = (topResult as { content?: Array<{ text?: string }> })?.content;
          if (!topContent?.[0]?.text) {
            log("Pencil MCP", "데이터 없음 - topContent가 비어있습니다.", true);
            log("디버그", `topResult: ${JSON.stringify(topResult).slice(0, 500)}`, true);
            controller.close();
            return;
          }
          topNodes = JSON.parse(topContent[0].text);
          log("Pencil MCP", `최상위 노드 ${topNodes.length}개 발견`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          log("Pencil MCP", `1차 읽기 실패: ${msg}`, true);
          controller.close();
          return;
        }

        // Step 2: Find sections
        const mainPage = topNodes[0];
        if (!mainPage?.children || !Array.isArray(mainPage.children)) {
          log("구조 분석", `메인 페이지에 children이 없습니다. keys: ${Object.keys(mainPage || {}).join(", ")}`, true);
          controller.close();
          return;
        }

        const sectionFrames = mainPage.children.filter((c: { type: string }) => c.type === "frame");
        const sectionIds = sectionFrames.map((c: { id: string }) => c.id);
        log("구조 분석", `${sectionFrames.length}개 섹션 프레임 발견: ${sectionFrames.map((f: { name: string }) => f.name).join(", ")}`);

        // Step 3: Deep read
        log("Pencil MCP", "섹션 상세 데이터 읽기 중 (depth 4)...");
        let deepNodes;
        try {
          const deepResult = await callPencilBatchGet(filePath, { nodeIds: sectionIds, readDepth: 4 });
          const deepContent = (deepResult as { content?: Array<{ text?: string }> })?.content;
          if (!deepContent?.[0]?.text) {
            log("Pencil MCP", "상세 데이터 없음", true);
            log("디버그", `deepResult: ${JSON.stringify(deepResult).slice(0, 500)}`, true);
            controller.close();
            return;
          }
          deepNodes = JSON.parse(deepContent[0].text);
          log("Pencil MCP", `상세 노드 ${deepNodes.length}개 읽기 완료`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          log("Pencil MCP", `상세 읽기 실패: ${msg}`, true);
          controller.close();
          return;
        }

        // Step 4: Extract sections
        log("데이터 추출", "텍스트, 이미지, 레이아웃 추출 중...");
        const sections = extractSections(deepNodes);
        log("데이터 추출", `${sections.length}개 섹션 추출 완료`);
        sections.forEach((s, i) => {
          log("데이터 추출", `  [${i + 1}] ${s.name}: 텍스트 ${s.texts.length}개, 이미지 ${s.images.length}개, 배경 ${s.bgColor}`);
        });

        // Step 5: Process in batches (4 sections per batch to avoid JSON truncation)
        const BATCH_SIZE = 4;
        const allContainers: Array<{ name: string; category: string; html: string; css: string }> = [];
        const client = new Anthropic({ apiKey: apiKeySetting.value });
        const totalBatches = Math.ceil(sections.length / BATCH_SIZE);

        for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
          const batchSections = sections.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE);
          log("Claude API", `배치 ${batchIdx + 1}/${totalBatches} 처리 중 (${batchSections.map((s: { name: string }) => s.name).join(", ")})`);

          const sectionDescriptions = batchSections.map((s: { name: string; category: string; texts: string[]; images: string[]; bgColor: string; layout: string; rawStructure: string }, i: number) => `
--- Section ${i + 1}: "${s.name}" (category: ${s.category}) ---
Background: ${s.bgColor}
Layout: ${s.layout}
Texts:
${s.texts.map((t: string) => `  - "${t}"`).join("\n")}
Images:
${s.images.map((img: string) => `  - ${img}`).join("\n") || "  (none)"}
Structure:
${s.rawStructure}
`).join("\n");

          const prompt = `Convert these ${batchSections.length} design sections into premium HTML+Tailwind CSS.

${sectionDescriptions}

OUTPUT: ONLY a valid JSON array. Each element has:
- "name": Section name (Korean)
- "category": "header"|"footer"|"hero"|"content"|"banner"|"general"
- "html": Complete responsive HTML with Tailwind CSS
- "css": Additional CSS (usually "")

RULES:
- Use EXACT text and image URLs from data
- Match background colors exactly
- Font: 'Pretendard', sans-serif
- Modern Tailwind: rounded-2xl, flex, grid, responsive
- Hero: min-h-screen + bg overlay gradient
- Premium quality (Toss/Apple level)
- NO markdown fences, NO explanation — ONLY the JSON array

JSON ESCAPING CRITICAL:
- Double quotes in HTML → \\"
- Example: "html": "<div class=\\"flex\\">text</div>"
- The output MUST pass JSON.parse()`;

          log("Claude API", `프롬프트 ${prompt.length}자, 모델: ${model}`);

          let message;
          try {
            message = await client.messages.create({
              model,
              max_tokens: 8192,
              messages: [{ role: "user", content: prompt }],
            });
            log("Claude API", `배치 ${batchIdx + 1} 응답 수신 (stop: ${message.stop_reason})`);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            log("Claude API", `배치 ${batchIdx + 1} 실패: ${msg}`, true);
            continue;
          }

          const textContent = message.content.find((c) => c.type === "text");
          if (!textContent || textContent.type !== "text") {
            log("파싱", `배치 ${batchIdx + 1}: 텍스트 없음`, true);
            continue;
          }

          const rawText = textContent.text;
          log("파싱", `배치 ${batchIdx + 1} 응답 ${rawText.length}자`);

          // Parse JSON
          let jsonStr = rawText.trim();
          jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/m, "").replace(/\n?```\s*$/m, "").trim();
          const fb = jsonStr.indexOf("[");
          const lb = jsonStr.lastIndexOf("]");
          if (fb !== -1 && lb !== -1 && lb > fb) jsonStr = jsonStr.slice(fb, lb + 1);

          let batchContainers: Array<{ name: string; category: string; html: string; css: string }>;
          try {
            batchContainers = JSON.parse(jsonStr);
            log("파싱", `배치 ${batchIdx + 1} 파싱 성공: ${batchContainers.length}개`);
          } catch (parseErr: unknown) {
            const errMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
            log("파싱", `배치 ${batchIdx + 1} 직접 파싱 실패: ${errMsg}`, true);

            // Fallback: extract objects by regex
            batchContainers = [];
            const objRegex = /\{\s*"name"\s*:\s*"([^"]+)"\s*,\s*"category"\s*:\s*"([^"]+)"\s*,\s*"html"\s*:\s*"/g;
            const positions: number[] = [];
            let m;
            while ((m = objRegex.exec(jsonStr)) !== null) positions.push(m.index);

            for (let i = 0; i < positions.length; i++) {
              const start = positions[i];
              const end = i < positions.length - 1 ? positions[i + 1] : jsonStr.length;
              const chunk = jsonStr.slice(start, end);
              const nameM = chunk.match(/"name"\s*:\s*"([^"]+)"/);
              const catM = chunk.match(/"category"\s*:\s*"([^"]+)"/);
              if (!nameM || !catM) continue;

              const htmlIdx = chunk.indexOf('"html"');
              if (htmlIdx === -1) continue;
              const htmlValStart = chunk.indexOf('"', htmlIdx + 6) + 1;
              let htmlValEnd = -1;
              const cssSearch = chunk.slice(htmlValStart).search(/",\s*\n?\s*"css"\s*:/);
              if (cssSearch !== -1) htmlValEnd = htmlValStart + cssSearch;

              if (htmlValEnd === -1) continue;
              const html = chunk.slice(htmlValStart, htmlValEnd).replace(/\\"/g, '"').replace(/\\n/g, "\n");
              batchContainers.push({ name: nameM[1], category: catM[1], html, css: "" });
              log("파싱", `  복구: "${nameM[1]}" (${html.length}자)`);
            }

            if (batchContainers.length === 0) {
              log("파싱", `배치 ${batchIdx + 1} 복구도 실패`, true);
              log("디버그", `응답 앞 500자: ${rawText.slice(0, 500).replace(/\n/g, "\\n")}`, true);
              continue;
            }
            log("파싱", `배치 ${batchIdx + 1} 복구 완료: ${batchContainers.length}개`);
          }

          allContainers.push(...batchContainers);
        }

        const containers = allContainers;
        if (containers.length === 0) {
          log("오류", "모든 배치에서 템플릿 추출에 실패했습니다.", true);
          controller.close();
          return;
        }
        log("Claude API", `총 ${containers.length}개 컨테이너 변환 완료`);

        // Step 7: Save to DB
        log("저장", `${containers.length}개 템플릿 DB 저장 중...`);
        let count = 0;
        for (const container of containers) {
          const slug = `${container.name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-")}-${folderId}-${Date.now()}-${count}`;
          await prisma.template.create({
            data: {
              name: container.name,
              slug,
              folderId,
              category: container.category || "general",
              htmlContent: container.html || "",
              cssContent: container.css || "",
              jsContent: "",
              isOriginal: true,
            },
          });
          log("저장", `  [${count + 1}] "${container.name}" (${container.category}) 저장 완료`);
          count++;
        }

        log("완료", `총 ${count}개 템플릿 생성 완료!`);

        // Final success message
        const finalData = JSON.stringify({
          step: "done",
          detail: "완료",
          success: true,
          count,
          containers: containers.map((c) => c.name),
        });
        controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const errData = JSON.stringify({ step: "오류", detail: msg, isError: true });
        controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
