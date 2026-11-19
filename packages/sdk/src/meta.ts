
import type {
  AnthropicTool,
  App,
  Module,
  ToolDefinition,
  ToolDownload,
  ToolListParams,
  ToolReadResponse,
} from "./types.js";
import { QaitoError } from "./error.js";
import { dataUrlToBlob } from "./serialize.js";
import { validateFetchUrl } from "./ssrf.js";
import type { SdkTransport } from "./transport.js";

export function createModulesNamespace(tx: SdkTransport) {
  return {
    list: <T extends { format?: "slugs" } | undefined = undefined>(
      params?: T,
    ): Promise<T extends { format: "slugs" } ? string[] : Module[]> => {
      const qs = new URLSearchParams();
      if (params?.format) qs.set("format", params.format);
      const q = qs.toString();
      return tx.request("GET", `/modules${q ? `?${q}` : ""}`) as Promise<
        T extends { format: "slugs" } ? string[] : Module[]
      >;
    },
  };
}

export function createAppsNamespace(tx: SdkTransport) {
  return {
    /**
     * 呼び出し元が**入れる**内部アプリ（棚）を取得する。
     *
     * モジュール scope ではなく**アプリの付与行**で絞られる（ポータルの棚と同じ解決）。
     * 「棚に何が並ぶか」を知りたいときは `modules.list()` ではなくこちらを使う
     */
    list: (): Promise<App[]> => tx.request("GET", "/apps") as Promise<App[]>,
  };
}

