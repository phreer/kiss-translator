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

import { genTransReq, parseTransRes, renderBatchExample } from "./trans";
import {
  defaultSystemPrompt,
  defaultSystemPromptXml,
  defaultSystemPromptLines,
  defaultNobatchPrompt,
  OPT_TRANS_OPENAI,
} from "../config";
import {
  applyPromptTestOverrides,
  resolveApiPromptSettings,
} from "../config/prompt";

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

// 与 buildBatchExample 的 markdown 输出逐字节一致的期望串构造器。
// note 为空时生成 "## Note: "（含尾随空格），有值时生成 "## Note: \n{note}"。
const EXAMPLE_MARKDOWN = (input, output, note = "") =>
  `## Example:\n### Input\n\`\`\`\n${input}\n\`\`\`\n### Output\n\`\`\`\n${output}\n\`\`\`\n## Note: ${
    note ? `\n${note}` : ""
  }`;

const renderSystemPrompt = async ({
  systemPrompt,
  useBatchFetch = true,
  ioInputFormat,
  ioOutputFormat,
  ioInputTemplate,
}) => {
  const [, init] = await genTransReq({
    apiType: OPT_TRANS_OPENAI,
    url: "https://api.openai.com/v1/chat/completions",
    key: "test-key",
    model: "test-model",
    systemPrompt,
    useBatchFetch,
    ioInputFormat,
    ioOutputFormat,
    ioInputTemplate,
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
      `${defaultSystemPrompt}\n\n${EXAMPLE_MARKDOWN(
        EXAMPLE_INPUT,
        EXAMPLE_OUTPUT_JSON
      )}`
    );
  });

  test("XML prompt with ioOutputFormat xml appends unified XML example and escape note", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: defaultSystemPromptXml,
      ioOutputFormat: "xml",
    });
    expect(content).toBe(
      `${defaultSystemPromptXml}\n\n${EXAMPLE_MARKDOWN(
        EXAMPLE_INPUT_XML,
        EXAMPLE_OUTPUT_XML,
        XML_PROMPT_NOTE
      )}`
    );
  });

  test("LINE prompt with ioOutputFormat textlines appends unified line example and escape note", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: defaultSystemPromptLines,
      ioOutputFormat: "textlines",
    });
    expect(content).toBe(
      `${defaultSystemPromptLines}\n\n${EXAMPLE_MARKDOWN(
        EXAMPLE_INPUT_LINE,
        EXAMPLE_OUTPUT_LINE,
        LINES_PROMPT_NOTE
      )}`
    );
  });

  test("each format's example input is byte-identical to its own real user message", async () => {
    for (const [systemPrompt, ioOutputFormat, expectedInput] of [
      [defaultSystemPrompt, "json", EXAMPLE_INPUT],
      [defaultSystemPromptXml, "xml", EXAMPLE_INPUT_XML],
      [defaultSystemPromptLines, "textlines", EXAMPLE_INPUT_LINE],
    ]) {
      const content = await renderSystemPrompt({
        systemPrompt,
        ioOutputFormat,
      });
      expect(content).toContain(
        `### Input\n\`\`\`\n${expectedInput}\n\`\`\``
      );

      const [, , userMsg] = await genTransReq({
        apiType: OPT_TRANS_OPENAI,
        url: "https://api.openai.com/v1/chat/completions",
        key: "test-key",
        model: "test-model",
        systemPrompt,
        useBatchFetch: true,
        ioOutputFormat,
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

  test("default format produces a JSON example for an unmarked prompt", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: "Custom batch rules only.",
    });
    expect(content).toBe(
      `Custom batch rules only.\n\n${EXAMPLE_MARKDOWN(
        EXAMPLE_INPUT,
        EXAMPLE_OUTPUT_JSON
      )}`
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

const makeResponse = (content) => ({
  choices: [{ message: { role: "assistant", content } }],
});

// 批量解码侧：输出格式由所选批处理提示词（ioOutputFormat）显式指定，并把对应 preset 的 denormalize 注入 parseAIRes。
const parseOpenAI = (content, systemPrompt, ioOutputFormat) =>
  parseTransRes(makeResponse(content), {
    apiType: OPT_TRANS_OPENAI,
    useBatchFetch: true,
    systemPrompt,
    ioOutputFormat,
  });

describe("batch decode (denormalize wiring)", () => {
  test("XML batch decodes escaped entities back to rich text", async () => {
    const result = await parseOpenAI(
      '<root>\n    <t id="0" sourceLanguage="en">一个&lt;b&gt;React&lt;/b&gt;组件</t>\n</root>',
      defaultSystemPromptXml,
      "xml"
    );
    expect(result).toEqual([["一个<b>React</b>组件", "en"]]);
  });

  test("XML batch keeps &amp;lt; as a literal single-pass restore", async () => {
    const result = await parseOpenAI(
      '<root><t id="0" sourceLanguage="en">&amp;lt;br&amp;gt;</t></root>',
      defaultSystemPromptXml,
      "xml"
    );
    expect(result).toEqual([["&lt;br&gt;", "en"]]);
  });

  test("LINE batch folds <br> to newlines and denormalizes literal <br>", async () => {
    const result = await parseOpenAI(
      "0 | 第一行<br>第二行\n1 | a &lt;br&gt; b",
      defaultSystemPromptLines,
      "textlines"
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
      defaultSystemPromptXml,
      "xml"
    );
    expect(result).toEqual([["一个<b>React</b>组件", ""]]);
  });
});

// 输入/输出格式接线：格式由所选批处理提示词决定（ioInputFormat/ioOutputFormat/ioInputTemplate），
// 不再依赖系统提示词特征；示例、user message 与解码侧共用同一份格式。
describe("io format wiring", () => {
  test("ioOutputFormat xml forces XML output example even for a JSON prompt", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: defaultSystemPrompt,
      ioOutputFormat: "xml",
    });
    expect(content).toBe(
      `${defaultSystemPrompt}\n\n${EXAMPLE_MARKDOWN(
        EXAMPLE_INPUT_XML,
        EXAMPLE_OUTPUT_XML,
        XML_PROMPT_NOTE
      )}`
    );
  });

  test("ioOutputFormat xml decodes XML entities from a JSON prompt", async () => {
    const result = await parseOpenAI(
      '<root><t id="0" sourceLanguage="en">一个&lt;b&gt;React&lt;/b&gt;组件</t></root>',
      defaultSystemPrompt,
      "xml"
    );
    expect(result).toEqual([["一个<b>React</b>组件", "en"]]);
  });

  test("ioInputFormat and ioOutputFormat are independent", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: defaultSystemPrompt,
      ioInputFormat: "percent",
      ioOutputFormat: "json",
    });
    expect(content).toContain("\nSegments:\n[0]");
    expect(content).toContain(`### Output\n\`\`\`\n${EXAMPLE_OUTPUT_JSON}`);
  });

  test("ioInputFormat percent keeps example input byte-identical to a real user message", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: defaultSystemPrompt,
      ioInputFormat: "percent",
      ioOutputFormat: "percent",
    });
    const exampleInput = content.slice(
      content.indexOf("### Input\n```\n") + "### Input\n```\n".length,
      content.indexOf("\n```\n### Output")
    );
    const [, , userMsg] = await genTransReq({
      apiType: OPT_TRANS_OPENAI,
      url: "https://api.openai.com/v1/chat/completions",
      key: "test-key",
      model: "test-model",
      systemPrompt: defaultSystemPrompt,
      useBatchFetch: true,
      ioInputFormat: "percent",
      ioOutputFormat: "percent",
      from: "en",
      to: "zh",
      fromLang: "English",
      toLang: "zh-CN",
      texts: ["A <b>React</b> component.", "Line 1\nLine 2"],
      glossary: { component: "组件", React: "" },
      docInfo: { title: "", description: "" },
    });
    expect(userMsg.content).toBe(exampleInput);
    expect(userMsg.content).toMatch(/^Target Language: zh-CN\nGlossary:\n/);
    expect(userMsg.content).toContain("\nSegments:\n[0]");
    expect(userMsg.content).toContain("\n%%\n[1]");
  });

  test("ioInputFormat percent escapes % and backslash once (no double escape)", async () => {
    const [, , userMsg] = await genTransReq({
      apiType: OPT_TRANS_OPENAI,
      url: "https://api.openai.com/v1/chat/completions",
      key: "test-key",
      model: "test-model",
      systemPrompt: defaultSystemPrompt,
      useBatchFetch: true,
      ioInputFormat: "percent",
      ioOutputFormat: "percent",
      from: "en",
      to: "zh",
      fromLang: "English",
      toLang: "zh-CN",
      texts: ["50% off", "a\\b"],
      glossary: {},
      docInfo: { title: "", description: "" },
    });
    expect(userMsg.content).toContain("[0]\n50\\% off");
    expect(userMsg.content).toContain("[1]\na\\\\b");
  });

  test("ioOutputFormat percent decodes escaped output back to plain text", async () => {
    const result = await parseOpenAI(
      "[0]\n50\\% off\n%%\n[1]\nHello",
      defaultSystemPrompt,
      "percent"
    );
    expect(result).toEqual([
      ["50% off", ""],
      ["Hello", ""],
    ]);
  });

  test("ioInputFormat custom uses the custom input template", async () => {
    const [, , userMsg] = await genTransReq({
      apiType: OPT_TRANS_OPENAI,
      url: "https://api.openai.com/v1/chat/completions",
      key: "test-key",
      model: "test-model",
      systemPrompt: defaultSystemPrompt,
      useBatchFetch: true,
      ioInputFormat: "custom",
      ioInputTemplate:
        "Translate: {{to_lang|raw}}|{% for s in segments %}{{s.id}}:{{s.source_text|raw}};{% endfor %}",
      from: "en",
      to: "zh",
      fromLang: "English",
      toLang: "zh-CN",
      texts: ["A <b>React</b> component.", "Line 1\nLine 2"],
      glossary: {},
      docInfo: { title: "", description: "" },
    });
    expect(userMsg.content).toBe(
      "Translate: zh-CN|0:A <b>React</b> component.;1:Line 1\nLine 2;"
    );
  });

  test("ioInputFormat custom falls back to json template when template is empty", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: defaultSystemPrompt,
      ioInputFormat: "custom",
    });
    expect(content).toContain(`### Input\n\`\`\`\n${EXAMPLE_INPUT}`);
  });
});

