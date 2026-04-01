import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folderName = formData.get("folderName") as string | null;

  if (!file || !file.name.endsWith(".pen")) {
    return NextResponse.json({ error: ".pen 파일만 업로드 가능합니다." }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "pen");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);

  return NextResponse.json({
    success: true,
    filePath,
    fileName: file.name,
    folderName: folderName || file.name.replace(".pen", ""),
  });
}
