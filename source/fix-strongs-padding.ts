import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

function fixPadding() {
  if (!fs.existsSync(DATA_DIR)) {
    console.log("No data directory found.");
    return;
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('strong_') && f.endsWith('.json'));
  let updatedCount = 0;

  for (const file of files) {
    const match = file.match(/^strong_(grk|heb)_(\d+)\.json$/);
    if (!match) continue;

    const type = match[1];
    const numStr = match[2];
    
    // If it's already 4 digits, we still might need to check the content,
    // but the user specifically mentioned fixing the padding.
    // Let's pad the number to 4 digits.
    const paddedNum = numStr.padStart(4, '0');
    
    const filePath = path.join(DATA_DIR, file);
    const newFilePath = path.join(DATA_DIR, `strong_${type}_${paddedNum}.json`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      let modified = false;

      // Fix title: "agathos #18" -> "agathos #0018"
      if (parsed.title && parsed.title.includes(`#${numStr}`)) {
        // Only replace if it's exactly the unpadded number, or just replace the #number part
        // We use a regex to ensure we don't replace #180 if numStr is 18
        const titleRegex = new RegExp(`#0*${numStr}\\b`);
        if (titleRegex.test(parsed.title)) {
          parsed.title = parsed.title.replace(titleRegex, `#${paddedNum}`);
          modified = true;
        }
      }

      // Fix originalWord: "18 ἀγαθός" -> "0018 ἀγαθός"
      if (parsed.originalWord) {
        const wordRegex = new RegExp(`^0*${numStr}\\s+`);
        if (wordRegex.test(parsed.originalWord)) {
          parsed.originalWord = parsed.originalWord.replace(wordRegex, `${paddedNum} `);
          modified = true;
        }
      }

      // If the file needs to be renamed OR modified, we write it
      if (modified || numStr !== paddedNum) {
        fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2));
        
        if (numStr !== paddedNum) {
          fs.renameSync(filePath, newFilePath);
        }
        updatedCount++;
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }

  console.log(`Successfully fixed padding for ${updatedCount} Strong's files.`);
}

fixPadding();