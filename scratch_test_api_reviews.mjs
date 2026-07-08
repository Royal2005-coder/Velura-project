// Quick test: call the local API to get product details with reviews
async function run() {
  const productId = "fc8618c1-1c5c-4ed4-a59d-7e46c0f2a90c";
  const res = await fetch(`http://localhost:8787/api/user/products/${productId}`);
  const data = await res.json();
  console.log("Product:", data.name);
  console.log("Reviews:", JSON.stringify(data.reviews, null, 2));
}

run().catch(console.error);