export function createToolsNamespace(tx: SdkTransport) {
  let toolsCache: ToolDefinition[] | null = null;

  return {
    list: <T extends ToolListParams | undefined = undefined>(
      params?: T
    ): Promise<T extends { format: "anthropic" } ? AnthropicTool[] : ToolDefinition[]> => {
      const qs = new URLSearchParams();
      if (params?.format) qs.set("format", params.format);
      const q = qs.toString();
      return tx.request(
        "GET",
        `/tools${q ? `?${q}` : ""}`
      );
    },
    listWithContext: async (): Promise<{
      tools: ToolDefinition[];
      access: {
        facility_scoped: boolean;
        facility_count: number | null;
        default_facility?: { id: string; name: string; source: string } | null;
      };
    }> => {
      const url = `${tx.getBaseUrl()}/tools`;
      const headers = tx.authHeaders();
      const res = await fetch(url, { headers });
      const json = await res.json() as {
        success: boolean;
        data: ToolDefinition[];
        access?: {
          facility_scoped: boolean;
          facility_count: number | null;
          default_facility?: { id: string; name: string; source: string } | null;
        };
        error?: string;
        code?: string;
      };
      if (!json.success) {
        throw new QaitoError(json.error ?? "Failed to list tools", res.status, json.code);
      }
      return {
        tools: json.data,
        access: json.access ?? { facility_scoped: false, facility_count: null },
      };
    },
    execute: async (name: string, input: Record<string, unknown> = {}): Promise<unknown> => {
      if (!toolsCache) {
        toolsCache = await tx.request<ToolDefinition[]>("GET", "/tools");
      }
      const tool = toolsCache.find((t) => t.name === name);
      if (!tool) {
        throw new QaitoError(`Tool '${name}' not found`, 404);
      }
    
      if (!tool.endpoint) {
        throw new QaitoError(
          `Tool '${name}' has no API endpoint (internal client-side tool, e.g. chat_create_artifact / chat_execute_code)`,
          400,
          "TOOL_HAS_NO_ENDPOINT",
        );
      }
      const { method, path, content_type } = tool.endpoint;
    
      let resolvedPath = path;
      const pathParams: string[] = [];
      const paramPattern = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
      let match: RegExpExecArray | null;
      while ((match = paramPattern.exec(path)) !== null) {
        const paramName = match[1];
        pathParams.push(paramName);
        const value = input[paramName];
        if (value == null) {
          throw new QaitoError(`Missing path parameter: ${paramName}`, 400);
        }
        const raw = String(value);
        if (raw === "." || raw === "..") {
          throw new QaitoError(`Invalid path parameter: ${paramName}`, 400);
        }
        resolvedPath = resolvedPath.replace(`:${paramName}`, encodeURIComponent(raw));
      }
    
      const bodyInput: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        if (!pathParams.includes(key)) {
          bodyInput[key] = value;
        }
      }
    
      const responseType = tool.response_type;
      if (responseType === "blob") {
        const blobQueryEntries = Object.entries(bodyInput).filter(([, v]) => v != null);
        const blobResolvedPath =
          blobQueryEntries.length > 0
            ? `${resolvedPath}?${new URLSearchParams(
                blobQueryEntries.map(([k, v]) => [k, String(v)]),
              ).toString()}`
            : resolvedPath;
        return {
          success: true,
          message: "ファイルを用意しました。画面のダウンロードボタンから取得できます",
          downloadUrl: `${tx.getBaseUrl()}${blobResolvedPath}`,
          path: blobResolvedPath,
          type: input.type ?? "unknown",
          client_id: input.client_id,
          assessment_id: input.assessment_id,
        };
      }
    
      if (method === "GET" || method === "DELETE") {
        const entries = Object.entries(bodyInput).filter(([, v]) => v != null);
        let target = resolvedPath;
        if (entries.length > 0) {
          const qs = new URLSearchParams();
          for (const [k, v] of entries) {
            qs.set(k, String(v));
          }
          target = `${resolvedPath}?${qs.toString()}`;
        }
        if (method === "DELETE") return tx.request(method, target);
        const { data, total, has_more } = await tx.requestEnvelope<unknown>(method, target);
        if (Array.isArray(data) && (total !== undefined || has_more !== undefined)) {
          return { data, ...(total !== undefined ? { total } : {}), ...(has_more !== undefined ? { has_more } : {}) };
        }
        return data;
      }
    
      if (content_type === "multipart/form-data") {
        const formData = new FormData();
        for (const [key, value] of Object.entries(bodyInput)) {
          if (value == null) continue;
          if (key.endsWith("_url") && typeof value === "string") {
            const fieldName = key.slice(0, -4);
            if (!value.startsWith("data:")) {
              validateFetchUrl(value, tx.getBaseUrl());
            }
            let blob: Blob;
            if (value.startsWith("data:")) {
              blob = dataUrlToBlob(value);
            } else {
              const fetchHeaders: Record<string, string> = {};
              if (value.startsWith(tx.getBaseUrl())) {
                fetchHeaders["Authorization"] = `Bearer ${tx.getApiKey()}`;
                const token = tx.bearerToken();
                if (token) fetchHeaders["X-User-Token"] = token;
              }
              blob = await fetch(value, { headers: fetchHeaders }).then((r) => r.blob());
            }
            formData.append(fieldName, blob);
          } else {
            formData.append(key, String(value));
          }
        }
        return tx.requestMultipart(resolvedPath, formData);
      }
    
      return tx.request(method, resolvedPath, bodyInput);
    },
    /**
     * ツールが読み取りに使う口（`GET`）をそのまま読み、応答の本文（`data` の外の `total` / `meta` も含む）を返す。
     * どのパスを許すかは呼び出し側が決める（QaitoChat ではデータ分析の Python から読める口だけ）。
     */
    read: async <T = unknown,>(path: string): Promise<ToolReadResponse<T>> => {
      if (!path.startsWith("/") || path.includes("..") || path.includes("//")) {
        throw new QaitoError("Invalid path", 400, "INVALID_PATH");
      }
      const res = await fetch(`${tx.getBaseUrl()}${path}`, { headers: tx.authHeaders() });
      const body = (await res.json().catch(() => null)) as ToolReadResponse<T> | null;
      if (!res.ok || !body?.success) {
        throw new QaitoError(body?.error ?? `Read failed (${res.status})`, res.status, body?.code);
      }
      return body;
    },
    /**
     * `execute` がファイルのツール（`response_type: "blob"`）で返した `path` の中身を取る。
     * 名前と形式は api の応答のまま返す（画面のダウンロードの中継に使う）。
     */
    download: async (path: string): Promise<ToolDownload> => {
      if (!path.startsWith("/") || path.includes("..") || path.includes("//")) {
        throw new QaitoError("Invalid path", 400, "INVALID_PATH");
      }
      const res = await fetch(`${tx.getBaseUrl()}${path}`, { headers: tx.authHeaders() });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
        throw new QaitoError(body?.error ?? `Download failed (${res.status})`, res.status, body?.code);
      }
      return {
        body: await res.arrayBuffer(),
        contentType: res.headers.get("content-type") ?? "application/octet-stream",
        contentDisposition: res.headers.get("content-disposition") ?? "attachment",
      };
    },
  };
}
