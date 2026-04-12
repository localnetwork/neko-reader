import MangaList from "./MangaList";
import HottestSidebar from "./HottestSidebar";
import MangaSearchForm from "./MangaSearchForm";

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row gap-8 w-full">
      <div className="md:w-1/4 w-full">
        <HottestSidebar />
      </div>
      <div className="flex-1 flex flex-col">
        <MangaSearchForm />
        <MangaList />
      </div>
    </div>
  );
}
