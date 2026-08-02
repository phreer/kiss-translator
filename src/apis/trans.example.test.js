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

import { genTransReq, parseTransRes } from "./trans";
import {
  defaultSystemPrompt,
  defaultSystemPromptXml,
  defaultSystemPromptLines,
  defaultNobatchPrompt,
  OPT_TRANS_OPENAI,
} from "../config";

const EXAMPLE_INPUT =
  '{"targetLanguage":"zh-CN","segments":[{"id":0,"text":"A <b>React</b> component."},{"id":1,"text":"Line 1\\nLine 2"}],"glossary":{"component":"组件","React":""}}';

// XML/textlines 输出格式会对 source_text 做对应转义，示例输入逐字节镜像真实批量 user message。
const EXAMPLE_INPUT_XML =
  '{"targetLanguage":"zh-CN","segments":[{"id":0,"text":"A &lt;b&gt;React&lt;/b&gt; component."},{"id":1,"text":"Line 1\\nLine 2"}],"glossary":{"component":"组件","React":""}}';

const EXAMPLE_INPUT_LINE =
  '{"targetLanguage":"zh-CN","segments":[{"id":0,"text":"A <b>React</b> component."},{"id":1,"text":"Line 1<br>Line 2"}],"glossary":{"component":"组件","React":""}}';

const XML_PROMPT_NOTE =
  "Write a literal <, > or & in translated text as &lt;, &gt;, &amp; respectively.";
const LINES_PROMPT_NOTE =
  "Use <br> for newlines; write a literal <br> as &lt;br&gt; and & as &amp;.";

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

  test("XML prompt appends unified example with XML output and escape note", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: defaultSystemPromptXml,
    });
    expect(content).toBe(
      `${defaultSystemPromptXml}\n\nExample:\nInput: ${EXAMPLE_INPUT_XML}\nOutput: ${EXAMPLE_OUTPUT_XML}\n${XML_PROMPT_NOTE}`
    );
  });

  test("LINE prompt appends unified example with line output and escape note", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: defaultSystemPromptLines,
    });
    expect(content).toBe(
      `${defaultSystemPromptLines}\n\nExample:\nInput: ${EXAMPLE_INPUT_LINE}\nOutput: ${EXAMPLE_OUTPUT_LINE}\n${LINES_PROMPT_NOTE}`
    );
  });

  test("each format's example input is byte-identical to its own real user message", async () => {
    for (const [systemPrompt, expectedInput] of [
      [defaultSystemPrompt, EXAMPLE_INPUT],
      [defaultSystemPromptXml, EXAMPLE_INPUT_XML],
      [defaultSystemPromptLines, EXAMPLE_INPUT_LINE],
    ]) {
      const content = await renderSystemPrompt({ systemPrompt });
      expect(content).toContain(`Example:\nInput: ${expectedInput}`);

      const [, , userMsg] = await genTransReq({
        apiType: OPT_TRANS_OPENAI,
        url: "https://api.openai.com/v1/chat/completions",
        key: "test-key",
        model: "test-model",
        systemPrompt,
        useBatchFetch: true,
        from: "en",
        to: "zh",
        fromLang: "English",
        toLang: "zh-CN",
        texts: ["A <b>React</b> component.", "Line 1\nLine 2"],
        glossary: { component: "组件", React: "" },
        docInfo: { title: "", description: "" },
      });
      expect(userMsg.content).toBe(expectedInput);
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

// 批量解码侧：按系统提示词判定输出格式，并把对应 preset 的 denormalize 注入 parseAIRes。
describe("batch decode (denormalize wiring)", () => {
  const makeResponse = (content) => ({
    choices: [{ message: { role: "assistant", content } }],
  });

  const parseOpenAI = (content, systemPrompt) =>
    parseTransRes(makeResponse(content), {
      apiType: OPT_TRANS_OPENAI,
      useBatchFetch: true,
      systemPrompt,
    });

  test("XML batch decodes escaped entities back to rich text", async () => {
    const result = await parseOpenAI(
      '<root>\n    <t id="0" sourceLanguage="en">一个&lt;b&gt;React&lt;/b&gt;组件</t>\n</root>',
      defaultSystemPromptXml
    );
    expect(result).toEqual([["一个<b>React</b>组件", "en"]]);
  });

  test("XML batch keeps &amp;lt; as a literal single-pass restore", async () => {
    const result = await parseOpenAI(
      '<root><t id="0" sourceLanguage="en">&amp;lt;br&amp;gt;</t></root>',
      defaultSystemPromptXml
    );
    expect(result).toEqual([["&lt;br&gt;", "en"]]);
  });

  test("LINE batch folds <br> to newlines and denormalizes literal <br>", async () => {
    const result = await parseOpenAI(
      "0 | 第一行<br>第二行\n1 | a &lt;br&gt; b",
      defaultSystemPromptLines
    );
    expect(result).toEqual([
      ["第一行\n第二行", ""],
      ["a <br> b", ""],
    ]);
  });

  test("json batch keeps text verbatim (identity decode)", async () => {
    const result = await parseOpenAI(
      '{"translations":[{"id":0,"text":"A & B <b>c</b>","sourceLanguage":"en"}]}',
      defaultSystemPrompt
    );
    expect(result).toEqual([["A & B <b>c</b>", "en"]]);
  });

  test("plain-text fallback still decodes per preset", async () => {
    const result = await parseOpenAI(
      "一个&lt;b&gt;React&lt;/b&gt;组件",
      defaultSystemPromptXml
    );
    expect(result).toEqual([["一个<b>React</b>组件", ""]]);
  });
});
