import fs from 'fs';
const filename = process.argv[2];

const byStatus = new Map();

const tests = JSON.parse(fs.readFileSync(filename, {encoding: 'utf8'})).tests;
Object.entries(tests)
  .forEach(([name, info]) => {
    const testsOfStatus = byStatus.get(info.actual) ?? [];
    byStatus.set(info.actual, testsOfStatus);
    info.name = name;
    testsOfStatus.push(info);
  });

for (const [status, tests] of byStatus.entries()) {
  if (status === 'PASS') {
    continue;
  }
  console.log('====== [', status, '] ======');
  tests.sort((a, b) => a.name > b.name);
  for (let test of tests) {
    console.log(`  ${test.actual} ${test.expected}: ${test.name}`);
  }
  console.log('\n');
}

console.log('summary:');
let sum = 0;
for (const [status, tests] of byStatus.entries()) {
  console.log(`  ${status}: ${tests.length}`);
  sum += tests.length;
}
console.log(`total: ${sum}`);

