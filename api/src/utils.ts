/**
 * Returns true if every element of `arr1` exists in `arr2`,
 * and false otherwise.
 */
const isSubsetOf = <T>(arr1: T[], arr2: T[]) => {
  const set2 = new Set(arr2);
  return arr1.every((i) => set2.has(i));
};

export { isSubsetOf };
