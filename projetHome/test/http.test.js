const assert = require("node:assert/strict");
const { Readable } = require("node:stream");
const test = require("node:test");

const { contentTypeForPath, createError, fetchJson, readJsonBody } = require("../server/http");

test("contentTypeForPath maps known web assets and falls back for unknown extensions", () => {
  assert.equal(contentTypeForPath("index.html"), "text/html; charset=utf-8");
  assert.equal(contentTypeForPath("site.css"), "text/css; charset=utf-8");
  assert.equal(contentTypeForPath("site.js"), "text/javascript; charset=utf-8");
  assert.equal(contentTypeForPath("asset.bin"), "application/octet-stream");
});

test("readJsonBody parses valid JSON and reports invalid payloads", async () => {
  assert.deepEqual(await readJsonBody(Readable.from([Buffer.from('{"ok":true}')])), { ok: true });
  assert.deepEqual(await readJsonBody(Readable.from([])), {});
  await assert.rejects(() => readJsonBody(Readable.from([Buffer.from("{broken")])), /Invalid JSON body/);
});

test("createError attaches an HTTP status code", () => {
  const error = createError(422, "Invalid");
  assert.equal(error.statusCode, 422);
  assert.equal(error.message, "Invalid");
});

test("fetchJson sends accept headers and parses JSON responses", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (_url, init) => {
    assert.equal(init.headers.Accept, "application/json");
    return {
      ok: true,
      status: 200,
      text: async () => '{"value":42}',
    };
  };

  assert.deepEqual(await fetchJson("https://example.test/data"), { value: 42 });
});
