"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Phone, ArrowRight } from "lucide-react";
import { useAuth, normalizePhone } from "@/lib/auth";
import { CITIES } from "@/lib/mockData";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const returnTo = searchParams.get("returnTo") || "/";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState<string>(CITIES[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length >= 2 && phone.trim().length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setError("تکایە ناو و ژمارەی مۆبایل بە دروستی بنووسە");
      return;
    }
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    login({
      id: `user-${Date.now()}`,
      name: name.trim(),
      phone: normalizePhone(phone),
      city,
      created_at: new Date().toISOString(),
    });
    router.push(returnTo);
  }

  return (
    <main className="min-h-[calc(100vh-64px)] grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white grid place-items-center mx-auto mb-5">
          <User className="w-6 h-6" strokeWidth={2} />
        </div>

        <h1 className="text-xl font-extrabold text-ink text-center mb-1.5">
          چوونەژوورەوە بۆ بازاڕ
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
          بۆ دانانی ڕیکلام یان پەیوەندیکردن بە فرۆشیار، پێویستە هەژمارێک هەبێت
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-ink mb-2">ناوی تەواو</label>
            <div className="relative">
              <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="کاروان ئەحمەد"
                className="w-full bg-gray-50 border border-gray-200 focus:border-brand-500 rounded-xl pr-10 pl-3.5 py-3 text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-ink mb-2">ژمارەی مۆبایل</label>
            <div className="relative">
              <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                dir="ltr"
                placeholder="+964 750 123 4567"
                className="w-full bg-gray-50 border border-gray-200 focus:border-brand-500 rounded-xl pr-10 pl-3.5 py-3 text-sm text-left outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-ink mb-2">شار</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-brand-500 rounded-xl px-3.5 py-3 text-sm outline-none"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 font-medium text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 disabled:bg-gray-300 hover:bg-brand-600 transition-colors text-white font-bold rounded-full py-3.5 mt-2"
          >
            {loading ? "چوونەژوورەوە..." : "چوونەژوورەوە"}
            {!loading && <ArrowRight className="w-4 h-4 rotate-180" strokeWidth={2.5} />}
          </button>

          <p className="text-xs text-gray-400 text-center leading-relaxed pt-2">
            بە بەردەوامبوون، ڕازیت لە{" "}
            <span className="text-gray-600 font-medium">مەرجەکانی بەکارهێنان</span>
          </p>
        </form>
      </div>
    </main>
  );
}
