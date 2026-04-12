// Get all chapters for a manga (no pagination, for infinite scroll)
export async function fetchAllChapters(mangaId) {
  let all = [];
  let page = 1;
  const limit = 100;
  let total = 0;
  do {
    const res = await fetch(
      `https://api.mangadex.org/manga/${mangaId}/feed?limit=${limit}&offset=${(page - 1) * limit}&translatedLanguage[]=en&order[chapter]=asc`,
    );
    if (!res.ok) throw new Error("Failed to fetch chapters");
    const data = await res.json();
    all = all.concat(data.data);
    total = data.total;
    page++;
  } while (all.length < total);
  return all;
}
// Fetch all pages for a chapter
export async function fetchChapterPages(chapterId) {
  const res = await fetch(
    `https://api.mangadex.org/at-home/server/${chapterId}`,
  );
  if (!res.ok) throw new Error("Failed to fetch chapter pages");
  const data = await res.json();
  // Returns { baseUrl, chapter: { hash, data: [page1, page2, ...] } }
  return data;
}

// Get full image URL for a page
export function getPageImageUrl(baseUrl, hash, fileName) {
  return `${baseUrl}/data/${hash}/${fileName}`;
}
