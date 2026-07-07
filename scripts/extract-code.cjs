const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:\\Users\\ADMIN\\Downloads\\Velura-Images\\AI-powered e-commerce customer support chatbot - LOGGED SAFE RESPONSE COMPLETE (1).json', 'utf8'));

// Find key nodes and print their jsCode
const targets = ['Normalize Intent JSON', 'Prepare Safe Response - Order', 'Prepare Safe Response - Support', 'Prepare Safe Response - Recommendation'];
for (const node of data.nodes) {
  if (targets.includes(node.name) && node.parameters.jsCode) {
    console.log(`\n=== ${node.name} ===`);
    console.log(node.parameters.jsCode);
  }
  if (node.name === 'General Queries' && node.parameters.systemMessage) {
    console.log(`\n=== ${node.name} systemMessage ===`);
    console.log(node.parameters.systemMessage);
  }
}
