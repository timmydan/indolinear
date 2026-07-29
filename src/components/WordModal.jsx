import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Book, Copy, Check, Search, Layers, Tag, Hash } from 'lucide-react';

export default function WordModal({
  wordObj,
  isHebrew,
  strongLexicon,
  onClose,
  onSearchStrong
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!wordObj) return null;

  const cleanOriginal = wordObj.word_orig ? wordObj.word_orig.replace(/\//g, '') : '';
  const langClass = isHebrew ? 'font-hebrew' : 'font-greek';
  const strongKey = wordObj.strong || '';
  const lexData = strongLexicon ? strongLexicon[strongKey] : null;

  const fallbackCopy = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Copy fallback failed:', err);
    }
  };

  const handleCopy = () => {
    const textToCopy = `Kata: ${cleanOriginal} (${strongKey})\nMorfologi: ${wordObj.morph_id || wordObj.morph}\nTerjemahan AYT: ${wordObj.ayt_word || '-'}\nDefinisi Kamus: ${lexData ? lexData.def_clean : '-'}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          fallbackCopy(textToCopy);
        });
    } else {
      fallbackCopy(textToCopy);
    }
  };

  const modalContent = (
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
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
          position: 'relative',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div 
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)'
          }}
          className="px-6 py-4 flex items-center justify-between"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-500 text-xs font-black">
            <Tag className="w-3.5 h-3.5" />
            <span>{isHebrew ? 'Bahasa Ibrani (BHS)' : 'Bahasa Yunani (WH)'}</span>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-color)'
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Main Original Word Display */}
          <div className="text-center pb-4 border-b border-[var(--border-color)]" dir={isHebrew ? 'rtl' : 'ltr'}>
            <h2 className={`${langClass} text-5xl font-black mb-2 tracking-wide`}>
              {cleanOriginal}
            </h2>

            {wordObj.translit && (
              <p className="text-[var(--text-muted)] text-sm italic font-semibold" dir="ltr">
                Transliterasi: {wordObj.translit}
              </p>
            )}

            {strongKey && (
              <div className="flex items-center justify-center gap-2 mt-3" dir="ltr">
                <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 text-[var(--accent-gold)] text-xs font-black border border-amber-500/30 shadow-sm flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  <span>Nomor Strong: {strongKey}</span>
                </span>
              </div>
            )}
          </div>

          {/* AYT Translation Card */}
          <div 
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)'
            }}
            className="p-4 rounded-2xl border shadow-sm"
          >
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-500 mb-1">
              Terjemahan AYT (Indonesia)
            </h3>
            <p className="text-2xl font-black text-[var(--text-primary)]">
              {wordObj.ayt_word || '—'}
            </p>
            {wordObj.gloss_en && (
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                Padanan Inggris: <span className="text-[var(--text-secondary)] italic font-semibold">{wordObj.gloss_en}</span>
              </p>
            )}
          </div>

          {/* Indonesian Morphology Analysis */}
          <div 
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)'
            }}
            className="p-4 rounded-2xl border shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
                Analisis Morfologi & Tata Bahasa (Indonesia)
              </h3>
            </div>
            
            <p 
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              className="text-base font-bold p-3.5 rounded-xl border leading-relaxed shadow-inner"
            >
              {wordObj.morph_id || wordObj.morph || 'Morfologi standar'}
            </p>
            
            {wordObj.morph && (
              <p className="text-xs text-[var(--text-muted)] mt-2 font-mono">
                Kode Morfologi Raw: <span className="text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2.5 py-1 rounded-lg border border-[var(--border-color)] font-semibold">{wordObj.morph}</span>
              </p>
            )}
          </div>

          {/* Strong Lexicon Entry */}
          {lexData && (
            <div 
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)'
              }}
              className="p-4 rounded-2xl border shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <div className="flex items-center gap-2">
                  <Book className="w-4 h-4 text-sky-500" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-500">
                    Kamus Strong's & Definisi Lengkap
                  </h3>
                </div>
                {lexData.kind && (
                  <span className="text-[11px] font-bold bg-[var(--bg-primary)] text-[var(--text-secondary)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]">
                    {lexData.kind}
                  </span>
                )}
              </div>

              {lexData.word && (
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span>Kata Dasar / Lemma:</span>
                  <span className="font-bold text-[var(--text-primary)] text-sm">{lexData.word}</span>
                </div>
              )}

              {lexData.pron && (
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span>Pengucapan:</span>
                  <span className="italic text-[var(--text-primary)] font-semibold">{lexData.pron}</span>
                </div>
              )}

              {lexData.av && (
                <div className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-color)]">
                  <span className="font-bold text-[var(--accent-gold)] block mb-1">Penerjemahan KJV / AV:</span>
                  <p className="text-[var(--text-primary)] leading-relaxed font-medium">{lexData.av}</p>
                </div>
              )}

              {lexData.def_clean && (
                <div className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-color)]">
                  <span className="font-bold text-sky-500 block mb-1">Definisi Lengkap:</span>
                  <pre 
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-color)'
                    }}
                    className="whitespace-pre-wrap font-sans text-xs leading-relaxed p-3.5 rounded-xl border max-h-36 overflow-y-auto shadow-inner"
                  >
                    {lexData.def_clean}
                  </pre>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div 
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-color)'
          }}
          className="p-4 flex flex-wrap items-center justify-between gap-3"
        >
          {strongKey && (
            <button
              onClick={() => {
                onClose();
                onSearchStrong(strongKey);
              }}
              className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Cari Kemunculan ({strongKey})</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)'
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl hover:bg-[var(--bg-card-hover)] font-extrabold text-xs transition-all border shadow-md hover:scale-[1.02] active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin!' : 'Salin Detail'}</span>
          </button>
        </div>

      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
