import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const members = await prisma.member.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const fields = await prisma.memberField.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const baseHeaders = ["id", "email", "name", "phone", "createdAt"];
  const extraHeaders = fields.map((f) => f.fieldKey);
  const allHeaders = [...baseHeaders, ...extraHeaders];

  const rows = members.map((m) => {
    const extra = JSON.parse(m.extraData || "{}") as Record<string, string>;
    const base = [
      String(m.id),
      m.email,
      m.name,
      m.phone,
      m.createdAt.toISOString(),
    ];
    const extraValues = extraHeaders.map((key) => extra[key] ?? "");
    return [...base, ...extraValues].map((v) => `"${v.replace(/"/g, '""')}"`).join(",");
  });

  const csv = [allHeaders.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=members.csv",
    },
  });
}
