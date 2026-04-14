import fs from 'fs';
import path from 'path';
import hebStrongs from './strongs-hebrew-dictionary.cjs';
import grkStrongs from './strongs-greek-dictionary.cjs';

const strongs = { ...(hebStrongs as any), ...(grkStrongs as any) };

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

async function updateStrongs() {
  if (!fs.existsSync(DATA_DIR)) {
    console.log("No data directory found.");
    return;
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('strong_') && f.endsWith('.json'));
  console.log(`Found ${files.length} Strong's files to process.`);

  let count = 0;
  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      
      // Extract type and number from filename, e.g., strong_grk_26.json -> type: grk, num: 26
      const match = file.match(/^strong_(grk|heb)_(\d+)\.json$/);
      if (!match) continue;

      const type = match[1];
      const num = match[2];
      const strongsId = `${type === 'grk' ? 'G' : 'H'}${num}`;

      const strongsEntry = (strongs as any)[strongsId];
      
      if (strongsEntry && strongsEntry.lemma) {
        const properlyAccentedWord = strongsEntry.lemma;
        
        // Preserve any number prefix that might already be in the JSON
        const oldParts = (parsed.originalWord || '').split(' ');
        const hasNumberPrefix = oldParts.length > 1 && !isNaN(Number(oldParts[0]));
        
        // Update the JSON
        parsed.originalWord = hasNumberPrefix ? `${oldParts[0]} ${properlyAccentedWord}` : properlyAccentedWord;
        
        // Save it back prettified
        fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');
        console.log(`  -> Updated ${file} originalWord to: ${parsed.originalWord}`);
        count++;
      } else {
        console.log(`  -> Could not find word for ${strongsId} in strongs dictionary`);
      }

    } catch (e: any) {
      console.error(`Failed to update ${file}:`, e.message);
    }
  }
  console.log(`Successfully updated ${count} Strong's files.`);
}

updateStrongs();
