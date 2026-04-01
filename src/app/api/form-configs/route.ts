import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configs = await prisma.formConfig.findMany({
    orderBy: { formType: "asc" },
  });

  return NextResponse.json(configs);
}
