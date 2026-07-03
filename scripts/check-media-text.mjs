import fs from 'fs';
import path from 'path';

const dir = "C:\\Users\\aaa\\.gemini\\antigravity-ide\\brain\\2c109a9b-712b-4238-a854-86b25b0e3fc4";
const files = [
  'media__1783109741306.jpg',
  'media__1783109741348.jpg',
  'media__1783109741423.jpg',
  'media__1783109741445.jpg'
];

files.forEach(f => {
  const filepath = path.join(dir, f);
  if (fs.existsSync(filepath)) {
    const buf = fs.readFileSync(filepath);
    const text = buf.toString('binary');
    console.log(`File: ${f}, size: ${buf.length}`);
    const matches = ['RECTANGLE', 'PEAR', 'HOURGLASS', 'APPLE'].filter(word => text.includes(word));
    console.log(`Matches:`, matches);
  } else {
    console.log(`File ${f} does not exist`);
  }
});
