require("mocha");
const { assert } = require("chai");
const { jsonParser } = require("./turner");

describe("json_parse", () => {
  it("単純なKeyValue", () => {
    const string1 = '{"first": "Jerome"}';
    const expect1 = JSON.parse(string1);
    assert.deepEqual(jsonParser(string1), expect1);
  });

  it("階層構造になったKeyValue", () => {
    const string2 = '{"first": {"aaa":"bbb"}}';
    const expect2 = JSON.parse(string2);
    assert.deepEqual(jsonParser(string2), expect2);
  });
});
