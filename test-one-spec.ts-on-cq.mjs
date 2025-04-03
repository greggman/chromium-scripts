/*
 steps
   1. check git is clean
   2. create cq-test-xxx
   3. delete all .spec.ts except glob
   4. remove everything except 'webgpu:print_environment:*' from tools/gen_wpt_cfg_withsomeworkers.json
   5. change src/webgpu/listing_meta.json to
      {
        "_comment": "",
        "_end": ""
      }
      run-cts requires this because it doesn't actually parse the file as JSON, it just inserts lines in the format of:
        "test:query": { "subcaseMS": 0.123 },
   6. commit git changes
   7. upload cq-test-xxx to github
   8. get revision number and remote origin from git
   9. execute (cd $S/chromium/src/third_party/dawn && tools/run cts roll --max-attempts 0 --repo <remote-origin> --preserve --revision <revision>)
      ... consider not using tools/run cts roll for this - or add options to name it something other than "[DO NOT SUBMIT] Roll third_party/webgpu-cts/ 5fbd82847..546ab9375 (21 commits)"
*/
import fs from 'node:fs';
import { simpleGit } from 'simple-git';
import { execute } from './lib/execute.js';

const args = {};

const argHandlers = {
  help() {
    showHelp();
  },
  test(key, value) {
    assertParam(key, value);
    args.test = value;
  },
  name(key, value) {
    assertParam(key, value);
    args.name = value;
  },
  'dawn'(key, value) {
    assertParam(key, value);
    args.dawn = value;
  },
  'dry-run'() {
    args.dryRun = true;
  },
};

for(let arg of process.argv.slice(2)) {
  if (arg.startsWith('--')) {
    const equalNdx = arg.indexOf('=');
    const [key, value] = equalNdx >= 0
      ? [arg.substring(2, equalNdx), arg.substring(equalNdx + 1)]
      : [arg.substring(2), undefined];
    const handler = argHandlers[key];
    if (!handler) {
      fail(`unknown option --${key}`);
      showHelp();
    }
    handler(key, value);
  } else {
    fail(`unknown argument: ${arg}`);
  }
}
if (!args.dawn) {
  fail('missing --dawn=<path-to-dawn>')
}

function assertParam(argName, param) {
  if (param === undefined) {
    console.error(`param for option ${argName} missing: format is --${argName}=param`);
  }
}

function showHelp() {
  console.log(`\
node ${process.argv[1]} "--test=<regex-files-to-keep>"

  --dry-run      : show a bunch of output without executing.
  --test=<regex> : files to keep (case sensitive)
      eg: "--test=atomicAdd.spec.ts" - keeps "atomicAdd.spec.ts" (well, technically the . = any character)
      eg: "--test=atomic.*?\.spec\.ts$" - matches "atomicAdd.spec.ts", "atomicMax.spec.ts", etc...
  --name=<branch-name> : name to name the branch, default is "cq-test-<number>"
`);
  process.exit(0);
}

const git = simpleGit();
await checkGitIsClean(git, args);
const branchName = await createCQBranch(git, args);
await deleteAllSpecTSFilesExceptTest(git, args);
await fixupGenWPTCfgWithSomeWorkers(git, args);
await fixupListingMetaJson(git, args);
const hash = await commitGitChanges(git, args);
await uploadToGithub(git, args, branchName);
await executeCQ(git, args, hash);

async function checkGitIsClean(git, args) {
  // 1. check git is clean
  const status = await git.status();
  if (status.files.length > 0) {
    fail('current folder not clean - use git status');
  }
}

async function createCQBranch(git, args) {
  // 2. create cq-test-xxx
  const branchName = `cq-test-${Date.now()}`;
  log(`creating branch: ${branchName}`);
  if (!args.dryRun) {
    await git.checkoutLocalBranch(branchName);
  }
  return branchName;
}

