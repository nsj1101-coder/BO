import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pageType = searchParams.get("type") || "main";

  const pages = await prisma.page.findMany({
    where: { pageType },
    include: {
      sections: {
        include: { template: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, pageType } = body;

  const slug = (pageType === "main" ? "main" : title.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-")) + "-" + Date.now();

  const page = await prisma.page.create({
    data: { title, slug, pageType: pageType || "sub" },
  });

  if (pageType === "sub") {
    const fixedSections = await prisma.pageSection.findMany({
      where: {
        page: { pageType: "main" },
        isFixed: true,
      },
      include: { template: true },
    });

    for (const section of fixedSections) {
      const clone = await prisma.template.create({
        data: {
          name: `${section.template.name}_${page.id}`,
          slug: `${section.template.slug}-clone-${page.id}-${Date.now()}`,
          category: section.template.category,
          htmlContent: section.htmlContent || section.template.htmlContent,
          cssContent: section.cssContent || section.template.cssContent,
          jsContent: section.jsContent || section.template.jsContent,
          isOriginal: false,
          sourceId: section.template.isOriginal ? section.template.id : section.template.sourceId,
        },
      });

      await prisma.pageSection.create({
        data: {
          pageId: page.id,
          templateId: clone.id,
          sortOrder: section.sortOrder,
          isFixed: true,
          fixPosition: section.fixPosition,
          htmlContent: clone.htmlContent,
          cssContent: clone.cssContent,
          jsContent: clone.jsContent,
        },
      });
    }
  }

  return NextResponse.json(page, { status: 201 });
}
