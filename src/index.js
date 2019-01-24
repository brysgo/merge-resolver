const flat = require("array.prototype.flat");

const defaultResolver = (values, join) => join(...values);

export const mergeResolver = resolvers => {
  const merge = objects => {
    const combineNext = (...currentObjects) => {
      let type = resolvers.typeFromObj(currentObjects[0]);
      if (!type) {
        if (
          typeof currentObjects[0] === "string" ||
          typeof currentObjects[0] === "number"
        )
          return currentObjects[currentObjects.length - 1];
        if (Array.isArray(currentObjects[0])) return flat(currentObjects);
      }

      if (typeof resolvers[type] === "function") {
        // short circuit field level resolution if a function if provided for the type
        return resolvers[type](currentObjects, combineNext);
      }

      const fieldValues = currentObjects.reduce((acc, cur) => {
        const curType = resolvers.typeFromObj(cur);
        if (curType !== type) {
          throw new Error(`TypeMismatchError: Cannot merge two different types

          Tried to merge "${curType}" with "${type}"`);
        }
        for (let key in cur) {
          acc[key] = acc[key] || [];
          acc[key].push(cur[key]);
        }
        return acc;
      }, {});

      return Object.keys(fieldValues).reduce((acc, cur) => {
        const resolver = (resolvers[type] || {})[cur] || defaultResolver;
        acc[cur] = resolver(fieldValues[cur], combineNext);
        return acc;
      }, {});
    };

    return combineNext(...objects);
  };
  return merge;
};
