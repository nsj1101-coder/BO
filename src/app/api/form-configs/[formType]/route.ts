import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/log";

type Params = { params: Promise<{ formType: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { formType } = await params;

  let config = await prisma.formConfig.findUnique({ where: { formType } });
  if (!config) {
    config = await prisma.formConfig.create({ data: { formType, fields: "[]" } });
  }

  return NextResponse.json(config);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { formType } = await params;
  const { fields } = await request.json();

  const config = await prisma.formConfig.upsert({
    where: { formType },
    update: { fields },
    create: { formType, fields },
  });

  await logAction("form_config_update", `폼 설정 수정: ${formType}`);
  return NextResponse.json(config);
}
