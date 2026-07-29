import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import InterlinearView from './components/InterlinearView';
import WordModal from './components/WordModal';
import SettingsModal from './components/SettingsModal';
import SearchModal from './components/SearchModal';

export default function App() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(1); // Default Genesis (1)
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [chapterData, setChapterData] = useState([]);
  
  const [strongHebrew, setStrongHebrew] = useState(null);
  const [strongGreek, setStrongGreek] = useState(null);

  const [displayMode, setDisplayMode] = useState('classic'); // 'classic' | 'reverse' | 'bilinear'
  const [theme, setTheme] = useState(() => localStorage.getItem('ayt_theme') || 'dark');
  
  const [settings, setSettings] = useState({
    fontSize: 'medium',
    showStrongs: true,
    showTranslit: true,
    showMorph: true,
  });

  const [selectedWordObj, setSelectedWordObj] = useState(null);
  const [selectedWordIsHebrew, setSelectedWordIsHebrew] = useState(true);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');

  // Sync theme attribute to HTML document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ayt_theme', theme);
  }, [theme]);

  // Load books metadata with relative path for GitHub Pages compatibility
  useEffect(() => {
    fetch('./data/books.json')
      .then(res => res.json())
      .then(data => setBooks(data))
      .catch(err => console.error('Error loading books.json:', err));
  }, []);

  // Load Strong Lexicons in background
  useEffect(() => {
    fetch('./data/strong_hebrew.json')
      .then(res => res.json())
      .then(data => setStrongHebrew(data))
      .catch(err => console.error('Error loading strong_hebrew.json:', err));

    fetch('./data/strong_greek.json')
      .then(res => res.json())
      .then(data => setStrongGreek(data))
      .catch(err => console.error('Error loading strong_greek.json:', err));
  }, []);

  // Load chapter data whenever selectedBook or selectedChapter changes
  useEffect(() => {
    if (!selectedBook || !selectedChapter) return;
    setChapterData([]);
    
    fetch(`./data/chapters/${selectedBook}_${selectedChapter}.json`)
      .then(res => res.json())
      .then(data => {
        setChapterData(data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(err => {
        console.error(`Error loading chapter ${selectedBook}_${selectedChapter}:`, err);
        setChapterData([]);
      });
  }, [selectedBook, selectedChapter]);

  const currentBookObj = books.find(b => b.id === selectedBook) || { name: 'Kejadian', testament: 'OT', chaptersCount: 50 };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else if (selectedBook > 1) {
      const prevBookObj = books.find(b => b.id === selectedBook - 1);
      if (prevBookObj) {
        setSelectedBook(selectedBook - 1);
        setSelectedChapter(prevBookObj.chaptersCount);
      }
    }
  };

  const handleNextChapter = () => {
    if (selectedChapter < currentBookObj.chaptersCount) {
      setSelectedChapter(selectedChapter + 1);
    } else if (selectedBook < 66) {
      setSelectedBook(selectedBook + 1);
      setSelectedChapter(1);
    }
  };

  const handleNavigateVerse = (bookId, chapter, verse) => {
    setSelectedBook(bookId);
    setSelectedChapter(chapter);
    setTimeout(() => {
      const elem = document.getElementById(`verse-${verse}`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  const handleSearchStrong = (strongCode) => {
    setSelectedWordObj(null);
    setSearchInitialQuery(strongCode);
    setIsSearchOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Navigation Header */}
      <Navbar
        books={books}
        selectedBook={selectedBook}
        setSelectedBook={setSelectedBook}
        selectedChapter={selectedChapter}
        setSelectedChapter={setSelectedChapter}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        theme={theme}
        setTheme={setTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => {
          setSearchInitialQuery('');
          setIsSearchOpen(true);
        }}
      />

      {/* Main Interlinear View Content */}
      <main className="flex-1">
        <InterlinearView
          chapterData={chapterData}
          testament={currentBookObj.testament}
          displayMode={displayMode}
          settings={settings}
          onSelectWord={(word, isHeb) => {
            setSelectedWordObj(word);
            setSelectedWordIsHebrew(isHeb);
          }}
          onPrevChapter={handlePrevChapter}
          onNextChapter={handleNextChapter}
          currentBookName={currentBookObj.name}
          currentChapter={selectedChapter}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500 mt-12 bg-slate-950/40">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="font-semibold text-slate-400">
            Alkitab Interlinear AYT (Alkitab Yang Terbuka) • Yayasan Lembaga SABDA (YLSA)
          </p>
          <p>
            Teks Ibrani Biblia Hebraica Stuttgartensia (BHS) & Teks Yunani Westcott-Hort (WH) dengan Penanda Vokal, Aksen, Nomor Strong, dan Morfologi Bahasa Indonesia.
          </p>
        </div>
      </footer>

      {/* Word Morphology & Strong's Lexicon Modal */}
      {selectedWordObj && (
        <WordModal
          wordObj={selectedWordObj}
          isHebrew={selectedWordIsHebrew}
          strongLexicon={selectedWordIsHebrew ? strongHebrew : strongGreek}
          onClose={() => setSelectedWordObj(null)}
          onSearchStrong={handleSearchStrong}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          setSettings={setSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <SearchModal
          books={books}
          chapterData={chapterData}
          strongHebrew={strongHebrew}
          strongGreek={strongGreek}
          onNavigateVerse={handleNavigateVerse}
          onClose={() => setIsSearchOpen(false)}
          initialQuery={searchInitialQuery}
        />
      )}
    </div>
  );
}
