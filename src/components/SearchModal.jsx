import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, Hash, ArrowRight, Loader2, Book } from 'lucide-react';

export default function SearchModal({
  books,
  chapterData = [],
  strongHebrew,
  strongGreek,
  onNavigateVerse,
  onClose,
  initialQuery = ''
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [strongLexEntry, setStrongLexEntry] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 1) {
      setResults([]);
      setStrongLexEntry(null);
      return;
    }

    setLoading(true);
    const q = searchTerm.trim();
    const qLower = q.toLowerCase();
    const matchedResults = [];
    setStrongLexEntry(null);

    // 1. Check if user typed Strong's pattern (e.g. G976, H7225, or numbers like 976 / 7225)
    const strongMatch = q.match(/^(h|g)?\s*(\d{1,5})$/i);
    if (strongMatch) {
      const rawPrefix = strongMatch[1] ? strongMatch[1].toUpperCase() : '';
      const numStr = strongMatch[2];
      
      let candidateKeys = [];
      if (rawPrefix) {
        candidateKeys.push(`${rawPrefix}${numStr}`);
      } else {
        candidateKeys.push(`G${numStr}`, `H${numStr}`);
      }

      // Check lexicons
      let lexMatch = null;
      for (const k of candidateKeys) {
        if (k.startsWith('H') && strongHebrew && strongHebrew[k]) {
          lexMatch = strongHebrew[k];
          break;
        } else if (k.startsWith('G') && strongGreek && strongGreek[k]) {
          lexMatch = strongGreek[k];
          break;
        }
      }

      if (lexMatch) {
        setStrongLexEntry(lexMatch);
      }

      // Scan chapterData for matching Strong's number words
      if (chapterData && chapterData.length > 0) {
        chapterData.forEach(vObj => {
          if (vObj.words) {
            vObj.words.forEach(w => {
              const wStrong = w.strong ? w.strong.toUpperCase() : '';
              const matchesStrong = candidateKeys.some(k => wStrong === k || wStrong.endsWith(numStr));
              if (matchesStrong) {
                matchedResults.push({
                  type: 'strong_occurrence',
                  bookId: vObj.book,
                  chapter: vObj.chapter,
                  verse: vObj.verse,
                  word: w.word_orig,
                  aytWord: w.ayt_word,
                  strongKey: w.strong,
                  title: `Ayat ${vObj.verse}: ${w.word_orig} (${w.strong})`,
                  desc: `AYT: "${w.ayt_word || '-'}" • "${vObj.ayt_text ? vObj.ayt_text.slice(0, 70) + '...' : ''}"`
                });
              }
            });
          }
        });
      }
    }

    // 2. Check verse reference (e.g. Yoh 3:16, Kej 1:1, Mat 2:5)
    const refMatch = qLower.match(/^([1-3]?\s*[a-z]+)\s*(\d+)(?::(\d+))?$/i);
    if (refMatch) {
      const bookQuery = refMatch[1].replace(/\s+/g, '').toLowerCase();
      const chapNum = parseInt(refMatch[2]);
      const verseNum = refMatch[3] ? parseInt(refMatch[3]) : 1;

      const foundBook = books.find(b => 
        b.name.toLowerCase().replace(/\s+/g, '').startsWith(bookQuery) ||
        b.abbr.toLowerCase().replace(/\s+/g, '').startsWith(bookQuery)
      );

      if (foundBook && chapNum <= foundBook.chaptersCount) {
        matchedResults.unshift({
          type: 'reference',
          bookId: foundBook.id,
          bookName: foundBook.name,
          chapter: chapNum,
          verse: verseNum,
          title: `Buka ${foundBook.name} Pasal ${chapNum}${refMatch[3] ? ` Ayat ${verseNum}` : ''}`,
          desc: `Navigasi langsung ke ${foundBook.name} ${chapNum}:${verseNum}`
        });
      }
    }

    // 3. Search book names
    books.forEach(b => {
      if (b.name.toLowerCase().includes(qLower) || b.abbr.toLowerCase().includes(qLower)) {
        matchedResults.push({
          type: 'book',
          bookId: b.id,
          bookName: b.name,
          chapter: 1,
          verse: 1,
          title: `Kitab ${b.name} (${b.abbr})`,
          desc: `${b.testament === 'OT' ? 'Perjanjian Lama (Ibrani)' : 'Perjanjian Baru (Yunani)'} • ${b.chaptersCount} Pasal`
        });
      }
    });

    setResults(matchedResults.slice(0, 20));
    setLoading(false);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          margin: 'auto'
        }}
        className="w-full max-w-2xl rounded-3xl border p-5 sm:p-6 relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)'
          }}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[var(--bg-card-hover)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Input Bar */}
        <div className="mb-5">
          <label className="text-xs font-black uppercase tracking-wider text-indigo-500 mb-2 block">
            Pencarian Cepat Alkitab Interlinear
          </label>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Ketik referensi (misal: Yoh 3:16, Kej 1:1) atau Strong's (misal: G976, H7225)..."
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border text-sm font-semibold outline-none focus:border-indigo-500 transition-colors placeholder:text-[var(--text-muted)] shadow-inner"
            />
          </div>
        </div>

        {/* Search Results & Strong's Lexicon Card */}
        <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
          
          {/* Strong Lexicon Preview Card */}
          {strongLexEntry && (
            <div 
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)'
              }}
              className="p-4 rounded-2xl border shadow-md space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <div className="flex items-center gap-2">
                  <Book className="w-4 h-4 text-sky-500" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-sky-500">
                    Definisi Kamus Strong's {strongLexEntry.id}
                  </h4>
                </div>
                {strongLexEntry.kind && (
                  <span className="text-[11px] font-bold bg-[var(--bg-primary)] px-2.5 py-0.5 rounded-lg border border-[var(--border-color)]">
                    {strongLexEntry.kind}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-amber-400">{strongLexEntry.word}</span>
                {strongLexEntry.pron && <span className="text-xs italic text-[var(--text-muted)]">"{strongLexEntry.pron}"</span>}
              </div>

              {strongLexEntry.av && (
                <p className="text-xs text-[var(--text-secondary)]">
                  <span className="font-bold text-amber-500">KJV:</span> {strongLexEntry.av}
                </p>
              )}

              {strongLexEntry.def_clean && (
                <p className="text-xs text-[var(--text-primary)] leading-relaxed bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)] max-h-24 overflow-y-auto font-sans">
                  {strongLexEntry.def_clean}
                </p>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10 text-[var(--text-muted)] gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <span>Mencari...</span>
            </div>
          ) : results.length > 0 ? (
            results.map((res, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (res.bookId) {
                    onNavigateVerse(res.bookId, res.chapter, res.verse);
                    onClose();
                  }
                }}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)'
                }}
                className="p-4 rounded-2xl border hover:border-indigo-500 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-98 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    res.type === 'strong_occurrence' 
                      ? 'bg-amber-500/15 text-[var(--accent-gold)] border border-amber-500/30'
                      : 'bg-indigo-500/15 text-indigo-500 border border-indigo-500/30'
                  }`}>
                    {res.type === 'strong_occurrence' ? <Hash className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[var(--text-primary)] group-hover:text-indigo-500 transition-colors">
                      {res.title}
                    </h4>
                    {res.desc && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">{res.desc}</p>
                    )}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors flex-shrink-0" />
              </div>
            ))
          ) : query.trim() ? (
            <div className="text-center py-10 text-[var(--text-muted)]">
              <p className="text-sm font-extrabold">Tidak ada hasil untuk "{query}"</p>
              <p className="text-xs mt-1">Coba ketik nama kitab (misal: Kejadian, Yohanes) atau Strong's (misal: G976, H7225)</p>
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--text-muted)] text-xs leading-relaxed">
              <p className="font-bold text-[var(--text-secondary)] mb-1">Petunjuk Pencarian:</p>
              <p>• Tulis referensi ayat: <code className="text-indigo-500 font-bold">Yoh 3:16</code>, <code className="text-indigo-500 font-bold">Kej 1:1</code></p>
              <p className="mt-1">• Tulis nomor Strong's: <code className="text-[var(--accent-gold)] font-bold">G976</code> (Yunani), <code className="text-[var(--accent-gold)] font-bold">H7225</code> (Ibrani)</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
