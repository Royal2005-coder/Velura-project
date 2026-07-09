async function run() {
  const resp = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json');
  const data = await resp.json();
  const ipv6_prefixes = data.ipv6_prefixes;
  
  // Find which prefix contains our IP 2406:da1a:b00:1300:b410:eaf8:ad5d:2232
  // We can just find prefixes starting with "2406:da1a"
  const matches = ipv6_prefixes.filter(p => p.ipv6_prefix.startsWith('2406:da1a'));
  console.log('Matches for 2406:da1a:');
  console.log(JSON.stringify(matches, null, 2));
}

run().catch(console.error);
