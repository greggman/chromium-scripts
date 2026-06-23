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
import { execute } from './lib/execute.js';

function camelCaseToDashCase(id) {
  return id
    .replace(/(.)([A-Z][a-z]+)/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function dashCaseToCamelCase(name) {
  return name
    .split('-')
    .map(v => v.charAt(0).toUpperCase() + v.slice(1))
    .join('');
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

function help(msg) {
  console.error('ERROR:', msg);
  console.log('example arguments:')
  console.log(Object.entries(commonArgs).map(([k, v]) => `  --${camelCaseToDashCase(k)}=${v}`).join('\n'));
  process.exit(1);
}

async function main() {
  for (let i = 2; i < process.argv.length; ++i) {
    const option = process.argv[i];
    if (!option.startsWith('-')) {
      help(`unknown argument: ${option}`);
    }
    const rawOption = option.replace(/^-+/, '')
    const equalNdx = rawOption.indexOf('=');
    let name;
    let value;
    if (equalNdx > 0) {
      name = rawOption.substring(0, equalNdx);
      value = rawOption.substring(equalNdx + 1);
    } else {
      name = rawOption;
      value = process.argv[++i];
    }
    const camelCaseName = dashCaseToCamelCase(name);
    if (!camelCaseName in commonArgs) {
      help(`unknown argument: ${option}`);
    }
    if (!value) {
      help(`unknown argument: ${option}`);
    }
    commonArgs[name] = value;
  }

  for (const { benchmark, story, cfgs } of tests) {
    for (const cfg of cfgs) {
      const args = {
        ...commonArgs,
        benchmark,
        story,
        cfg,
      }
      await pinpointExperimentTelemetryStart(args);
    }
  }
}

main();

