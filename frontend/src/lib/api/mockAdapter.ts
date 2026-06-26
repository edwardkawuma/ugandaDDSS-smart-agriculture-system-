// MIRROR FILE: kept in sync between universal_base_v1_auth/ and universal_base_v1_blank/.
// If you edit one, edit the other.
//
// Runtime mock adapter for axios.
// Activated when VITE_USE_MOCK === 'true' (see main.tsx).
// Reads ./__seed__.json (generated at scaffold time from /planner/api_details/)
// and serves stateful CRUD against an in-memory copy of the seed.

import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import seedData from './__seed__.json';

type RouteAction = 'list' | 'detail' | 'create' | 'update' | 'delete' | 'singleton' | 'aggregate' | 'custom';

interface RouteSpec {
  entity: string;
  subResource?: string;
  storeKey: string;
  parentFkField?: string;
  action: RouteAction;
  responseShape: unknown;
  fileName: string;
  pathTemplate: string;
  pathParams: string[];
}

interface MockSeed {
  records: Record<string, Array<Record<string, any>>>;
  routes: Record<string, RouteSpec>;
  searchFields: Record<string, string[]>;
  primaryKey: Record<string, string>;
}

const seed: MockSeed = JSON.parse(JSON.stringify(seedData));

// Pre-build (verb, regex, route) tuples once at module load so the per-request
// path is just a list scan + regex match. Same algorithm as the orchestrator's
// shared/path-params.ts — pasted to keep the template self-contained.
function pathTemplateToRegex(template: string): RegExp {
  const pat = template
    .replace(/[.+*?^${}()|[\]\\]/g, '\\$&')
    .replace(/\/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '/(?<$1>[^/]+)');
  return new RegExp(`^${pat}$`);
}

const COMPILED_ROUTES: Array<{ verb: string; regex: RegExp; route: RouteSpec }> = Object.entries(seed.routes).map(
  ([key, route]) => {
    const sp = key.indexOf(' ');
    const verb = key.slice(0, sp);
    // Prefer the explicit pathTemplate field; fall back to the route key path.
    const tmpl = route.pathTemplate ?? key.slice(sp + 1);
    return { verb, regex: pathTemplateToRegex(tmpl), route };
  },
);

function genId(): string {
  return 'mk-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
}

function toFiniteNumber(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function applyFilters(
  rows: Array<Record<string, any>>,
  params: Record<string, any>,
  searchFields: string[],
  knownKeys: string[],
): Array<Record<string, any>> {
  let out = rows;
  const search = (params.search ?? '').toString().trim().toLowerCase();
  if (search) {
    out = out.filter((r) =>
      searchFields.some((f) => {
        const v = r[f];
        return v != null && v.toString().toLowerCase().includes(search);
      }),
    );
  }
  const knownSet = new Set(knownKeys);
  for (const [key, val] of Object.entries(params)) {
    if (key === 'search' || key === 'page' || key === 'limit') continue;
    if (val == null || val === '') continue;
    if (key === 'date_from') {
      const d = new Date(val as string).getTime();
      out = out.filter((r) => {
        const cand = r.created_at ?? r.date ?? r.due_date;
        return cand && new Date(cand).getTime() >= d;
      });
      continue;
    }
    if (key === 'date_to') {
      const d = new Date(val as string).getTime();
      out = out.filter((r) => {
        const cand = r.created_at ?? r.date ?? r.due_date;
        return cand && new Date(cand).getTime() <= d;
      });
      continue;
    }
    if (knownSet.has(key)) {
      out = out.filter((r) => String(r[key]) === String(val));
    }
  }
  return out;
}

function paginate(rows: Array<Record<string, any>>, params: Record<string, any>) {
  const page = Math.max(1, toFiniteNumber(params.page, 1));
  const limit = Math.max(1, toFiniteNumber(params.limit, 10));
  const total = rows.length;
  const start = (page - 1) * limit;
  const data = rows.slice(start, start + limit);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { data, total, page, limit, totalPages };
}

function buildOk<T>(config: InternalAxiosRequestConfig | AxiosRequestConfig, data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: config as InternalAxiosRequestConfig,
  };
}

function buildNotFound(config: InternalAxiosRequestConfig | AxiosRequestConfig, message: string): AxiosResponse {
  return {
    data: { message },
    status: 404,
    statusText: 'Not Found',
    headers: {},
    config: config as InternalAxiosRequestConfig,
  };
}

function denormalize(record: Record<string, any>) {
  for (const key of Object.keys(record)) {
    if (!key.endsWith('_name')) continue;
    const stem = key.slice(0, -'_name'.length);
    const idField = `${stem}_id`;
    if (!Object.prototype.hasOwnProperty.call(record, idField)) continue;
    const parentId = record[idField];
    if (!parentId) continue;
    for (const [parentStoreKey, rows] of Object.entries(seed.records)) {
      const pPk = seed.primaryKey[parentStoreKey];
      if (!pPk) continue;
      const parent = rows.find((r) => r[pPk] === parentId);
      if (parent && parent.name) {
        record[key] = parent.name;
        break;
      }
    }
  }
}

