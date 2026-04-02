import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get("id");

  let page;

  if (!pageId) {
    page = await prisma.page.findFirst({
      where: { pageType: "main" },
      include: {
        sections: {
          where: { isActive: true },
          include: { template: { include: { banners: true } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  } else {
    page = await prisma.page.findUnique({
      where: { id: Number(pageId) },
      include: {
        sections: {
          where: { isActive: true },
          include: { template: { include: { banners: true } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  // Preload source template banners for clones
  const sourceIds = page.sections
    .filter((s) => s.template.sourceId && s.template.banners.length === 0)
    .map((s) => s.template.sourceId as number);

  const sourceBanners: Record<number, typeof page.sections[0]["template"]["banners"]> = {};
  if (sourceIds.length > 0) {
    const banners = await prisma.banner.findMany({ where: { templateId: { in: sourceIds }, isActive: true } });
    banners.forEach((b) => {
      if (!sourceBanners[b.templateId]) sourceBanners[b.templateId] = [];
      sourceBanners[b.templateId].push(b);
    });
  }

  const sections = page.sections.map((s) => {
    let html = s.htmlContent || s.template.htmlContent;

    // Use template's own banners, or fall back to source template's banners
    const banners = s.template.banners.length > 0
      ? s.template.banners
      : (s.template.sourceId ? sourceBanners[s.template.sourceId] || [] : []);

    banners
      .filter((b) => b.isActive)
      .forEach((b) => {
        const tag = `{{BANNER:${b.slotKey}}}`;
        // If inside url('...') → replace with URL only, otherwise → <img> tag
        html = html.replace(new RegExp(`url\\(['"]?${tag.replace(/[{}]/g, '\\$&')}['"]?\\)`, 'g'), `url('${b.imageUrl}')`);
        const img = b.linkUrl
          ? `<a href="${b.linkUrl}"><img src="${b.imageUrl}" alt="${b.altText || ""}" style="max-width:100%;height:auto;display:block;" /></a>`
          : `<img src="${b.imageUrl}" alt="${b.altText || ""}" style="max-width:100%;height:auto;display:block;" />`;
        html = html.replaceAll(tag, img);
      });

    return {
      id: s.id,
      isFixed: s.isFixed,
      fixPosition: s.fixPosition,
      html,
      css: s.cssContent || s.template.cssContent,
      js: s.jsContent || s.template.jsContent,
    };
  });

  return NextResponse.json({ title: page.title, sections });
}
