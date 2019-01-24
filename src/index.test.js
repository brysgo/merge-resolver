import { mergeResolver } from "./";
import { mergeResolver as mergeResolverDist } from "../dist";
import flat from "array.prototype.flat";

flat.shim();

describe("build products", () => {
  it("doesn't break", () => {
    const thing1 = {
      __typename: "Query",
      blah: {
        __typename: "Blah",
        bazzez: [
          { __typename: "Baz", a: "b" },
          { __typename: "Baz", a: "c", d: "e" }
        ]
      }
    };
    const thing2 = {
      __typename: "Query",
      blah: {
        __typename: "Blah",
        bazzez: [{ __typename: "Baz", a: "c", d: "f" }]
      }
    };

    const merge = mergeResolverDist({
      Blah: {
        bazzez: (values, join) => {
          const valuesByKey = {};
          values.flat().forEach(val => {
            valuesByKey[val.a] = valuesByKey[val.a]
              ? join(val, valuesByKey[val.a])
              : val;
          });
          return Object.values(valuesByKey);
        }
      },
      Baz: {
        d: values => values.join("")
      },
      typeFromObj: obj => obj && obj.__typename
    });

    expect(merge([thing1, thing2])).toEqual({
      __typename: "Query",
      blah: {
        __typename: "Blah",
        bazzez: [
          { __typename: "Baz", a: "b" },
          { __typename: "Baz", a: "c", d: "fe" }
        ]
      }
    });
  });
});

describe("mergeResolver", () => {
  it("throws an error instead of merging different types", () => {
    const typeA = "A";
    const typeB = "B";
    const merge = mergeResolver({ typeFromObj: o => o });
    expect(() => merge([typeA, typeB])).toThrowErrorMatchingSnapshot();
  });

  it("supports setting types on arrays", () => {
    const merge = mergeResolver({
      Array: (values, join) => "dope",
      typeFromObj: o => (Array.isArray(o) ? "Array" : undefined)
    });
    expect(
      merge([{ a: { one: "one" }, b: [] }, { a: { one: "two" }, b: [] }])
    ).toMatchSnapshot();
  });

  it("delegates merge decisions by type", () => {
    const thing1 = {
      __typename: "Query",
      blah: {
        __typename: "Blah",
        bazzez: [
          { __typename: "Baz", a: "b" },
          { __typename: "Baz", a: "c", d: "e" }
        ]
      }
    };
    const thing2 = {
      __typename: "Query",
      blah: {
        __typename: "Blah",
        bazzez: [{ __typename: "Baz", a: "c", d: "f" }]
      }
    };

    const merge = mergeResolver({
      Blah: {
        bazzez: (values, join) => {
          const valuesByKey = {};
          values.flat().forEach(val => {
            valuesByKey[val.a] = valuesByKey[val.a]
              ? join(val, valuesByKey[val.a])
              : val;
          });
          return Object.values(valuesByKey);
        }
      },
      Baz: {
        d: values => values.join("")
      },
      typeFromObj: obj => obj && obj.__typename
    });

    expect(merge([thing1, thing2])).toEqual({
      __typename: "Query",
      blah: {
        __typename: "Blah",
        bazzez: [
          { __typename: "Baz", a: "b" },
          { __typename: "Baz", a: "c", d: "fe" }
        ]
      }
    });
  });
});

describe("when types are defined without resolvers", () => {
  it("still uses default resolvers", () => {
    const merge = mergeResolver({
      typeFromObj: obj => obj && obj.__typename
    });

    expect(
      merge([
        {
          __typename: "NoResolver",
          a: 1,
          b: { __typename: "And", c: "hello" },
          d: ["ei"]
        },
        {
          __typename: "NoResolver",
          a: 2,
          b: { __typename: "And", c: "world" },
          d: ["eio"]
        }
      ])
    ).toEqual({
      __typename: "NoResolver",
      a: 2,
      b: { __typename: "And", c: "world" },
      d: ["ei", "eio"]
    });
  });
});
