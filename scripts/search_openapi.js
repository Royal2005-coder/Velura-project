import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\6c44772d-6455-48f1-88a2-97f180f338d2\\scratch\\openapi.json', 'utf8'));

const rpcs = Object.keys(data.paths).filter(p => p.startsWith('/rpc/'));
console.log('RPC paths in OpenAPI:');
console.log(rpcs);

const returnsExchange = data.paths['/return_exchange'];
if (returnsExchange) {
  console.log('return_exchange GET parameters:');
  console.log(returnsExchange.get.parameters.map(p => p.$ref || p.name));
} else {
  console.log('return_exchange path not found');
}
