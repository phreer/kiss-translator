import {
  parsePercentTranslationSegments,
  renderJsonOutput,
  renderXmlOutput,
  renderLineOutput,
  renderPercentOutput,
  parserPresets,
  getParserPreset,
  createEscapeCodec,
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
      '<root>\n    <t id="0" sourceLanguage="en">一个&lt;b&gt;React&lt;/b&gt;组件</t>\n    <t id="1" sourceLanguage="en">第一行<br>第二行</t>\n</root>'
    );
  });

  test("LINE render is byte-identical to the pinned example output", () => {
    expect(renderLineOutput(SAMPLE)).toBe(
      "0 | 一个<b>React</b>组件\n1 | 第一行<br>第二行"
    );
  });

  test("percent render joins blocks with %% separators and no id headers", () => {
    expect(renderPercentOutput(SAMPLE)).toBe(
      "一个<b>React</b>组件\n\n%%\n\n第一行\n第二行"
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
  test("parses blocks separated by %% in order", () => {
    expect(parsePercentTranslationSegments("Hello\n%%\n\nWorld")).toEqual([
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
    expect(parsePercentTranslationSegments("  A \n%%\n\n%%\n\n B ")).toEqual([
      { id: 0, translation: ["A", ""] },
      { id: 2, translation: ["B", ""] },
    ]);
  });

  test("preserves internal newlines inside a block", () => {
    expect(parsePercentTranslationSegments("Line 1\nLine 2")).toEqual([
      { id: 0, translation: ["Line 1\nLine 2", ""] },
    ]);
  });

  test("applies decodeText to extracted text", () => {
    expect(
      parsePercentTranslationSegments("&amp;", {
        decodeText: (s) => s.replace(/&amp;/g, "&"),
      })
    ).toEqual([{ id: 0, translation: ["&", ""] }]);
  });

  test("handles empty and malformed input", () => {
    expect(parsePercentTranslationSegments("")).toEqual([]);
    expect(parsePercentTranslationSegments("   ")).toEqual([]);
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

  test("XML keeps <br> and entities (not re-decoded) for rich content", () => {
    const rendered = parserPresets.xml.render(SAMPLE);
    expect(parserPresets.xml.parse(rendered)).toEqual([
      { id: 0, translation: ["一个&lt;b&gt;React&lt;/b&gt;组件", "en"] },
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

describe("createEscapeCodec", () => {
  const { xml, textlines, percent, json } = parserPresets;

  test("round-trips: denormalize(normalize(x)) === x for each format", () => {
    const cases = {
      xml: ["plain", "a<b>React</b>c", "& < >", "x &lt; y", "a<br>b"],
      // 换行标记由 parse 层还原，不进 denormalize，因此 codec 级往返不含 `\n`；
      // `<br/>` 等写法被归一为规范形 `<br>`，也不在此断言逐字节不变。
      textlines: ["a<br>b", "a & b", "&lt;br&gt;"],
      percent: ["50%", "a\\b", "\\%", "100%\\", "plain"],
    };
    for (const [name, texts] of Object.entries(cases)) {
      const preset = parserPresets[name];
      for (const text of texts) {
        expect(preset.denormalize(preset.normalize(text))).toBe(text);
      }
    }
  });

  test("XML escapes & first so literal entities stay literal", () => {
    expect(xml.normalize("&lt;")).toBe("&amp;lt;");
    expect(xml.denormalize("&amp;lt;")).toBe("&lt;");
    expect(xml.normalize("<b>React</b>")).toBe("&lt;b&gt;React&lt;/b&gt;");
  });

  test("XML denormalize is a single pass (no nested decode)", () => {
    expect(xml.denormalize("&amp;lt;br&amp;gt;")).toBe("&lt;br&gt;");
  });

  test("textlines folds newlines into <br> and escapes literal <br>", () => {
    expect(textlines.normalize("a\nb")).toBe("a<br>b");
    expect(textlines.normalize("a<br>b")).toBe("a&lt;br&gt;b");
    expect(textlines.normalize("a<br/>b")).toBe("a&lt;br&gt;b");
    expect(textlines.normalize("a & b")).toBe("a &amp; b");
  });

  test("textlines denormalize does not decode the newline marker", () => {
    expect(textlines.denormalize("<br>")).toBe("<br>");
    expect(textlines.denormalize("&lt;br&gt;")).toBe("<br>");
  });

  test("textlines denormalize single pass keeps &amp;lt;br&amp;gt; as literal", () => {
    expect(textlines.denormalize("&amp;lt;br&amp;gt;")).toBe("&lt;br&gt;");
  });

  test("percent denormalize single pass preserves escaped percent", () => {
    // 单趟逆映射才能把 `\\\%` 还原成 `\%`；两次 replaceAll 会错误地还原成 `%`。
    expect(percent.denormalize(percent.normalize("\\%"))).toBe("\\%");
  });

  test("json codec is identity", () => {
    expect(json.normalize("a<b>&c")).toBe("a<b>&c");
    expect(json.denormalize("a<b>&c")).toBe("a<b>&c");
  });
});

describe("escaped round-trip (denormalize ∘ parse ∘ render ∘ normalize)", () => {
  test("XML full pipeline preserves rich text and entities", () => {
    const sample = [
      { id: 0, translation: ["a<b>React</b>&amp;", "en"] },
      { id: 1, translation: ["世界", "en"] },
    ];
    const parsed = parserPresets.xml.parse(parserPresets.xml.render(sample));
    // XML 解析器保实体原样，需在展示层应用 denormalize 还原。
    const recovered = parsed.map((seg) => ({
      ...seg,
      translation: [
        parserPresets.xml.denormalize(seg.translation[0]),
        seg.translation[1],
      ],
    }));
    expect(recovered).toEqual(sample);
  });

  test("textlines full pipeline survives newlines and literal <br>", () => {
    const sample = [
      { id: 0, translation: ["a<br>b", "en"] },
      { id: 1, translation: ["第一行\n第二行", "en"] },
    ];
    const parsed = parserPresets.textlines.parse(
      parserPresets.textlines.render(sample)
    );
    // 真实调用链把 denormalize 作为 decodeText 传入 parse；这里手动应用以对齐。
    const recovered = parsed.map((seg) => ({
      ...seg,
      translation: [parserPresets.textlines.denormalize(seg.translation[0]), ""],
    }));
    expect(recovered).toEqual([
      { id: 0, translation: ["a<br>b", ""] },
      { id: 1, translation: ["第一行\n第二行", ""] },
    ]);
  });

  test("percent full pipeline survives backslashes and percents", () => {
    const sample = [{ id: 0, translation: ["100% \\ off", ""] }];
    const parsed = parserPresets.percent.parse(
      parserPresets.percent.render(sample)
    );
    const recovered = parsed.map((seg) => ({
      ...seg,
      translation: [parserPresets.percent.denormalize(seg.translation[0]), ""],
    }));
    expect(recovered).toEqual(sample);
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

  test("presets expose normalize/denormalize/promptNote", () => {
    for (const name of ["json", "xml", "textlines", "percent"]) {
      const preset = parserPresets[name];
      expect(typeof preset.normalize).toBe("function");
      expect(typeof preset.denormalize).toBe("function");
      expect(typeof preset.promptNote).toBe("string");
    }
    expect(parserPresets.json.promptNote.length).toBeGreaterThan(0);
    expect(parserPresets.json.normalize("a<b>&c")).toBe("a<b>&c");
    expect(parserPresets.xml.promptNote).toContain("&lt;");
    expect(parserPresets.percent.promptNote.length).toBeGreaterThan(0);
  });

  test("getParserPreset returns the preset by name", () => {
    expect(getParserPreset("xml")).toBe(parserPresets.xml);
  });

  test("getParserPreset falls back to json for unknown names", () => {
    expect(getParserPreset("unknown")).toBe(parserPresets.json);
  });
});
