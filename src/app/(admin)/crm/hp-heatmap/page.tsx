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

interface Referrer { referrer: string; sessions: number; percentage: number }
interface UtmSource { source: string; medium: string; campaign: string; sessions: number }
interface DeviceRow { device: string; sessions: number; percentage: number }
interface BrowserRow { browser: string; sessions: number; percentage: number }

interface SourcesData {
  referrers: Referrer[];
  utmSources: UtmSource[];
  devices: DeviceRow[];
  browsers: BrowserRow[];
}

const DEVICE_COLORS: Record<string, string> = { desktop: ACCENT, mobile: "#8b5cf6", tablet: "#ec4899" };

function PercentBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#f3f4f6", overflow: "hidden" }}>
        <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.3s" }} />
      </div>
      <span style={{ minWidth: 40, textAlign: "right", fontSize: 12, color: "#666", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default function HpHeatmapPage() {
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState<SourcesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/track/analytics/sources?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const referrers = (data?.referrers ?? []).slice(0, 10);
  const maxRef = Math.max(...referrers.map((r) => r.sessions), 1);
  const utmSources = data?.utmSources ?? [];
  const maxUtm = Math.max(...utmSources.map((u) => u.sessions), 1);
  const devices = data?.devices ?? [];
  const totalDeviceSessions = devices.reduce((s, d) => s + d.sessions, 0) || 1;
  const browsers = data?.browsers ?? [];
  const maxBrowser = Math.max(...browsers.map((b) => b.sessions), 1);

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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 16 }}>리퍼러 Top 10</div>
          {referrers.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#ccc", fontSize: 13 }}>데이터 없음</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {referrers.map((r) => (
                <div key={r.referrer}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#333", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{r.referrer}</span>
                    <span style={{ fontSize: 12, color: "#999" }}>{r.percentage}%</span>
                  </div>
                  <PercentBar value={r.sessions} max={maxRef} color={ACCENT} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 16 }}>UTM 소스</div>
          {utmSources.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#ccc", fontSize: 13 }}>데이터 없음</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {utmSources.map((u, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>
                      {u.source}
                      {u.medium && <span style={{ color: "#999" }}> / {u.medium}</span>}
                      {u.campaign && <span style={{ color: "#bbb" }}> / {u.campaign}</span>}
                    </span>
                  </div>
                  <PercentBar value={u.sessions} max={maxUtm} color="#8b5cf6" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 16 }}>디바이스 분포</div>
          {devices.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#ccc", fontSize: 13 }}>데이터 없음</div>
          ) : (
            <>
              <div style={{ display: "flex", height: 28, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
                {devices.map((d) => (
                  <div
                    key={d.device}
                    style={{
                      width: `${(d.sessions / totalDeviceSessions) * 100}%`,
                      background: DEVICE_COLORS[d.device] ?? "#94a3b8",
                      minWidth: 2,
                      transition: "width 0.3s",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {devices.map((d) => (
                  <div key={d.device} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: DEVICE_COLORS[d.device] ?? "#94a3b8" }} />
                    <span style={{ fontSize: 13, color: "#333", flex: 1 }}>{d.device}</span>
                    <span style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>{d.sessions}</span>
                    <span style={{ fontSize: 12, color: "#999", minWidth: 48, textAlign: "right" }}>{d.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 16 }}>브라우저 분포</div>
          {browsers.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#ccc", fontSize: 13 }}>데이터 없음</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {browsers.map((b) => (
                <div key={b.browser}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{b.browser}</span>
                    <span style={{ fontSize: 12, color: "#999" }}>{b.percentage}%</span>
                  </div>
                  <PercentBar value={b.sessions} max={maxBrowser} color="#10b981" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
