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

`summarize-standalone-cts-json.mjs`
===================================

Prints out all the test cases that failed as well as list of tests (higher-level than cases).
This works on output from the standalone tests. The ones that run in the browser at
[https://gpuweb.github.io/cts/standalone/](https://gpuweb.github.io/cts/standalone/).

Steps:

1. run the cts in the browser.
2. when tests are finished, click "Save results to JSON file" at the bottom of the page

```js
node path/to/summarize-standalone-cts-json.mjs path-to-json-file-you-just-downloaded
```
