
import type {
  ChatFeedback,
  ChatMemory,
  ChatMemoryCandidate,
  ChatMemoryListParams,
  ChatMessage,
  ChatPendingMemory,
  ChatSession,
  ChatShareInfo,
  ChatTemplate,
  ChatThinkingPolicy,
  CompletionInput,
  CompletionResponse,
  CreateChatFeedbackInput,
  CreateChatMemoryInput,
  CreateChatMessageInput,
  CreateChatSessionInput,
  CreateChatTemplateInput,
  CreateModelConfigInput,
  ExtractChatMemoriesInput,
  GenerateFileInput,
  GenerateFileResult,
  GenerateTitleInput,
  GenerateTitleResult,
  ModelConfig,
  ReserveToolExecutionInput,
  SettleToolExecutionInput,
  SharedChatSession,
  ToolExecutionState,
  UpdateChatMemoryInput,
  UpdateChatSessionInput,
  UpdateChatTemplateInput,
  UpdateChatThinkingPolicyInput,
  UpdateModelConfigInput,
  UsageListParams,
  UsageLog,
} from "../types.js";
import { pathParam } from "../path-param.js";
import type { SdkTransport } from "../transport.js";

export function createChatNamespace(tx: SdkTransport) {
  return {
    generateTitle: (input: GenerateTitleInput) =>
      tx.request<GenerateTitleResult>("POST", "/chat/title", input),
    generateFile: (input: GenerateFileInput) =>
      tx.request<GenerateFileResult>("POST", "/chat/generate-file", input),
    thinkingPolicy: {
      get: () => tx.request<ChatThinkingPolicy>("GET", "/chat/thinking-policy"),
      update: (input: UpdateChatThinkingPolicyInput) =>
        tx.request<ChatThinkingPolicy>("PUT", "/chat/thinking-policy", input),
    },
    sessions: {
      list: () => tx.request<ChatSession[]>("GET", "/chat/sessions"),
      get: (id: string) => tx.request<ChatSession>("GET", `/chat/sessions/${pathParam(id, "id")}`),
      create: (input?: CreateChatSessionInput) =>
        tx.request<ChatSession>("POST", "/chat/sessions", input ?? {}),
      update: (id: string, input: UpdateChatSessionInput) =>
        tx.request<ChatSession>("PATCH", `/chat/sessions/${pathParam(id, "id")}`, input),
      delete: (id: string) => tx.request<void>("DELETE", `/chat/sessions/${pathParam(id, "id")}`),
      messages: (id: string) =>
        tx.request<ChatMessage[]>("GET", `/chat/sessions/${pathParam(id, "id")}/messages`),
      addMessage: (id: string, input: CreateChatMessageInput, files?: File[]) => {
        if (files && files.length > 0) {
          const formData = new FormData();
          formData.append("role", input.role);
          formData.append("content", input.content);
          if (input.parts) formData.append("parts", JSON.stringify(input.parts));
          if (input.client_message_id) {
            formData.append("client_message_id", input.client_message_id);
          }
          for (const file of files) {
            formData.append("files", file);
          }
          return tx.requestMultipart<ChatMessage>(
            `/chat/sessions/${id}/messages`,
            formData
          );
        }
        return tx.request<ChatMessage>("POST", `/chat/sessions/${id}/messages`, input);
      },
      addMessages: (id: string, messages: CreateChatMessageInput[]) =>
        tx.request<ChatMessage[]>("POST", `/chat/sessions/${pathParam(id, "id")}/messages/batch`, { messages }),
      share: (id: string) => tx.request<ChatShareInfo>("POST", `/chat/sessions/${pathParam(id, "id")}/share`),
      unshare: (id: string) => tx.request<void>("DELETE", `/chat/sessions/${pathParam(id, "id")}/share`),
    },
    feedback: {
      create: (input: CreateChatFeedbackInput) => tx.request<ChatFeedback>("POST", "/chat/feedback", input),
      list: (sessionId: string) =>
        tx.request<ChatFeedback[]>("GET", `/chat/feedback/${pathParam(sessionId, "sessionId")}`),
    },
    shared: {
      get: (shareToken: string) =>
        tx.request<SharedChatSession>("GET", `/chat/shared/${pathParam(shareToken, "shareToken")}`),
    },
    memories: {
      /**
       * 会話メモリ。`limit` 無しは全件（設定画面向け）、`limit` 付きは `q` に近いものの検索
       * （`q` が無い・検索に失敗したときは最近使った順）。GET /chat/memories
       */
      list: (params?: ChatMemoryListParams) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.limit != null) qs.set("limit", String(params.limit));
        const q = qs.toString();
        return tx.request<ChatMemory[]>("GET", `/chat/memories${q ? `?${q}` : ""}`);
      },
      /** 記憶を足す（本文の埋め込みはサーバが作る）。POST /chat/memories */
      create: (input: CreateChatMemoryInput) => tx.request<ChatMemory>("POST", "/chat/memories", input),
      /** 記憶を直す（埋め込みは作り直す）。PUT /chat/memories/:id */
      update: (id: string, input: UpdateChatMemoryInput) =>
        tx.request<ChatMemory>("PUT", `/chat/memories/${pathParam(id, "id")}`, input),
      /** 会話の最後のやり取りから記憶の候補を抜き出す（記憶にはしない）。POST /chat/memories/extract */
      extract: (input: ExtractChatMemoriesInput) =>
        tx.request<{ created: number }>("POST", "/chat/memories/extract", input),
      /** ターンの頭に確かめる記憶の候補（未聞きは聞いたことになる）。GET /chat/memories/candidates */
      candidates: () => tx.request<ChatMemoryCandidate[]>("GET", "/chat/memories/candidates"),
      /** まだ記憶になっていない候補の一覧（設定の画面。「聞いた」は付けない）。GET /chat/memories?status=candidate */
      pending: () => tx.request<ChatPendingMemory[]>("GET", "/chat/memories?status=candidate"),
      /** 候補を断る（記憶にしない・同じ候補をまた出さない）。POST /chat/memories/candidates/:id/reject */
      rejectCandidate: (id: string) =>
        tx.request<void>("POST", `/chat/memories/candidates/${pathParam(id, "id")}/reject`),
      /** 記憶を消す。DELETE /chat/memories/:id */
      delete: (id: string) => tx.request<void>("DELETE", `/chat/memories/${pathParam(id, "id")}`),
    },
    toolExecutions: {
      /**
       * 承認したツールの実行を予約する（同じ tool_call_id の二重実行を止める）。
       * `done` なら既に成立しているので再実行せず `result` を使う。POST /chat/tool-executions/reserve
       */
      reserve: (input: ReserveToolExecutionInput) =>
        tx.request<ToolExecutionState>("POST", "/chat/tool-executions/reserve", input),
      /** 予約した実行の結果を確定する。POST /chat/tool-executions/settle */
      settle: (input: SettleToolExecutionInput) =>
        tx.request<ToolExecutionState>("POST", "/chat/tool-executions/settle", input),
    },
    templates: {
      list: () => tx.request<ChatTemplate[]>("GET", "/chat/templates"),
      create: (input: CreateChatTemplateInput) => tx.request<ChatTemplate>("POST", "/chat/templates", input),
      update: (id: string, input: UpdateChatTemplateInput) =>
        tx.request<ChatTemplate>("PATCH", `/chat/templates/${pathParam(id, "id")}`, input),
      delete: (id: string) => tx.request<void>("DELETE", `/chat/templates/${pathParam(id, "id")}`),
    },
  };
}

