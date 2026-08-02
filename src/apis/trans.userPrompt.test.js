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

import { genTransReq } from "./trans";
import { OPT_TRANS_OPENAI } from "../config";

// 复刻重构前 genUserPrompt 批量分支的硬编码逻辑，作为逐字节一致的基准。
const buildLegacyPrompt = ({
  toLang,
  texts,
  title,
  description,
  glossary,
  tone,
}) => {
  const promptObj = {
    targetLanguage: toLang,
    segments: texts.map((text, i) => ({ id: i, text })),
  };
  title && (promptObj.title = title);
  description && (promptObj.description = description);
  Object.keys(glossary).length !== 0 && (promptObj.glossary = glossary);
  tone && (promptObj.tone = tone);
  return JSON.stringify(promptObj);
};

const renderUserPrompt = async ({
  texts,
  toLang = "zh-CN",
  title = "",
  description = "",
  glossary = {},
  tone = "",
}) => {
  const [, , userMsg] = await genTransReq({
    apiType: OPT_TRANS_OPENAI,
    url: "https://api.openai.com/v1/chat/completions",
    key: "test-key",
    model: "test-model",
    systemPrompt: "system",
    useBatchFetch: true,
    from: "en",
    to: "zh",
    fromLang: "English",
    toLang,
    texts,
    glossary,
    tone,
    docInfo: { title, description },
  });
  return userMsg.content;
};

describe("genUserPrompt batch input (template engine refactor)", () => {
  test("byte-identical: no optional fields", async () => {
    const texts = ["Hello, world!", "How are you?"];
    expect(await renderUserPrompt({ texts })).toBe(
      buildLegacyPrompt({ toLang: "zh-CN", texts, glossary: {} })
    );
  });

  test("byte-identical: all optional fields present", async () => {
    const texts = ["Hello.", "Line 1\nLine 2"];
    const glossary = { React: "React", component: "组件" };
    const title = "Page Title";
    const description = "A description";
    expect(
      await renderUserPrompt({
        texts,
        title,
        description,
        glossary,
        tone: "formal",
      })
    ).toBe(
      buildLegacyPrompt({
        toLang: "zh-CN",
        texts,
        title,
        description,
        glossary,
        tone: "formal",
      })
    );
  });

  test("byte-identical: empty glossary omits the key", async () => {
    const texts = ["Only text, no glossary."];
    expect(await renderUserPrompt({ texts, glossary: {} })).toBe(
      buildLegacyPrompt({ toLang: "zh-CN", texts, glossary: {} })
    );
  });

  test("byte-identical: special characters in text", async () => {
    const texts = [
      'A "quoted" phrase and \\ backslash.',
      "line1\nline2\nline3",
      "HTML: <b>bold</b> &amp; entities.",
      "Unicode: 你好 مرحبا Привет «French»",
    ];
    expect(await renderUserPrompt({ texts })).toBe(
      buildLegacyPrompt({ toLang: "zh-CN", texts, glossary: {} })
    );
  });

  test("byte-identical: empty texts list", async () => {
    expect(await renderUserPrompt({ texts: [] })).toBe(
      buildLegacyPrompt({ toLang: "zh-CN", texts: [], glossary: {} })
    );
  });

  test("byte-identical: single segment has no separator issues", async () => {
    const texts = ["Only one segment."];
    expect(await renderUserPrompt({ texts })).toBe(
      buildLegacyPrompt({ toLang: "zh-CN", texts, glossary: {} })
    );
  });

  test("byte-identical: many segments", async () => {
    const texts = Array.from({ length: 12 }, (_, i) => `Segment ${i} content.`);
    expect(await renderUserPrompt({ texts })).toBe(
      buildLegacyPrompt({ toLang: "zh-CN", texts, glossary: {} })
    );
  });
});
