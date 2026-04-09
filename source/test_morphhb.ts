import axios from 'axios';

async function run() {
  const res1 = await axios.get('https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt');
  const res2 = await axios.get('https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Act-Rev%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt');
  const lines = res1.data.split('\n').concat(res2.data.split('\n'));
  const books = new Set();
  for (const line of lines) {
    const match = line.match(/^([A-Za-z0-9]+)\.\d+\.\d+#/);
    if (match) {
      books.add(match[1]);
    }
  }
  console.log(Array.from(books));
}
run();
