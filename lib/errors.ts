/**
 * Supabase throws PostgrestError/StorageError objects that carry a
 * `.message` but aren't always strict `instanceof Error`. This pulls a
 * readable string out of whatever got thrown, so error UI never has to
 * guess or fall back to a blank message.
 */
export function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  if (typeof err === "string") return err;
  return "";
}
