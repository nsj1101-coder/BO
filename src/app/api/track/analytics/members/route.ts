import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  const searchCondition = search
    ? `AND (m.email ILIKE $3 OR m.name ILIKE $3)`
    : "";
  const params: Array<number | string> = [limit, offset];
  if (search) params.push(`%${search}%`);

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      member_id: number;
      email: string | null;
      name: string | null;
      sessions: bigint;
      total_page_views: bigint;
      last_seen: Date;
    }>
  >(
    `SELECT
       ts.member_id,
       m.email,
       m.name,
       COUNT(*) as sessions,
       SUM(ts.page_count) as total_page_views,
       MAX(ts.started_at) as last_seen
     FROM track_sessions ts
     LEFT JOIN members m ON m.id = ts.member_id
     WHERE ts.member_id IS NOT NULL
     ${searchCondition}
     GROUP BY ts.member_id, m.email, m.name
     ORDER BY last_seen DESC
     LIMIT $1 OFFSET $2`,
    ...params,
  );

  const topPagesMap = new Map<number, Array<{ path: string; views: number }>>();

  if (rows.length > 0) {
    const memberIds = rows.map((r) => r.member_id);
    const topPages = await prisma.$queryRawUnsafe<
      Array<{ member_id: number; path: string; views: bigint }>
    >(
      `SELECT member_id, path, COUNT(*) as views
       FROM track_page_views
       WHERE member_id = ANY($1::int[])
       GROUP BY member_id, path
       ORDER BY member_id, views DESC`,
      memberIds,
    );

    for (const tp of topPages) {
      if (!topPagesMap.has(tp.member_id)) {
        topPagesMap.set(tp.member_id, []);
      }
      const arr = topPagesMap.get(tp.member_id)!;
      if (arr.length < 5) {
        arr.push({ path: tp.path, views: Number(tp.views) });
      }
    }
  }

  const totalResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    search
      ? `SELECT COUNT(DISTINCT ts.member_id) as count
         FROM track_sessions ts
         LEFT JOIN members m ON m.id = ts.member_id
         WHERE ts.member_id IS NOT NULL AND (m.email ILIKE $1 OR m.name ILIKE $1)`
      : `SELECT COUNT(DISTINCT member_id) as count FROM track_sessions WHERE member_id IS NOT NULL`,
    ...(search ? [`%${search}%`] : []),
  );

  const total = Number(totalResult[0]?.count ?? 0);

  const members = rows.map((r) => ({
    memberId: r.member_id,
    email: r.email,
    name: r.name,
    sessions: Number(r.sessions),
    totalPageViews: Number(r.total_page_views),
    lastSeen: r.last_seen,
    topPages: topPagesMap.get(r.member_id) ?? [],
  }));

  return NextResponse.json({ members, total });
}
