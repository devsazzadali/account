// AccountStoreOne — browser data client.
//
// Drop-in replacement for the old hosted-backend client, backed by the app's own
// API routes (/api/db/[table]) so every query is authorized on the server
// with the Neon Auth session. The chainable builder keeps the call shape
// the screens were written against:
//   db.from('products').select('*').eq('id', x).order('created_at').single()
//   db.from('products').insert({...}) / .update({...}).eq(...) / .delete().eq(...)
// Realtime channels are implemented as polling subscriptions (the Neon
// replacement for hosted realtime in this app): subscribe() polls the
// filtered table every few seconds and fires callbacks for inserted /
// updated rows.

type Result<T = any> = { data: T; error: { message: string; code?: string } | null };

interface Filter {
  op: string;
  col: string;
  value: unknown;
}

const enc = encodeURIComponent;

class QueryBuilder implements PromiseLike<Result<any>> {
  private table: string;
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private payload: unknown = null;
  private filters: Filter[] = [];
  private orders: { col: string; ascending: boolean }[] = [];
  private limitN: number | null = null;
  private selectCols = "*";
  private singleFlag = false;
  private maybeSingleFlag = false;

  constructor(table: string) {
    this.table = table;
  }

  select(cols = "*") {
    this.selectCols = cols;
    return this;
  }
  insert(rows: unknown) {
    this.mode = "insert";
    this.payload = rows;
    return this;
  }
  update(fields: unknown) {
    this.mode = "update";
    this.payload = fields;
    return this;
  }
  delete() {
    this.mode = "delete";
    return this;
  }
  eq(col: string, value: unknown) { this.filters.push({ op: "eq", col, value }); return this; }
  neq(col: string, value: unknown) { this.filters.push({ op: "neq", col, value }); return this; }
  gt(col: string, value: unknown) { this.filters.push({ op: "gt", col, value }); return this; }
  gte(col: string, value: unknown) { this.filters.push({ op: "gte", col, value }); return this; }
  lt(col: string, value: unknown) { this.filters.push({ op: "lt", col, value }); return this; }
  lte(col: string, value: unknown) { this.filters.push({ op: "lte", col, value }); return this; }
  ilike(col: string, value: unknown) { this.filters.push({ op: "ilike", col, value }); return this; }
  in(col: string, values: unknown[]) { this.filters.push({ op: "in", col, value: (values as unknown[]).join(",") }); return this; }
  is(col: string, value: unknown) { this.filters.push({ op: "is", col, value: value === null ? "null" : value }); return this; }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, ascending: opts?.ascending !== false });
    return this;
  }
  limit(n: number) { this.limitN = n; return this; }
  single() { this.singleFlag = true; return this; }
  maybeSingle() { this.maybeSingleFlag = true; return this; }

  private filterQuery(): string {
    return this.filters
      .map((f) => `${enc(`${f.op}.${f.col}`)}=${enc(String(f.value))}`)
      .join("&");
  }

  private async execute(): Promise<Result<any>> {
    try {
      if (this.mode === "select") {
        const params = new URLSearchParams();
        params.set("select", this.selectCols);
        for (const f of this.filters) params.set(`${f.op}.${f.col}`, String(f.value));
        for (const o of this.orders) params.append("order", `${o.col}.${o.ascending ? "asc" : "desc"}`);
        if (this.limitN != null) params.set("limit", String(this.limitN));
        if (this.singleFlag) params.set("single", "1");
        const res = await fetch(`/api/db/${this.table}?${params.toString()}`, { credentials: "same-origin" });
        const json = await res.json();
        if (this.maybeSingleFlag && json.error) return { data: null, error: null };
        return { data: json.data ?? null, error: json.error ?? null };
      }
      const q = this.filterQuery();
      const url = `/api/db/${this.table}${q ? `?${q}` : ""}`;
      if (this.mode === "insert") {
        const res = await fetch(url, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.payload),
        });
        const json = await res.json();
        if (json.error) return { data: null, error: json.error };
        const rows = json.data || [];
        return { data: this.singleFlag ? rows[0] ?? null : rows, error: null };
      }
      if (this.mode === "update") {
        const res = await fetch(url, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.payload),
        });
        const json = await res.json();
        if (json.error) return { data: null, error: json.error };
        const rows = json.data || [];
        return { data: this.singleFlag ? rows[0] ?? null : rows, error: null };
      }
      // delete
      const res = await fetch(url, { method: "DELETE", credentials: "same-origin" });
      const json = await res.json();
      if (json.error) return { data: null, error: json.error };
      return { data: json.data || [], error: null };
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : "Network error" } };
    }
  }

  then<TResult1 = Result<any>, TResult2 = never>(
    onfulfilled?: ((value: Result<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// ─── Polling "realtime" channels ───────────────────────────────────────────

interface ChannelHandler {
  event: string;
  table: string;
  filter?: string;
  callback: (payload: { new: any; old: any; eventType: string }) => void;
}

export class PollingChannel {
  private handlers: ChannelHandler[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private snapshot = new Map<string, string>();

  on(type: string, filter: { event?: string; schema?: string; table?: string; filter?: string }, callback: ChannelHandler["callback"]) {
    if (type === "postgres_changes") {
      this.handlers.push({ event: filter.event || "*", table: filter.table || "", filter: filter.filter, callback });
    }
    return this;
  }

  subscribe() {
    if (this.timer) return this;
    const tick = async () => {
      for (const h of this.handlers) {
        try {
          let url = `/api/db/${h.table}?order=created_at.desc&limit=25`;
          if (h.filter) {
            const m = h.filter.match(/^([a-z_]+)=eq\.(.+)$/);
            if (m) url += `&eq.${m[1]}=${enc(m[2])}`;
          }
          const res = await fetch(url, { credentials: "same-origin" });
          const json = await res.json();
          const rows: any[] = json.data || [];
          const seen = new Set<string>();
          for (const row of rows) {
            const key = `${h.table}:${row.id}`;
            seen.add(key);
            const serialized = JSON.stringify(row);
            const prev = this.snapshot.get(key);
            if (prev === undefined) {
              if (this.snapshot.size > 0 && (h.event === "INSERT" || h.event === "*")) {
                h.callback({ new: row, old: null, eventType: "INSERT" });
              }
            } else if (prev !== serialized && (h.event === "UPDATE" || h.event === "*")) {
              h.callback({ new: row, old: null, eventType: "UPDATE" });
            }
            this.snapshot.set(key, serialized);
          }
        } catch {
          // polling is best-effort; next tick retries
        }
      }
    };
    // First tick only builds the snapshot so we don't replay history.
    tick();
    this.timer = setInterval(tick, 4000);
    return this;
  }

  unsubscribe() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

// ─── Storage (local uploads via /api/upload) ───────────────────────────────

function storageBucket(bucket: string) {
  return {
    async upload(path: string, file: File | Blob) {
      const form = new FormData();
      form.set("file", file as Blob, (file as File).name || path.split("/").pop() || "upload");
      form.set("bucket", bucket);
      const res = await fetch("/api/upload", { method: "POST", credentials: "same-origin", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { data: null, error: { message: json.error || "Upload failed" } };
      return { data: { path: json.url, fullPath: json.url }, error: null };
    },
    getPublicUrl(path: string) {
      const url = path.startsWith("/uploads/") ? path : `/uploads/${bucket}/${path}`;
      return { data: { publicUrl: url } };
    },
  };
}

export const db = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  channel(_name: string) {
    return new PollingChannel();
  },
  removeChannel(channel: PollingChannel) {
    channel?.unsubscribe?.();
    return Promise.resolve();
  },
  storage: { from: storageBucket },
};
