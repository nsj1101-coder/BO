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

  const sections = page.sections.map((s) => {
    let html = s.htmlContent || s.template.htmlContent;

    s.template.banners
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
