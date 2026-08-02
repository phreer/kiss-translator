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
import {
  defaultSystemPrompt,
  defaultSystemPromptXml,
  defaultSystemPromptLines,
  defaultNobatchPrompt,
  OPT_TRANS_OPENAI,
} from "../config";

const EXAMPLE_INPUT =
  '{"targetLanguage":"zh-CN","segments":[{"id":0,"text":"A <b>React</b> component."},{"id":1,"text":"Line 1\\nLine 2"}],"glossary":{"component":"组件","React":""}}';

const EXAMPLE_OUTPUT_JSON =
  '{"translations":[{"id":0,"text":"一个<b>React</b>组件","sourceLanguage":"en"},{"id":1,"text":"第一行\\n第二行","sourceLanguage":"en"}]}';

const EXAMPLE_OUTPUT_XML =
  '<root>\n    <t id="0" sourceLanguage="en">一个&lt;b&gt;React&lt;/b&gt;组件</t>\n    <t id="1" sourceLanguage="en">第一行<br>第二行</t>\n</root>';

const EXAMPLE_OUTPUT_LINE = "0 | 一个<b>React</b>组件\n1 | 第一行<br>第二行";

const renderSystemPrompt = async ({ systemPrompt, useBatchFetch = true }) => {
  const [, init] = await genTransReq({
    apiType: OPT_TRANS_OPENAI,
    url: "https://api.openai.com/v1/chat/completions",
    key: "test-key",
    model: "test-model",
    systemPrompt,
    useBatchFetch,
    from: "en",
    to: "zh",
    fromLang: "English",
    toLang: "zh-CN",
    texts: ["Hello."],
    glossary: {},
    docInfo: { title: "", description: "" },
  });
  return JSON.parse(init.body).messages[0].content;
};

describe("batch system prompt example", () => {
  test("example input is byte-identical to a real batch user message", async () => {
    const [, , userMsg] = await genTransReq({
      apiType: OPT_TRANS_OPENAI,
      url: "https://api.openai.com/v1/chat/completions",
      key: "test-key",
      model: "test-model",
      systemPrompt: defaultSystemPrompt,
      useBatchFetch: true,
      from: "en",
      to: "zh",
      fromLang: "English",
      toLang: "zh-CN",
      texts: ["A <b>React</b> component.", "Line 1\nLine 2"],
      glossary: { component: "组件", React: "" },
      docInfo: { title: "", description: "" },
    });
    expect(userMsg.content).toBe(EXAMPLE_INPUT);
  });

  test("JSON prompt appends unified example with JSON output", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: defaultSystemPrompt,
    });
    expect(content).toBe(
      `${defaultSystemPrompt}\n\nExample:\nInput: ${EXAMPLE_INPUT}\nOutput: ${EXAMPLE_OUTPUT_JSON}`
    );
  });

  test("XML prompt appends unified example with XML output", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: defaultSystemPromptXml,
    });
    expect(content).toBe(
      `${defaultSystemPromptXml}\n\nExample:\nInput: ${EXAMPLE_INPUT}\nOutput: ${EXAMPLE_OUTPUT_XML}`
    );
  });

  test("LINE prompt appends unified example with line output", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: defaultSystemPromptLines,
    });
    expect(content).toBe(
      `${defaultSystemPromptLines}\n\nExample:\nInput: ${EXAMPLE_INPUT}\nOutput: ${EXAMPLE_OUTPUT_LINE}`
    );
  });

  test("all three formats share the same example input", async () => {
    for (const systemPrompt of [
      defaultSystemPrompt,
      defaultSystemPromptXml,
      defaultSystemPromptLines,
    ]) {
      const content = await renderSystemPrompt({ systemPrompt });
      expect(content).toContain(`Example:\nInput: ${EXAMPLE_INPUT}`);
    }
  });

  test("custom prompt without format markers falls back to JSON example", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: "Custom batch rules only.",
    });
    expect(content).toBe(
      `Custom batch rules only.\n\nExample:\nInput: ${EXAMPLE_INPUT}\nOutput: ${EXAMPLE_OUTPUT_JSON}`
    );
  });

  test("non-batch prompt does not append example", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: defaultNobatchPrompt,
      useBatchFetch: false,
    });
    expect(content).toBe(defaultNobatchPrompt);
    expect(content).not.toContain("Example:");
  });

  test("subtitle prompt does not append example", async () => {
    const [, init] = await genTransReq({
      apiType: OPT_TRANS_OPENAI,
      url: "https://api.openai.com/v1/chat/completions",
      key: "test-key",
      model: "test-model",
      subtitlePrompt: "Subtitle rules.",
      useBatchFetch: true,
      from: "en",
      to: "zh",
      fromLang: "English",
      toLang: "zh-CN",
      events: [{ id: 0, text: "Once" }],
      docInfo: { title: "", description: "" },
    });
    const content = JSON.parse(init.body).messages[0].content;
    expect(content).toBe("Subtitle rules.");
    expect(content).not.toContain("Example:");
  });
});
