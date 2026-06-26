// MIRROR FILE: kept in sync with universal_base_v1_blank/src/lib/api/pathParams.ts
// AND with src/task/shared/path-params.ts in the orchestrator codebase.
// The `substitutePath` function body MUST match the orchestrator copy byte-for-byte —
// generated service files call this when an endpoint has `:param` segments.

const PARAM_RE = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;

export function substitutePath(
  path: string,
  params: Record<string, string | number>,
): string {
  return path.replace(PARAM_RE, (_, key: string) => {
    const v = params[key];
    if (v === undefined || v === null || v === '') {
      throw new Error(`substitutePath: missing path param ":${key}" for "${path}"`);
    }
    return encodeURIComponent(String(v));
  });
}
