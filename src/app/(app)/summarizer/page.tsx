"use client";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "next-auth/react";
import { Upload, X, Sparkles, Lock, Crown, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Flashcard { front: string; back: string; }
interface Result { summary: string; flashcards: Flashcard[]; keyQuestions: string[]; }

export default function SummarizerPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!session?.user?.isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
          <Lock size={36} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t("premiumFeature")}</h2>
        <p className="text-gray-500 max-w-sm mb-6">{t("upgradeDesc")}</p>
        <Link href="/settings" className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold">
          <Crown size={18} /> {t("upgrade")}
        </Link>
      </div>
    );
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setImages((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    setImages((imgs) => imgs.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const analyze = async () => {
    if (!images.length) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      images.forEach((f) => fd.append("images", f));
      const res = await fetch("/api/ai/summarize", { method: "POST", body: fd });
      if (res.ok) {
        setResult(await res.json());
        setCardIndex(0); setFlipped(false);
      } else {
        // Safely parse error — the response may not be JSON (e.g. raw 500 from Next.js)
        let msg = t("error");
        try {
          const text = await res.text();
          if (text) {
            const d = JSON.parse(text);
            msg = d.error || msg;
          }
        } catch {}
        setError(msg);
      }
    } catch (err: any) {
      setError(err?.message || t("error"));
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Sparkles size={20} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("aiSummarizer")}</h1>
          <p className="text-sm text-gray-400">{t("uploadDesc")}</p>
        </div>
      </div>

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-indigo-300 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <Upload size={32} className="mx-auto text-gray-300 mb-3" />
        <p className="font-medium text-gray-600">{t("uploadImages")}</p>
        <p className="text-sm text-gray-400 mt-1">PNG, JPG, WebP · Click or drag & drop</p>
      </div>

      {/* Image previews */}
      {previews.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {previews.map((src, i) => (
            <div key={i} className="relative group">
              <img src={src} alt="" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
              <button onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>}

      <button onClick={analyze} disabled={loading || !images.length}
        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm">
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t("analyzing")}</>
        ) : (
          <><Sparkles size={18} />{t("analyze")}</>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              📄 {t("summary")}
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{result.summary}</div>
          </div>

          {/* Flashcards */}
          {result.flashcards.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🃏 {t("flashcards")} ({result.flashcards.length})
              </h2>
              <div className="flip-card w-full h-48 cursor-pointer" onClick={() => setFlipped(!flipped)}>
                <div className={cn("flip-card-inner w-full h-full", flipped && "flipped")}>
                  <div className="flip-card-front w-full h-full bg-indigo-50 border-2 border-indigo-100 rounded-xl flex items-center justify-center p-6 text-center">
                    <div>
                      <p className="text-xs text-indigo-400 mb-2 font-medium">{t("front")}</p>
                      <p className="text-lg font-semibold text-indigo-900">{result.flashcards[cardIndex].front}</p>
                    </div>
                  </div>
                  <div className="flip-card-back w-full h-full bg-green-50 border-2 border-green-100 rounded-xl flex items-center justify-center p-6 text-center">
                    <div>
                      <p className="text-xs text-green-400 mb-2 font-medium">{t("back")}</p>
                      <p className="text-base text-green-900">{result.flashcards[cardIndex].back}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <button onClick={() => { setCardIndex(Math.max(0, cardIndex - 1)); setFlipped(false); }}
                  disabled={cardIndex === 0}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-600">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <button onClick={() => setFlipped(!flipped)} className="flex items-center gap-1 text-indigo-600 font-medium">
                    <RotateCcw size={14} /> {t("flip")}
                  </button>
                  <span>·</span>
                  <span>{cardIndex + 1} / {result.flashcards.length}</span>
                </div>
                <button onClick={() => { setCardIndex(Math.min(result.flashcards.length - 1, cardIndex + 1)); setFlipped(false); }}
                  disabled={cardIndex === result.flashcards.length - 1}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-600">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Key Questions */}
          {result.keyQuestions.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                ❓ {t("keyQuestions")}
              </h2>
              <ol className="space-y-3">
                {result.keyQuestions.map((q, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <p className="text-sm text-gray-700 pt-0.5">{q}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
