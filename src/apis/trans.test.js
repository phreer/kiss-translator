/**
 * @jest-environment jsdom
 */
jest.mock("query-string", () => ({
  __esModule: true,
  default: { stringify: jest.fn() },
  stringify: jest.fn(),
}));
jest.mock("@streamparser/json", () => ({
  JSONParser: jest.fn(),
}));
jest.mock("../libs/auth", () => ({}));
jest.mock("./deepl", () => ({}));
jest.mock("./baidu", () => ({}));
jest.mock("../libs/interpreter", () => ({
  interpreter: { run: jest.fn(), exports: {} },
}));
jest.mock("../libs/log", () => ({
  kissLog: jest.fn(),
  LogLevel: {
    DEBUG: { name: "DEBUG", value: 0 },
    INFO: { name: "INFO", value: 1 },
    WARN: { name: "WARN", value: 2 },
    ERROR: { name: "ERROR", value: 3 },
  },
}));
jest.mock("../libs/fetch", () => ({
  fetchData: jest.fn(),
  fetchStream: jest.fn(),
}));
jest.mock("./history", () => ({ getMsgHistory: jest.fn() }));
jest.mock("../subtitle/vtt", () => ({ parseBilingualVtt: jest.fn() }));
jest.mock("../libs/docInfo", () => ({ getDocInfo: jest.fn(() => ({})) }));

import {
  buildBatchSystemPrompt,
  genUserPrompt,
  getLlmPromptPreview,
  parseAIRes,
  validateTemplateSettings,
} from "./trans";
import {
  defaultLlmRulesPrompt,
  defaultLlmInputTemplatePercent,
  defaultLlmInputSegmentTemplatePercent,
  defaultLlmOutputTemplatePercent,
  defaultLlmOutputSegmentTemplatePercent,
  LLM_OUTPUT_FORMAT_AUTO,
  LLM_OUTPUT_FORMAT_JSON,
  LLM_OUTPUT_MAPPING_BY_ORDER,
  LLM_OUTPUT_FORMAT_PERCENT,
  LLM_OUTPUT_FORMAT_TEXTLINES,
  LLM_OUTPUT_FORMAT_XML,
  resolveLlmOutputFormat,
  getLlmTemplatePreset,
} from "../config";

describe("resolveLlmOutputFormat", () => {
  it("prefers explicit format", () => {
    expect(
      resolveLlmOutputFormat({
        llmOutputFormat: LLM_OUTPUT_FORMAT_JSON,
        systemPrompt: defaultLlmRulesPrompt,
      })
    ).toBe(LLM_OUTPUT_FORMAT_JSON);
  });

  it("uses auto when no explicit format is provided", () => {
    expect(
      resolveLlmOutputFormat({ systemPrompt: defaultLlmRulesPrompt })
    ).toBe(LLM_OUTPUT_FORMAT_AUTO);
  });
});

