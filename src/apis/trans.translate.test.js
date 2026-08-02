jest.mock("query-string", () => ({
  stringify: (obj) => new URLSearchParams(obj).toString(),
}));

jest.mock("@streamparser/json", () => ({
  JSONParser: jest.fn(),
}));

jest.mock("../libs/fetch", () => ({
  fetchData: jest.fn(),
  fetchStream: jest.fn(),
}));

jest.mock("../libs/docInfo", () => ({
  getDocInfo: () => ({}),
}));

import { handleTranslate } from "./trans";
import { DEFAULT_API_LIST, OPT_TRANS_OPENAI } from "../config";
import { fetchData, fetchStream } from "../libs/fetch";
import { trustedTypesHelper } from "../libs/trustedTypes";

const getApiSetting = (apiType) => ({
  ...DEFAULT_API_LIST.find((api) => api.apiType === apiType),
  useStream: true,
  useBatchFetch: true,
  key: "test-key",
  model: "test-model",
  fetchInterval: 0,
  fetchLimit: 1,
  httpTimeout: 1000,
});

const getNobatchApiSetting = (update = {}) => ({
  ...getApiSetting(OPT_TRANS_OPENAI),
  useStream: false,
  useBatchFetch: false,
  systemPrompt: "batch system prompt",
  nobatchPrompt: "Translate {{text}}.",
  nobatchUserPrompt: "",
  ...update,
});

async function collectAsyncGenerator(generator) {
  const result = [];
  for await (const item of generator) {
    result.push(item);
  }
  return result;
}

