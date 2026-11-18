import { createAnthropic } from "@ai-sdk/anthropic";

export function createQaitoLLM(options: {
  baseUrl: string;
  /** public client（chat 等）: opaque user token。x-api-key として送られ userTokenMiddleware が照合 */
  userToken?: string;
  /** confidential client（M2M）: API キー。指定時は x-api-key=apiKey + X-User-Token=userToken */
  apiKey?: string;
  extraHeaders?: Record<string, string>;
}) {
  return createAnthropic({
    baseURL: options.baseUrl + "/chat/llm/v1",
    apiKey: options.apiKey ?? options.userToken ?? "",
    headers: {
      ...(options.apiKey && options.userToken ? { "X-User-Token": options.userToken } : {}),
      ...(options.extraHeaders ?? {}),
    },
  });
}