function getQueryParams(config: AxiosRequestConfig): Record<string, any> {
  const params = config.params ?? {};
  return params as Record<string, any>;
}

function getBody(config: AxiosRequestConfig): Record<string, any> {
  const data = config.data ?? {};
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return {}; }
  }
  return data as Record<string, any>;
}

/**
 * Built-in handlers for auth endpoints shipped by the universal_base_v1_auth template.
 * These don't appear in /planner/api_details/, so the seed-driven router won't see them.
 * Returning sensible mock responses lets the auth template's screens work end-to-end.
 */

// Derive a role from the email's local part (everything before `@`), lowercased.
// Demo credentials follow the convention `{role}@demo.com` so `manager@demo.com`
// → `manager`, `employee@demo.com` → `employee`. Without a role on the signin
// response, ProtectedRoute's role check denies every protected page and the
// content area renders blank — that was the #1 "page is empty after login"
// bug report. A numeric suffix is stripped so `manager1@demo.com` still
// resolves to `manager`. Falls back to `user` for any non-conforming email.
function roleFromEmail(email: string | undefined): string {
  if (!email) return 'user';
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  return local.replace(/\d+$/, '') || 'user';
}

function handleAuthRoute(verb: string, urlPath: string, config: AxiosRequestConfig): AxiosResponse | null {
  const stripped = urlPath.replace(/^\/+/, '').toLowerCase();
  const body = getBody(config);
  const buildAuthOk = <T>(payload: T) => buildOk(config, payload as any);

  if (verb === 'POST' && stripped === 'auth/signin') {
    const email = body.email ?? 'mock@example.com';
    return buildAuthOk({
      token: 'mock-token-' + Math.random().toString(36).slice(2, 10),
      user_id: 'mock-user-001',
      email,
      name: 'Mock User',
      is_email_verified: 1,
      role: roleFromEmail(email),
    });
  }
  if (verb === 'POST' && stripped === 'auth/signup') {
    return buildAuthOk({ user_id: 'mock-user-' + Math.random().toString(36).slice(2, 8) });
  }
  if (verb === 'POST' && stripped === 'auth/verifyotp') {
    return buildAuthOk({
      token: 'mock-token-' + Math.random().toString(36).slice(2, 10),
      user_id: 'mock-user-001',
      role: roleFromEmail(body.email),
    });
  }
  if (verb === 'POST' && stripped === 'auth/verifyresetotp') {
    return buildAuthOk({ reset_token: 'mock-reset-' + Math.random().toString(36).slice(2, 10) });
  }
  if (
    verb === 'POST' &&
    (stripped === 'auth/forgotpassword' ||
      stripped === 'auth/resetpassword' ||
      stripped === 'auth/resendotp' ||
      stripped === 'auth/resendresetotp')
  ) {
    return buildAuthOk({});
  }
  if (verb === 'GET' && stripped.startsWith('user/profile/')) {
    return buildAuthOk({
      user_id: stripped.split('/').pop() ?? 'mock-user-001',
      email: 'mock@example.com',
      name: 'Mock User',
    });
  }
  return null;
}

/**
 * Find a route entry whose verb matches and whose template-regex matches the
 * incoming URL. Returns the matched route plus the captured path-param values.
 */
function matchRoute(verb: string, urlPath: string): { route: RouteSpec; pathValues: Record<string, string> } | null {
  for (const compiled of COMPILED_ROUTES) {
    if (compiled.verb !== verb) continue;
    const m = compiled.regex.exec(urlPath);
    if (!m) continue;
    const pathValues: Record<string, string> = {};
    if (m.groups) {
      for (const [k, v] of Object.entries(m.groups)) {
        if (v !== undefined) pathValues[k] = v;
      }
    }
    return { route: compiled.route, pathValues };
  }
  return null;
}

