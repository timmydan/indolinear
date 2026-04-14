import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

function removeAvUsage() {
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
      
      if ('avUsage' in parsed) {
        delete parsed.avUsage;
        fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');
        count++;
      }
    } catch (e: any) {
      console.error(`Failed to process ${file}:`, e.message);
    }
  }
  console.log(`Successfully removed avUsage from ${count} files.`);
}

removeAvUsage();
