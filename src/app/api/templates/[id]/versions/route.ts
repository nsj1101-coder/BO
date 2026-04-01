import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const versions = await prisma.templateVersion.findMany({
    where: { templateId: Number(id) },
    orderBy: { version: "desc" },
  });

  return NextResponse.json(versions);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const templateId = Number(id);
  const { versionId } = await req.json();

  const version = await prisma.templateVersion.findUnique({ where: { id: versionId } });
  if (!version || version.templateId !== templateId) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const current = await prisma.template.findUnique({ where: { id: templateId } });
  if (current) {
    const lastVersion = await prisma.templateVersion.findFirst({
      where: { templateId },
      orderBy: { version: "desc" },
    });
    await prisma.templateVersion.create({
      data: {
        templateId,
        version: (lastVersion?.version ?? 0) + 1,
        htmlContent: current.htmlContent,
        cssContent: current.cssContent,
        jsContent: current.jsContent,
        memo: `v${version.version}으로 복원 전 백업`,
      },
    });
  }

  const template = await prisma.template.update({
    where: { id: templateId },
    data: {
      htmlContent: version.htmlContent,
      cssContent: version.cssContent,
      jsContent: version.jsContent,
    },
  });

  return NextResponse.json(template);
}
