/*
pinpoint experiment-telemetry-start \
-base-commit=9f798ea0366b9c446bd028926bca0721c5d1c23a \
-benchmark=rendering.mobile.notracing \
-cfg=android-pixel4-perf \
-exp-commit=9f798ea0366b9c446bd028926bca0721c5d1c23a \
-exp-patch-url=https://chromium-review.googlesource.com/c/7960498 \
-attempts=150 \
-story=motionmark_ramp_composite
*/
import { parseArgs } from 'node:util';
import { execute } from './lib/execute.js';

function camelCaseToDashCase(id) {
  return id
    .replace(/(.)([A-Z][a-z]+)/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

async function pinpointExperimentTelemetryStart(_args) {
  const args = [
    'experiment-telemetry-start',
  ];
  for (const [key, value] of Object.entries(_args)) {
    args.push(`-${camelCaseToDashCase(key)}=${value}`);
  }
  await execute('pinpoint', args);
}

const commonArgs = {
  baseCommit: '9f798ea0366b9c446bd028926bca0721c5d1c23a',
  expCommit: '9f798ea0366b9c446bd028926bca0721c5d1c23a',
  expPatchUrl: 'https://chromium-review.googlesource.com/c/7960498',
  attempts: 150,
};

const mobileCfgs = [
  'android-pixel4-perf',

];

const desktopCfgs = [
  'mac-m1_mini_2020-perf',
  'linux-r350-perf',
  'win-11-perf',
];

const allCfgs = [
  ...mobileCfgs,
  ...desktopCfgs,
];

const tests = [
  {
    benchmark: 'rendering.mobile.notracing',
    story: 'motionmark_ramp_composite',
    cfgs: mobileCfgs,
  },
  {
    benchmark: 'rendering.desktop.notracing',
    story: 'motionmark_ramp_composite',
    cfgs: desktopCfgs,
  },
  {
    benchmark: 'speedometer3',
    story: 'Speedometer3',
    cfgs: allCfgs,
  },
  {
    benchmark: 'jetstream2',
    story: 'JetStream2',
    cfgs: allCfgs,
  },
];

const options = {
  help: { type: 'boolean', short: 'h', description: 'Show this help message' },
  benchmark: { type: 'string', description: 'Filter by benchmark (case-insensitive substring)' },
  bot: { type: 'string', description: 'Filter by bot (case-insensitive substring)' },
};

for (const key of Object.keys(commonArgs)) {
  options[camelCaseToDashCase(key)] = {
    type: 'string',
    description: `Default: ${commonArgs[key]}`,
  };
}

function printUsage() {
  console.log('Usage: node pinpoint-batch.mjs [options]');
  console.log('Options:');
  for (const [name, opt] of Object.entries(options)) {
    const alias = opt.short ? `-${opt.short}, ` : '    ';
    const argType = opt.type === 'string' ? '=<value>' : '';
    const optionStr = `${alias}--${name}${argType}`;
    console.log(`  ${optionStr.padEnd(30)} ${opt.description || ''}`);
  }
  console.log('\nBenchmarks:');
  const uniqueBenchmarks = [...new Set(tests.map(t => t.benchmark))];
  for (const benchmark of uniqueBenchmarks) {
    console.log(`  ${benchmark}`);
  }
  console.log('\nBots:');
  const uniqueCfgs = [...new Set(allCfgs)];
  for (const cfg of uniqueCfgs) {
    console.log(`  ${cfg}`);
  }
}

async function main() {
  let values;
  try {
    const result = parseArgs({ options });
    values = result.values;
  } catch (err) {
    console.error('ERROR:', err.message);
    printUsage();
    process.exit(1);
  }

  if (values.help) {
    printUsage();
    process.exit(0);
  }

  for (const key of Object.keys(commonArgs)) {
    const dashCaseKey = camelCaseToDashCase(key);
    if (values[dashCaseKey] !== undefined) {
      const originalValue = commonArgs[key];
      if (typeof originalValue === 'number') {
        const num = Number(values[dashCaseKey]);
        if (Number.isNaN(num)) {
          console.error(`ERROR: --${dashCaseKey} must be a number`);
          printUsage();
          process.exit(1);
        }
        commonArgs[key] = num;
      } else {
        commonArgs[key] = values[dashCaseKey];
      }
    }
  }

  const benchmarkFilter = values.benchmark?.toLowerCase();
  const botFilter = values.bot?.toLowerCase();

  for (const { benchmark, story, cfgs } of tests) {
    if (benchmarkFilter && !benchmark.toLowerCase().includes(benchmarkFilter)) {
      continue;
    }
    for (const cfg of cfgs) {
      if (botFilter && !cfg.toLowerCase().includes(botFilter)) {
        continue;
      }
      const args = {
        ...commonArgs,
        benchmark,
        story,
        cfg,
      };
      console.log('run:', JSON.stringify(args));
      await pinpointExperimentTelemetryStart(args);
    }
  }
}

main();

