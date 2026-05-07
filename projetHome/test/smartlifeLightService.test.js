const assert = require("node:assert/strict");
const test = require("node:test");

const { LightService } = require("../smartlife-proxy/src/lightService");
const { safeJsonParse, toBool, toInt } = require("../smartlife-proxy/src/utils");

const baseConfig = {
  tuya: {
    deviceIds: ["lamp-1"],
    deviceNames: {},
  },
  smartlife: {
    cacheTtlSeconds: 60,
    switchCode: "switch_led",
    brightnessCode: "bright_value_v2",
    brightnessMin: 10,
    brightnessMax: 1000,
  },
};

test("SmartLife utils parse defensive values", () => {
  assert.deepEqual(safeJsonParse('{"min":10}'), { min: 10 });
  assert.deepEqual(safeJsonParse("broken", { fallback: true }), { fallback: true });
  assert.equal(toBool(true), true);
  assert.equal(toBool("true"), false);
  assert.equal(toInt("42"), 42);
  assert.equal(toInt("nope", 7), 7);
});

test("LightService maps Tuya status into normalized light devices and caches results", async () => {
  let detailCalls = 0;
  const tuyaClient = {
    getDeviceDetails: async () => {
      detailCalls += 1;
      return { name: "Desk lamp" };
    },
    getDeviceStatus: async () => [
      { code: "switch_led", value: true },
      { code: "bright_value_v2", value: 505 },
    ],
    getDeviceFunctions: async () => [{ code: "bright_value_v2", values: '{"min":10,"max":1000}' }],
    sendCommands: async () => {},
  };

  const service = new LightService(tuyaClient, baseConfig);
  const first = await service.listLights();
  const second = await service.listLights();

  assert.equal(first.lights[0].name, "Desk lamp");
  assert.equal(first.lights[0].brightness, 50);
  assert.equal(first.lights[0].isOn, true);
  assert.equal(second, first);
  assert.equal(detailCalls, 1);
});

test("LightService sends switch and mapped brightness commands", async () => {
  const commands = [];
  const tuyaClient = {
    getDeviceDetails: async () => ({ name: "Desk lamp" }),
    getDeviceStatus: async () => [
      { code: "switch_led", value: true },
      { code: "bright_value_v2", value: 1000 },
    ],
    getDeviceFunctions: async () => [{ code: "bright_value_v2", values: '{"min":10,"max":1000}' }],
    sendCommands: async (_deviceId, payload) => {
      commands.push(payload);
    },
  };

  const service = new LightService(tuyaClient, baseConfig);
  await service.toggleLight("lamp-1", false);
  await service.setBrightness("lamp-1", 50);

  assert.deepEqual(commands[0], [{ code: "switch_led", value: false }]);
  assert.deepEqual(commands[1], [
    { code: "switch_led", value: true },
    { code: "bright_value_v2", value: 505 },
  ]);
});
