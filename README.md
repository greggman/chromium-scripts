# Scripts for Chromium dev

These are some personal scripts for chromium dev. In particular, working on Dawn

Installation

```sh
git clone https://github.com/greggman/chromium-scripts.git
npm ci
```

---

`summarize-run-cts-json.mjs`
===============================

Prints out all the test cases that failed as well as list of tests (higher-level than cases).
This works on output from dawn-node and run-cts

```sh
# build dawn-node
 (cd $S/chromium/src/third_party/dawn/out/cmake-release && /Applications/CMake.app/Contents/bin/cmake $S/chromium/src/third_party/dawn -GNinja -DCMAKE_BUILD_TYPE=Release -DDAWN_BUILD_NODE_BINDINGS=1 -DCMAKE_OSX_SYSROOT=/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk && ninja dawn.node)

# run it
(cd $S/chromium/src/third_party/dawn &&  ./tools/run run-cts --bin=out/cmake-release --cts=$S/gpuweb/cts --log=$T/cts.txt --output=$T/cts.json  'webgpu:api,*')

 # summarize the results
node summarize-run-cts-json.mjs $T/cts.json
```

---

`filter-cq-json.mjs`
====================

This works on output from the CQ bots. Given a particular run [https://dawn-review.googlesource.com/q/status:merged](https://dawn-review.googlesource.com/q/status:merged),

1. click the 'Checks' tab
2. on the left, click the ↗️ for a particular machine.
3. On the overview tab, click on a step, for example "59. webgpu_cts_tests on Android Device"
4. Near the bottom of the step, click on 'json.output'
5. At the top right, right click 'Raw log' and pick 'Save Link As...'

Assuming you saved it as `log.txt` then

```sh
node filter-cq-json.mjs log.txt
```

---

test-one-spec.ts-on-cq.mjs
==========================

This runs just one (or a few) .spec.ts on the bots via the cts roller

Steps:

1. cd to your cts folder
2. make sure it's clean (git status - no output)
3. make sure it's checked out on the branch you want to test
4. make sure your local dawn checkout is up to date or at least the version you want it at

```js
node path/to/test-one-spec.ts-on-cq.mjs --dawn=path/to/dawn "--test=nameOfTest.spec.ts"
```

What this will do:

1. check git is clean
2. create a new branch named `cq-test-<xxx>`
3. git rm all .spec.ts files except regex matches for `--test=<regex>`
4. munge `tools/gen_wpt_cfg_withsomeworkers.json` and `src/webgpu/listing_meta.json` to make `npm test` happy
5. `git commit` all of this
6. upload `cq-test-<xxx>` to your github
7. execute `(cd path-to-dawn && tools/run cts roll --max-attempts 0 --repo <remote-origin> --preserve --revision <revision>)`

