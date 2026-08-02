import {
  parsePercentTranslationSegments,
  renderJsonOutput,
  renderXmlOutput,
  renderLineOutput,
  renderPercentOutput,
  parserPresets,
  getParserPreset,
} from "./aiResponseParser";

// 与 trans.js 中 SAMPLE_TRANSLATIONS 同构的示例译文，golden 字节与 trans.example.test.js 一致。
const SAMPLE = [
  { id: 0, translation: ["一个<b>React</b>组件", "en"] },
  { id: 1, translation: ["第一行\n第二行", "en"] },
];

const SIMPLE = [
  { id: 0, translation: ["Hello", "en"] },
  { id: 1, translation: ["世界", "en"] },
];

describe("render functions (Output example generation)", () => {
  test("JSON render is byte-identical to the pinned example output", () => {
    expect(renderJsonOutput(SAMPLE)).toBe(
      '{"translations":[{"id":0,"text":"一个<b>React</b>组件","sourceLanguage":"en"},{"id":1,"text":"第一行\\n第二行","sourceLanguage":"en"}]}'
    );
  });

  test("XML render is byte-identical to the pinned example output", () => {
    expect(renderXmlOutput(SAMPLE)).toBe(
      '<root>\n    <t id="0" sourceLanguage="en">一个<b>React</b>组件</t>\n    <t id="1" sourceLanguage="en">第一行<br>第二行</t>\n</root>'
    );
  });

  test("LINE render is byte-identical to the pinned example output", () => {
    expect(renderLineOutput(SAMPLE)).toBe(
      "0 | 一个<b>React</b>组件\n1 | 第一行<br>第二行"
    );
  });

  test("percent render mirrors the percent encoder block structure", () => {
    expect(renderPercentOutput(SAMPLE)).toBe(
      "[0]\n一个<b>React</b>组件\n%%\n\n[1]\n第一行\n第二行"
    );
  });

  test("render of empty list yields valid empty structures", () => {
    expect(renderJsonOutput([])).toBe('{"translations":[]}');
    expect(renderXmlOutput([])).toBe("<root>\n</root>");
    expect(renderLineOutput([])).toBe("");
    expect(renderPercentOutput([])).toBe("");
  });

  test("JSON render escapes quotes and backslashes", () => {
    expect(renderJsonOutput([{ id: 0, translation: ['He said "hi"\\ok', "en"] }])).toBe(
      '{"translations":[{"id":0,"text":"He said \\"hi\\"\\\\ok","sourceLanguage":"en"}]}'
    );
  });

  test("render tolerates plain translation/source_language shape", () => {
    expect(
      renderJsonOutput([
        { id: 0, translation: "你好", source_language: "en" },
      ])
    ).toBe('{"translations":[{"id":0,"text":"你好","sourceLanguage":"en"}]}');
  });
});

describe("parsePercentTranslationSegments", () => {
  test("parses id-prefixed blocks separated by %%", () => {
    expect(
      parsePercentTranslationSegments("[0]\nHello\n%%\n\n[1]\nWorld")
    ).toEqual([
      { id: 0, translation: ["Hello", ""] },
      { id: 1, translation: ["World", ""] },
    ]);
  });

  test("assigns ids by order when blocks omit the id header", () => {
    expect(parsePercentTranslationSegments("First\n%%\n\nSecond")).toEqual([
      { id: 0, translation: ["First", ""] },
      { id: 1, translation: ["Second", ""] },
    ]);
  });

  test("skips empty blocks and trims surrounding whitespace", () => {
    expect(parsePercentTranslationSegments("  [0]\n A \n%%\n\n%%\n\n [1]\nB ")).toEqual([
      { id: 0, translation: ["A", ""] },
      { id: 1, translation: ["B", ""] },
    ]);
  });

  test("preserves internal newlines inside a block", () => {
    expect(parsePercentTranslationSegments("[1]\nLine 1\nLine 2")).toEqual([
      { id: 1, translation: ["Line 1\nLine 2", ""] },
    ]);
  });

  test("applies decodeText to extracted text", () => {
    expect(
      parsePercentTranslationSegments("[0]\n&amp;", {
        decodeText: (s) => s.replace(/&amp;/g, "&"),
      })
    ).toEqual([{ id: 0, translation: ["&", ""] }]);
  });

  test("handles empty and malformed input", () => {
    expect(parsePercentTranslationSegments("")).toEqual([]);
    expect(parsePercentTranslationSegments("%%  %%")).toEqual([]);
  });
});

describe("round-trip (parse ∘ render)", () => {
  test("JSON round-trips segments including newlines and source", () => {
    expect(parserPresets.json.parse(parserPresets.json.render(SAMPLE))).toEqual(
      SAMPLE
    );
  });

  test("XML round-trips segments without internal newlines", () => {
    expect(parserPresets.xml.parse(parserPresets.xml.render(SIMPLE))).toEqual(
      SIMPLE
    );
  });

  test("XML keeps <br> (not re-decoded) for texts with internal newlines", () => {
    const rendered = parserPresets.xml.render(SAMPLE);
    expect(parserPresets.xml.parse(rendered)).toEqual([
      { id: 0, translation: ["一个<b>React</b>组件", "en"] },
      { id: 1, translation: ["第一行<br>第二行", "en"] },
    ]);
  });

  test("LINE round-trips text via <br> encoding, dropping source", () => {
    expect(parserPresets.textlines.parse(parserPresets.textlines.render(SAMPLE))).toEqual([
      { id: 0, translation: ["一个<b>React</b>组件", ""] },
      { id: 1, translation: ["第一行\n第二行", ""] },
    ]);
  });

  test("percent round-trips text, dropping source", () => {
    expect(parserPresets.percent.parse(parserPresets.percent.render(SAMPLE))).toEqual([
      { id: 0, translation: ["一个<b>React</b>组件", ""] },
      { id: 1, translation: ["第一行\n第二行", ""] },
    ]);
  });
});

describe("parserPresets registry", () => {
  test("exposes the four decoder presets with their mapping modes", () => {
    expect(Object.keys(parserPresets).sort()).toEqual([
      "json",
      "percent",
      "textlines",
      "xml",
    ]);
    expect(parserPresets.json.mappingMode).toBe("by_id");
    expect(parserPresets.xml.mappingMode).toBe("by_id");
    expect(parserPresets.textlines.mappingMode).toBe("by_id");
    expect(parserPresets.percent.mappingMode).toBe("by_order");
  });

  test("getParserPreset returns the preset by name", () => {
    expect(getParserPreset("xml")).toBe(parserPresets.xml);
  });

  test("getParserPreset falls back to json for unknown names", () => {
    expect(getParserPreset("unknown")).toBe(parserPresets.json);
  });
});
