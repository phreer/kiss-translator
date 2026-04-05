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

import { parseAIRes } from "./trans";
import {
  defaultSystemPrompt,
  defaultSystemPromptLines,
  defaultSystemPromptXml,
  LLM_OUTPUT_FORMAT_AUTO,
  LLM_OUTPUT_FORMAT_JSON,
  LLM_OUTPUT_FORMAT_TEXTLINES,
  LLM_OUTPUT_FORMAT_XML,
  resolveLlmOutputFormat,
} from "../config";

describe("resolveLlmOutputFormat", () => {
  it("prefers explicit format", () => {
    expect(
      resolveLlmOutputFormat({
        llmOutputFormat: LLM_OUTPUT_FORMAT_JSON,
        systemPrompt: defaultSystemPromptXml,
      })
    ).toBe(LLM_OUTPUT_FORMAT_JSON);
  });

  it("falls back to known default prompts", () => {
    expect(resolveLlmOutputFormat({ systemPrompt: defaultSystemPrompt })).toBe(
      LLM_OUTPUT_FORMAT_JSON
    );
    expect(
      resolveLlmOutputFormat({ systemPrompt: defaultSystemPromptXml })
    ).toBe(LLM_OUTPUT_FORMAT_XML);
    expect(
      resolveLlmOutputFormat({ systemPrompt: defaultSystemPromptLines })
    ).toBe(LLM_OUTPUT_FORMAT_TEXTLINES);
  });

  it("uses auto for custom prompts without explicit format", () => {
    expect(resolveLlmOutputFormat({ systemPrompt: "custom" })).toBe(
      LLM_OUTPUT_FORMAT_AUTO
    );
  });
});

describe("parseAIRes", () => {
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
