import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import * as cheerio from "cheerio";

import hebStrongs from './strongs-hebrew-dictionary.cjs';
import grkStrongs from './strongs-greek-dictionary.cjs';

const strongs = { ...(hebStrongs as any), ...(grkStrongs as any) };

const app = express();
app.use(express.json());
const PORT = 3000;

import Database from "better-sqlite3";

const db = new Database("bible.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS bible_texts (
    book_id INTEGER,
    chapter INTEGER,
    verse INTEGER,
    text TEXT,
    version TEXT,
    PRIMARY KEY (book_id, chapter, verse, version)
  );

  CREATE TABLE IF NOT EXISTS original_words (
    book_id INTEGER,
    chapter INTEGER,
    verse INTEGER,
    word_index INTEGER,
    text TEXT,
    lemma TEXT,
    strongs TEXT,
    morphology TEXT,
    transliteration TEXT,
    translation TEXT,
    PRIMARY KEY (book_id, chapter, verse, word_index)
  );

  CREATE TABLE IF NOT EXISTS strongs_cache (
    strong_id TEXT,
    type TEXT,
    data TEXT,
    PRIMARY KEY (strong_id, type)
  );
`);

const BOOKS = [
  "Kejadian", "Keluaran", "Imamat", "Bilangan", "Ulangan", "Yosua", "Hakim-hakim", "Rut", "1 Samuel", "2 Samuel",
  "1 Raja-raja", "2 Raja-raja", "1 Tawarikh", "2 Tawarikh", "Ezra", "Nehemia", "Ester", "Ayub", "Mazmur", "Amsal",
  "Pengkhotbah", "Kidung Agung", "Yesaya", "Yeremia", "Ratapan", "Yehezkiel", "Daniel", "Hosea", "Yoel", "Amos",
  "Obaja", "Yunus", "Mikha", "Nahum", "Habakuk", "Zefanya", "Hagai", "Zakharia", "Maleakhi",
  "Matius", "Markus", "Lukas", "Yohanes", "Kisah Para Rasul", "Roma", "1 Korintus", "2 Korintus", "Galatia", "Efesus", "Filipi",
  "Kolose", "1 Tesalonika", "2 Tesalonika", "1 Timotius", "2 Timotius", "Titus", "Filemon", "Ibrani", "Yakobus", "1 Petrus",
  "2 Petrus", "1 Yohanes", "2 Yohanes", "3 Yohanes", "Yudas", "Wahyu"
];

const WLC_BOOKS = [
  "Gen", "Exod", "Lev", "Num", "Deut", "Josh", "Judg", "Ruth", "1Sam", "2Sam",
  "1Kgs", "2Kgs", "1Chr", "2Chr", "Ezra", "Neh", "Esth", "Job", "Ps", "Prov",
  "Eccl", "Song", "Isa", "Jer", "Lam", "Ezek", "Dan", "Hos", "Joel", "Amos",
  "Obad", "Jonah", "Mic", "Nah", "Hab", "Zeph", "Hag", "Zech", "Mal"
];

const SBLGNT_BOOKS = [
  'Mat', 'Mrk', 'Luk', 'Jhn', 'Act', 'Rom', '1Co', '2Co', 'Gal', 'Eph', 'Php', 'Col',
  '1Th', '2Th', '1Ti', '2Ti', 'Tit', 'Phm', 'Heb', 'Jas', '1Pe', '2Pe', '1Jn', '2Jn',
  '3Jn', 'Jud', 'Rev'
];

async function ensureWlcBook(bookId: number) {
  if (bookId > 39) return;
  const bookName = WLC_BOOKS[bookId - 1];
  const count = db.prepare("SELECT COUNT(*) as count FROM original_words WHERE book_id = ?").get(bookId) as any;
  
  if (count.count === 0) {
    console.log(`Fetching morphhb for ${bookName}...`);
    const url = `https://raw.githubusercontent.com/openscriptures/morphhb/master/wlc/${bookName}.xml`;
    const { data } = await axios.get(url);
    
    const $ = cheerio.load(data, { xmlMode: true });
    
    const insert = db.prepare("INSERT OR REPLACE INTO original_words (book_id, chapter, verse, word_index, text, lemma, strongs, morphology, transliteration, translation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    const rows: any[] = [];
    
    $('chapter').each((_, chapterElem) => {
      const chapterId = $(chapterElem).attr('osisID');
      if (!chapterId) return;
      const chapterNum = parseInt(chapterId.split('.')[1]);
      
      $(chapterElem).find('verse').each((_, verseElem) => {
        const verseId = $(verseElem).attr('osisID');
        if (!verseId) return;
        const verseNum = parseInt(verseId.split('.')[2]);
        
        let wordIndex = 0;
        $(verseElem).children().each((_, child) => {
          if (child.type === 'tag' && child.tagName === 'w') {
            const w = $(child);
            let text = w.text().trim();
            
            const next = child.next;
            if (next && next.type === 'tag' && next.tagName === 'seg' && $(next).attr('type') === 'x-maqqef') {
              text += $(next).text().trim();
            }
            
            const lemma = w.attr('lemma') || '';
            const morph = w.attr('morph') || '';
            
            const strongsMatches = lemma.match(/\d+/g);
            const strongs = strongsMatches ? strongsMatches.join(',') : '';
            
            rows.push({
              book_id: bookId,
              chapter: chapterNum,
              verse: verseNum,
              word_index: wordIndex++,
              text,
              lemma,
              strongs,
              morphology: morph,
              transliteration: '',
              translation: ''
            });
          }
        });
      });
    });
    
    const transaction = db.transaction((rows) => {
      for (const row of rows) insert.run(row.book_id, row.chapter, row.verse, row.word_index, row.text, row.lemma, row.strongs, row.morphology, row.transliteration, row.translation);
    });
    transaction(rows);
  }
}

