import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function getBooks() {
  const url = 'https://devx.sabda.org/indolinear/view/?version=tb&dir=classic&book=1&chapter=1&show=all';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const books: any[] = [];
  $('select[name="book"] option').each((i, el) => {
    books.push({ id: parseInt($(el).attr('value') as string), name: $(el).text() });
  });
  
const chaptersMap: Record<number, number> = {
    1: 50, 2: 40, 3: 27, 4: 36, 5: 34, 6: 24, 7: 21, 8: 4, 9: 31, 10: 24,
    11: 22, 12: 25, 13: 29, 14: 36, 15: 10, 16: 13, 17: 10, 18: 42, 19: 150, 20: 31,
    21: 12, 22: 8, 23: 66, 24: 52, 25: 5, 26: 48, 27: 12, 28: 14, 29: 3, 30: 9,
    31: 1, 32: 4, 33: 7, 34: 3, 35: 3, 36: 3, 37: 2, 38: 14, 39: 4, 40: 28,
    41: 16, 42: 24, 43: 21, 44: 28, 45: 16, 46: 16, 47: 13, 48: 6, 49: 6, 50: 4,
    51: 4, 52: 5, 53: 3, 54: 6, 55: 4, 56: 3, 57: 1, 58: 13, 59: 5, 60: 5,
    61: 3, 62: 5, 63: 1, 64: 1, 65: 1, 66: 22
  };
  
  fs.writeFileSync(path.join(DATA_DIR, 'books.json'), JSON.stringify({ books, chaptersMap }, null, 2));
  return { books, chaptersMap };
}

const exportedStrongs = new Set<string>();

async function exportStrong(s: string, type: 'heb' | 'grk') {
  const key = `${type}_${s}`;
  if (exportedStrongs.has(key)) return;
  
  const filePath = path.join(DATA_DIR, `strong_${type}_${s}.json`);
  if (fs.existsSync(filePath)) {
    exportedStrongs.add(key);
    return;
  }
  
  try {
    const { data } = await axios.get(`http://localhost:3000/api/strong/${type}/${s}`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    exportedStrongs.add(key);
    console.log(`Exported Strong ${type} ${s}`);
  } catch (e: any) {
    console.error(`Failed to export Strong ${type} ${s}:`, e.message);
  }
}

async function exportAll() {
  console.log("Starting export...");
  const { books, chaptersMap } = await getBooks();
  
  let count = 0;
  let total = 0;
  for (const book of books) {
    total += chaptersMap[book.id];
  }
  
  console.log(`Total chapters to export: ${total}`);
  
  for (const book of books) {
    for (let c = 1; c <= chaptersMap[book.id]; c++) {
      const filePath = path.join(DATA_DIR, `chapter_${book.id}_${c}.json`);
      let chapterData;
      
      if (fs.existsSync(filePath)) {
        chapterData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        count++;
      } else {
        try {
          const { data } = await axios.get(`http://localhost:3000/api/chapter/${book.id}/${c}`);
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
          chapterData = data;
          count++;
          console.log(`Exported ${book.name} ${c} (${count}/${total})`);
        } catch (e: any) {
          console.error(`Failed to export ${book.name} ${c}:`, e.message);
          continue;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Export strongs for this chapter
      if (chapterData && chapterData.verses) {
        const type = book.id < 40 ? 'heb' : 'grk';
        for (const verse of chapterData.verses) {
          if (verse.originalUnits) {
            for (const word of verse.originalUnits) {
              if (word.strong) {
                const strongs = word.strong.split(' ').filter(Boolean);
                for (const s of strongs) {
                  await exportStrong(s, type);
                  await new Promise(resolve => setTimeout(resolve, 10));
                }
              }
            }
          }
        }
      }
    }
  }
  
  console.log("Export complete!");
}

exportAll();
