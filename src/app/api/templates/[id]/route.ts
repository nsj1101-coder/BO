import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/log";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const template = await prisma.template.findUnique({
    where: { id: Number(id) },
    include: { banners: true },
  });

  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const templateId = Number(id);
  const body = await req.json();

  // Save current state as version before updating
  const current = await prisma.template.findUnique({ where: { id: templateId } });
  if (current && (body.htmlContent !== undefined || body.cssContent !== undefined || body.jsContent !== undefined)) {
    const lastVersion = await prisma.templateVersion.findFirst({
      where: { templateId },
      orderBy: { version: "desc" },
    });
    const nextVersion = (lastVersion?.version ?? 0) + 1;

    await prisma.templateVersion.create({
      data: {
        templateId,
        version: nextVersion,
        htmlContent: current.htmlContent,
        cssContent: current.cssContent,
        jsContent: current.jsContent,
        memo: body.versionMemo || `v${nextVersion} 저장`,
      },
    });
  }

  const template = await prisma.template.update({
    where: { id: templateId },
    data: {
      name: body.name,
      folderId: body.folderId !== undefined ? (body.folderId || null) : undefined,
      category: body.category,
      htmlContent: body.htmlContent,
      cssContent: body.cssContent,
      jsContent: body.jsContent,
    },
  });

  await logAction("템플릿 수정", `${template.name}(ID:${template.id}) 수정`);

  return NextResponse.json(template);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.template.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
