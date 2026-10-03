// Maps "next/link" onto the stub beside this file, for scripts that render a
// Server Component directly.
const STUB = new URL("./next-link.mjs", import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/link") return { url: STUB, shortCircuit: true };
  return nextResolve(specifier, context);
}
