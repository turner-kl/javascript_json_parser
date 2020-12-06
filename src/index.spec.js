require("mocha");
const { assert } = require("chai");
const { json_parse } = require("./index");

const string = '{"first": "Jerome"}';
const expect = { first: "Jerome" };

describe("json_parse", () => {
  it("should return a JSON object given a string", () => {
    assert.deepEqual(json_parse(string), expect);
  });
});
