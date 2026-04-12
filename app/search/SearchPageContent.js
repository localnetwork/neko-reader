"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMangaCovers, getMangaCoverUrl } from "../mangaApi";

export default function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [covers, setCovers] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=24&availableTranslatedLanguage[]=en&hasAvailableChapters=true&contentRating[]=safe`,
    )
      .then((res) => res.json())
      .then(async (data) => {
        setResults(data.data || []);
        const coverMap = await fetchMangaCovers(data.data || []);
        setCovers(coverMap);
      })
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Search Results for "{query}"</h2>
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : results.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">No results found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {results.map((m) => {
            const coverRel = m.relationships.find(
              (r) => r.type === "cover_art",
            );
            const coverId = coverRel ? coverRel.id : null;
            const fileName = coverId ? covers[coverId] : null;
            const coverUrl = fileName ? getMangaCoverUrl(m.id, fileName) : null;
            return (
              <a
                key={m.id}
                href={`/manga/${m.id}`}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-200 p-3 flex flex-col items-center border border-zinc-100 dark:border-zinc-800 hover:scale-105"
              >
                <div className="w-32 h-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-2 flex items-center justify-center overflow-hidden shadow-inner">
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
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
