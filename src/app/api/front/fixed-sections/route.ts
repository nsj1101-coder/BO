import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const mainPage = await prisma.page.findFirst({
    where: { pageType: "main" },
    include: {
      sections: {
        where: { isActive: true, isFixed: true },
        include: { template: { include: { banners: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!mainPage) return NextResponse.json({ top: [], bottom: [] });

  const process = (sections: typeof mainPage.sections) =>
    sections.map((s) => {
      let html = s.htmlContent || s.template.htmlContent;
      s.template.banners.filter((b) => b.isActive).forEach((b) => {
        const tag = `{{BANNER:${b.slotKey}}}`;
        html = html.replace(new RegExp(`url\\(['"]?${tag.replace(/[{}]/g, "\\$&")}['"]?\\)`, "g"), `url('${b.imageUrl}')`);
        const img = b.linkUrl
          ? `<a href="${b.linkUrl}"><img src="${b.imageUrl}" alt="${b.altText || ""}" style="max-width:100%;height:auto;display:block;" /></a>`
          : `<img src="${b.imageUrl}" alt="${b.altText || ""}" style="max-width:100%;height:auto;display:block;" />`;
        html = html.replaceAll(tag, img);
      });
      return html;
    });

  const top = process(mainPage.sections.filter((s) => s.fixPosition === "top"));
  const bottom = process(mainPage.sections.filter((s) => s.fixPosition === "bottom"));

  return NextResponse.json({ top, bottom });
}
