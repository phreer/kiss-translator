import {
  resolveIoPreset,
  getInputFormatPreset,
  inputFormatPresets,
  combineIoCodec,
} from "../config/api";
import { getParserPreset } from "../libs/aiResponseParser";

describe("resolveIoPreset", () => {
  test("defaults to json input and json output", () => {
    expect(resolveIoPreset()).toMatchObject({
      inputFormat: { name: "json" },
      outputFormat: { name: "json" },
    });
  });

  test.each([
    ["json", "json", "json"],
    ["percent", "percent", "percent"],
  ])("input=%s output=%s resolves accordingly", (input, inputName, outputName) => {
    const { inputFormat, outputFormat } = resolveIoPreset(input, outputName);
    expect(inputFormat.name).toBe(inputName);
    expect(outputFormat.name).toBe(outputName);
  });

  test("input json + output xml keeps json input and xml output", () => {
    const { inputFormat, outputFormat } = resolveIoPreset("json", "xml");
    expect(inputFormat.name).toBe("json");
    expect(outputFormat.name).toBe("xml");
  });

  test("undefined format values default to json", () => {
    expect(resolveIoPreset(undefined, undefined)).toMatchObject({
      inputFormat: { name: "json" },
      outputFormat: { name: "json" },
    });
  });

  test("unknown input format falls back to json input", () => {
    const { inputFormat, outputFormat } = resolveIoPreset("nope", "xml");
    expect(inputFormat.name).toBe("json");
    expect(outputFormat.name).toBe("xml");
  });
});

describe("getInputFormatPreset", () => {
  test("returns the registered preset for known names", () => {
    expect(getInputFormatPreset("json")).toBe(inputFormatPresets.json);
    expect(getInputFormatPreset("percent")).toBe(inputFormatPresets.percent);
  });

  test("unknown name falls back to json", () => {
    expect(getInputFormatPreset("nope")).toBe(inputFormatPresets.json);
  });

  test("json template keeps the legacy byte-identical structure", () => {
    const template = inputFormatPresets.json.inputTemplate;
    expect(template).toContain('{"targetLanguage":{{to_lang|json}},"segments":[');
    expect(template).toContain('"text":{{seg.source_text|json}}');
  });

  test("percent normalize escapes structural characters", () => {
    const normalize = inputFormatPresets.percent.normalize;
    expect(normalize("50% off")).toBe("50\\% off");
    expect(normalize("a\\b")).toBe("a\\\\b");
  });

  test("input presets carry a denormalize mirroring the parser codec", () => {
    expect(inputFormatPresets.json.denormalize).toBe(
      getParserPreset("json").denormalize
    );
    expect(inputFormatPresets.percent.denormalize).toBe(
      getParserPreset("percent").denormalize
    );
  });
});

describe("combineIoCodec", () => {
  const resolve = (input, output) => resolveIoPreset(input, output);

  test("same-format pairs apply the codec only once", () => {
    const normalize = combineIoCodec(
      resolve("percent", "percent").inputFormat,
      resolve("percent", "percent").outputFormat,
      "normalize"
    );
    expect(normalize("50% off")).toBe("50\\% off");
    expect(normalize("50\\% off")).toBe("50\\\\\\% off");
  });

  test.each([
    ["json", "json"],
    ["percent", "percent"],
  ])(
    "input=%s output=%s round-trips through normalize then denormalize",
    (input, output) => {
      const { inputFormat, outputFormat } = resolve(input, output);
      const normalize = combineIoCodec(inputFormat, outputFormat, "normalize");
      const denormalize = combineIoCodec(
        inputFormat,
        outputFormat,
        "denormalize"
      );
      const text = "50% off & a\\b";
      expect(denormalize(normalize(text))).toBe(text);
    }
  );

  test.each([
    ["percent", "json"],
    ["json", "percent"],
    ["percent", "xml"],
    ["json", "xml"],
    ["percent", "textlines"],
  ])(
    "input=%s output=%s round-trips escaped text through normalize then denormalize",
    (input, output) => {
      const { inputFormat, outputFormat } = resolve(input, output);
      const normalize = combineIoCodec(inputFormat, outputFormat, "normalize");
      const denormalize = combineIoCodec(
        inputFormat,
        outputFormat,
        "denormalize"
      );
      // 模型回显输入中的转义文本（如 percent 的 \%）时，解析侧须还原为原文。
      const text = "50% off & a\\b";
      expect(denormalize(normalize(text))).toBe(text);
    }
  );
});
