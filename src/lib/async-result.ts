export type AsyncResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: unknown };

export async function toResult<T>(promise: Promise<T>): Promise<AsyncResult<T>> {
  try {
    return { data: await promise };
  } catch (error) {
    return { error };
  }
}
