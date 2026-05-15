"use client";
// src/app/reviews/ReviewsClient.tsx  (Owner-portal)

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Review {
    id: string;
    productId: string;
    productName: string;
    customerEmail: string | null;
    customerName: string | null;
    rating: number;
    title: string | null;
    body: string;
    verified: boolean;
    source: string;
    status: string;
    createdAt: string;
}

interface StarBreakdown { star: number; count: number; }
interface Product { id: string; name: string; }

interface Props {
    reviews: Review[];
    total: number;
    page: number;
    totalPages: number;
    averageRating: number;
    totalReviews: number;
    starBreakdown: StarBreakdown[];
    products: Product[];
    storeId: string;
    filters: { productId?: string; rating?: number; source?: string };
}

// ─── Star renderer ───────────────────────────────────────────────────────────
function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
    return (
        <span className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} width={size} height={size} viewBox="0 0 20 20" fill={s <= rating ? "#f59e0b" : "#e5e7eb"}>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </span>
    );
}

// ─── CSV preview row ─────────────────────────────────────────────────────────
interface CsvPreviewRow {
    productId: string; productName?: string; customerEmail?: string;
    customerName?: string; rating: string; title?: string; body: string; createdAt?: string;
}

function parseCsv(text: string): CsvPreviewRow[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
        return row as unknown as CsvPreviewRow;
    });
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ReviewsClient({
    reviews, total, page, totalPages, averageRating, totalReviews,
    starBreakdown, products, storeId, filters,
}: Props) {
    const router = useRouter();

    // ── Filters ──
    const [filterProduct, setFilterProduct] = useState(filters.productId ?? "");
    const [filterRating, setFilterRating] = useState(filters.rating?.toString() ?? "");
    const [filterSource, setFilterSource] = useState(filters.source ?? "");

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (filterProduct) params.set("productId", filterProduct);
        if (filterRating) params.set("rating", filterRating);
        if (filterSource) params.set("source", filterSource);
        router.push(`/reviews?${params.toString()}`);
    };

    const clearFilters = () => {
        setFilterProduct(""); setFilterRating(""); setFilterSource("");
        router.push("/reviews");
    };

    // ── Delete ──
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const deleteReview = async (id: string) => {
        if (!confirm("Delete this review? This cannot be undone.")) return;
        setDeletingId(id);
        await fetch(`/api/reviews/${id}`, { method: "DELETE" });
        setDeletingId(null);
        router.refresh();
    };

    // ── CSV import ──
    const [showImport, setShowImport] = useState(false);
    const [csvRows, setCsvRows] = useState<CsvPreviewRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            setCsvRows(parseCsv(text));
            setImportResult(null);
        };
        reader.readAsText(file);
    }, []);

    const runImport = async () => {
        if (csvRows.length === 0) return;
        setImporting(true);
        const res = await fetch("/api/reviews/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storeId, rows: csvRows }),
        });
        const data = await res.json();
        setImportResult(data);
        setImporting(false);
        if (data.imported > 0) router.refresh();
    };

    // ── Render ──
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage customer reviews for your products</p>
                    </div>
                    <button
                        onClick={() => setShowImport(!showImport)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Import CSV
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Reviews</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{totalReviews.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Average Rating</p>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-3xl font-bold text-gray-900">{averageRating || "—"}</p>
                            {averageRating > 0 && <Stars rating={Math.round(averageRating)} />}
                        </div>
                    </div>
                    {[5, 4, 3].map((star) => {
                        const entry = starBreakdown.find((s) => s.star === star);
                        const count = entry?.count ?? 0;
                        const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                        return (
                            <div key={star} className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center gap-1 mb-2">
                                    <Stars rating={star} size={14} />
                                    <span className="text-xs text-gray-500">{star} star</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                                        <div className="h-1.5 bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 w-6 text-right">{count}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* CSV Import Panel */}
                {showImport && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-1">Import Reviews from CSV</h2>
                        <p className="text-xs text-gray-500 mb-4">
                            CSV must have headers: <code className="bg-gray-100 px-1 rounded">productId, rating, body</code> (required) + <code className="bg-gray-100 px-1 rounded">productName, customerEmail, customerName, title, createdAt</code> (optional)
                        </p>

                        <div className="flex items-center gap-3 mb-4">
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".csv"
                                onChange={onFileChange}
                                className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 file:text-gray-700 file:text-xs hover:file:bg-gray-200 cursor-pointer"
                            />
                            {csvRows.length > 0 && (
                                <span className="text-sm text-gray-500">{csvRows.length} rows detected</span>
                            )}
                        </div>

                        {/* Preview */}
                        {csvRows.length > 0 && (
                            <div className="overflow-x-auto border border-gray-100 rounded-lg mb-4">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {["productId", "rating", "customerEmail", "title", "body"].map((h) => (
                                                <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {csvRows.slice(0, 5).map((row, i) => (
                                            <tr key={i} className="border-t border-gray-100">
                                                <td className="px-3 py-2 font-mono text-gray-700">{row.productId}</td>
                                                <td className="px-3 py-2">{row.rating}</td>
                                                <td className="px-3 py-2 text-gray-500">{row.customerEmail || "—"}</td>
                                                <td className="px-3 py-2 text-gray-500">{row.title || "—"}</td>
                                                <td className="px-3 py-2 text-gray-700 max-w-xs truncate">{row.body}</td>
                                            </tr>
                                        ))}
                                        {csvRows.length > 5 && (
                                            <tr className="border-t border-gray-100">
                                                <td colSpan={5} className="px-3 py-2 text-gray-400 text-center">
                                                    … and {csvRows.length - 5} more rows
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {importResult && (
                            <div className={`rounded-lg p-4 mb-4 text-sm ${importResult.imported > 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                                <p className="font-medium">
                                    {importResult.imported} imported, {importResult.skipped} skipped
                                </p>
                                {importResult.errors.slice(0, 5).map((e, i) => (
                                    <p key={i} className="text-xs mt-1 opacity-80">{e}</p>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={runImport}
                                disabled={importing || csvRows.length === 0}
                                className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
                            >
                                {importing ? "Importing…" : `Import ${csvRows.length} rows`}
                            </button>
                            <button
                                onClick={() => { setShowImport(false); setCsvRows([]); setImportResult(null); if (fileRef.current) fileRef.current.value = ""; }}
                                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium">Product</label>
                        <select
                            value={filterProduct}
                            onChange={(e) => setFilterProduct(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            <option value="">All products</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium">Rating</label>
                        <select
                            value={filterRating}
                            onChange={(e) => setFilterRating(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            <option value="">All ratings</option>
                            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} stars</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium">Source</label>
                        <select
                            value={filterSource}
                            onChange={(e) => setFilterSource(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            <option value="">All sources</option>
                            <option value="organic">Organic</option>
                            <option value="csv">CSV import</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={applyFilters} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
                            Filter
                        </button>
                        <button onClick={clearFilters} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                            Clear
                        </button>
                    </div>
                    <span className="ml-auto text-sm text-gray-400">{total} result{total !== 1 ? "s" : ""}</span>
                </div>

                {/* Reviews Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {reviews.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-40">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            <p>No reviews yet</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Product</th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Rating</th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Review</th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Source</th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {reviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <span className="font-medium text-gray-900 text-xs">{review.productName}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div>
                                                <p className="text-gray-900">{review.customerName || "—"}</p>
                                                <p className="text-gray-400 text-xs">{review.customerEmail || "—"}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Stars rating={review.rating} size={14} />
                                        </td>
                                        <td className="px-5 py-4 max-w-xs">
                                            {review.title && <p className="font-medium text-gray-900 text-xs mb-0.5">{review.title}</p>}
                                            <p className="text-gray-500 text-xs line-clamp-2">{review.body}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${review.source === "csv" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                                                    }`}>
                                                    {review.source === "csv" ? "CSV" : "Organic"}
                                                </span>
                                                {review.verified && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                                                        <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        Verified
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                                            {new Date(review.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => deleteReview(review.id)}
                                                disabled={deletingId === review.id}
                                                className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                                                title="Delete review"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => {
                                    const params = new URLSearchParams(window.location.search);
                                    params.set("page", String(p));
                                    router.push(`/reviews?${params.toString()}`);
                                }}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}