describe("parseAIRes", () => {
  it("builds final batch system prompt with protocol appendix", () => {
    const prompt = buildBatchSystemPrompt({
      systemPrompt: defaultLlmRulesPrompt,
      tone: "neutral",
      from: "en",
      to: "zh-CN",
      fromLang: "en",
      toLang: "zh-CN",
      texts: ["Hello"],
      docInfo: {},
      templateMeta: {
        llmInputTemplate: defaultLlmInputTemplatePercent,
        llmInputSegmentTemplate: defaultLlmInputSegmentTemplatePercent,
        llmInputSegmentsSeparator: "\n%%\n",
        llmOutputTemplate: defaultLlmOutputTemplatePercent,
        llmOutputSegmentTemplate: defaultLlmOutputSegmentTemplatePercent,
        llmOutputSegmentsSeparator: "\n%%\n",
        llmOutputMappingMode: LLM_OUTPUT_MAPPING_BY_ORDER,
      },
    });

    expect(prompt).toContain("Act as a precise translation engine.");
    expect(prompt).toContain("Protocol Appendix:");
    expect(prompt).toContain("Sample Input:");
    expect(prompt).toContain("Expected Output:");
  });

  it("returns prompt preview for preset templates", () => {
    const preview = getLlmPromptPreview({
      systemPrompt: defaultLlmRulesPrompt,
      llmOutputFormat: LLM_OUTPUT_FORMAT_PERCENT,
      ...getLlmTemplatePreset(LLM_OUTPUT_FORMAT_PERCENT),
    });

    expect(preview.preset).toBe(LLM_OUTPUT_FORMAT_PERCENT);
    expect(preview.sampleUserInput).toContain("Target Language: zh-CN");
    expect(preview.sampleOutput).toContain("你好，世界");
  });

  it("renders percent input template for batch prompts", () => {
    const prompt = genUserPrompt({
      useBatchFetch: true,
      llmOutputFormat: LLM_OUTPUT_FORMAT_PERCENT,
      llmInputTemplate: defaultLlmInputTemplatePercent,
      llmInputSegmentTemplate: defaultLlmInputSegmentTemplatePercent,
      llmInputSegmentsSeparator: "\n%%\n",
      systemPrompt: defaultLlmRulesPrompt,
      toLang: "zh-CN",
      texts: ["Hello.", "World!"],
      glossary: { World: "世界" },
      docInfo: {},
      tone: "neutral",
    });

    expect(prompt).toContain("Target Language: zh-CN");
    expect(prompt).toContain("[0]\nHello.");
    expect(prompt).toContain("\n%%\n[1]\nWorld!");
  });

  it("parses json explicitly", () => {
    const raw =
      'prefix {"translations":[{"id":0,"text":"你好","sourceLanguage":"en"}]} suffix';
    expect(parseAIRes(raw, true, LLM_OUTPUT_FORMAT_JSON)).toEqual([
      ["你好", "en"],
    ]);
  });

  it("parses xml explicitly", () => {
    const raw = '<root><t id="0" sourceLanguage="en">你好</t></root>';
    expect(parseAIRes(raw, true, LLM_OUTPUT_FORMAT_XML)).toEqual([
      ["你好", "en"],
    ]);
  });

  it("parses line output explicitly", () => {
    const raw = "0 | 你好\n1 | 世界";
    expect(parseAIRes(raw, true, LLM_OUTPUT_FORMAT_TEXTLINES)).toEqual([
      ["你好", ""],
      ["世界", ""],
    ]);
  });

  it("parses percent output explicitly", () => {
    const raw = "你好\n%%\n世界";
    expect(parseAIRes(raw, true, LLM_OUTPUT_FORMAT_PERCENT)).toEqual([
      ["你好", ""],
      ["世界", ""],
    ]);
  });

  it("parses custom by-order template output", () => {
    const raw = "<seg>你好</seg>\n---\n<seg>世界</seg>";
    expect(
      parseAIRes(raw, true, LLM_OUTPUT_FORMAT_AUTO, {
        llmOutputFormat: LLM_OUTPUT_FORMAT_AUTO,
        llmOutputTemplate: "{{segments}}",
        llmOutputSegmentTemplate: "<seg>{{translation}}</seg>",
        llmOutputSegmentsSeparator: "\n---\n",
        llmOutputMappingMode: LLM_OUTPUT_MAPPING_BY_ORDER,
      })
    ).toEqual([
      ["你好", ""],
      ["世界", ""],
    ]);
  });

  it("warns when by_id template misses id placeholder", () => {
    expect(
      validateTemplateSettings({
        llmInputTemplate: "{{segments}}",
        llmOutputTemplate: "{{segments}}",
        llmOutputSegmentTemplate: "<seg>{{translation}}</seg>",
        llmOutputSegmentsSeparator: "\n",
        llmOutputMappingMode: "by_id",
      })
    ).toContain(
      "by_id mapping requires {{id}} in the output segment template."
    );
  });

  it("keeps auto detection for legacy prompts", () => {
    const raw = '<root><t id="0" sourceLanguage="en">你好</t></root>';
    expect(parseAIRes(raw, true, LLM_OUTPUT_FORMAT_AUTO)).toEqual([
      ["你好", "en"],
    ]);
  });

  it("returns raw text when batch mode is disabled", () => {
    expect(parseAIRes("hello", false, LLM_OUTPUT_FORMAT_JSON)).toEqual([
      ["hello"],
    ]);
  });
});
