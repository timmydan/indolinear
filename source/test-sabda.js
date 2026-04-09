const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const { data } = await axios.get('https://devx.sabda.org/indolinear/view/?version=tb&dir=classic&book=1&chapter=1&show=all');
  const $ = cheerio.load(data);
  console.log($('.unithebrew').first().html());
}
test();
