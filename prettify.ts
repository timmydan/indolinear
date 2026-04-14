import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

async function prettifyAll() {
  if (!fs.existsSync(DATA_DIR)) {
    console.log("No data directory found.");
    return;
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} JSON files. Prettifying...`);

  let count = 0;
  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      // JSON.stringify with null and 2 adds indentation and preserves unicode characters
      fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');
      count++;
    } catch (e) {
      console.error(`Failed to prettify ${file}:`, e);
    }
  }
  console.log(`Successfully prettified ${count} files.`);
}

prettifyAll();
