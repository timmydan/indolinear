import axios from 'axios';
import * as cheerio from 'cheerio';

function cleanText(text: string) {
  return text.replace(/[<>]/g, '').trim();
}

async function test(dir: string) {
  const { data } = await axios.get(`https://devx.sabda.org/indolinear/view/?version=tb&dir=${dir}&book=1&chapter=1&show=all`);
  const $ = cheerio.load(data);
  
  const el = $('.unit, .unithebrew, .unitgreek').eq(2);
  $(el).find('sub, small').remove();
  $(el).find('a[href*="strong.php?s="]').remove(); // Remove strongs tags completely
  
  const hText = $(el).find('.h').text().trim();
  
  const otherParts = $(el).find('.t1, .fuzzy').not('.h *').map((i, e) => cleanText($(e).text())).get().filter(Boolean);
  
  console.log(`dir=${dir}`);
  console.log('hText:', hText);
  console.log('otherParts:', otherParts);
}

test('classic');
test('reverse');
