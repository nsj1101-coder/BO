export default function MediWPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", width: "100%" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,700&display=swap" rel="stylesheet" />
      <link href="https://unpkg.com/lucide-static@latest/font/lucide.css" rel="stylesheet" />

      {/* Section 1 - Hero */}
      {/* frame: h=1080, layout=vertical, justify=space_between, pad=[40,60,60,60] */}
      {/* fill: image + linear-gradient(#000000ab 12%, #00000000 36%) */}
      <section
        style={{
          width: "100%",
          height: 1080,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px 60px 60px 60px",
          backgroundImage: `linear-gradient(to bottom, #000000ab 12%, #00000000 36%), url('https://images.unsplash.com/photo-1758691461888-b74515208d7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NzQ4NjA1ODR8&ixlib=rb-4.1.0&q=80&w=1920')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* heroTopBar: justify=space_between, align=center, w=fill */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          {/* logo: 18px 700 #FFF ls:-0.5 */}
          <span style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", letterSpacing: -0.5 }}>MEDI-W®</span>

          {/* navCenter: gap=32 */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <a style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF", cursor: "pointer" }}>프로그램</a>
            <a style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF", cursor: "pointer" }}>병원</a>
            <a style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF", cursor: "pointer" }}>이용 방법</a>
            <a style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF", cursor: "pointer" }}>컨시어지</a>
          </div>

          {/* navRight: gap=16 */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* langBtn: w=36 h=36 rounded=100 border=#FFFFFF55 1px */}
            <button style={{ width: 36, height: 36, borderRadius: 100, border: "1px solid #FFFFFF55", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <i className="lucide" style={{ fontSize: 18, color: "#FFFFFF" }}>&#xe4b7;</i>
            </button>
            {/* modeBtn: w=36 h=36 rounded=100 border=#FFFFFF55 1px */}
            <button style={{ width: 36, height: 36, borderRadius: 100, border: "1px solid #FFFFFF55", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <i className="lucide" style={{ fontSize: 18, color: "#FFFFFF" }}>&#xe531;</i>
            </button>
            {/* loginText: 14px 500 #FFF */}
            <span style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF", cursor: "pointer" }}>로그인</span>
            {/* startBtn: bg=#FFF text=#1E1B4B 14px 600 pad=[10,24] rounded=100 */}
            <a style={{ backgroundColor: "#FFFFFF", color: "#1E1B4B", fontSize: 14, fontWeight: 600, padding: "10px 24px", borderRadius: 100, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>시작하기</a>
          </div>
        </nav>

        {/* heroSpacer: h=fill w=fill */}
        <div style={{ flex: 1 }} />

        {/* heroBottomText: 72px 700 #FFF ls:-2 lh:1.05 w:700 fixed-width */}
        <h1 style={{ fontSize: 72, fontWeight: 700, color: "#FFFFFF", letterSpacing: -2, lineHeight: 1.05, width: 700, margin: 0 }}>
          당신의 건강,<br />한 번의 터치로
        </h1>

        {/* heroBottom: justify=space_between align=end gap=40 w=fill */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", gap: 40 }}>
          {/* heroLeftInfo: vertical gap=20 w=600 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, width: 600 }}>
            {/* heroDesc: 18px normal #FFF opacity=0.8 lh:1.6 w:550 */}
            <p style={{ fontSize: 18, fontWeight: 400, color: "#FFFFFF", opacity: 0.8, lineHeight: 1.6, width: 550, margin: 0 }}>
              최고의 의료진과 즉시 예약하세요 — MEDI-W가 언제 어디서나 신뢰할 수 있는 의료 전문가와 연결해 드립니다.
            </p>
            {/* heroBtnRow: gap=16 align=center */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* getStartedBtn: bg=#FFF text=#1E1B4B 16px 600 pad=[16,36] rounded=100 */}
              <a style={{ backgroundColor: "#FFFFFF", color: "#1E1B4B", fontSize: 16, fontWeight: 600, padding: "16px 36px", borderRadius: 100, cursor: "pointer" }}>예약하기</a>
              {/* learnMoreBtn: text=#FFF 16px 500 pad=[16,36] rounded=100 border=#FFF 1.5px */}
              <a style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 500, padding: "16px 36px", borderRadius: 100, border: "1.5px solid #FFFFFF", cursor: "pointer" }}>더 알아보기</a>
            </div>
          </div>
          {/* heroRightInfo: vertical align=end gap=8 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            {/* 14px 500 #FFF opacity=0.7 */}
            <span style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF", opacity: 0.7 }}>전 세계 500개 이상의 의료기관이 신뢰합니다</span>
            {/* 14px normal #FFF opacity=0.5 */}
            <span style={{ fontSize: 14, fontWeight: 400, color: "#FFFFFF", opacity: 0.5 }}>스크롤하여 탐색하기 ↓</span>
          </div>
        </div>
      </section>
    </div>
  );
}
