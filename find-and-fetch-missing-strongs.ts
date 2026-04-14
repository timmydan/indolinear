import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import hebStrongs from './strongs-hebrew-dictionary.cjs';
import grkStrongs from './strongs-greek-dictionary.cjs';

const strongs = { ...(hebStrongs as any), ...(grkStrongs as any) };

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const MISSING_FILE = path.join(process.cwd(), 'missing_strongs.json');

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function processMissing() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const existingFiles = new Set(fs.readdirSync(DATA_DIR).filter(f => f.startsWith('strong_') && f.endsWith('.json')));
  
  const missing: { type: 'grk' | 'heb', num: string, id: string }[] = [];

  // Find missing
  for (const key of Object.keys(strongs)) {
    // strongs package keys are like G1, G2, H1, H2
    const type = key.startsWith('G') ? 'grk' : 'heb';
    const num = key.substring(1);
    const filename = `strong_${type}_${num}.json`;
    
    if (!existingFiles.has(filename)) {
      missing.push({ type, num, id: key });
    }
  }

  console.log(`Found ${missing.length} missing files.`);
  fs.writeFileSync(MISSING_FILE, JSON.stringify(missing, null, 2), 'utf-8');
  console.log(`Wrote missing list to ${MISSING_FILE}`);

  if (missing.length === 0) {
    console.log("No missing files to fetch!");
    return;
  }

  console.log("Starting to fetch missing files...");
  let successCount = 0;
  let failCount = 0;

  for (const item of missing) {
    const { type, num, id } = item;
    const filename = `strong_${type}_${num}.json`;
    const filePath = path.join(DATA_DIR, filename);

    console.log(`Fetching missing: ${id} (${filename})...`);
    try {
      const url = `https://devx.sabda.org/interlinear/${type}2tb/strong.php?s=${num}`;
      const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
      const html = data.toString('latin1');
      const $ = cheerio.load(html);

      const title = $('title').text().trim() || id;
      
      let definition = '';
      const defNode = $('td:contains("Definition:")').next().find('pre');
      if (defNode.length) {
        definition = defNode.text().trim();
      }

      let nasbUsage = '';
      const nasbNode = $('td:contains("NASB:")').first().next();
      if (nasbNode.length) {
        nasbUsage = nasbNode.text().trim();
      }

      let originalWord = '';
      let numPart = '';
      
      const sabdaBig = $('big').first().text().trim();
      const parts = sabdaBig.split('//');
      if (parts.length > 1) {
        numPart = parts[0].trim();
      }

      const strongsEntry = (strongs as any)[id];
      if (strongsEntry && strongsEntry.lemma) {
        const properlyAccentedWord = strongsEntry.lemma;
        originalWord = numPart ? `${numPart} ${properlyAccentedWord}` : properlyAccentedWord;
      } else {
        originalWord = sabdaBig || id;
      }

      const result = { title, originalWord, definition, nasbUsage };
      
      fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
      successCount++;
      
      await delay(500); // 500ms delay to be polite
    } catch (e: any) {
      console.error(`Failed to fetch ${id}:`, e.message);
      failCount++;
    }
  }

  console.log(`Finished processing missing files. Success: ${successCount}, Failed: ${failCount}`);
}

processMissing();