let tagntMatJhnFetched = false;
let tagntActRevFetched = false;

async function ensureSblgntBook(bookId: number) {
  if (bookId < 40) return;
  
  const count = db.prepare("SELECT COUNT(*) as count FROM original_words WHERE book_id = ?").get(bookId) as any;
  if (count.count > 0) return;

  const isMatJhn = bookId >= 40 && bookId <= 43;
  
  if (isMatJhn && tagntMatJhnFetched) return;
  if (!isMatJhn && tagntActRevFetched) return;

  const url = isMatJhn 
    ? 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt'
    : 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Act-Rev%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt';

  console.log(`Fetching TAGNT data...`);
  const { data } = await axios.get(url);
  
  const lines = data.split('\n');
  const insert = db.prepare("INSERT OR REPLACE INTO original_words (book_id, chapter, verse, word_index, text, lemma, strongs, morphology, transliteration, translation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  
  const rows: any[] = [];
  
  for (const line of lines) {
    if (!line || line.startsWith('#') || line.startsWith('=')) continue;
    
    const parts = line.split('\t');
    if (parts.length < 5) continue;
    
    const idPart = parts[0];
    const match = idPart.match(/^([A-Za-z0-9]+)\.(\d+)\.(\d+)#(\d+)/);
    if (!match) continue;
    
    const bookName = match[1];
    const chapter = parseInt(match[2]);
    const verse = parseInt(match[3]);
    const wordIndex = parseInt(match[4]);
    
    const currentBookId = SBLGNT_BOOKS.indexOf(bookName) + 40;
    if (currentBookId < 40) continue;

    const textPart = parts[1];
    const textMatch = textPart.match(/^([^\(]+)(?:\((.+)\))?/);
    const text = textMatch ? textMatch[1].trim() : textPart.trim();
    const transliteration = textMatch && textMatch[2] ? textMatch[2].trim() : '';
    
    const translation = parts[2].trim();
    
    const grammarPart = parts[3];
    const [strongsFull, morphology] = grammarPart.split('=');
    const strongsMatches = strongsFull ? strongsFull.match(/\d+/g) : null;
    const strongs = strongsMatches ? strongsMatches.join(',') : '';
    
    const lemmaPart = parts[4];
    const lemma = lemmaPart.split('=')[0].trim();
    
    rows.push({
      book_id: currentBookId,
      chapter,
      verse,
      word_index: wordIndex,
      text,
      lemma,
      strongs,
      morphology: morphology || '',
      transliteration,
      translation
    });
  }
  
  const transaction = db.transaction((rows) => {
    for (const row of rows) insert.run(row.book_id, row.chapter, row.verse, row.word_index, row.text, row.lemma, row.strongs, row.morphology, row.transliteration, row.translation);
  });
  transaction(rows);

  if (isMatJhn) tagntMatJhnFetched = true;
  else tagntActRevFetched = true;
}

async function ensureLxx() {
  const count = db.prepare("SELECT COUNT(*) as count FROM bible_texts WHERE version = 'LXX'").get() as any;
  if (count.count > 0) return;

  console.log("Fetching LXX data...");
  const [versificationRes, wordsRes] = await Promise.all([
    axios.get('https://raw.githubusercontent.com/eliranwong/LXX-Swete-1930/master/00-Swete_versification.csv'),
    axios.get('https://raw.githubusercontent.com/eliranwong/LXX-Swete-1930/master/01-Swete_word_with_punctuations.csv')
  ]);

  const versification = versificationRes.data.split('\n').filter(Boolean).map((line: string) => {
    const [index, ref] = line.split('\t');
    const match = ref.match(/^([A-Za-z0-9]+)\.(\d+):(\d+)/);
    return { index: parseInt(index), book: match?.[1], chapter: parseInt(match?.[2] || "0"), verse: parseInt(match?.[3] || "0") };
  });

  const words = wordsRes.data.split('\n').filter(Boolean).map((line: string) => {
    const [index, word] = line.split('\t');
    return { index: parseInt(index), word: word.trim() };
  });

  const insert = db.prepare("INSERT OR REPLACE INTO bible_texts (book_id, chapter, verse, text, version) VALUES (?, ?, ?, ?, 'LXX')");
  
  const transaction = db.transaction(() => {
    let currentRefIdx = 0;
    let currentVerseWords: string[] = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Check if we reached the next verse
      if (currentRefIdx + 1 < versification.length && word.index >= versification[currentRefIdx + 1].index) {
        // Save current verse
        const ref = versification[currentRefIdx];
        const bookId = WLC_BOOKS.findIndex(b => b.startsWith(ref.book || "")) + 1;
        if (bookId > 0) {
          insert.run(bookId, ref.chapter, ref.verse, currentVerseWords.join(' '));
        }
        
        currentRefIdx++;
        currentVerseWords = [];
      }
      
      currentVerseWords.push(word.word);
    }
    
    // Save last verse
    const ref = versification[currentRefIdx];
    const bookId = WLC_BOOKS.findIndex(b => b.startsWith(ref.book || "")) + 1;
    if (bookId > 0) {
      insert.run(bookId, ref.chapter, ref.verse, currentVerseWords.join(' '));
    }
  });

  transaction();
}

const HEBREW_MAP: Record<string, string> = {
  'a': 'א', 'b': 'ב', 'g': 'ג', 'd': 'ד', 'h': 'ה', 'w': 'ו', 'z': 'ז', 'x': 'ח', 'v': 'ט', 'y': 'י',
  'k': 'כ', 'K': 'ך', 'l': 'ל', 'm': 'מ', 'M': 'ם', 'n': 'נ', 'N': 'ן', '[': 'ע', '(': 'ע',
  'p': 'פ', 'P': 'ף', 'c': 'צ', 'C': 'ץ', 'q': 'ק', 'r': 'ר', '$': 'ש', '#': 'ש', 't': 'ת', 's': 'ש',
  'S': 'ס', 'f': 'פ', 'F': 'ף', 'j': 'ח', 'u': 'ו', 'i': 'י', 'o': 'ו', 'e': 'ע', '+': 'ט', ')': 'א',
  'U': 'ץ'
};

const GREEK_MAP: Record<string, string> = {
  'a': 'α', 'b': 'β', 'g': 'γ', 'd': 'δ', 'e': 'ε', 'z': 'ζ', 'h': 'η', 'q': 'θ', 'i': 'ι', 'k': 'κ',
  'l': 'λ', 'm': 'μ', 'n': 'ν', 'x': 'ξ', 'o': 'ο', 'p': 'π', 'r': 'ρ', 's': 'σ', 'v': 'ς', 't': 'τ',
  'u': 'υ', 'f': 'φ', 'c': 'χ', 'y': 'ψ', 'w': 'ω',
  'A': 'Α', 'B': 'Β', 'G': 'Γ', 'D': 'Δ', 'E': 'Ε', 'Z': 'Ζ', 'H': 'Η', 'Q': 'Θ', 'I': 'Ι', 'K': 'Κ',
  'L': 'Λ', 'M': 'Μ', 'N': 'Ν', 'X': 'Ξ', 'O': 'Ο', 'P': 'Π', 'R': 'Ρ', 'S': 'Σ', 'T': 'Τ', 'U': 'Υ',
  'F': 'Φ', 'C': 'Χ', 'Y': 'Ψ', 'W': 'Ω'
};

const HEBREW_TRANSLIT_MAP: Record<string, string> = {
  'א': '', 'ב': 'v', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y',
  'כ': 'kh', 'ך': 'kh', 'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': '',
  'פ': 'f', 'ף': 'f', 'צ': 'tz', 'ץ': 'tz', 'ק': 'q', 'ר': 'r', 'ש': 'sh', 'ת': 't',
  '\u05B0': 'e', '\u05B1': 'e', '\u05B2': 'a', '\u05B3': 'o', '\u05B4': 'i', '\u05B5': 'e',
  '\u05B6': 'e', '\u05B7': 'a', '\u05B8': 'a', '\u05B9': 'o', '\u05BB': 'u', '\u05C1': 'sh', '\u05C2': 's',
  '\u05BC': '', '\u05BE': '-'
};

function transliterateHebrew(unicode: string): string {
  let res = "";
  for (let i = 0; i < unicode.length; i++) {
    const char = unicode[i];
    const next = i + 1 < unicode.length ? unicode[i + 1] : "";

    // Handle special cases with Dagesh (U+05BC)
    if (next === '\u05BC') {
      if (char === 'ב') { res += 'b'; i++; continue; }
      if (char === 'כ' || char === 'ך') { res += 'k'; i++; continue; }
      if (char === 'פ' || char === 'ף') { res += 'p'; i++; continue; }
      if (char === 'ו') { res += 'u'; i++; continue; } // Shuruq
    }

    // Handle Vav Holam
    if (char === 'ו' && next === '\u05B9') {
      res += 'o';
      i++;
      continue;
    }

    // Handle Shin/Sin
    if (char === 'ש') {
      if (next === '\u05C2') { res += 's'; i++; continue; }
      if (next === '\u05C1') { res += 'sh'; i++; continue; }
    }

    const mapped = HEBREW_TRANSLIT_MAP[char];
    if (mapped !== undefined) {
      res += mapped;
    } else if (char >= '\u0591' && char <= '\u05C7') {
      // Ignore other accents
    } else {
      res += char;
    }
  }
  return res;
}

const GREEK_TRANSLIT_MAP: Record<string, string> = {
  'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'e', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'ph', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o'
};

function transliterateGreek(unicode: string): string {
  const normalized = unicode.toLowerCase().normalize('NFD');
  let res = "";
  let hasRoughBreathing = false;
  
  for (const char of normalized) {
    if (char === '\u0314') {
      hasRoughBreathing = true;
    } else if (GREEK_TRANSLIT_MAP[char]) {
      res += GREEK_TRANSLIT_MAP[char];
    } else if (char >= '\u0300' && char <= '\u036F') {
      // Skip other diacritics
    } else {
      res += char;
    }
  }
  
  if (hasRoughBreathing) {
    res = 'h' + res;
  }
  
  return res.replace(/[^a-z\s']/g, '');
}

function toUnicode(text: string, type: 'heb' | 'grk'): string {
  if (!text) return "";
  if (type === 'grk' && /[\u0370-\u03FF\u1F00-\u1FFF]/.test(text)) return text;
  if (type === 'heb' && /[\u0590-\u05FF]/.test(text)) return text;
  const map = type === 'heb' ? HEBREW_MAP : GREEK_MAP;
  // Sabda Hebrew ASCII is often reversed
  const processedText = type === 'heb' ? text.split('').reverse().join('') : text;
  return processedText.split('').map(char => map[char] || char).join('');
}

const HEBREW_LETTER_NAMES = [
  'aleph', 'beth', 'gimel', 'daleth', 'he', 'waw', 'zayin', 'cheth', 'teth', 'yod',
  'kaph', 'lamed', 'mem', 'nun', 'samekh', 'ayin', 'pe', 'tsadhe', 'qoph', 'resh', 'shin', 'taw',
  'alef', 'bet', 'vav', 'het', 'tet', 'kaf', 'tsadi', 'kof', 'tav'
];

function isLikelyTransliteration(t: string): boolean {
  if (!t) return false;
  const low = t.toLowerCase().replace(/[^a-z]/g, '');
  if (HEBREW_LETTER_NAMES.includes(low)) return true;
  if (['et', 'veet', 'ha', 'be', 'le', 'va', 've'].includes(low)) return true;
  if (t.includes('·')) return true;
  return false;
}

function cleanText(t: string): string {
  if (!t) return "";
  // Remove Strong's numbers like <430> or [430] or <ta<853>
  let cleaned = t.replace(/<[^>]+>/g, '').replace(/\[[^\]]+\]/g, '').replace(/<[a-z]+/g, '').trim();
  
  if (isLikelyTransliteration(cleaned)) return "";

  // Remove Hebrew letter names that sometimes leak into translation
  const words = cleaned.split(/\s+/);
  cleaned = words.filter(w => !HEBREW_LETTER_NAMES.includes(w.toLowerCase())).join(' ');

  // If it's just a number, it's likely a Strong's number that escaped
  if (/^\d+$/.test(cleaned)) return "";
  return cleaned;
}

async function fetchHebrewChapter(bookId: number, chapter: string) {
  await ensureWlcBook(bookId);

  const fetchUnits = async (dir: 'reverse' | 'classic') => {
    const cacheKey = `sabda_${dir}_v6`;
    const cached = db.prepare("SELECT text FROM bible_texts WHERE book_id = ? AND chapter = ? AND verse = 0 AND version = ?").get(bookId, parseInt(chapter), cacheKey) as any;
    if (cached) {
      return JSON.parse(cached.text);
    }

    const url = `https://devx.sabda.org/indolinear/view/?version=tb&dir=${dir}&book=${bookId}&chapter=${chapter}&show=all`;
    const { data } = await axios.get(url, { responseType: 'arraybuffer' });
    const html = data.toString('latin1');
    const $ = cheerio.load(html);
    
    const verseUnitsMap: Record<string, any[]> = {};
    let currentVerseNum = "";

    $('.unit, .unithebrew, .unitgreek').each((i, el) => {
      const verseNumLink = $(el).find('big b a');
      if (verseNumLink.length > 0) {
        currentVerseNum = verseNumLink.text().trim();
        verseUnitsMap[currentVerseNum] = [];
      } else if (currentVerseNum) {
        $(el).find('sub, small').remove();
        const strongs = $(el).find('a[href*="strong.php?s="]').map((i, a) => $(a).text().replace(/[<>]/g, '').trim()).get().filter(Boolean);
        
        $(el).find('a[href*="strong.php?s="]').remove();

        const hText = $(el).find('.h').text().trim();
        const allTextNodes = $(el).find('*').contents().filter(function() {
          return this.nodeType === 3 && $(this).closest('.h').length === 0 && $(this).text().trim() !== '';
        });
        let ind = allTextNodes.map((i, e) => cleanText($(e).text().trim())).get().join(' ').replace(/\d+/g, '').trim();

        if (strongs.length <= 1) {
          verseUnitsMap[currentVerseNum].push({ ind, strong: strongs.join(' ') });
        } else {
          const words = ind.split(' ').filter(Boolean);
          if (words.length === 0) {
            for (const s of strongs) {
              verseUnitsMap[currentVerseNum].push({ ind: '', strong: s });
            }
          } else if (words.length === strongs.length) {
            for (let i = 0; i < strongs.length; i++) {
              verseUnitsMap[currentVerseNum].push({ ind: words[i], strong: strongs[i] });
            }
          } else if (words.length > strongs.length) {
            for (let i = 0; i < strongs.length - 1; i++) {
              verseUnitsMap[currentVerseNum].push({ ind: words[i], strong: strongs[i] });
            }
            verseUnitsMap[currentVerseNum].push({ ind: words.slice(strongs.length - 1).join(' '), strong: strongs[strongs.length - 1] });
          } else {
            for (let i = 0; i < strongs.length; i++) {
              verseUnitsMap[currentVerseNum].push({ ind: i < words.length ? words[i] : '', strong: strongs[i] });
            }
          }
        }
      }
    });
    
    db.prepare("INSERT OR REPLACE INTO bible_texts (book_id, chapter, verse, text, version) VALUES (?, ?, 0, ?, ?)").run(bookId, parseInt(chapter), JSON.stringify(verseUnitsMap), cacheKey);
    return verseUnitsMap;
  };

  const indonesianMap = await fetchUnits('classic');
  const verses: any[] = [];
  
  const originalWordsRows = db.prepare("SELECT * FROM original_words WHERE book_id = ? AND chapter = ? ORDER BY verse, word_index").all(bookId, parseInt(chapter)) as any[];
  
  const originalWordsByVerse: Record<number, any[]> = {};
  for (const row of originalWordsRows) {
    if (!originalWordsByVerse[row.verse]) originalWordsByVerse[row.verse] = [];
    originalWordsByVerse[row.verse].push(row);
  }

  const verseNumbers = Object.keys(originalWordsByVerse).map(Number).sort((a, b) => a - b);

  for (const verseNum of verseNumbers) {
    const originalWords = originalWordsByVerse[verseNum] || [];
    const sabdaIndonesian = indonesianMap[verseNum.toString()] || [];
    const sabdaIndonesianCopy = JSON.parse(JSON.stringify(sabdaIndonesian));

    const originalUnits = originalWords.map(word => {
      const wordStrongs = word.strongs.split(',').filter(Boolean);
      let matchedInd = "";
      let sabdaIndex = -1;
      
      if (wordStrongs.length > 0) {
        const idx = sabdaIndonesianCopy.findIndex((u: any) => {
          if (!u.strong || u.strong === 'MATCHED') return false;
          const uStrongs = u.strong.split(' ').filter(Boolean);
          return uStrongs.some((s: string) => wordStrongs.some((ws: string) => ws.replace(/^0+/, '') === s.replace(/^0+/, '')));
        });
        
        if (idx !== -1) {
          sabdaIndex = idx;
          matchedInd = sabdaIndonesianCopy[idx].ind;
          
          let uStrongs = sabdaIndonesianCopy[idx].strong.split(' ').filter(Boolean);
          for (const s of wordStrongs) {
            const i = uStrongs.findIndex((us: string) => us.replace(/^0+/, '') === s.replace(/^0+/, ''));
            if (i !== -1) uStrongs.splice(i, 1);
          }
          
          if (uStrongs.length === 0) {
            sabdaIndonesianCopy[idx].strong = 'MATCHED';
          } else {
            sabdaIndonesianCopy[idx].strong = uStrongs.join(' ');
            sabdaIndonesianCopy[idx].ind = "";
          }
        }
      }

      return {
        ind: matchedInd.trim(),
        origUnicode: word.text.replace(/\//g, ''),
        origAscii: transliterateHebrew(word.text),
        strong: word.strongs.replace(/,/g, ' '),
        morphology: word.morphology,
        lemma: word.lemma,
        sabdaIndex
      };
    });

    sabdaIndonesian.forEach((u: any, i: number) => {
      if (u.strong === '') {
        let bestIdx = -1;
        let bestCost = Infinity;
        
        originalUnits.forEach((mw, mi) => {
          if (mw.sabdaIndex !== -1) {
            let cost = Math.abs(i - mw.sabdaIndex);
            if (sabdaIndonesian[mw.sabdaIndex].ind === '') cost -= 3;
            
            if (cost < bestCost) {
              bestCost = cost;
              bestIdx = mi;
            } else if (cost === bestCost) {
              const currentAbsDist = Math.abs(i - originalUnits[bestIdx].sabdaIndex);
              const newAbsDist = Math.abs(i - mw.sabdaIndex);
              if (newAbsDist < currentAbsDist) {
                bestIdx = mi;
              } else if (newAbsDist === currentAbsDist) {
                if (mw.sabdaIndex > i) bestIdx = mi;
              }
            }
          }
        });
        
        if (bestIdx !== -1) {
          if (originalUnits[bestIdx].sabdaIndex > i) {
            originalUnits[bestIdx].ind = (u.ind + ' ' + originalUnits[bestIdx].ind).trim();
          } else {
            originalUnits[bestIdx].ind = (originalUnits[bestIdx].ind + ' ' + u.ind).trim();
          }
        }
      }
    });

    const indonesianUnits = sabdaIndonesian.map((unit: any) => {
      const uStrongs = unit.strong.split(' ').filter(Boolean);
      let matchedOrig = "";
      let matchedTranslit = "";
      let matchedMorph = "";
      let matchedLemma = "";
      
      if (uStrongs.length > 0) {
        const matchingWords = originalWords.filter(w => {
          const wStrongs = w.strongs.split(',').filter(Boolean);
          return wStrongs.some((s: string) => uStrongs.includes(s));
        });
        
        if (matchingWords.length > 0) {
          matchedOrig = matchingWords.map(w => w.text).join(' ');
          matchedTranslit = matchingWords.map(w => transliterateHebrew(w.text)).join(' ');
          matchedMorph = matchingWords.map(w => w.morphology).filter(Boolean).join(' ');
          matchedLemma = matchingWords.map(w => w.lemma).filter(Boolean).join(' ');
        }
      }

      return {
        ind: unit.ind,
        origUnicode: matchedOrig || unit.origUnicode,
        origAscii: matchedTranslit || unit.origAscii,
        strong: unit.strong,
        morphology: matchedMorph,
        lemma: matchedLemma
      };
    });

    verses.push({
      number: verseNum.toString(),
      originalUnits,
      indonesianUnits,
      origFullText: originalWords.map(w => w.text).join(' ')
    });
  }

  return { title: `${BOOKS[bookId - 1]} ${chapter}`, verses };
}

async function fetchGreekChapter(bookId: number, chapter: string) {
  await ensureSblgntBook(bookId);

  const fetchUnits = async (dir: 'reverse' | 'classic') => {
    const cacheKey = `sabda_${dir}_v7`;
    const cached = db.prepare("SELECT text FROM bible_texts WHERE book_id = ? AND chapter = ? AND verse = 0 AND version = ?").get(bookId, parseInt(chapter), cacheKey) as any;
    if (cached) {
      return JSON.parse(cached.text);
    }

    const url = `https://devx.sabda.org/indolinear/view/?version=tb&dir=${dir}&book=${bookId}&chapter=${chapter}&show=all`;
    const { data } = await axios.get(url, { responseType: 'arraybuffer' });
    const html = data.toString('latin1');
    const $ = cheerio.load(html);
    
    const verseUnitsMap: Record<string, any[]> = {};
    let currentVerseNum = "";

    $('.unit, .unithebrew, .unitgreek').each((i, el) => {
      const verseNumLink = $(el).find('big b a');
      if (verseNumLink.length > 0) {
        currentVerseNum = verseNumLink.text().trim();
        verseUnitsMap[currentVerseNum] = [];
      } else if (currentVerseNum) {
        $(el).find('sub, small').remove();
        const strongs = $(el).find('a[href*="strong.php?s="]').map((i, a) => $(a).text().replace(/[<>]/g, '').trim()).get().filter(Boolean);
        
        $(el).find('a[href*="strong.php?s="]').remove();

        const allTextNodes = $(el).find('*').contents().filter(function() {
          return this.nodeType === 3 && $(this).closest('.g').length === 0 && $(this).text().trim() !== '';
        });
        let ind = allTextNodes.map((i, e) => cleanText($(e).text().trim())).get().join(' ').replace(/\d+/g, '').trim();

        if (strongs.length <= 1) {
          verseUnitsMap[currentVerseNum].push({ ind, strong: strongs.join(' ') });
        } else {
          const words = ind.split(' ').filter(Boolean);
          if (words.length === 0) {
            for (const s of strongs) {
              verseUnitsMap[currentVerseNum].push({ ind: '', strong: s });
            }
          } else if (words.length === strongs.length) {
            for (let i = 0; i < strongs.length; i++) {
              verseUnitsMap[currentVerseNum].push({ ind: words[i], strong: strongs[i] });
            }
          } else if (words.length > strongs.length) {
            for (let i = 0; i < strongs.length - 1; i++) {
              verseUnitsMap[currentVerseNum].push({ ind: words[i], strong: strongs[i] });
            }
            verseUnitsMap[currentVerseNum].push({ ind: words.slice(strongs.length - 1).join(' '), strong: strongs[strongs.length - 1] });
          } else {
            for (let i = 0; i < strongs.length; i++) {
              verseUnitsMap[currentVerseNum].push({ ind: i < words.length ? words[i] : '', strong: strongs[i] });
            }
          }
        }
      }
    });
    
    db.prepare("INSERT OR REPLACE INTO bible_texts (book_id, chapter, verse, text, version) VALUES (?, ?, 0, ?, ?)").run(bookId, parseInt(chapter), JSON.stringify(verseUnitsMap), cacheKey);
    return verseUnitsMap;
  };

  const indonesianMap = await fetchUnits('classic');
  const verses: any[] = [];
  
  const originalWordsRows = db.prepare("SELECT * FROM original_words WHERE book_id = ? AND chapter = ? ORDER BY verse, word_index").all(bookId, parseInt(chapter)) as any[];
  
  const originalWordsByVerse: Record<number, any[]> = {};
  for (const row of originalWordsRows) {
    if (!originalWordsByVerse[row.verse]) originalWordsByVerse[row.verse] = [];
    originalWordsByVerse[row.verse].push(row);
  }

  const verseNumbers = Object.keys(originalWordsByVerse).map(Number).sort((a, b) => a - b);

  for (const verseNum of verseNumbers) {
    const originalWords = originalWordsByVerse[verseNum] || [];
    const sabdaIndonesian = indonesianMap[verseNum.toString()] || [];
    const sabdaIndonesianCopy = JSON.parse(JSON.stringify(sabdaIndonesian));

    const originalUnits = originalWords.map(word => {
      const wordStrongs = word.strongs.split(',').filter(Boolean);
      let matchedInd = "";
      let sabdaIndex = -1;
      
      if (wordStrongs.length > 0) {
        const idx = sabdaIndonesianCopy.findIndex((u: any) => {
          if (!u.strong || u.strong === 'MATCHED') return false;
          const uStrongs = u.strong.split(' ').filter(Boolean);
          return uStrongs.some((s: string) => wordStrongs.some((ws: string) => ws.replace(/^0+/, '') === s.replace(/^0+/, '')));
        });
        
        if (idx !== -1) {
          sabdaIndex = idx;
          matchedInd = sabdaIndonesianCopy[idx].ind;
          
          let uStrongs = sabdaIndonesianCopy[idx].strong.split(' ').filter(Boolean);
          for (const s of wordStrongs) {
            const i = uStrongs.findIndex((us: string) => us.replace(/^0+/, '') === s.replace(/^0+/, ''));
            if (i !== -1) uStrongs.splice(i, 1);
          }
          
          if (uStrongs.length === 0) {
            sabdaIndonesianCopy[idx].strong = 'MATCHED';
          } else {
            sabdaIndonesianCopy[idx].strong = uStrongs.join(' ');
            sabdaIndonesianCopy[idx].ind = "";
          }
        }
      }

      return {
        ind: matchedInd.trim(),
        origUnicode: word.text,
        origAscii: word.transliteration,
        strong: word.strongs.replace(/,/g, ' '),
        morphology: word.morphology,
        lemma: word.lemma,
        sabdaIndex
      };
    });

    sabdaIndonesian.forEach((u: any, i: number) => {
      if (u.strong === '') {
        let bestIdx = -1;
        let bestCost = Infinity;
        
        originalUnits.forEach((mw, mi) => {
          if (mw.sabdaIndex !== -1) {
            let cost = Math.abs(i - mw.sabdaIndex);
            if (sabdaIndonesian[mw.sabdaIndex].ind === '') cost -= 3;
            
            if (cost < bestCost) {
              bestCost = cost;
              bestIdx = mi;
            } else if (cost === bestCost) {
              const currentAbsDist = Math.abs(i - originalUnits[bestIdx].sabdaIndex);
              const newAbsDist = Math.abs(i - mw.sabdaIndex);
              if (newAbsDist < currentAbsDist) {
                bestIdx = mi;
              } else if (newAbsDist === currentAbsDist) {
                if (mw.sabdaIndex > i) bestIdx = mi;
              }
            }
          }
        });
        
        if (bestIdx !== -1) {
          if (originalUnits[bestIdx].sabdaIndex > i) {
            originalUnits[bestIdx].ind = (u.ind + ' ' + originalUnits[bestIdx].ind).trim();
          } else {
            originalUnits[bestIdx].ind = (originalUnits[bestIdx].ind + ' ' + u.ind).trim();
          }
        }
      }
    });

    const indonesianUnits = sabdaIndonesian.map((unit: any) => {
      const uStrongs = unit.strong.split(' ').filter(Boolean);
      let matchedOrig = "";
      let matchedTranslit = "";
      let matchedMorph = "";
      let matchedLemma = "";
      
      if (uStrongs.length > 0) {
        const matchingWords = originalWords.filter(w => {
          const wStrongs = w.strongs.split(',').filter(Boolean);
          return wStrongs.some((s: string) => uStrongs.includes(s));
        });
        
        if (matchingWords.length > 0) {
          matchedOrig = matchingWords.map(w => w.text).join(' ');
          matchedTranslit = matchingWords.map(w => w.transliteration).join(' ');
          matchedMorph = matchingWords.map(w => w.morphology).filter(Boolean).join(' ');
          matchedLemma = matchingWords.map(w => w.lemma).filter(Boolean).join(' ');
        }
      }

      return {
        ind: unit.ind,
        origUnicode: matchedOrig || unit.origUnicode,
        origAscii: matchedTranslit || unit.origAscii,
        strong: unit.strong,
        morphology: matchedMorph,
        lemma: matchedLemma
      };
    });

    verses.push({
      number: verseNum.toString(),
      originalUnits,
      indonesianUnits,
      origFullText: originalWords.map(w => w.text).join(' ')
    });
  }

  return { title: `${BOOKS[bookId - 1]} ${chapter}`, verses };
}

async function fetchChapter(book: string, chapter: string) {
  const bookId = parseInt(book);
  if (bookId <= 39) {
    await ensureWlcBook(bookId);
    return fetchHebrewChapter(bookId, chapter);
  } else {
    await ensureSblgntBook(bookId);
    return fetchGreekChapter(bookId, chapter);
  }
}

// Helper to parse verse detail
async function fetchVerseDetail(id: string, type: 'heb' | 'grk') {
  const url = `https://devx.sabda.org/interlinear/${type}2tb/detail.php?id=${id}`;
  const { data } = await axios.get(url, { responseType: 'arraybuffer' });
  const html = data.toString('latin1'); 
  const $ = cheerio.load(html);

  const indonesianWords: any[] = [];
  $('div[id^="n"]').each((i, el) => {
    indonesianWords.push({
      id: $(el).attr('id'),
      text: $(el).text().trim()
    });
  });

  const originalWords: any[] = [];
  $('div[id^="h"]').each((i, el) => {
    const strong = $(el).find('.s').text().replace(/[<>]/g, '').trim();
    const asciiText = $(el).find('.h').text().trim();
    originalWords.push({
      id: $(el).attr('id'),
      strong,
      asciiText,
      text: toUnicode(asciiText, type)
    });
  });

  // Extract navigation options
  const books: any[] = [];
  $('#sbook1 option').each((i, el) => {
    books.push({ value: $(el).attr('value'), text: $(el).text(), selected: $(el).attr('selected') !== undefined });
  });

  const chapters: any[] = [];
  $('#schapter1 option').each((i, el) => {
    chapters.push({ value: $(el).attr('value'), text: $(el).text(), selected: $(el).attr('selected') !== undefined });
  });

  const verses: any[] = [];
  $('#sverse1 option').each((i, el) => {
    verses.push({ value: $(el).attr('value'), text: $(el).text(), selected: $(el).attr('selected') !== undefined });
  });

  // Extract linkage from script
  const scriptContent = $('script').text();
  const linkageMatch = scriptContent.match(/linkage\[\d+\]\s*=\s*new Array\((.*?)\);/g);
  const linkage: any[] = [];
  if (linkageMatch) {
    linkageMatch.forEach(m => {
      const parts = m.match(/\((.*?)\)/)?.[1].split(',').map(p => parseInt(p.trim()));
      if (parts) {
        linkage.push({
          indId: parts[0], // nX
          origId: parts[1], // hX
          type: parts[2],
          color: parts[3]
        });
      }
    });
  }

  // Extract verse title
  const title = $('b a').first().text().trim();

  return { title, indonesianWords, originalWords, linkage, navigation: { books, chapters, verses } };
}

// Helper to parse Strong's detail
async function fetchStrongDetail(s: string, type: 'heb' | 'grk') {
  const cached = db.prepare("SELECT data FROM strongs_cache WHERE strong_id = ? AND type = ?").get(s, type) as any;
  if (cached) {
    return JSON.parse(cached.data);
  }

  const url = `https://devx.sabda.org/interlinear/${type}2tb/strong.php?s=${s}`;
  const { data } = await axios.get(url, { responseType: 'arraybuffer' });
  const html = data.toString('latin1');
  const $ = cheerio.load(html);

  const title = $('title').text().trim();
  const definition = $('td:contains("Definition:")').next().find('pre').text().trim();
  const nasbUsage = $('td:contains("NASB:")').first().next().text().trim();
  
  let originalWord = $('big').first().text().trim();
  const parts = originalWord.split('//');
  let numPart = '';
  if (parts.length > 1) {
    numPart = parts[0].trim();
  }

  try {
    const unpaddedS = parseInt(s, 10).toString();
    const studyBibleId = `${type === 'grk' ? 'G' : 'H'}${unpaddedS}`;
    const strongsEntry = (strongs as any)[studyBibleId];
    if (strongsEntry && strongsEntry.lemma) {
      const properlyAccentedWord = strongsEntry.lemma;
      originalWord = numPart ? `${numPart} ${properlyAccentedWord}` : properlyAccentedWord;
    }
  } catch (err) {
    console.error(`Failed to fetch properly accented word for ${type} ${s} from strongs package`);
  }

  const result = { title, originalWord, definition, nasbUsage };
  db.prepare("INSERT OR REPLACE INTO strongs_cache (strong_id, type, data) VALUES (?, ?, ?)").run(s, type, JSON.stringify(result));
  return result;
}

async function startServer() {
  // Background download all texts
  (async () => {
    try {
      console.log("Starting background downloads...");
      await ensureLxx();
      for (let i = 1; i <= 66; i++) {
        if (i <= 39) await ensureWlcBook(i);
        else await ensureSblgntBook(i);
      }
      console.log("All Bible texts downloaded and cached.");
    } catch (err) {
      console.error("Background download error:", err);
    }
  })();

  app.get("/api/books", (req, res) => {
    res.json(BOOKS.map((name, i) => ({ id: (i + 1).toString(), name })));
  });

  app.get("/api/chapter/:book/:chapter", async (req, res) => {
    try {
      const { book, chapter } = req.params;
      const data = await fetchChapter(book, chapter);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/verse/:type/:id", async (req, res) => {
    try {
      const { type, id } = req.params;
      const data = await fetchVerseDetail(id, type as 'heb' | 'grk');
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/strong/:type/:s", async (req, res) => {
    try {
      const { type, s } = req.params;
      const data = await fetchStrongDetail(s, type as 'heb' | 'grk');
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/scrape", async (req, res) => {
    try {
      const { bookId } = req.body;
      if (!bookId) {
        return res.status(400).json({ error: "bookId is required" });
      }
      
      // Start background scrape
      (async () => {
        try {
          console.log(`Starting background scrape for book ${bookId}...`);
          // We don't know the exact number of chapters, so we just try up to 150
          for (let chapter = 1; chapter <= 150; chapter++) {
            try {
              await fetchChapter(bookId.toString(), chapter.toString());
              // Add a small delay to avoid overwhelming the server
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err: any) {
              // If it fails, we assume we reached the end of the book
              console.log(`Finished scraping book ${bookId} at chapter ${chapter - 1}`);
              break;
            }
          }
        } catch (err) {
          console.error(`Error scraping book ${bookId}:`, err);
        }
      })();
      
      res.json({ message: `Started background scrape for book ${bookId}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lookup/:type/:book/:chapter/:verse", async (req, res) => {
    try {
      const { type, book, chapter, verse } = req.params;
      const url = `https://devx.sabda.org/indolinear/view/?version=tb&dir=reverse&book=${book}&chapter=${chapter}`;
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      
      // Find the link to the specific verse in the interlinear view
      // The view page lists all verses in the chapter.
      // We look for the verse number and its corresponding detail link.
      let id = "";
      $('tr').each((i, el) => {
        const vNum = $(el).find('td').first().text().trim();
        if (vNum === verse) {
          const link = $(el).find('a[href*="detail.php?id="]').attr('href');
          id = link?.match(/id=(\d+)/)?.[1] || "";
        }
      });

      if (!id) {
        // Fallback: just get the first verse of the chapter
        const firstLink = $('a[href*="detail.php?id="]').first().attr('href');
        id = firstLink?.match(/id=(\d+)/)?.[1] || "";
      }

      res.json({ id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
