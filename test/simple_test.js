import { mergeResolver } from "../src";
import { mergeResolver as mergeResolverDist } from "../build";
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
      Item: ([left, right], join) => {
        return {
          detectedType: "Item",
          ...join(left, right)
        };
      },
      Array: ([left, right], join) => left.map((l, i) => join(l, right[i])),
      typeFromObj: (o, path, ancestorTypes) => {
        if ("Array" === Array.from(ancestorTypes).pop()) {
          return "Item";
        }
        return Array.isArray(o) ? "Array" : undefined;
      }
    });
    expect(
      merge([
        { a: { one: "one" }, b: [{ foo: "bar" }] },
        { a: { one: "two" }, b: [{ baz: "bop" }] }
      ])
    ).toMatchSnapshot();
  });

  it("delegates merge decisions by type", () => {
    const thing1 = {
      __typename: "Query",
      blah: {
        bazzez: [
          { __typename: "Baz", a: "b" },
          { __typename: "Baz", a: "c", d: "e" }
        ]
      }
    };
    const thing2 = {
      __typename: "Query",
      blah: {
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
      typeFromObj: (obj, path, ancestorTypes) => {
        if (obj && obj.__typename) return obj.__typename;
        if (
          path &&
          ancestorTypes &&
          Array.from(path).pop() === "blah" &&
          Array.from(ancestorTypes).pop() === "Query"
        )
          return "Blah";
      }
    });

    expect(merge([thing1, thing2])).toEqual({
      __typename: "Query",
      blah: {
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
