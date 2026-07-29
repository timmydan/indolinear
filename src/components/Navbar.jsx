import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Sliders, 
  Sun, 
  Moon, 
  ChevronDown, 
  Layers, 
  ArrowLeftRight, 
  AlignLeft, 
  BookMarked,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Navbar({
  books = [],
  selectedBook,
  setSelectedBook,
  selectedChapter,
  setSelectedChapter,
  displayMode,
  setDisplayMode,
  theme,
  setTheme,
  onOpenSettings,
  onOpenSearch
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [scrolledUp, setScrolledUp] = useState(true);
  const lastScrollY = useRef(0);
  const pickerRef = useRef(null);

  const fallbackBook = { id: 1, name: 'Kejadian', abbr: 'Kej', testament: 'OT', chaptersCount: 50 };
  const currentBookObj = books.find(b => b.id === selectedBook) || fallbackBook;
  const chaptersCount = currentBookObj ? currentBookObj.chaptersCount : 50;

  // Handle auto-collapsing entire header when scrolling down on mobile/desktop
  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 40 && currentScrollY > lastScrollY.current + 6) {
        setScrolledUp(false); // Hide entire header when scrolling down
        if (pickerOpen) setPickerOpen(false); // Close dropdown if open
      } else if (currentScrollY < lastScrollY.current - 6 || currentScrollY <= 15) {
        setScrolledUp(true); // Reveal entire header when scrolling up or at top
      }
      lastScrollY.current = currentScrollY;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pickerOpen]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBooks = books.filter(b => 
    b.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    b.abbr.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const otBooks = filteredBooks.filter(b => b.testament === 'OT');
  const ntBooks = filteredBooks.filter(b => b.testament === 'NT');

  return (
    <header 
      className={`sticky top-0 z-40 glass-header px-3 sm:px-8 transition-all duration-300 transform ${
        scrolledUp 
          ? 'translate-y-0 opacity-100 py-2.5 sm:py-4 shadow-xl' 
          : '-translate-y-full opacity-0 py-0 shadow-none pointer-events-none'
      }`}
    >
      
      {/* BRAND & LOGO TITLE BAR */}
      <div className="max-w-4xl mx-auto flex flex-row items-center justify-between gap-3 mb-3 pb-2.5 sm:mb-4 sm:pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-2 ring-white/20">
            <BookMarked className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-base sm:text-2xl tracking-tight text-[var(--text-primary)]">
                AYT <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-400 bg-clip-text text-transparent">Interlinear</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO 2.0
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium hidden sm:block">
              Alkitab Teks Ibrani BHS & Yunani WH
            </p>
          </div>
        </div>

        {/* Current Testament Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black tracking-wide border shadow-sm ${
            currentBookObj.testament === 'OT'
              ? 'bg-amber-500/15 text-[var(--accent-gold)] border-amber-500/30'
              : 'bg-sky-500/15 text-[var(--accent-cyan)] border-sky-500/30'
          }`}>
            {currentBookObj.testament === 'OT' ? '• Ibrani BHS (PL)' : '• Yunani WH (PB)'}
          </span>
        </div>
      </div>

      {/* CENTER-ALIGNED MAIN CONTROL NAVIGATION ISLAND (COLLAPSES TOGETHER WITH THE HEADER) */}
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-6 p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl backdrop-blur-xl">
        
        {/* PASSAGE PICKER & STEPPER CARD */}
        <div className="relative w-full md:w-auto" ref={pickerRef}>
          <div 
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)'
            }}
            className="flex items-center justify-between p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border shadow-inner gap-2"
          >
            {/* Book Trigger Button */}
            <button
              onClick={() => setPickerOpen(!pickerOpen)}
              className="flex items-center gap-2 sm:gap-3 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-base font-black text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
            >
              <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
              <span>{currentBookObj.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80 transition-transform duration-200 ${pickerOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className="w-[1px] h-5 sm:h-6 bg-[var(--border-color)] mx-1" />

            {/* Chapter Stepper Buttons */}
            <div className="flex items-center gap-1">
              <button
                disabled={selectedChapter <= 1}
                onClick={() => setSelectedChapter(selectedChapter - 1)}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-color)'
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl border flex items-center justify-center text-xs sm:text-sm font-black hover:bg-[var(--bg-card-hover)] disabled:opacity-30 transition-all hover:scale-110 active:scale-90 shadow-sm"
                title="Pasal Sebelumnya"
              >
                ‹
              </button>

              <span className="text-xs sm:text-sm font-black text-[var(--accent-gold)] px-2 sm:px-3 min-w-[2.75rem] sm:min-w-[3.25rem] text-center">
                Pasal {selectedChapter}
              </span>

              <button
                disabled={selectedChapter >= chaptersCount}
                onClick={() => setSelectedChapter(selectedChapter + 1)}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-color)'
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl border flex items-center justify-center text-xs sm:text-sm font-black hover:bg-[var(--bg-card-hover)] disabled:opacity-30 transition-all hover:scale-110 active:scale-90 shadow-sm"
                title="Pasal Berikutnya"
              >
                ›
              </button>
            </div>
          </div>

          {/* PASSAGE PICKER POPOVER MODAL */}
          {pickerOpen && (
            <div 
              style={{
                backgroundColor: 'var(--bg-modal)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-card)'
              }}
              className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 sm:w-[440px] max-h-[75vh] overflow-hidden rounded-3xl border z-50 p-4 sm:p-5 animate-fade-in ring-1 ring-white/10"
            >
              
              <div className="mb-4 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Ketik nama kitab (misal: Yohanes, Kej)..."
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-bold placeholder:text-[var(--text-muted)] outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              {/* Quick Chapter Grid */}
              <div className="mb-4 p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-500">
                    Pilih Pasal ({currentBookObj.name}):
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                    Total {chaptersCount} Pasal
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                  {Array.from({ length: chaptersCount }, (_, i) => i + 1).map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedChapter(c);
                        setPickerOpen(false);
                      }}
                      style={{
                        backgroundColor: c === selectedChapter ? 'var(--accent-primary)' : 'var(--bg-card)',
                        color: c === selectedChapter ? '#ffffff' : 'var(--text-primary)',
                        borderColor: 'var(--border-color)'
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-black border transition-all hover:scale-110 active:scale-95 ${
                        c === selectedChapter ? 'shadow-md shadow-indigo-600/30' : ''
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Books List */}
              <div className="max-h-[45vh] overflow-y-auto pr-1 space-y-4">
                {otBooks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[var(--accent-gold)]">
                        Perjanjian Lama (Ibrani BHS)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {otBooks.map(b => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setSelectedBook(b.id);
                            setSelectedChapter(1);
                            setPickerOpen(false);
                          }}
                          style={{
                            backgroundColor: b.id === selectedBook ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                            color: b.id === selectedBook ? '#ffffff' : 'var(--text-primary)',
                            borderColor: 'var(--border-color)'
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-[1.02] active:scale-95 ${
                            b.id === selectedBook ? 'shadow-md' : ''
                          }`}
                        >
                          <span className="truncate">{b.name}</span>
                          {b.id === selectedBook && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {ntBooks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 px-1 pt-2 border-t border-[var(--border-color)]">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[var(--accent-cyan)]">
                        Perjanjian Baru (Yunani WH)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {ntBooks.map(b => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setSelectedBook(b.id);
                            setSelectedChapter(1);
                            setPickerOpen(false);
                          }}
                          style={{
                            backgroundColor: b.id === selectedBook ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                            color: b.id === selectedBook ? '#ffffff' : 'var(--text-primary)',
                            borderColor: 'var(--border-color)'
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-[1.02] active:scale-95 ${
                            b.id === selectedBook ? 'shadow-md' : ''
                          }`}
                        >
                          <span className="truncate">{b.name}</span>
                          {b.id === selectedBook && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* SEGMENTED MODE CONTROL TABS */}
        <div 
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)'
          }}
          className="flex items-center p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border gap-1 sm:gap-1.5 w-full md:w-auto justify-center shadow-inner"
        >
          <button
            onClick={() => setDisplayMode('classic')}
            style={{
              backgroundColor: displayMode === 'classic' ? 'var(--accent-primary)' : 'transparent',
              color: displayMode === 'classic' ? '#ffffff' : 'var(--text-muted)'
            }}
            className={`flex-1 md:flex-initial px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
              displayMode === 'classic' ? 'shadow-lg shadow-indigo-600/30 scale-105' : 'hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Klasik</span>
          </button>

          <button
            onClick={() => setDisplayMode('reverse')}
            style={{
              backgroundColor: displayMode === 'reverse' ? 'var(--accent-primary)' : 'transparent',
              color: displayMode === 'reverse' ? '#ffffff' : 'var(--text-muted)'
            }}
            className={`flex-1 md:flex-initial px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
              displayMode === 'reverse' ? 'shadow-lg shadow-indigo-600/30 scale-105' : 'hover:text-[var(--text-primary)]'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Terbalik</span>
          </button>

          <button
            onClick={() => setDisplayMode('bilinear')}
            style={{
              backgroundColor: displayMode === 'bilinear' ? 'var(--accent-primary)' : 'transparent',
              color: displayMode === 'bilinear' ? '#ffffff' : 'var(--text-muted)'
            }}
            className={`flex-1 md:flex-initial px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
              displayMode === 'bilinear' ? 'shadow-lg shadow-indigo-600/30 scale-105' : 'hover:text-[var(--text-primary)]'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Pararel</span>
          </button>
        </div>

        {/* ACTION ICON BUTTONS (SPACIOUS GLASS BUTTONS) */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3">
          <button
            onClick={onOpenSearch}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-card)'
            }}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            title="Cari Ayat atau Strong's"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
          </button>

          <button
            onClick={onOpenSettings}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-card)'
            }}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            title="Pengaturan Tampilan"
          >
            <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
          </button>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-card)'
            }}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            title="Ganti Tema"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />}
          </button>
        </div>

      </div>
    </header>
  );
}
