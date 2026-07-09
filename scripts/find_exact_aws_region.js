async function run() {
  const resp = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json');
  const data = await resp.json();
  const ipv6_prefixes = data.ipv6_prefixes;
  
  // Our target IP segments in binary
  // 2406:da1a:b00:1300:...
  // 2406 = 0010 0100 0000 0110
  // da1a = 1101 1010 0001 1010
  // 0b00 = 0000 1011 0000 0000
  // Let's write a helper to convert an IPv6 prefix string to a binary string
  function ipv6ToBinary(ip) {
    const parts = ip.split('::');
    const left = parts[0].split(':').filter(Boolean);
    const right = (parts[1] || '').split(':').filter(Boolean);
    
    const fillCount = 8 - (left.length + right.length);
    const middle = Array(fillCount).fill('0000');
    
    const allHex = [...left, ...middle, ...right];
    return allHex.map(h => {
      const num = parseInt(h, 16);
      return num.toString(2).padStart(16, '0');
    }).join('');
  }
  
  const targetIpBinary = ipv6ToBinary('2406:da1a:b00:1300:b410:eaf8:ad5d:2232');
  
  const matches = [];
  for (const prefix of ipv6_prefixes) {
    const [ip, maskStr] = prefix.ipv6_prefix.split('/');
    const mask = parseInt(maskStr, 10);
    try {
      const prefixBinary = ipv6ToBinary(ip);
      if (targetIpBinary.substring(0, mask) === prefixBinary.substring(0, mask)) {
        matches.push(prefix);
      }
    } catch (e) {
      // ignore
    }
  }
  
  console.log('Matches:');
  console.log(JSON.stringify(matches, null, 2));
}

run().catch(console.error);
