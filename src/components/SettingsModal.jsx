import React from 'react';
import { X, Sliders, Type, Eye } from 'lucide-react';

export default function SettingsModal({
  settings,
  setSettings,
  onClose
}) {
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
        className="w-full max-w-md rounded-3xl border p-6 relative animate-slide-up"
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

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-color)]">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 font-extrabold">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--text-primary)]">Pengaturan Tampilan</h2>
            <p className="text-xs text-[var(--text-muted)]">Sesuaikan ukuran teks dan elemen interlinear</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Font Size Selector */}
          <div>
            <label className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] mb-3">
              <Type className="w-4 h-4 text-indigo-500" />
              <span>Ukuran Teks Alkitab</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'small', label: 'Kecil' },
                { id: 'medium', label: 'Sedang' },
                { id: 'large', label: 'Besar' },
                { id: 'xlarge', label: 'Sangat Besar' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSettings({ ...settings, fontSize: opt.id })}
                  style={{
                    backgroundColor: settings.fontSize === opt.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: settings.fontSize === opt.id ? '#ffffff' : 'var(--text-primary)',
                    borderColor: 'var(--border-color)'
                  }}
                  className="py-2.5 px-1 rounded-xl text-xs font-black transition-all border shadow-sm hover:scale-105 active:scale-95"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Switches */}
          <div>
            <label className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] mb-3">
              <Eye className="w-4 h-4 text-sky-500" />
              <span>Elemen Tampilan Interlinear</span>
            </label>
            <div 
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)'
              }}
              className="space-y-3 p-4 rounded-2xl border"
            >
              
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-[var(--text-primary)] block">Nomor Strong's</span>
                  <span className="text-xs text-[var(--text-muted)]">Tampilkan nomor kamus di bawah kata</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showStrongs}
                  onChange={(e) => setSettings({ ...settings, showStrongs: e.target.checked })}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[var(--border-color)]">
                <div>
                  <span className="text-sm font-bold text-[var(--text-primary)] block">Transliterasi</span>
                  <span className="text-xs text-[var(--text-muted)]">Cara baca huruf Ibrani / Yunani</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showTranslit}
                  onChange={(e) => setSettings({ ...settings, showTranslit: e.target.checked })}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[var(--border-color)]">
                <div>
                  <span className="text-sm font-bold text-[var(--text-primary)] block">Kode Morfologi</span>
                  <span className="text-xs text-[var(--text-muted)]">Kode tata bahasa pada kartu kata</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showMorph}
                  onChange={(e) => setSettings({ ...settings, showMorph: e.target.checked })}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </label>

            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--border-color)] text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm transition-all shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
}
