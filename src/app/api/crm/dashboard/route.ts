import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalLeads,
    newLeadsToday,
    totalCustomers,
    openFollowups,
    totalDeals,
    wonDeals,
    leadsByStatus,
    dealsByStage,
  ] = await Promise.all([
    prisma.crmLead.count(),
    prisma.crmLead.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.crmCustomer.count(),
    prisma.crmFollowup.count({ where: { status: "pending" } }),
    prisma.crmDeal.count(),
    prisma.crmDeal.aggregate({ where: { wonLost: "won" }, _sum: { amount: true }, _count: true }),
    prisma.crmLead.groupBy({ by: ["statusCode"], _count: true }),
    prisma.crmDeal.groupBy({ by: ["stage"], _count: true }),
  ]);

  const totalRevenue = wonDeals._sum.amount || 0;
  const wonCount = wonDeals._count;
  const conversionRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 10000) / 100 : 0;

  return NextResponse.json({
    totalLeads,
    newLeadsToday,
    totalCustomers,
    openFollowups,
    totalDeals,
    totalRevenue,
    conversionRate,
    leadsByStatus: leadsByStatus.map((g) => ({ status: g.statusCode, count: g._count })),
    dealsByStage: dealsByStage.map((g) => ({ stage: g.stage, count: g._count })),
  });
}
