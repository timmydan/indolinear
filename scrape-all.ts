import Database from 'better-sqlite3';
import axios from 'axios';
import * as cheerio from 'cheerio';

const db = new Database('bible.db');

const books = db.prepare("SELECT * FROM books ORDER BY id").all() as any[];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function cleanText(text: string) {
  return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").replace(/\s+/g, " ").trim();
}

async function fetchUnits(bookId: number, chapter: number, dir: 'reverse' | 'classic') {
  const cacheKey = `sabda_${dir}_v7`;
  const cached = db.prepare("SELECT text FROM bible_texts WHERE book_id = ? AND chapter = ? AND verse = 0 AND version = ?").get(bookId, chapter, cacheKey) as any;
  if (cached) {
    return; // Already cached
  }

  const url = `https://devx.sabda.org/indolinear/view/?version=tb&dir=${dir}&book=${bookId}&chapter=${chapter}&show=all`;
  try {
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
          return this.nodeType === 3 && $(this).closest('.g').length === 0 && $(this).closest('.h').length === 0 && $(this).text().trim() !== '';
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
    
    db.prepare("INSERT OR REPLACE INTO bible_texts (book_id, chapter, verse, text, version) VALUES (?, ?, 0, ?, ?)").run(bookId, chapter, JSON.stringify(verseUnitsMap), cacheKey);
    console.log(`Cached Book ${bookId} Chapter ${chapter}`);
  } catch (e) {
    console.error(`Failed to fetch Book ${bookId} Chapter ${chapter}:`, e);
  }
}

async function scrapeAll() {
  console.log("Starting scrape...");
  let totalChapters = 0;
  for (const book of books) {
    totalChapters += book.chapters;
  }
  
  let count = 0;
  const concurrency = 10;
  const queue: {bookId: number, chapter: number}[] = [];
  
  for (const book of books) {
    for (let c = 1; c <= book.chapters; c++) {
      queue.push({bookId: book.id, chapter: c});
    }
  }
  
  console.log(`Total chapters to scrape: ${queue.length}`);
  
  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);
    await Promise.all(batch.map(async (item) => {
      await fetchUnits(item.bookId, item.chapter, 'classic');
      count++;
      if (count % 50 === 0) {
        console.log(`Progress: ${count}/${totalChapters}`);
      }
    }));
    await delay(100); // Small delay between batches
  }
  
  console.log("Scraping complete!");
}

scrapeAll();
