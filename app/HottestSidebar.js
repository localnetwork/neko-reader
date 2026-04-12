"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMangaList, fetchMangaCovers, getMangaCoverUrl } from "./mangaApi";

export default function HottestSidebar() {
  const [manga, setManga] = useState([]);
  const [covers, setCovers] = useState({});

  useEffect(() => {
    fetchMangaList(1, 8).then(async (data) => {
      setManga(data.data);
      const coverMap = await fetchMangaCovers(data.data);
      setCovers(coverMap);
    });
  }, []);

  return (
    <aside className="w-full md:w-64 bg-white/80 dark:bg-zinc-900/80 rounded-xl shadow p-4 mb-8 md:mb-0 md:mr-8">
      <h3 className="text-lg font-bold mb-4 text-zinc-800 dark:text-zinc-100">
        🔥 Hottest Manga
      </h3>
      <ul className="space-y-4">
        {manga.map((m) => {
          const coverRel = m.relationships.find((r) => r.type === "cover_art");
          const coverId = coverRel ? coverRel.id : null;
          const fileName = coverId ? covers[coverId] : null;
          const coverUrl = fileName ? getMangaCoverUrl(m.id, fileName) : null;
          return (
            <li key={m.id} className="flex items-center gap-3">
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt="cover"
                  className="w-12 h-16 object-cover rounded shadow"
                />
              )}
              <Link
                href={`/manga/${m.id}`}
                className="font-medium text-zinc-800 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
              >
                {m.attributes.title.en || Object.values(m.attributes.title)[0]}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
