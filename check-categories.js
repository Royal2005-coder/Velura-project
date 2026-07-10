const http = require('http');

http.get('http://localhost:8787/api/user/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      const setDoProducts = products.filter(p => p.category_slug === 'set-do');
      console.log(`Total products: ${products.length}`);
      console.log(`Products with category_slug 'set-do': ${setDoProducts.length}`);
      const categories = [...new Set(products.map(p => p.category_slug))];
      console.log(`Categories found: ${categories.join(', ')}`);
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', (e) => {
  console.error(e.message);
});
