import {
  resolveIoPreset,
  getInputFormatPreset,
  inputFormatPresets,
} from "../config/api";

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
});
