"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F1117] via-[#191F28] to-[#0F1117]">
      <div className="w-full max-w-[420px] mx-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">SJCMS</h1>
          <p className="text-sm text-gray-400 mt-2">Content Management System</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                아이디
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-[#F04452] bg-[#F04452]/10 px-4 py-2.5 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 bg-[#3182F6] hover:bg-[#1B6CF2] text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-[#3182F6]/25"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">SJCMS Admin v0.001</p>
      </div>
    </div>
  );
}
