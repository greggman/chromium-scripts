import fs from 'fs';
const filename = process.argv[2];
const cts = JSON.parse(fs.readFileSync(filename, {encoding: 'utf8'}));
const collection = new Map();
cts.results
  .filter(([, info]) => info.status === 'fail')
  .forEach(([name]) => {
    console.log(name);
    const colonNdx = name.lastIndexOf(':');
    const base = name.substring(0, colonNdx);
    const tests = collection.get(base) ?? [];
    tests.push(name);
    collection.set(base, tests);
  });

console.log('--- failures by .spec.ts file ---');
console.log(JSON.stringify([...collection.keys()], null, 2));

