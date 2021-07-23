import { zip } from "lodash";

/**
 * Given a set of inputs and a "producer" function, deliver a map
 * of inputs to outputs when all the outputs are settled.
 */
export default async function produceMap<T extends string | number | symbol, U>(
  inputKeys: T[],
  producer: (input: T) => Promise<U>
): Promise<Record<T, U>> {
  const values = await Promise.all(inputKeys.map(producer));
  return Object.fromEntries(zip(inputKeys, values));
}
