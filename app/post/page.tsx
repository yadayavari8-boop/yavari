"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X, Check, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import AuthGate from "@/components/AuthGate";
import { CATEGORIES, CITIES } from "@/lib/mockData";
import { useAppStore } from "@/lib/store";
import { useAuth, normalizePhone } from "@/lib/auth";
import { compressImage } from "@/lib/imageUtils";
import { isSupabaseConfigured, uploadListingPhotos } from "@/lib/supabase";
import { CategorySlug, Condition, Listing } from "@/lib/types";

const MAX_PHOTOS = 6;
const IQD_PER_USD = 1460;

export default function PostAdPage() {
  const router = useRouter();
  const { addListing } = useAppStore();
  const { user, hydrated } = useAuth();

  // photoPreviews: compressed data URLs, always used for on-screen preview.
  // photoBlobs: the same compressed images as Blobs, used to upload to
  // Supabase Storage when a cloud backend is connected.
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoBlobs, setPhotoBlobs] = useState<Blob[]>([]);
  const [category, setCategory] = useState<CategorySlug | "">("");
  const [city, setCity] = useState<string>("");
  const [condition, setCondition] = useState<Condition>("used");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [compressing, setCompressing] = useState(false);

  // Pre-fill with the account's phone, but the seller can still change it
  // per-listing — e.g. if they lost their old number or mistyped it at signup.
  useEffect(() => {
    if (user) setContactPhone(user.phone);
  }, [user]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - photoPreviews.length);
    if (files.length === 0) return;
    setCompressing(true);
    setError("");
    try {
      // Downscale/compress before it ever touches state or storage — this is
      // what keeps real phone photos from silently blowing local storage,
      // and keeps cloud uploads fast.
      const compressed = await Promise.all(files.map((f) => compressImage(f)));
      setPhotoPreviews((p) => [...p, ...compressed.map((c) => c.dataUrl)].slice(0, MAX_PHOTOS));
      setPhotoBlobs((p) => [...p, ...compressed.map((c) => c.blob)].slice(0, MAX_PHOTOS));
    } catch {
      setError("نەتوانرا وێنەکە پرۆسێس بکرێت، تکایە وێنەیەکی تر تاقی بکەرەوە");
    } finally {
      setCompressing(false);
      e.target.value = "";
    }
  }

  function removePhoto(i: number) {
    setPhotoPreviews((p) => p.filter((_, idx) => idx !== i));
    setPhotoBlobs((p) => p.filter((_, idx) => idx !== i));
  }

  const isValid =
    photoPreviews.length > 0 &&
    category !== "" &&
    city !== "" &&
    title.trim().length > 0 &&
    price !== "" &&
    contactPhone.trim().length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!isValid) {
      setError("تکایە هەموو خانە پێویستەکان پڕبکەرەوە (وێنە، جۆر، شار، نرخ، ژمارەی پەیوەندی)");
      return;
    }
    setError("");
    setSubmitting(true);

    const priceIqd = Number(price);
    const priceUsd = Math.round(priceIqd / IQD_PER_USD);

    try {
      // Cloud mode: upload the already-compressed photos to Supabase
      // Storage and store their public URLs. Local mode: just store the
      // compressed data URLs directly (this device only).
      const images = isSupabaseConfigured
        ? await uploadListingPhotos(photoBlobs, user.id)
        : photoPreviews;

      const newListing: Omit<Listing, "id" | "created_at"> = {
        title_ckb: title.trim(),
        price_iqd: priceIqd,
        price_usd: priceUsd,
        currency_default: "IQD",
        category: category as CategorySlug,
        city: city as Listing["city"],
        condition,
        description_ckb: description.trim(),
        images,
        is_featured: false,
        is_sold: false,
        // Seller name comes from the signed-in account. The contact number
        // is editable per-listing — pre-filled from the account but the
        // seller can override it here if it's out of date or was mistyped.
        seller_id: user.id,
        seller_name: user.name,
        seller_phone: normalizePhone(contactPhone),
      };

      const saved = await addListing(newListing);
      setSubmitting(false);
      setDone(true);
      setTimeout(() => router.push(`/item/${saved.id}`), 1200);
    } catch (err) {
      // Log the real cause instead of guessing — open devtools console to
      // see this. Common causes: the `listing-photos` storage bucket or
      // its policies aren't set up yet (see supabase/fix_listings_schema.sql),
      // a schema-cache mismatch on the listings table, or a network issue.
      // eslint-disable-next-line no-console
      console.error("[post] failed to save listing:", err);
      setSubmitting(false);
      const detail =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "";
      setError(
        detail
          ? `نەتوانرا ڕیکلامەکە پاشەکەوت بکرێت: ${detail}`
          : "نەتوانرا ڕیکلامەکە پاشەکەوت بکرێت. تکایە دووبارە هەوڵبدەرەوە."
      );
    }
  }

  if (!hydrated) {
    return (
      <>
        <Header />
        <div className="text-center text-sm text-gray-400 py-20">بارکردن...</div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <AuthGate
          title="پێویستە بچیتە ژوورەوە"
          description="بۆ دانانی ڕیکلام، پێویستە هەژمارێکت هەبێت یان بچیتە ژوورەوە. ناوی هەژمارەکەت وەک ناوی فرۆشیار دەردەکەوێت."
        />
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
          <h1 className="text-lg font-bold text-ink">ڕیکلامەکەت بڵاوکرایەوە!</h1>
          <p className="text-sm text-gray-500 mt-1">دەگەڕێیتەوە بۆ ڕیکلامەکەت...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6 pb-28">
        <h1 className="text-xl font-extrabold text-ink mb-1">ڕیکلامی نوێ دابنێ</h1>
        <p className="text-sm text-gray-500 mb-6">
          وەک <span className="font-semibold text-ink">{user.name}</span> بڵاودەکرێتەوە
        </p>

        <form onSubmit={handleSubmit} className="space-y-7">
          <Field label={`وێنەکان (${photoPreviews.length}/${MAX_PHOTOS})`}>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photoPreviews.map((src, i) => (
                <div key={src.slice(0, 40) + i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 left-1 w-6 h-6 grid place-items-center rounded-full bg-black/60 text-white"
                    aria-label="سڕینەوەی وێنە"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 right-1 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      سەرەکی
                    </span>
                  )}
                </div>
              ))}
              {photoPreviews.length < MAX_PHOTOS && (
                <label className={`aspect-square rounded-xl border-2 border-dashed grid place-items-center transition-colors ${
                  compressing
                    ? "border-brand-300 text-brand-500 cursor-wait"
                    : "border-gray-300 text-gray-400 cursor-pointer hover:border-brand-400 hover:text-brand-500"
                }`}>
                  <div className="text-center">
                    {compressing ? (
                      <Loader2 className="w-6 h-6 mx-auto mb-1 animate-spin" />
                    ) : (
                      <ImagePlus className="w-6 h-6 mx-auto mb-1" />
                    )}
                    <span className="text-[11px] font-medium">
                      {compressing ? "پرۆسێسکردن..." : "زیادکردن"}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={compressing}
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
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
                    category === cat.slug
                      ? "bg-brand-500 border-brand-500 text-white"
                      : "bg-white border-gray-200 text-ink hover:border-brand-300"
                  }`}
                >
                  {cat.name_ckb}
                </button>
              ))}
            </div>
          </Field>

          <Field label="شار">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-brand-500 rounded-xl px-3.5 py-3 text-sm outline-none"
            >
              <option value="">شار هەڵبژێرە</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="ناونیشانی ڕیکلام">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="بۆ نموونە: تویۆتا کۆرۆلا 2019"
              maxLength={80}
              className="w-full bg-gray-50 border border-gray-200 focus:border-brand-500 rounded-xl px-3.5 py-3 text-sm outline-none placeholder:text-gray-400"
            />
          </Field>

          <Field label="دۆخی کاڵا">
            <div className="grid grid-cols-2 gap-2">
              {(["new", "used"] as Condition[]).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`rounded-xl border py-3 text-sm font-semibold transition-colors ${
                    condition === c
                      ? "bg-brand-500 border-brand-500 text-white"
                      : "bg-white border-gray-200 text-ink"
                  }`}
                >
                  {c === "new" ? "نوێ" : "بەکارهاتوو"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="نرخ (دینار)">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="450000"
              className="w-full bg-gray-50 border border-gray-200 focus:border-brand-500 rounded-xl px-3.5 py-3 text-sm outline-none placeholder:text-gray-400"
            />
          </Field>

          <Field label="وردەکاری کاڵا">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="باسی بارودۆخ، هۆکاری فرۆشتن و هەر زانیارییەکی گرنگی تر بکە..."
              className="w-full bg-gray-50 border border-gray-200 focus:border-brand-500 rounded-xl px-3.5 py-3 text-sm outline-none placeholder:text-gray-400 resize-none"
            />
          </Field>

          <Field label="ژمارەی پەیوەندی بۆ ئەم ڕیکلامە">
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              type="tel"
              dir="ltr"
              placeholder="+964 750 123 4567"
              className="w-full bg-gray-50 border border-gray-200 focus:border-brand-500 rounded-xl px-3.5 py-3 text-sm text-left outline-none placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              بە شێوەی خۆکار لە هەژمارەکەت پڕکراوەتەوە — ئەگەر ژمارەکەت گۆڕاوە یان هەڵە نووسراوە، لێرە بیگۆڕە
            </p>
          </Field>

          {error && <p className="text-sm text-red-600 font-medium text-center">{error}</p>}

          <button
            type="submit"
            disabled={submitting || compressing}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 disabled:bg-gray-300 hover:bg-brand-600 transition-colors text-white font-bold rounded-full py-3.5"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "بڵاوکردنەوە..." : "بڵاوکردنەوەی ڕیکلام"}
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
