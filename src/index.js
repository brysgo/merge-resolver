
export const mergeResolver = resolvers => {
  const merge = objects => {
    const combineNext = (...currentObjects) => {
      let type = resolvers.typeFromObj(currentObjects[0]);

      const fieldValues = currentObjects.reduce((acc, cur) => {
        const curType = resolvers.typeFromObj(cur);
        if (curType !== type) {
          throw new Error(`TypeMismatchError: Cannot merge two different types

          Tried to merge "${curType}" with "${type}"`)
        }
        for (let key in cur) {
          acc[key] = acc[key] || [];
          acc[key].push(cur[key]);
        }
        return acc;
      }, {});

      return Object.keys(fieldValues).reduce((acc, cur) => {
        const resolver =
          (resolvers[type] || {})[cur] ||
          (values => {
            if (typeof values[0] === "string") return values[values.length - 1];
            if (Array.isArray(values[0])) return values.flat();
            return combineNext(...values);
          });
        acc[cur] = resolver(fieldValues[cur], combineNext);
        return acc;
      }, {});
    };

    return combineNext(...objects);
  };
  return merge;
};
