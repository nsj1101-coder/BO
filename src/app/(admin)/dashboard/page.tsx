"use client";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "등록된 템플릿", value: "-", color: "#3182F6" },
          { label: "메인 페이지 섹션", value: "-", color: "#03B26C" },
          { label: "서브 페이지", value: "-", color: "#F59E0B" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow"
          >
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="text-3xl font-extrabold mt-2" style={{ color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-8 shadow-sm">
        <h3 className="text-lg font-bold text-[#191F28] mb-4">시작하기</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p>1. <strong>템플릿 관리</strong>에서 컨테이너 템플릿을 등록하세요.</p>
          <p>2. <strong>메인 페이지 관리</strong>에서 등록된 템플릿을 추가하여 메인 페이지를 구성하세요.</p>
          <p>3. <strong>서브 페이지 관리</strong>에서 서브 페이지를 생성하고 템플릿을 추가하세요.</p>
        </div>
      </div>
    </div>
  );
}
