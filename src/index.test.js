import { mergeResolver } from "./";
import { mergeResolver as mergeResolverDist } from "../dist";
import 'array-flat-polyfill';

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
