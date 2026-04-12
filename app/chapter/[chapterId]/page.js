"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  fetchChapterPages,
  getPageImageUrl,
  fetchAllChapters,
} from "../../chapterApi";

export default function ChapterReader() {
  const { chapterId } = useParams();
  const searchParams = useSearchParams();
  const mangaId = searchParams.get("mangaId");
  const [allChapters, setAllChapters] = useState([]);
  const [loadedChapters, setLoadedChapters] = useState([]); // [{id, number, pages: []}]
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loaderRef = useRef();

  // Load all chapters for infinite scroll
  useEffect(() => {
    if (!mangaId) return;
    fetchAllChapters(mangaId)
      .then((chs) => setAllChapters(chs))
      .catch(() => setAllChapters([]));
  }, [mangaId]);

  // Find current chapter index and load initial chapter
  useEffect(() => {
    if (!allChapters.length) return;
    const idx = allChapters.findIndex((c) => c.id === chapterId);
    setCurrentIdx(idx);
    if (idx !== -1 && loadedChapters.length === 0) {
      // Load the initial chapter
      setLoading(true);
      fetchChapterPages(allChapters[idx].id)
        .then((data) => {
          const { baseUrl, chapter } = data;
          setLoadedChapters([
            {
              id: allChapters[idx].id,
              number: allChapters[idx].attributes.chapter || "?",
              pages: chapter.data.map((file) =>
                getPageImageUrl(baseUrl, chapter.hash, file),
              ),
            },
          ]);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line
  }, [allChapters, chapterId]);

  // Infinite scroll: load next chapter when bottom is reached
  const handleScroll = useCallback(() => {
    if (
      !loaderRef.current ||
      loading ||
      !allChapters.length ||
      currentIdx === -1
    )
      return;
    const rect = loaderRef.current.getBoundingClientRect();
    if (
      rect.top < window.innerHeight + 100 &&
      loadedChapters.length < allChapters.length
    ) {
      // Load next chapter and append
      setLoading(true);
      const nextIdx = currentIdx + loadedChapters.length;
      if (nextIdx < allChapters.length) {
        fetchChapterPages(allChapters[nextIdx].id)
          .then((data) => {
            const { baseUrl, chapter } = data;
            setLoadedChapters((prev) => [
              ...prev,
              {
                id: allChapters[nextIdx].id,
                number: allChapters[nextIdx].attributes.chapter || "?",
                pages: chapter.data.map((file) =>
                  getPageImageUrl(baseUrl, chapter.hash, file),
                ),
              },
            ]);
          })
          .catch((e) => setError(e.message))
          .finally(() => setLoading(false));
      }
    }
  }, [allChapters, currentIdx, loadedChapters.length, loading]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (
    !chapterId ||
    !allChapters.length ||
    currentIdx === -1 ||
    loadedChapters.length === 0
  )
    return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto py-8">
      {loadedChapters.map((ch, idx) => (
        <div key={ch.id} className="w-full">
          <div className="text-lg font-bold mb-4 text-center">
            Chapter {ch.number}
          </div>
          <div className="flex flex-col gap-4 w-full">
            {ch.pages.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Page ${i + 1}`}
                className="w-full rounded shadow bg-zinc-100 dark:bg-zinc-900"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      ))}
      <div ref={loaderRef} />
      {loading && <div className="text-center py-8">Loading pages...</div>}
    </div>
  );
}
