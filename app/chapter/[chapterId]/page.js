"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  fetchChapterPages,
  getPageImageUrl,
  fetchAllChapters,
} from "../../chapterApi";

export default function ChapterReader() {
  const router = useRouter();

  const { chapterId } = useParams();
  const searchParams = useSearchParams();
  const mangaId = searchParams.get("mangaId");

  const [failedImages, setFailedImages] = useState({});
  const [allChapters, setAllChapters] = useState([]);
  const [loadedChapters, setLoadedChapters] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loaderRef = useRef(null);
  const chapterRefs = useRef([]); // ✅ moved here

  // Load all chapters
  useEffect(() => {
    if (!mangaId) return;
    fetchAllChapters(mangaId)
      .then(setAllChapters)
      .catch(() => setAllChapters([]));
  }, [mangaId]);

  // Load initial chapter
  useEffect(() => {
    if (!allChapters.length) return;

    const idx = allChapters.findIndex((c) => c.id === chapterId);
    setCurrentIdx(idx);

    if (idx !== -1 && loadedChapters.length === 0) {
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
  }, [allChapters, chapterId]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (!loaderRef.current || loading || currentIdx === -1) return;

    const rect = loaderRef.current.getBoundingClientRect();

    if (
      rect.top < window.innerHeight + 100 &&
      loadedChapters.length < allChapters.length
    ) {
      const nextIdx = currentIdx + loadedChapters.length;

      if (nextIdx < allChapters.length) {
        setLoading(true);
        fetchChapterPages(allChapters[nextIdx].id)
          .then((data) => {
            const { baseUrl, chapter } = data;
            setLoadedChapters((prev) => {
              const nextChapter = {
                id: allChapters[nextIdx].id,
                number: allChapters[nextIdx].attributes.chapter || "?",
                pages: chapter.data.map((file) =>
                  getPageImageUrl(baseUrl, chapter.hash, file),
                ),
              };

              // ✅ Update URL immediately when new chapter loads
              const params = new URLSearchParams(window.location.search);
              const newUrl = `/chapter/${nextChapter.id}?${params.toString()}`;
              window.history.replaceState(null, "", newUrl);

              return [...prev, nextChapter];
            });
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

  useEffect(() => {
    if (!loadedChapters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio > 0.5)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const idx = Number(
            visible[0].target.getAttribute("data-chapter-idx"),
          );

          const chapter = loadedChapters[idx];

          if (chapter && chapter.id !== chapterId) {
            const params = new URLSearchParams(window.location.search);

            const newUrl = `/chapter/${chapter.id}?${params.toString()}`;

            // ✅ NO refresh, no re-render trigger
            window.history.replaceState(null, "", newUrl);
          }
        }
      },
      { threshold: [0.5] },
    );

    chapterRefs.current.forEach((ref) => ref && observer.observe(ref));

    return () => observer.disconnect();
  }, [loadedChapters, chapterId]);

  // UI states
  if (!chapterId || !allChapters.length || currentIdx === -1) {
    return <div>Loading...</div>;
  }

  if (error) return <div className="text-red-500">{error}</div>;

  // ✅ MAIN RETURN FIXED
  return (
    <div className="w-full">
      {loadedChapters.map((ch, idx) => (
        <div
          key={ch.id}
          ref={(el) => (chapterRefs.current[idx] = el)}
          data-chapter-idx={idx}
          className="w-full"
        >
          <div className="text-lg font-bold mb-4 text-center">
            Chapter {ch.number}
          </div>

          <div className="flex flex-col gap-4 w-full">
            {ch.pages.map((url, i) => {
              const key = `${idx}-${i}`;
              const reloadCount = failedImages[key]?.reloadCount || 0;
              const isFailed = failedImages[key]?.failed;

              return (
                <div key={key} className="relative w-full">
                  <img
                    src={url + (reloadCount ? `?r=${reloadCount}` : "")}
                    alt={`Page ${i + 1}`}
                    className="w-full rounded shadow"
                    loading="lazy"
                    onError={() =>
                      setFailedImages((prev) => ({
                        ...prev,
                        [key]: { reloadCount, failed: true },
                      }))
                    }
                    onLoad={() =>
                      setFailedImages((prev) => {
                        if (!prev[key]) return prev;
                        const { [key]: _, ...rest } = prev;
                        return rest;
                      })
                    }
                  />

                  {isFailed && (
                    <button
                      onClick={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [key]: {
                            reloadCount: reloadCount + 1,
                            failed: false,
                          },
                        }))
                      }
                      className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded"
                    >
                      <FiRefreshCw size={32} className="text-white" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div ref={loaderRef} />
      {loading && <div className="text-center py-8">Loading pages...</div>}
    </div>
  );
}