export function createLlmNamespace(tx: SdkTransport) {
  return {
    completions: {
      stream: (input: CompletionInput): Promise<ReadableStream> =>
        tx.requestStream("POST", "/chat/llm/completions", { ...input, stream: true }),
      create: (input: CompletionInput): Promise<CompletionResponse> =>
        tx.request<CompletionResponse>("POST", "/chat/llm/completions", { ...input, stream: false }),
    },
    models: {
      list: () => tx.request<ModelConfig[]>("GET", "/chat/llm/models"),
      get: (id: string) => tx.request<ModelConfig>("GET", `/chat/llm/models/${pathParam(id, "id")}`),
      create: (input: CreateModelConfigInput) => tx.request<ModelConfig>("POST", "/chat/llm/models", input),
      update: (id: string, input: UpdateModelConfigInput) =>
        tx.request<ModelConfig>("PATCH", `/chat/llm/models/${pathParam(id, "id")}`, input),
      delete: (id: string) => tx.request<void>("DELETE", `/chat/llm/models/${pathParam(id, "id")}`),
    },
    usage: {
      list: (params?: UsageListParams) => {
        const query = params?.limit !== undefined ? `?limit=${params.limit}` : "";
        return tx.request<UsageLog[]>("GET", `/chat/llm/usage${query}`);
      },
    },
  };
}
