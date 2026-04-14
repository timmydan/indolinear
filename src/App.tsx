import React, { useState, useEffect } from "react";
import { BookOpen, Info, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { parseMorphology } from "./lib/morphology";

const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === 'true';

async function apiFetch(path: string) {
  if (STATIC_MODE) {
	  // Use import.meta.env.BASE_URL to ensure paths are correct regardless of where the app is hosted (e.g. GitHub Pages subfolder)
    const base = import.meta.env.BASE_URL;
    if (path === '/api/books') {
      return fetch(`${base}data/books.json`);
    } else if (path.startsWith('/api/chapter/')) {
      const parts = path.split('/');
      return fetch(`${base}data/chapter_${parts[3]}_${parts[4]}.json`);
    } else if (path.startsWith('/api/strong/')) {
      const parts = path.split('/');
      return fetch(`${base}data/strong_${parts[3]}_${parts[4]}.json`);
    }
  }
  return fetch(path);
}

interface InterlinearUnit {
  ind: string;
  origAscii: string;
  origUnicode: string;
  strong: string;
  morphology?: string;
  lemma?: string;
}

interface Verse {
  number: string;
  originalUnits: InterlinearUnit[];
  indonesianUnits: InterlinearUnit[];
  origFullText?: string;
}

interface ChapterData {
  title: string;
  verses: Verse[];
}

interface Book {
  id: string;
  name: string;
}

interface StrongData {
  title: string;
  originalWord: string;
  definition: string;
  nasbUsage: string;
  avUsage: string;
}

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState("1");
  const [selectedChapter, setSelectedChapter] = useState("1");
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStrong, setSelectedStrong] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<InterlinearUnit | null>(null);
  const [strongData, setStrongData] = useState<StrongData | null>(null);
  const [strongLoading, setStrongLoading] = useState(false);
  const [hoveredStrong, setHoveredStrong] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    fetchChapter();
    setSelectedStrong(null);
    setSelectedUnit(null);
  }, [selectedBook, selectedChapter]);

  useEffect(() => {
    if (selectedStrong) {
      fetchStrong();
    }
  }, [selectedStrong]);

  const fetchBooks = async () => {
    try {
      const res = await apiFetch("/api/books");
      const data = await res.json();
      setBooks(STATIC_MODE ? data.books : data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChapter = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/chapter/${selectedBook}/${selectedChapter}`);
      const data = await res.json();
      setChapterData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStrong = async () => {
    setStrongLoading(true);
    try {
      const type = parseInt(selectedBook) <= 39 ? 'heb' : 'grk';
      // Pad the Strong's number to 4 digits (e.g., "18" -> "0018")
      // If there are multiple numbers separated by space, pad the first one or all of them
      const paddedStrong = selectedStrong ? selectedStrong.split(' ')[0].padStart(4, '0') : '';
      const res = await apiFetch(`/api/strong/${type}/${paddedStrong}`);
      const data = await res.json();
      setStrongData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStrongLoading(false);
    }
  };

  const isHebrew = parseInt(selectedBook) <= 39;
  const isOT = parseInt(selectedBook) <= 39;
  const isRTL = isHebrew;

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-[#F5F2ED]">
      {/* Header */}
      <header className="border-b border-[#1A1A1A]/20 p-4 flex items-center justify-between sticky top-0 bg-[#F5F2ED]/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <BookOpen className="w-6 h-6" />
          <h1 className="font-serif italic text-xl font-bold uppercase tracking-wider">Alkitab Indolinear</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {/* 
			<button
              onClick={async () => {
                try {
                  await fetch('/api/admin/scrape', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bookId: selectedBook })
                  });
                  alert(`Started scraping book ${selectedBook} in the background.`);
                } catch (err) {
                  alert('Failed to start scrape.');
                }
              }}
              className="px-3 py-1.5 text-[10px] font-bold uppercase transition-all border border-[#1A1A1A]/20 hover:bg-[#1A1A1A] hover:text-[#F5F2ED] rounded-sm"
            >
              Scrape & Cache Book
            </button>
			*/}
            <select 
              value={selectedBook}
              onChange={(e) => {
                setSelectedBook(e.target.value);
                setSelectedChapter("1");
              }}
              className="bg-transparent border border-[#1A1A1A]/20 px-3 py-1.5 text-xs font-bold uppercase outline-none rounded-sm focus:border-[#1A1A1A]"
            >
              {books.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setSelectedChapter(prev => Math.max(1, parseInt(prev) - 1).toString())}
                className="p-1.5 hover:bg-[#1A1A1A] hover:text-[#F5F2ED] transition-colors border border-[#1A1A1A]/20 rounded-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input 
                type="number" 
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value || "1")}
                className="w-12 text-center font-mono text-sm bg-transparent border border-[#1A1A1A]/20 py-1 rounded-sm outline-none"
              />
              <button 
                onClick={() => setSelectedChapter(prev => (parseInt(prev) + 1).toString())}
                className="p-1.5 hover:bg-[#1A1A1A] hover:text-[#F5F2ED] transition-colors border border-[#1A1A1A]/20 rounded-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 pb-[50vh] lg:pb-6 grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-[1600px] mx-auto">
        {/* Main Content */}
        <section className="lg:col-span-3 space-y-12">
          <div className="flex items-baseline justify-between border-b border-[#1A1A1A]/10 pb-4">
            <h2 className="font-serif italic text-4xl">{chapterData?.title || "Loading..."}</h2>
            <div className="flex items-center gap-6">
               <span className="text-[10px] uppercase font-bold opacity-40 tracking-[0.2em]">
                 {isOT ? 'WLC' : 'SBL GNT'} / Terjemahan Baru
               </span>
            </div>
          </div>

          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-xs tracking-widest uppercase opacity-50">Fetching Chapter Data...</span>
            </div>
          ) : (
            <div className="space-y-16">
              {chapterData?.verses.map((verse) => (
                <div key={verse.number} className="relative group pb-16 pl-12 sm:pl-16 border-b border-[#1A1A1A]/5 last:border-0">
                  {/* Verse Number */}
                  <div className="absolute left-0 top-0 font-serif italic text-2xl opacity-40 group-hover:opacity-100 transition-opacity">
                    {verse.number}
                  </div>

                  {/* Interlinear Row */}
                  <div 
                    className="flex flex-wrap gap-x-8 gap-y-14"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    {verse.originalUnits.map((unit, idx) => {
                      const isHovered = hoveredStrong === unit.strong && unit.strong !== '0';
                      const hasInd = unit.ind && unit.ind !== '-' && unit.ind !== '';
                      
                      return (
                        <div 
                          key={`${verse.number}-${idx}`}
                          onMouseEnter={() => setHoveredStrong(unit.strong)}
                          onMouseLeave={() => setHoveredStrong(null)}
                          onClick={() => {
                            if (unit.strong !== '0') {
                              setSelectedStrong(unit.strong);
                              setSelectedUnit(unit);
                            }
                          }}
                          className={`flex flex-col items-center p-3 transition-all cursor-pointer rounded-lg min-w-[90px] ${isHovered ? 'bg-[#1A1A1A] text-[#F5F2ED] shadow-2xl scale-110 z-10' : 'hover:bg-[#1A1A1A]/5'}`}
                        >
                          {/* Strong's Number */}
                          <div className="h-4 flex items-center justify-center mb-1">
                            <span className={`font-mono text-[10px] tracking-tighter ${isHovered ? 'text-[#F5F2ED]/60' : 'text-[#1A1A1A]/30'}`}>
                              {unit.strong !== '0' ? unit.strong : ''}
                            </span>
                          </div>

                          {/* Original Language Word */}
                          <div className="h-14 flex items-center justify-center">
                            <span className={`text-4xl leading-none font-serif ${isHebrew ? 'font-bold' : ''}`}>
                              {unit.origUnicode}
                            </span>
                          </div>

                          {/* Transliteration & Morphology */}
                          <div className="h-8 flex flex-col items-center justify-center mt-1">
                            {hasInd && (
                              <span className={`font-mono text-[11px] italic opacity-30 ${isHovered ? 'text-[#F5F2ED]' : ''}`}>
                                {unit.origAscii}
                              </span>
                            )}
                            {unit.morphology && (
                              <span className={`font-mono text-[9px] uppercase tracking-wider opacity-40 mt-0.5 ${isHovered ? 'text-[#F5F2ED]' : 'text-[#1A1A1A]'}`}>
                                {unit.morphology}
                              </span>
                            )}
                          </div>

                          {/* Indonesian Translation */}
                          <div className="mt-3 pt-3 border-t border-[#1A1A1A]/10 w-full flex justify-center">
                            <span className={`text-sm font-medium text-center max-w-[140px] leading-snug ${isHovered ? 'text-[#F5F2ED]' : 'text-[#1A1A1A]/80'}`}>
                              {hasInd ? unit.ind : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="fixed bottom-0 left-0 right-0 z-40 lg:sticky lg:top-24 lg:bottom-auto lg:left-auto lg:right-auto lg:z-auto">
            <div className="border-t lg:border border-[#1A1A1A]/10 p-4 lg:p-6 lg:rounded-lg bg-[#F5F2ED]/95 lg:bg-white/50 backdrop-blur-md lg:backdrop-blur-sm shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-sm max-h-[50vh] lg:max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2 border-b border-[#1A1A1A]/10 pb-3 mb-4 lg:mb-6">
                <Info className="w-4 h-4" />
                <h3 className="font-serif italic text-lg uppercase tracking-tight">Detail Leksikon</h3>
              </div>

              {!selectedStrong ? (
                <div className="space-y-4">
                  <p className="text-sm opacity-60 font-serif leading-relaxed italic">
                    Pilih kata dari teks indolinear untuk melihat makna aslinya, definisi Strong, dan penggunaannya di seluruh Alkitab.
                  </p>
                  <div className="h-px bg-[#1A1A1A]/5" />
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold opacity-30">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />
                      Hebrew (WLC)
                    </div>
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold opacity-30">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />
                      Greek (SBL GNT)
                    </div>
                  </div>
                </div>
              ) : strongLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-6 h-6 border border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">Memuat Leksikon...</span>
                </div>
              ) : strongData ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div>
                    <div className="text-[9px] uppercase font-bold opacity-40 tracking-[0.2em] mb-2">Kata Asli</div>
                    <div className="text-4xl font-serif border-b-2 border-[#1A1A1A] pb-3">{strongData.originalWord}</div>
                  </div>

                  <div>
                    <div className="text-[9px] uppercase font-bold opacity-40 tracking-[0.2em] mb-2">Bahasa Inggris</div>
                    <div className="text-sm font-serif leading-relaxed text-[#1A1A1A]/90 bg-[#1A1A1A]/5 p-4 rounded-md border border-[#1A1A1A]/5">
                      {strongData.nasbUsage}
                    </div>
                  </div>

                  {/*{strongData.avUsage && (
                    <div>
                      <div className="text-[9px] uppercase font-bold opacity-40 tracking-[0.2em] mb-2">Bahasa Inggris</div>
                      <div className="text-xs leading-relaxed opacity-80">{strongData.avUsage}</div>
                    </div>
                  )} */}

                  {selectedUnit?.morphology && (
                    <div>
                      <div className="text-[9px] uppercase font-bold opacity-40 tracking-[0.2em] mb-2">Morfologi</div>
                      <div className="text-xs leading-relaxed opacity-80">
                        {parseMorphology(selectedUnit.morphology)?.en}
                        <br />
                        <span className="italic opacity-70">{parseMorphology(selectedUnit.morphology)?.id}</span>
                      </div>
                    </div>
                  )}

                  <a 
                    href={`https://devx.sabda.org/interlinear/${isOT ? 'heb2tb' : 'grk2tb'}/strong.php?s=${selectedStrong.replace(/^[HG]/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 border border-[#1A1A1A] text-[10px] uppercase font-bold hover:bg-[#1A1A1A] hover:text-[#F5F2ED] transition-all group"
                  >
                    Lihat di Sabda <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </motion.div>
              ) : null}
            </div>
            
            <div className="text-[9px] uppercase font-bold opacity-20 tracking-[0.3em] text-center">
              Proyek Alkitab Indolinear &middot; 2026
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-[#1A1A1A]/10 p-12 bg-[#1A1A1A]/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center gap-8 opacity-40 grayscale">
             <span className="text-xs font-bold uppercase tracking-widest">WLC</span>
             <span className="text-xs font-bold uppercase tracking-widest">SBL GNT</span>
             <span className="text-xs font-bold uppercase tracking-widest">Sabda</span>
          </div>
          <p className="text-[10px] uppercase font-bold opacity-30 tracking-[0.4em]">
            Dibangun untuk Pendalaman Alkitab Bahasa Indonesia &middot; Soli Deo Gloria
          </p>
        </div>
      </footer>
    </div>
  );
}
