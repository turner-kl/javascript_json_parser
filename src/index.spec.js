require("mocha");
require('mocha-suppress-logs')();
const { assert } = require("chai");
const { jsonParser } = require("./index");

describe("json_parse", () => {
  describe("階層", () => {
    it("1層", () => {
      const string = '{"first": "Jerome"}';
      assert.deepEqual(jsonParser(string), JSON.parse(string));
    });

    it("2層", () => {
      const string = '{"first": {"aaa":"bbb"}}';
      assert.deepEqual(jsonParser(string), JSON.parse(string));
    });

    it("3層", () => {
      const string = '{"first": {"aaa":{"bbb":"ccc"}}}';
      assert.deepEqual(jsonParser(string), JSON.parse(string));
    });
  })

  describe("各種データ型", () => {
    it("文字列", () => {
      const string = '{"first": "Jerome"}';
      assert.deepEqual(jsonParser(string), JSON.parse(string));
    });

    describe("数値", () => {
      it("整数1桁", () => {
        const string = '{"first": 1}';
        assert.deepEqual(jsonParser(string), JSON.parse(string));
      });

      it("整数2桁", () => {
        const string = '{"first": 10}';
        assert.deepEqual(jsonParser(string), JSON.parse(string));
      });

      it("小数", () => {
        const string = '{"first": 1.5}';
        assert.deepEqual(jsonParser(string), JSON.parse(string));
      });
    })

    describe("配列", () => {
      it("文字列配列", () => {
        const string = '{"first": ["aaa", "bbb", "ccc"]}';
        assert.deepEqual(jsonParser(string), JSON.parse(string));
      });

      it("数値配列", () => {
        const string = '{"first": [1, 2, 3]}';
        assert.deepEqual(jsonParser(string), JSON.parse(string));
      });

      it("数値と文字列配列", () => {
        const string = '{"first": [1, 2, 3, "aaa"]}';
        assert.deepEqual(jsonParser(string), JSON.parse(string));
      });
    });

  });
});