describe("handleTranslate", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("falls back to non-stream request when stream reader is unsupported", async () => {
    async function* brokenStream() {
      throw new TypeError(
        "Cannot read properties of undefined (reading 'getReader')"
      );
    }

    fetchStream.mockReturnValueOnce(brokenStream());
    fetchData.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify([{ text: "你好", sourceLanguage: "en" }]),
          },
        },
      ],
    });

    const result = await collectAsyncGenerator(
      handleTranslate(["hello"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: getApiSetting(OPT_TRANS_OPENAI),
        usePool: false,
      })
    );

    expect(fetchStream).toHaveBeenCalledTimes(1);
    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchStream.mock.calls[0][1].body).stream).toBe(true);
    expect(JSON.parse(fetchData.mock.calls[0][1].body).stream).toBe(false);
    expect(result).toEqual([
      {
        id: 0,
        result: ["你好", "en"],
      },
    ]);
  });

  test("parses non-stream OpenAI XML content and ignores reasoning content", async () => {
    fetchData.mockResolvedValueOnce({
      choices: [
        {
          finish_reason: "stop",
          index: 0,
          logprobs: null,
          message: {
            content:
              '<root>\n    <t id="0" sourceLanguage="en">敏捷的棕色狐狸跳过了懒惰的狗。</t>\n</root>',
            reasoning_content:
              "This reasoning text should not be parsed as translation.",
            role: "assistant",
          },
        },
      ],
      created: 1782579027,
      id: "021782579025384c63a6ac480f44318ff02bbee696f61102e5957",
      model: "doubao-seed-2-0-mini-260428",
      object: "chat.completion",
    });

    const result = await collectAsyncGenerator(
      handleTranslate(["The quick brown fox jumps over the lazy dog."], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          useStream: false,
          useBatchFetch: true,
        },
        usePool: false,
      })
    );

    expect(fetchStream).not.toHaveBeenCalled();
    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchData.mock.calls[0][1].body).stream).toBe(false);
    expect(result).toEqual([
      {
        id: 0,
        result: ["敏捷的棕色狐狸跳过了懒惰的狗。", "en"],
      },
    ]);
  });

  test("parses non-stream OpenAI-compatible XML content from DeepSeek-style response", async () => {
    fetchData.mockResolvedValueOnce({
      id: "a729d491-11e8-4a8c-bb6a-c780329e1f99",
      object: "chat.completion",
      created: 1782580528,
      model: "deepseek-v4-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              '<root>\n    <t id="0" sourceLanguage="en">敏捷的棕色狐狸跳过了懒惰的狗。</t>\n</root>',
          },
          logprobs: null,
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 544,
        completion_tokens: 30,
        total_tokens: 574,
        prompt_tokens_details: {
          cached_tokens: 512,
        },
        prompt_cache_hit_tokens: 512,
        prompt_cache_miss_tokens: 32,
      },
      system_fingerprint: "fp_8b330d02d0_prod0820_fp8_kvcache_20260402",
    });

    const result = await collectAsyncGenerator(
      handleTranslate(["The quick brown fox jumps over the lazy dog."], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          useStream: false,
          useBatchFetch: true,
        },
        usePool: false,
      })
    );

    expect(fetchStream).not.toHaveBeenCalled();
    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchData.mock.calls[0][1].body).stream).toBe(false);
    expect(result).toEqual([
      {
        id: 0,
        result: ["敏捷的棕色狐狸跳过了懒惰的狗。", "en"],
      },
    ]);
  });

  test("parses OpenAI XML content before sanitized DOM fallback", async () => {
    const createHTMLSpy = jest
      .spyOn(trustedTypesHelper, "createHTML")
      .mockReturnValue("");

    fetchData.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content:
              '<root>\n    <t id="0" sourceLanguage="en">敏捷的棕色狐狸跳过了懒惰的狗。</t>\n</root>',
          },
        },
      ],
    });

    const result = await collectAsyncGenerator(
      handleTranslate(["The quick brown fox jumps over the lazy dog."], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          useStream: false,
          useBatchFetch: true,
        },
        usePool: false,
      })
    );

    expect(createHTMLSpy).not.toHaveBeenCalled();
    expect(result).toEqual([
      {
        id: 0,
        result: ["敏捷的棕色狐狸跳过了懒惰的狗。", "en"],
      },
    ]);
  });

  test("does not fall back when stream request is aborted", async () => {
    async function* abortedStream() {
      throw new DOMException("The operation was aborted.", "AbortError");
    }

    fetchStream.mockReturnValueOnce(abortedStream());

    await expect(
      collectAsyncGenerator(
        handleTranslate(["hello"], {
          from: "en",
          to: "zh-CN",
          fromLang: "English",
          toLang: "Chinese",
          langMap: () => "",
          glossary: "",
          apiSetting: getApiSetting(OPT_TRANS_OPENAI),
          usePool: false,
        })
      )
    ).rejects.toThrow("The operation was aborted.");

    expect(fetchData).not.toHaveBeenCalled();
  });

  test("streams XML batch results incrementally", async () => {
    async function* streamChunks() {
      yield JSON.stringify({
        choices: [{ delta: { content: '<root><t id="0">你好</t>' } }],
      });
      yield JSON.stringify({
        choices: [{ delta: { content: '<t id="1">世界</t></root>' } }],
      });
    }

    fetchStream.mockReturnValueOnce(streamChunks());

    const result = await collectAsyncGenerator(
      handleTranslate(["hello", "world"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          ioInputFormat: "json",
          ioOutputFormat: "xml",
          streamRenderMode: "disabled",
        },
        usePool: false,
      })
    );

    expect(result).toEqual([
      { id: 0, result: ["你好", ""] },
      { id: 1, result: ["世界", ""] },
    ]);
  });

  test("streams textlines batch results incrementally", async () => {
    async function* streamChunks() {
      yield JSON.stringify({ choices: [{ delta: { content: "0 | 你好\n" } }] });
      yield JSON.stringify({
        choices: [{ delta: { content: "1 | 世界\n" } }],
      });
    }

    fetchStream.mockReturnValueOnce(streamChunks());

    const result = await collectAsyncGenerator(
      handleTranslate(["hello", "world"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          ioInputFormat: "json",
          ioOutputFormat: "textlines",
          streamRenderMode: "disabled",
        },
        usePool: false,
      })
    );

    expect(result).toEqual([
      { id: 0, result: ["你好", ""] },
      { id: 1, result: ["世界", ""] },
    ]);
  });

  test("streams percent batch results incrementally and completes tail via fallback", async () => {
    async function* streamChunks() {
      yield JSON.stringify({ choices: [{ delta: { content: "第一段" } }] });
      yield JSON.stringify({
        choices: [{ delta: { content: "\n\n%%\n\n第二段" } }],
      });
    }

    fetchStream.mockReturnValueOnce(streamChunks());

    const result = await collectAsyncGenerator(
      handleTranslate(["a", "b"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          ioInputFormat: "json",
          ioOutputFormat: "percent",
          streamRenderMode: "disabled",
        },
        usePool: false,
      })
    );

    expect(result).toEqual([
      { id: 0, result: ["第一段", ""] },
      { id: 1, result: ["第二段", ""] },
    ]);
  });

  test("streams percent typewriter partials in realtime mode", async () => {
    async function* streamChunks() {
      yield JSON.stringify({ choices: [{ delta: { content: "第一" } }] });
      yield JSON.stringify({ choices: [{ delta: { content: "段" } }] });
      yield JSON.stringify({
        choices: [{ delta: { content: "\n\n%%\n\n第二" } }],
      });
      yield JSON.stringify({ choices: [{ delta: { content: "段" } }] });
    }

    fetchStream.mockReturnValueOnce(streamChunks());

    const result = await collectAsyncGenerator(
      handleTranslate(["a", "b"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          ioInputFormat: "json",
          ioOutputFormat: "percent",
          streamRenderMode: "realtime",
        },
        usePool: false,
      })
    );

    expect(result).toEqual([
      { id: 0, partialText: "第一", isComplete: false },
      { id: 0, partialText: "第一段", isComplete: false },
      { id: 0, result: ["第一段", ""] },
      { id: 1, partialText: "第二", isComplete: false },
      { id: 1, partialText: "第二段", isComplete: false },
      { id: 1, result: ["第二段", ""] },
    ]);
  });

  test("decodes escaped percent partials in realtime mode", async () => {
    async function* streamChunks() {
      yield JSON.stringify({ choices: [{ delta: { content: "50\\%" } }] });
      yield JSON.stringify({
        choices: [{ delta: { content: " off\n\n%%\n\n80\\%" } }],
      });
    }

    fetchStream.mockReturnValueOnce(streamChunks());

    const result = await collectAsyncGenerator(
      handleTranslate(["a", "b"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          ioInputFormat: "json",
          ioOutputFormat: "percent",
          streamRenderMode: "realtime",
        },
        usePool: false,
      })
    );

    expect(result).toEqual([
      { id: 0, partialText: "50%", isComplete: false },
      { id: 0, result: ["50% off", ""] },
      { id: 1, partialText: "80%", isComplete: false },
      { id: 1, result: ["80%", ""] },
    ]);
  });

  test("decodes percent escapes when partial char arrives one at a time", async () => {
    const frames = [
      "5",
      "0",
      "\\",
      "%",
      " ",
      "o",
      "f",
      "f",
      "\n\n%%\n\n",
      "8",
      "0",
      "\\",
      "%",
      " ",
      "o",
      "f",
      "f",
    ];
    async function* streamChunks() {
      for (const ch of frames) {
        yield JSON.stringify({ choices: [{ delta: { content: ch } }] });
      }
    }

    fetchStream.mockReturnValueOnce(streamChunks());

    const result = await collectAsyncGenerator(
      handleTranslate(["a", "b"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          ioInputFormat: "json",
          ioOutputFormat: "percent",
          streamRenderMode: "realtime",
        },
        usePool: false,
      })
    );

    // percent 语义：模型输出 50\% 表示字面量 50%。
    // 逐字符到达时，每个 partial 都从原始缓冲重新解码：\ 单独到达时会短暂显示，
    // % 到达后\ 与 % 组成完整转义并还原，最终 partial 不含残留的 \%。
    const partials = result.filter((item) => item.isComplete === false);
    expect(partials.length).toBeGreaterThan(0);
    for (const item of partials) {
      expect(item.partialText).not.toContain("\\%");
    }
    expect(result).toContainEqual({
      id: 1,
      partialText: "80% off",
      isComplete: false,
    });
    expect(result).toContainEqual({ id: 0, result: ["50% off", ""] });
    expect(result).toContainEqual({ id: 1, result: ["80% off", ""] });
  });

  test("decodes XML-escaped partials in realtime mode", async () => {
    async function* streamChunks() {
      yield JSON.stringify({
        choices: [{ delta: { content: '<t id="0">A &lt;b&gt;B' } }],
      });
      yield JSON.stringify({ choices: [{ delta: { content: "</t>" } }] });
    }

    fetchStream.mockReturnValueOnce(streamChunks());

    const result = await collectAsyncGenerator(
      handleTranslate(["a"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          ioInputFormat: "json",
          ioOutputFormat: "xml",
          streamRenderMode: "realtime",
        },
        usePool: false,
      })
    );

    expect(result).toEqual([
      { id: 0, partialText: "A <b>B", isComplete: false },
      { id: 0, result: ["A <b>B", ""] },
    ]);
  });

  test("streams non-batch plain text when batch fetch is disabled", async () => {
    async function* streamChunks() {
      yield JSON.stringify({ choices: [{ delta: { content: "你" } }] });
      yield JSON.stringify({ choices: [{ delta: { content: "好" } }] });
    }

    fetchStream.mockReturnValueOnce(streamChunks());

    const result = await collectAsyncGenerator(
      handleTranslate(["hello"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: getNobatchApiSetting({
          useStream: true,
          streamRenderMode: "realtime",
        }),
        usePool: false,
      })
    );

    expect(fetchStream).toHaveBeenCalledTimes(1);
    expect(fetchData).not.toHaveBeenCalled();
    expect(JSON.parse(fetchStream.mock.calls[0][1].body).stream).toBe(true);
    expect(result).toEqual([
      { id: 0, partialText: "你", isComplete: false },
      { id: 0, partialText: "你好", isComplete: false },
      { id: 0, result: ["你好"] },
    ]);
  });

  test("does not append external docInfo to system prompt without placeholders", async () => {
    fetchData.mockResolvedValueOnce({
      choices: [{ message: { content: "你好" } }],
    });

    await collectAsyncGenerator(
      handleTranslate(["hello"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: getNobatchApiSetting(),
        usePool: false,
        docInfo: {
          title: "Doc title",
          description: "Doc description",
          summary: "Doc summary",
          context: "Doc context",
        },
      })
    );

    const body = JSON.parse(fetchData.mock.calls[0][1].body);

    expect(body.messages[0].content).toBe("Translate hello.");
    expect(body.messages[0].content).not.toContain("# Context");
    expect(body.messages[0].content).not.toContain("Doc context");
  });

  test("replaces external docInfo placeholders in user prompt", async () => {
    fetchData.mockResolvedValueOnce({
      choices: [{ message: { content: "你好" } }],
    });

    await collectAsyncGenerator(
      handleTranslate(["hello"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: getNobatchApiSetting({
          nobatchUserPrompt: "Title: {{title}}\nContext: {{context}}",
        }),
        usePool: false,
        docInfo: {
          title: "Doc title",
          context: "Doc context",
        },
      })
    );

    const body = JSON.parse(fetchData.mock.calls[0][1].body);

    expect(body.messages[0].content).toBe("Translate hello.");
    expect(body.messages[body.messages.length - 1].content).toBe(
      "Title: Doc title\nContext: Doc context"
    );
  });
});
