jest.mock("@streamparser/json", () => ({
  JSONParser: jest.fn(),
}));

import {
  detectStreamJsonFormat,
  parseStreamingTextLineSegments,
  parseStreamingXmlSegments,
} from "./stream";
import {
  LLM_OUTPUT_FORMAT_AUTO,
  LLM_OUTPUT_FORMAT_JSON,
  LLM_OUTPUT_FORMAT_TEXTLINES,
  LLM_OUTPUT_FORMAT_XML,
} from "../config";

describe("detectStreamJsonFormat", () => {
  it("uses explicit json format without detection", () => {
    expect(
      detectStreamJsonFormat(LLM_OUTPUT_FORMAT_JSON, "not json yet")
    ).toEqual({
      isJson: true,
      detected: true,
    });
  });

  it("uses explicit non-json formats without heuristics", () => {
    expect(detectStreamJsonFormat(LLM_OUTPUT_FORMAT_XML, "anything")).toEqual({
      isJson: false,
      detected: true,
    });
    expect(
      detectStreamJsonFormat(LLM_OUTPUT_FORMAT_TEXTLINES, "anything")
    ).toEqual({
      isJson: false,
      detected: true,
    });
  });

  it("keeps legacy auto detection", () => {
    expect(
      detectStreamJsonFormat(LLM_OUTPUT_FORMAT_AUTO, '{"translations":[')
    ).toEqual({
      isJson: true,
      detected: true,
    });
  });
});

describe("parseStreamingXmlSegments", () => {
  it("yields xml segments by id", () => {
    const result = [
      ...parseStreamingXmlSegments(
        '<t id="0" sourceLanguage="en">Hello</t><t id="1">World</t>',
        new Set()
      ),
    ];

    expect(result).toEqual([
      { id: 0, translation: ["Hello", "en"] },
      { id: 1, translation: ["World", ""] },
    ]);
  });
});

describe("parseStreamingTextLineSegments", () => {
  it("yields complete text lines only", () => {
    const result = [
      ...parseStreamingTextLineSegments("0 | 你好\n1 | 世界", new Set()),
    ];

    expect(result).toEqual([{ id: 0, translation: ["你好", ""] }]);
  });
});