// UI 预览（Prompts 页只读框）与运行时追加的示例逐字节一致：renderBatchExample
// 走与 genTransReq 相同的 resolveIoPreset + buildBatchExample 路径。
describe("renderBatchExample (UI preview)", () => {
  test("default json/json preview matches the appended JSON example", () => {
    expect(renderBatchExample()).toBe(
      EXAMPLE_MARKDOWN(EXAMPLE_INPUT, EXAMPLE_OUTPUT_JSON)
    );
  });

  test("preview is byte-identical to the runtime-appended example", async () => {
    for (const [ioOutputFormat, expectedSuffix] of [
      ["xml", EXAMPLE_MARKDOWN(EXAMPLE_INPUT_XML, EXAMPLE_OUTPUT_XML, XML_PROMPT_NOTE)],
      ["textlines", EXAMPLE_MARKDOWN(EXAMPLE_INPUT_LINE, EXAMPLE_OUTPUT_LINE, LINES_PROMPT_NOTE)],
    ]) {
      const content = await renderSystemPrompt({
        systemPrompt: defaultSystemPrompt,
        ioOutputFormat,
      });
      expect(content).toBe(
        `${defaultSystemPrompt}\n\n${renderBatchExample("json", ioOutputFormat)}`
      );
      expect(renderBatchExample("json", ioOutputFormat)).toBe(expectedSuffix);
    }
  });

  test("percent preview matches the runtime appended example", async () => {
    const content = await renderSystemPrompt({
      systemPrompt: defaultSystemPrompt,
      ioInputFormat: "percent",
      ioOutputFormat: "percent",
    });
    expect(content).toBe(
      `${defaultSystemPrompt}\n\n${renderBatchExample("percent", "percent")}`
    );
  });

  test("custom template preview renders with the custom input template", () => {
    expect(
      renderBatchExample(
        "custom",
        "json",
        "Translate: {{to_lang|raw}}|{% for s in segments %}{{s.id}}:{{s.source_text|raw}};{% endfor %}"
      )
    ).toBe(
      EXAMPLE_MARKDOWN(
        "Translate: zh-CN|0:A <b>React</b> component.;1:Line 1\nLine 2;",
        EXAMPLE_OUTPUT_JSON
      )
    );
  });

  test("unknown or empty formats fall back to json/json", () => {
    expect(renderBatchExample("", "")).toBe(
      EXAMPLE_MARKDOWN(EXAMPLE_INPUT, EXAMPLE_OUTPUT_JSON)
    );
    expect(renderBatchExample("bogus", "bogus")).toBe(
      EXAMPLE_MARKDOWN(EXAMPLE_INPUT, EXAMPLE_OUTPUT_JSON)
    );
  });
});

// 提示词管理页"测试"按钮：applyPromptTestOverrides 把被测试提示词（含格式）覆盖到
// 解析后的 API 配置上，genTransReq 必须以被测提示词的格式追加示例。
describe("prompt test dialog uses the tested prompt config", () => {
  test("batch prompt override drives the appended example format", async () => {
    const apiSetting = applyPromptTestOverrides(
      resolveApiPromptSettings(
        {
          apiType: OPT_TRANS_OPENAI,
          url: "https://api.openai.com/v1/chat/completions",
          key: "test-key",
          model: "test-model",
          useBatchFetch: false,
        },
        [],
        {}
      ),
      {
        category: "batch system prompt",
        systemPrompt: defaultSystemPrompt,
        inputFormat: "json",
        outputFormat: "xml",
        inputTemplate: "",
      }
    );

    const [, init] = await genTransReq({
      ...apiSetting,
      from: "en",
      to: "zh",
      fromLang: "English",
      toLang: "zh-CN",
      texts: ["Hello."],
      glossary: {},
      docInfo: { title: "", description: "" },
    });
    const content = JSON.parse(init.body).messages[0].content;
    expect(content).toBe(
      `${defaultSystemPrompt}\n\n${renderBatchExample("json", "xml")}`
    );
  });
});
