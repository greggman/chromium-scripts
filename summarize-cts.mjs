import fs from 'fs';
const filename = process.argv[2];
const tests = JSON.parse(fs.readFileSync(filename, {encoding: 'utf8'}));
const collection = new Map();
tests
  .filter(({Status}) => Status === 'fail')
  .forEach(({ TestCase }) => {
    console.log(TestCase);
    const colonNdx = TestCase.lastIndexOf(':');
    const base = TestCase.substring(0, colonNdx);
    const tests = collection.get(base) ?? [];
    tests.push(TestCase);
    collection.set(base, tests);
  });

console.log('--- failures by .spec.ts file ---');
console.log(JSON.stringify([...collection.keys()], null, 2));

