import React from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

export default function InterlinearView({
  chapterData,
  testament,
  displayMode,
  settings,
  onSelectWord,
  onPrevChapter,
  onNextChapter,
  currentBookName,
  currentChapter
}) {
  if (!chapterData || chapterData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[var(--text-muted)]">
        <BookOpen className="w-12 h-12 mb-3 text-indigo-500 animate-pulse" />
        <p className="text-base font-semibold">Memuat teks interlinear...</p>
      </div>
    );
  }

  const isHebrew = testament === 'OT';
  const langClass = isHebrew ? 'font-hebrew' : 'font-greek';

  // Helper to remove slashes from Hebrew words
  const cleanWord = (text) => text ? text.replace(/\//g, '') : '';

  // Dynamic font sizing
  const fontSizes = {
    small: { orig: 'text-lg', translit: 'text-xs', ayt: 'text-xs' },
    medium: { orig: 'text-xl', translit: 'text-xs', ayt: 'text-sm' },
    large: { orig: 'text-2xl', translit: 'text-sm', ayt: 'text-base' },
    xlarge: { orig: 'text-3xl', translit: 'text-base', ayt: 'text-lg' }
  };
  const fontConfig = fontSizes[settings.fontSize] || fontSizes.medium;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Top Chapter Navigation Banner */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border-color)]">
        <button
          onClick={onPrevChapter}
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-card)'
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all border hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline">Pasal Sebelumnya</span>
          <span className="sm:hidden">Sebelumnya</span>
        </button>

        <div className="text-center px-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className={`px-3.5 py-1 rounded-full text-[11px] font-black tracking-wide ${
              isHebrew 
                ? 'bg-amber-500/15 text-[var(--accent-gold)] border border-amber-500/30' 
                : 'bg-sky-500/15 text-[var(--accent-cyan)] border border-sky-500/30'
            }`}>
              {isHebrew ? 'Perjanjian Lama • Ibrani (BHS)' : 'Perjanjian Baru • Yunani (WH)'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)]">
            {currentBookName} {currentChapter}
          </h2>
        </div>

        <button
          onClick={onNextChapter}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95"
        >
          <span className="hidden sm:inline">Pasal Berikutnya</span>
          <span className="sm:hidden">Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Verses List */}
      <div className="space-y-8">
        {chapterData.map((verse) => (
          <div 
            key={verse.verse} 
            id={`verse-${verse.verse}`}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-card)'
            }}
            className="rounded-3xl p-5 sm:p-7 border transition-all group"
          >
            {/* Pericope Title */}
            {verse.title && (
              <div className="pericope-title mb-4">
                <span>{verse.title}</span>
              </div>
            )}

            {/* Header: Verse Number & Full AYT Text (ONLY in Paralel mode) */}
            <div className="flex items-start gap-3.5 mb-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-500 font-black text-base flex items-center justify-center shadow-inner">
                {verse.verse}
              </span>
              
              {displayMode === 'bilinear' && (
                <div className="flex-1 pt-1">
                  <p className="text-base sm:text-lg font-semibold text-[var(--text-primary)] leading-relaxed">
                    {verse.ayt_text}
                  </p>
                </div>
              )}
            </div>

            {/* INTERLINEAR DISPLAY MODES */}

            {/* MODE 1: Klasik (Classic Interlinear - Hebrew RTL / Greek LTR) */}
            {displayMode === 'classic' && (
              <div 
                dir={isHebrew ? 'rtl' : 'ltr'}
                className="flex flex-wrap gap-2.5 pt-2"
              >
                {verse.words.map((w, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectWord(w, isHebrew)}
                    className="interlinear-word-card group/word relative"
                    title="Klik/tap untuk detail morfologi & kamus"
                  >
                    {/* Original Word */}
                    <span 
                      dir={isHebrew ? 'rtl' : 'ltr'}
                      lang={isHebrew ? 'he' : 'el'}
                      className={`${langClass} ${fontConfig.orig} tracking-wide transition-transform group-hover/word:scale-105`}
                    >
                      {cleanWord(w.word_orig)}
                    </span>

                    {/* Transliteration */}
                    {settings.showTranslit && w.translit && (
                      <span dir="ltr" className={`text-[var(--text-muted)] italic ${fontConfig.translit}`}>
                        {w.translit}
                      </span>
                    )}

                    {/* Strong's Badge */}
                    {settings.showStrongs && w.strong && (
                      <span dir="ltr" className="strong-badge">
                        {w.strong}
                      </span>
                    )}

                    {/* Morphology Badge */}
                    {settings.showMorph && w.morph && (
                      <span dir="ltr" className="morph-badge" title={w.morph_id}>
                        {w.morph}
                      </span>
                    )}

                    {/* AYT Indonesian Word */}
                    <span dir="ltr" className={`ayt-word-text mt-1 ${fontConfig.ayt}`}>
                      {w.ayt_word || '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* MODE 2: Terbalik (Reverse Interlinear - LTR Indonesian Order) */}
            {displayMode === 'reverse' && (
              <div 
                dir="ltr"
                className="flex flex-wrap gap-2.5 pt-2"
              >
                {verse.words.map((w, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectWord(w, isHebrew)}
                    className="interlinear-word-card group/word relative"
                    title="Klik/tap untuk detail morfologi & kamus"
                  >
                    {/* AYT Indonesian Word Top */}
                    <span dir="ltr" className={`ayt-word-text text-indigo-500 font-black ${fontConfig.ayt}`}>
                      {w.ayt_word || '—'}
                    </span>

                    {/* Strong's Badge */}
                    {settings.showStrongs && w.strong && (
                      <span dir="ltr" className="strong-badge">
                        {w.strong}
                      </span>
                    )}

                    {/* Original Hebrew/Greek Word Bottom */}
                    <span 
                      dir={isHebrew ? 'rtl' : 'ltr'}
                      lang={isHebrew ? 'he' : 'el'}
                      className={`${langClass} ${fontConfig.orig} tracking-wide mt-1`}
                    >
                      {cleanWord(w.word_orig)}
                    </span>

                    {/* Transliteration */}
                    {settings.showTranslit && w.translit && (
                      <span dir="ltr" className={`text-[var(--text-muted)] italic ${fontConfig.translit}`}>
                        {w.translit}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* MODE 3: Pararel (Bilinear / Parallel View) */}
            {displayMode === 'bilinear' && (
              <div className="pt-3 border-t border-[var(--border-color)]">
                <div 
                  dir={isHebrew ? 'rtl' : 'ltr'}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)'
                  }}
                  className="p-4 sm:p-5 rounded-2xl border leading-loose"
                >
                  {verse.words.map((w, idx) => (
                    <React.Fragment key={idx}>
                      <span
                        onClick={() => onSelectWord(w, isHebrew)}
                        lang={isHebrew ? 'he' : 'el'}
                        className={`${langClass} text-2xl sm:text-3xl inline-block cursor-pointer hover:text-[var(--accent-gold)] hover:underline transition-colors px-1.5 py-0.5 rounded-lg hover:bg-[var(--bg-card-hover)] mx-1.5 my-1`}
                        title={`Klik untuk detail: ${cleanWord(w.word_orig)} (${w.strong})`}
                      >
                        {cleanWord(w.word_orig)}
                      </span>
                      {"\u00A0\u00A0"}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Chapter Footer Navigation */}
      <div className="flex items-center justify-between mt-12 pt-6 border-t border-[var(--border-color)]">
        <button
          onClick={onPrevChapter}
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-card)'
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-sm transition-all border hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 text-indigo-500" />
          <span>Pasal Sebelumnya</span>
        </button>

        <button
          onClick={onNextChapter}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95"
        >
          <span>Pasal Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
