"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMangaList, fetchMangaCovers, getMangaCoverUrl } from "./mangaApi";

export default function MangaList() {
  const [manga, setManga] = useState([]);
  const [covers, setCovers] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    fetchMangaList(page, limit)
      .then(async (data) => {
        setManga(data.data);
        setTotal(data.total);
        // Fetch covers for this page
        const coverMap = await fetchMangaCovers(data.data);
        setCovers(coverMap);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6">Popular Manga</h2>
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {manga.map((m) => {
            const coverRel = m.relationships.find(
              (r) => r.type === "cover_art",
            );
            const coverId = coverRel ? coverRel.id : null;
            const fileName = coverId ? covers[coverId] : null;
            const coverUrl = fileName ? getMangaCoverUrl(m.id, fileName) : null;
            return (
              <Link
                key={m.id}
                href={`/manga/${m.id}`}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-200 p-3 flex flex-col items-center border border-zinc-100 dark:border-zinc-800 hover:scale-105"
              >
                <div className="w-32 h-48 bg-linear-to-br from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-xl mb-2 flex items-center justify-center overflow-hidden shadow-inner">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={m.attributes.title.en || "Manga cover"}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-xs text-zinc-500">No Cover</span>
                  )}
                </div>
                <div className="text-center text-sm font-medium line-clamp-2">
                  {m.attributes.title.en ||
                    Object.values(m.attributes.title)[0]}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <div className="flex justify-between items-center mt-8 gap-4">
        <button
          className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 font-semibold disabled:opacity-50 shadow"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>
          Page {page} / {Math.ceil(total / limit) || 1}
        </span>
        <button
          className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 font-semibold disabled:opacity-50 shadow"
          onClick={() => setPage((p) => p + 1)}
          disabled={page * limit >= total}
        >
          Next
        </button>
      </div>
    </div>
  );
}
