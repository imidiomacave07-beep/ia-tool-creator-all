const test = require("node:test");
const assert = require("node:assert/strict");

function dimensionsFor(ratio) {
  if (ratio === "9:16") return { width: 720, height: 1280 };
  if (ratio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1280, height: 720 };
}

test("uses landscape dimensions for 16:9", () => {
  assert.deepEqual(dimensionsFor("16:9"), { width: 1280, height: 720 });
});

test("uses portrait dimensions for 9:16", () => {
  assert.deepEqual(dimensionsFor("9:16"), { width: 720, height: 1280 });
});

test("uses square dimensions for 1:1", () => {
  assert.deepEqual(dimensionsFor("1:1"), { width: 1080, height: 1080 });
});