export const mockAdapter: AxiosAdapter = async (config) => {
  const verb = (config.method ?? 'get').toUpperCase();
  const url = (config.url ?? '').replace(/\?.*$/, '').replace(/^https?:\/\/[^/]+/, '');
  const path = url.startsWith('/') ? url : `/${url}`;

  // small simulated latency so loading states render
  await new Promise((r) => setTimeout(r, 80));

  // Hand-rolled handlers for the auth template's static endpoints (not in api_details/)
  const authResponse = handleAuthRoute(verb, path, config);
  if (authResponse) return authResponse;

  const matched = matchRoute(verb, path);
  if (!matched) {
    // eslint-disable-next-line no-console
    console.warn(
      `[mockAdapter] No route registered for ${verb} ${path} — returning 404. Available:`,
      Object.keys(seed.routes),
    );
    return buildNotFound(config, `No mock route for ${verb} ${path}`);
  }
  const { route, pathValues } = matched;

  const storeKey = route.storeKey;
  const rows = (seed.records[storeKey] ??= []);
  const pk = seed.primaryKey[storeKey] ?? 'id';
  const searchFields = seed.searchFields[storeKey] ?? [];

  // Merge captured path params into the query params so filters / detail lookups
  // can read them uniformly. Path values win over query values when both are present.
  const queryParams: Record<string, any> = { ...getQueryParams(config), ...pathValues };
  // Aliases so callers that still pass `id` still resolve detail/update/delete.
  if (!queryParams[pk] && queryParams.id) queryParams[pk] = queryParams.id;

  // PATCH aliases to update.
  const effectiveAction: RouteAction = verb === 'PATCH' && route.action === 'custom' ? 'update' : route.action;

  // Known shape keys for filter validation — fall back to first row keys.
  const knownKeys = rows[0] ? Object.keys(rows[0]) : [];

  if (effectiveAction === 'list') {
    const filtered = applyFilters(rows, queryParams, searchFields, knownKeys);
    const page = paginate(filtered, queryParams);
    return buildOk(config, { message: 'OK', ...page });
  }

  if (effectiveAction === 'singleton' || effectiveAction === 'aggregate') {
    return buildOk(config, { message: 'OK', data: rows[0] ?? {} });
  }

  if (effectiveAction === 'detail') {
    const id = queryParams[pk];
    const found = rows.find((r) => r[pk] === id);
    if (!found) return buildNotFound(config, `${storeKey} ${id} not found`);
    return buildOk(config, { message: 'OK', data: found });
  }

  if (effectiveAction === 'create') {
    const body = getBody(config);
    const record: Record<string, any> = { ...body, [pk]: genId(), created_at: new Date().toISOString() };
    if (route.parentFkField && !record[route.parentFkField] && body[route.parentFkField]) {
      record[route.parentFkField] = body[route.parentFkField];
    }
    // Inherit parent FK from the path when the URL carries it (e.g.
    // POST /leads/:lead_id/follow_ups → set follow_up.lead_id from pathValues.lead_id).
    // We first try the convention-derived FK column name, then fall back to a
    // case-insensitive scan of pathValues so planner variations like ":leadId"
    // still resolve to the snake_case "lead_id" column.
    if (route.parentFkField && !record[route.parentFkField]) {
      const fk = route.parentFkField;
      let val: unknown = pathValues[fk];
      if (val == null) {
        const fkLower = fk.replace(/_/g, '').toLowerCase();
        for (const [k, v] of Object.entries(pathValues)) {
          if (k.replace(/_/g, '').toLowerCase() === fkLower) {
            val = v;
            break;
          }
        }
      }
      if (val != null) record[fk] = val;
    }
    denormalize(record);
    rows.push(record);
    return buildOk(config, { message: 'Created', data: record });
  }

  if (effectiveAction === 'update' || (verb === 'PATCH' && route.action !== 'delete')) {
    const body = getBody(config);
    const id = body[pk] ?? queryParams[pk];
    const idx = rows.findIndex((r) => r[pk] === id);
    if (idx < 0) return buildNotFound(config, `${storeKey} ${id} not found`);
    rows[idx] = { ...rows[idx], ...body, [pk]: rows[idx][pk] };
    denormalize(rows[idx]);
    return buildOk(config, { message: 'Updated', data: rows[idx] });
  }

  if (effectiveAction === 'delete') {
    const combined = verb === 'DELETE' ? { ...getBody(config), ...queryParams } : queryParams;
    const id = combined[pk];
    const idx = rows.findIndex((r) => r[pk] === id);
    if (idx < 0) return buildNotFound(config, `${storeKey} ${id} not found`);
    rows.splice(idx, 1);
    return buildOk(config, { message: 'Deleted', data: null });
  }

  // Custom — best-effort: shape says data is array → return current list; data
  // is object → return first record. The final fall-through ALWAYS includes a
  // `data` key (set to null/{}) so callers that do `setState(res.data)` never
  // store `undefined`, which would later crash on `.length` / `.map`.
  const shape = route.responseShape as any;
  if (shape && shape.data) {
    if (Array.isArray(shape.data)) {
      const filtered = applyFilters(rows, queryParams, searchFields, knownKeys);
      const page = paginate(filtered, queryParams);
      return buildOk(config, { message: 'OK', ...page });
    }
    return buildOk(config, { message: 'OK', data: rows[0] ?? {} });
  }
  return buildOk(config, { message: 'OK', data: null });
};

export function getMockSeed(): MockSeed {
  return seed;
}
