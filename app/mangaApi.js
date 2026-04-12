// Utility for fetching manga data from MangaDex API
const BASE_URL = "https://api.mangadex.org";

export async function fetchMangaList(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const res = await fetch(
    `${BASE_URL}/manga?limit=${limit}&offset=${offset}&order[followedCount]=desc&availableTranslatedLanguage[]=en&hasAvailableChapters=true&contentRating[]=safe`,
  );
  if (!res.ok) throw new Error("Failed to fetch manga list");
  return res.json();
}

export async function fetchMangaChapters(mangaId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const res = await fetch(
    `${BASE_URL}/manga/${mangaId}/feed?limit=${limit}&offset=${offset}&translatedLanguage[]=en&order[chapter]=asc`,
  );
  if (!res.ok) throw new Error("Failed to fetch chapters");
  return res.json();
}

// Fetch cover art filenames for a batch of manga
export async function fetchMangaCovers(mangaList) {
  const coverIds = mangaList
    .map((m) => {
      const rel = m.relationships.find((r) => r.type === "cover_art");
      return rel ? rel.id : null;
    })
    .filter(Boolean);
  if (coverIds.length === 0) return {};
  const res = await fetch(
    `${BASE_URL}/cover?ids[]=${coverIds.join("&ids[]=")}`,
  );
  if (!res.ok) throw new Error("Failed to fetch covers");
  const data = await res.json();
  // Map cover id to filename
  const coverMap = {};
  data.data.forEach((cover) => {
    coverMap[cover.id] = cover.attributes.fileName;
  });
  return coverMap;
}

export function getMangaCoverUrl(mangaId, fileName) {
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.256.jpg`;
}
