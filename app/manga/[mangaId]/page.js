"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchMangaChapters } from "../../mangaApi";
import Link from "next/link";

export default function MangaChapters() {
  const { mangaId } = useParams();
  const [chapters, setChapters] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 20;

  useEffect(() => {
    if (!mangaId) return;
    setLoading(true);
    fetchMangaChapters(mangaId, page, limit)
      .then((data) => {
        setChapters(data.data);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [mangaId, page]);

  if (!mangaId) return <div>Loading...</div>;

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6">Chapters</h2>
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {chapters.map((ch) => (
            <li key={ch.id}>
              <Link
                href={`/chapter/${ch.id}?mangaId=${mangaId}`}
                className="block py-3 px-4 bg-white dark:bg-zinc-900 rounded-xl my-2 shadow hover:shadow-lg transition-all duration-200 border border-zinc-100 dark:border-zinc-800 font-medium text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Chapter {ch.attributes.chapter || "?"} -{" "}
                {ch.attributes.title || "No title"}
              </Link>
            </li>
          ))}
        </ul>
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
