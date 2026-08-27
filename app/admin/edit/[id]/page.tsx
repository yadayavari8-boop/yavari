"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X, Loader2, ShieldCheck, Check } from "lucide-react";
import Header from "@/components/Header";
import SmartImage from "@/components/SmartImage";
import { CATEGORIES, CITIES } from "@/lib/mockData";
import { useAppStore } from "@/lib/store";
import { useAuth, normalizePhone } from "@/lib/auth";
import { compressImage } from "@/lib/imageUtils";
import { isSupabaseConfigured, uploadListingPhotos } from "@/lib/supabase";
import { extractMessage } from "@/lib/errors";
import { CategorySlug, Condition, City } from "@/lib/types";

const MAX_PHOTOS = 6;
const IQD_PER_USD = 1460;

export default function AdminEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { getListingById, updateListing, hydrated } = useAppStore();
  const { user, hydrated: authHydrated } = useAuth();
  const listing = getListingById(params.id);

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [newBlobs, setNewBlobs] = useState<Blob[]>([]);
  const [category, setCategory] = useState<CategorySlug | "">("");
  const [city, setCity] = useState<string>("");
  const [condition, setCondition] = useState<Condition>("used");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [isSold, setIsSold] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    if (listing) {
      setExistingImages(listing.images);
      setCategory(listing.category);
      setCity(listing.city);
      setCondition(listing.condition);
      setTitle(listing.title_ckb);
      setPrice(String(listing.price_iqd));
      setDescription(listing.description_ckb);
      setSellerPhone(listing.seller_phone);
      setIsSold(listing.is_sold);
    }
  }, [listing]);

  const totalPhotos = existingImages.length + newPreviews.length;

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - totalPhotos);
    if (files.length === 0) return;
    setCompressing(true);
    setError("");
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f)));
      setNewPreviews((p) => [...p, ...compressed.map((c) => c.dataUrl)]);
      setNewBlobs((p) => [...p, ...compressed.map((c) => c.blob)]);
    } catch {
      setError("نەتوانرا وێنەکە پرۆسێس بکرێت");
    } finally {
      setCompressing(false);
      e.target.value = "";
    }
  }

  function removeExisting(i: number) {
    setExistingImages((p) => p.filter((_, idx) => idx !== i));
  }
  function removeNew(i: number) {
    setNewPreviews((p) => p.filter((_, idx) => idx !== i));
    setNewBlobs((p) => p.filter((_, idx) => idx !== i));
  }

  const isValid = totalPhotos > 0 && category !== "" && city !== "" && title.trim().length > 0 && price !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setError("تکایە هەموو خانە پێویستەکان پڕبکەرەوە");
      return;
    }
    setError("");
    setSubmitting(true);

    const priceIqd = Number(price);
    const priceUsd = Math.round(priceIqd / IQD_PER_USD);

    try {
      const uploadedUrls =
        isSupabaseConfigured && newBlobs.length > 0
          ? await uploadListingPhotos(newBlobs, "admin")
          : newPreviews;

      await updateListing(params.id, {
        title_ckb: title.trim(),
        price_iqd: priceIqd,
        price_usd: priceUsd,
        category: category as CategorySlug,
        city: city as City,
        condition,
        description_ckb: description.trim(),
        images: [...existingImages, ...uploadedUrls],
        seller_phone: normalizePhone(sellerPhone),
        is_sold: isSold,
      });

      setSubmitting(false);
      setDone(true);
      setTimeout(() => router.push("/admin"), 1000);
    } catch (err) {
      setSubmitting(false);
      setError(extractMessage(err) || "پاشەکەوتکردن سەرکەوتوو نەبوو");
    }
  }

  if (!authHydrated || !hydrated) {
    return (
      <>
        <Header />
        <div className="text-center text-sm text-gray-400 py-20">بارکردن...</div>
      </>
    );
  }

  if (!user?.isAdmin) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-sm text-center py-20 px-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 grid place-items-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-extrabold text-ink mb-1.5">دەسەڵاتت نییە</h2>
          <p className="text-sm text-gray-500">ئەم پەڕەیە تەنها بۆ ئەدمینەکانە.</p>
        </div>
      </>
    );
  }

  if (!listing) {
    return (
      <>
        <Header />
        <div className="text-center py-20 px-4">
          <p className="font-bold text-ink">ئەم ڕیکلامە نەدۆزرایەوە</p>
        </div>
      </>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <div className="w-16 h-16 rounded-full bg-brand-500 grid place-items-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
          <h1 className="text-lg font-bold text-ink">پاشەکەوتکرا!</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6 pb-28">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-brand-600" />
          <h1 className="text-xl font-extrabold text-ink">دەستکاریکردنی ڕیکلام (ئەدمین)</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          فرۆشیار: <span className="font-semibold text-ink">{listing.seller_name}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-7">
          <Field label={`وێنەکان (${totalPhotos}/${MAX_PHOTOS})`}>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {existingImages.map((src, i) => (
                <div key={`ex-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <SmartImage src={src} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExisting(i)}
                    className="absolute top-1 left-1 w-6 h-6 grid place-items-center rounded-full bg-black/60 text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {newPreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNew(i)}
                    className="absolute top-1 left-1 w-6 h-6 grid place-items-center rounded-full bg-black/60 text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {totalPhotos < MAX_PHOTOS && (
                <label className={`aspect-square rounded-xl border-2 border-dashed grid place-items-center transition-colors ${
                  compressing ? "border-brand-300 text-brand-500 cursor-wait" : "border-gray-300 text-gray-400 cursor-pointer hover:border-brand-400 hover:text-brand-500"
                }`}>
                  <div className="text-center">
                    {compressing ? <Loader2 className="w-6 h-6 mx-auto mb-1 animate-spin" /> : <ImagePlus className="w-6 h-6 mx-auto mb-1" />}
                    <span className="text-[11px] font-medium">{compressing ? "پرۆسێسکردن..." : "زیادکردن"}</span>
                  </div>
                  <input type="file" accept="image/*" multiple disabled={compressing} className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
          </Field>

          <Field label="جۆری کاڵا">
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.slug}
                  onClick={() => setCategory(cat.slug)}
                  className={`rounded-xl border px-2 py-3 text-xs font-semibold transition-colors ${
                    category === cat.slug ? "bg-brand-500 border-brand-500 text-white" : "bg-white border-gray-200 text-ink hover:border-brand-300"
                  }`}
                >
                  {cat.name_ckb}
                </button>
              ))}
            </div>
          </Field>

          <Field label="شار">
            <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:border-brand-500 rounded-xl px-3.5 py-3 text-sm outline-none">
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="ناونیشانی ڕیکلام">
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className="w-full bg-gray-50 border border-gray-200 focus:border-brand-500 rounded-xl px-3.5 py-3 text-sm outline-none" />
          </Field>

          <Field label="دۆخی کاڵا">
            <div className="grid grid-cols-2 gap-2">
              {(["new", "used"] as Condition[]).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`rounded-xl border py-3 text-sm font-semibold transition-colors ${
                    condition === c ? "bg-brand-500 border-brand-500 text-white" : "bg-white border-gray-200 text-ink"
                  }`}
                >
                  {c === "new" ? "نوێ" : "بەکارهاتوو"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="نرخ (دینار)">
            <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" className="w-full bg-gray-50 border border-gray-200 focus:border-brand-500 rounded-xl px-3.5 py-3 text-sm outline-none" />
          </Field>

          <Field label="وردەکاری کاڵا">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full bg-gray-50 border border-gray-200 focus:border-brand-500 rounded-xl px-3.5 py-3 text-sm outline-none resize-none" />
          </Field>

          <Field label="ژمارەی پەیوەندی">
            <input value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} type="tel" dir="ltr" className="w-full bg-gray-50 border border-gray-200 focus:border-brand-500 rounded-xl px-3.5 py-3 text-sm text-left outline-none" />
          </Field>

          <button
            type="button"
            onClick={() => setIsSold((s) => !s)}
            className={`w-full flex items-center justify-between rounded-xl border-2 p-3.5 text-sm font-bold transition-colors ${
              isSold ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 bg-white text-ink"
            }`}
          >
            نیشانکردن وەک فرۆشراو
            <span className={`w-11 h-6 rounded-full p-0.5 transition-colors ${isSold ? "bg-red-500" : "bg-gray-300"}`}>
              <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${isSold ? "-translate-x-5" : ""}`} />
            </span>
          </button>

          {error && <p className="text-sm text-red-600 font-medium text-center">{error}</p>}

          <button
            type="submit"
            disabled={submitting || compressing}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 disabled:bg-gray-300 hover:bg-brand-600 transition-colors text-white font-bold rounded-full py-3.5"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "پاشەکەوتکردن..." : "پاشەکەوتکردنی گۆڕانکارییەکان"}
          </button>
        </form>
      </main>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-ink mb-2">{label}</label>
      {children}
    </div>
  );
}
