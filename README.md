# merge-resolver

![CI](https://github.com/brysgo/merge-resolver/workflows/CI/badge.svg)
[![npm package][npm-badge]][npm]
![Update](https://github.com/brysgo/merge-resolver/workflows/Update/badge.svg)

> merge nested objects with graphql-like resolvers

## Install

```bash
{yarn, npm} add merge-resolver
```

## Usage

```js
    import { mergeResolver } from "merge-resolver";

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

    console.log(merge([thing1, thing2])));
```

Should print:

```json
    {
      "__typename": "Query",
      "blah": {
        "__typename": "Blah",
        "bazzez": [
          { "__typename": "Baz", "a": "b" },
          { "__typename": "Baz", "a": "c", "d": "fe" }
        ]
      }
    }
```

## License

MIT License

© Bryan Goldstein and Seth Jensen

[npm-badge]: https://img.shields.io/npm/v/merge-resolver.png?style=flat-square
[npm]: https://www.npmjs.org/package/merge-resolver