async function deleteAllSpecTSFilesExceptTest(git, args) {
  // 3. delete all .spec.ts except glob
  const keepRE = new RegExp(args.test);
  const files = readDir('./src/webgpu').filter(f => f.endsWith('.spec.ts') && !f.endsWith('print_environment.spec.ts'));
  const [filtered, unfiltered] = filter(files, f => !keepRE.test(f));
  log('delete:')
  log(filtered.map(v => `  ${v}`).join('\n'));
  log('keep:')
  log(unfiltered.map(v => `  ${v}`).join('\n'));
  if (!args.dryRun) {
    await git.rm(filtered);
  }
}

//   4. remove everything except 'webgpu:print_environment:*' from tools/gen_wpt_cfg_withsomeworkers.json
async function fixupGenWPTCfgWithSomeWorkers(git, args) {
  const filename = 'tools/gen_wpt_cfg_withsomeworkers.json';
  const data = JSON.parse(fs.readFileSync(filename, { encoding: 'utf-8' }));
  for (const d of data.argumentsPrefixes) {
    if (d.filters) {
      d.filters = ['webgpu:print_environment:*'];
    }
  }
  log(`update ${filename}`);
  if (args.dryRun) {
    return;
  }

  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  await git.add([filename]);
}

//   5. change src/webgpu/listing_meta.json to
//      {
//        "_comment": "",
//        "_end": ""
//      }
//      run-cts requires this because it doesn't actually parse the file as JSON, it just inserts lines in the format of:
//        "test:query": { "subcaseMS": 0.123 },
async function fixupListingMetaJson(git, args) {
  const filename = 'src/webgpu/listing_meta.json';
  log(`update ${filename}`);
  if (args.dryRun) {
    return;
  }

  const data = {
    "_comment": "",
    "_end": ""
  };
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  await git.add([filename]);
}

//   6. commit git changes
async function commitGitChanges(git, args) {
  log('git commit');
  if (args.dryRun) {
    return "not-real-hash";
  }
  const result = await git.commit(`test for CQ for ${args.test}`);
  return result.commit;
}

//   7. upload cq-test-xxx to github
async function uploadToGithub(git, args, branchName) {
  log(`git push origin ${branchName}`);
  if (args.dryRun) {
    return;
  }
  await git.push('origin', branchName);
}

//   8. get revision number and remote origin from git
//   9. execute (cd $S/chromium/src/third_party/dawn && tools/run cts roll --max-attempts 0 --repo <remote-origin> --preserve --revision <revision>)
//      ... consider not using tools/run cts roll for this - or add options to name it something other than "[DO NOT SUBMIT] Roll third_party/webgpu-cts/ 5fbd82847..546ab9375 (21 commits)"
async function executeCQ(git, args, hash) {
  const remotes = await git.getRemotes(true);
  const byName = Object.fromEntries(remotes.map(r => [r.name, r]));
  const url = gitURlToHttps(byName.origin.refs.push);
  const cmd = './tools/run';
  const cmdArgs = [
    'cts', 'roll',
    '--max-attempts', '0',
    '--repo', url,
    '--preserve',
    '--revision', hash,
  ];
  log(`cd ${args.dawn}`);
  log(`${cmd} ${cmdArgs.map(v => `"${v}"`).join(' ')}`);
  if (args.dryRun) {
    return;
  }
  await execute(cmd, cmdArgs, { cwd: args.dawn });
}

function gitURlToHttps(s) {
  const gitRE = /git@github.com\:(.*?)\/(.*?).git/;
  const m = gitRE.exec(s);
  return m
    ? `https://github.com/${m[1]}/${m[2]}.git`
    : s;
}

function readDir(path) {
  return fs.readdirSync(path, { recursive: true }).map(v => `${path}/${v}`);
}

function filter(array, fn) {
  const filtered = [];
  const unfiltered = [];
  for (const elem of array) {
    (fn(elem) ? filtered : unfiltered).push(elem);
  }
  return [filtered, unfiltered];
}

function log(...args) {
  console.log(...args);
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}
