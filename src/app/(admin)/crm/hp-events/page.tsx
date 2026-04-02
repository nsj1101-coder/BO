"use client";

import { useEffect, useState } from "react";

const ACCENT = "#4332f8";
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 };
const periods = [
  { label: "오늘", value: "today" },
  { label: "7일", value: "7d" },
  { label: "30일", value: "30d" },
  { label: "90일", value: "90d" },
];

interface EventRow {
  eventType: string;
  eventName: string;
  count: number;
  uniqueVisitors: number;
}

interface GroupedEvent {
  eventType: string;
  totalCount: number;
  totalVisitors: number;
  children: EventRow[];
  open: boolean;
}

export default function HpEventsPage() {
  const [period, setPeriod] = useState("7d");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    fetch(`/api/track/analytics/events?period=${period}`)
      .then((r) => r.json())
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const grouped: GroupedEvent[] = [];
  const map = new Map<string, EventRow[]>();
  for (const e of events) {
    if (!map.has(e.eventType)) map.set(e.eventType, []);
    map.get(e.eventType)!.push(e);
  }
  for (const [type, children] of map) {
    grouped.push({
      eventType: type,
      totalCount: children.reduce((s, c) => s + c.count, 0),
      totalVisitors: children.reduce((s, c) => s + c.uniqueVisitors, 0),
      children,
      open: openGroups.has(type),
    });
  }
  grouped.sort((a, b) => b.totalCount - a.totalCount);

  const toggleGroup = (type: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            style={{
              padding: "8px 18px", borderRadius: 100, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              background: period === p.value ? ACCENT : "#f3f4f6",
              color: period === p.value ? "#fff" : "#666",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={card}>
        {grouped.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#ccc", fontSize: 14 }}>데이터가 없습니다</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>이벤트 유형 / 이벤트명</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>발생 횟수</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>고유 방문자</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((g) => (
                <>
                  <tr
                    key={g.eventType}
                    onClick={() => toggleGroup(g.eventType)}
                    style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", background: "#fafafa" }}
                  >
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#111" }}>
                      <span style={{ display: "inline-block", width: 16, textAlign: "center", marginRight: 8, fontSize: 10, color: "#999", transition: "transform 0.2s", transform: openGroups.has(g.eventType) ? "rotate(90deg)" : "none" }}>&#9654;</span>
                      {g.eventType}
                      <span style={{ marginLeft: 8, fontSize: 11, color: "#bbb" }}>({g.children.length})</span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#333", fontWeight: 600, textAlign: "right" }}>{g.totalCount.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", color: "#666", textAlign: "right" }}>{g.totalVisitors.toLocaleString()}</td>
                  </tr>
                  {openGroups.has(g.eventType) && g.children.map((c) => (
                    <tr key={`${g.eventType}-${c.eventName}`} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "10px 12px 10px 44px", color: ACCENT, fontWeight: 500 }}>{c.eventName}</td>
                      <td style={{ padding: "10px 12px", color: "#333", textAlign: "right" }}>{c.count.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px", color: "#666", textAlign: "right" }}>{c.uniqueVisitors.toLocaleString()}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
