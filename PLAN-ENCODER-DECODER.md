# Encoder/Decoder Architecture Implementation Plan

## Goal

Add configurable LLM input/output formats to kiss-translator, using:
- **Encoder**: jinja2-like template for LLM input (replaces hardcoded JSON)
- **Decoder**: predefined output format presets (json, xml, textlines, percent)
- **IO Presets**: combined encoder+decoder pairs for simple configuration

## Progress

| Step | Status |
|------|--------|
| Step 1: Template Engine | DONE |
| Step 1.5: System Prompt Example Extraction | DONE |
| Step 2: Encoder Presets | DONE |
| Step 3: Decoder Presets | DONE |
| Step 3.5: Escape Codec & Placeholder Unification | DONE (escape engine; batch wiring pending in Step 5) |
| Step 4: IO Format Resolution | DONE |
| Step 5: Wire Up in trans.js | PENDING |
| Step 6: Config Schema & Migration | DONE (格式为批处理提示词属性；无迁移，旧 io 字段作废) |
| Step 7: Extend E2E Tests | PARTIAL (unit + wiring tests added; real-model E2E pending) |

## Base

- **Directory**: `~/workspace/ai/kiss-translator-dev`
- **Upstream**: fishjar/kiss-translator `2c9778a`
- **Reference Branch**: `phreer/dev`, which implements a preliminary version of this plan a few months ago and the base is far behind upstream. And the implementation in the reference branch is not yet ready for upstream. We should implement this plan in `origin/dev` branch.

## Upstream Key Entry Points

| Function | File:Line | Purpose |
|----------|-----------|---------|
| `genUserPrompt()` | `trans.js:133` | Build user input (currently hardcoded JSON) |
| `parseAIRes()` | `trans.js:223` | Parse LLM output (auto-detect JSON/XML/LINE) |
| `genSystemPrompt()` | `trans.js:111` | Render system prompt (placeholder replacement) |
| `genTransReq()` | `trans.js:1011` | Assemble full request (calls above functions) |
| `parseCompleteTranslationSegments()` | `aiResponseParser.js` | Unified parser (tries JSON→XML→LINE) |

## Step 1: Template Engine (DONE) — ✅ DONE (2026-08-02)

> Implemented on branch `io` (based on `origin/dev`). Beyond the original spec, Step 1 also:
> - Refactored `genUserPrompt()` batch branch (`trans.js`) to render a single-line `JSON_INPUT_TEMPLATE` via the engine, keeping **byte-identical** output (verified by `src/apis/trans.userPrompt.test.js`).
> - Hardened source parsing (strict tokenizer + compile-time validation), see "Status" below.

**Create:**
- `src/libs/template.js` (~120 lines, zero dependencies)
- `src/libs/template.test.js` (~20 tests)

**Features:**
- `{{ variable }}` — variable substitution
- `{{ variable|json }}` — JSON-stringify filter
- `{{ variable|raw }}` — raw value (null → empty string)
- `{% for item in list %}...{% endfor %}` — loop
- `{% if condition %}...{% endif %}` — conditional
- `loop.index` (0-based), `loop.last` (boolean) — loop variables

**API:**
```javascript
compileTemplate(source) → Instruction[]
render(instructions, context) → string
renderTemplate(source, context) → string  // convenience
```

**Test cases (53 total: 37 original + 16 hardening):**
- Variable substitution: `{{var}}`, `{{var|json}}`, `{{var|raw}}`, null handling
- For loops: basic, with `loop.index`, with `loop.last`, empty list, nested
- If conditions: truthy, falsy, `{% if not loop.last %}`
- Complex templates with LITERARY segments: JSON array with for+if
- Complex templates with MEDICAL segments: percent-separated list with long text
- Complex templates with TECHNICAL segments: text containing backticks and HTML
- Complex templates with EDGE_CASE segments: emoji, URLs, nested tags, mixed scripts
- Unicode handling: CJK characters, Arabic, Cyrillic, accented Latin
- Special characters in loop body: quotes, newlines, HTML entities
- Large segment list (10+ items): verify no truncation or performance issue

**Verify:** `npm test -- --runTestsByPath src/libs/template.test.js` ✅ (53 tests)

### Status (implementation notes)

Files created/modified:
- `src/libs/template.js` — CREATE. Engine: `{{path}}`, `{{path|json}}`, `{{path|raw|text}}`, `{% for item in list %}`, `{% if [not] path %}`, `loop.index` (0-based), `loop.last`. Compile-time validations: filter allowlist (`json`/`raw`/`text`), empty expression/condition, malformed `for`, bare `not`, non-string source → all throw.
- `src/libs/template.test.js` — CREATE. 53 tests (37 functional + 16 error-handling), covering the plan's content categories (LITERARY/MEDICAL/TECHNICAL/EDGE_CASE/DIALOGUE), Unicode, special chars, large lists, and malformed sources.
- `src/apis/trans.js` — MODIFY. `genUserPrompt()` batch branch now uses `renderTemplate(JSON_INPUT_TEMPLATE, ...)`; `has_glossary` precomputed because `{}` is truthy in JS. Output is byte-identical to the previous hardcoded `JSON.stringify(promptObj)`.
- `src/apis/trans.userPrompt.test.js` — CREATE. 7 regression tests asserting byte-identical user prompt via `genTransReq`.

Hardening rationale (added before Step 2, since encoder templates will come from user config):
- Stray `}}`/`%}` and unclosed `{{`/`{%` now throw (previously rendered as literal text).
- Unknown filters like `{{ x|foo }}` throw instead of silently degrading to raw.
- Nested braces (`{{ {{ x }} }}`), empty expressions, empty/bare-`not` `if`, malformed `for`, and non-string sources all throw with descriptive messages.

Regression: full suite 470 tests pass (pre-existing unrelated failure: `src/views/Options/Prompts.test.js` — `@streamparser/json` not Babel-transformed in node_modules).

---

## Step 1.5: System Prompt Example Extraction (DONE)

Strip the hardcoded `Example:` block out of the batch system prompts. The example `Input` is now generated from the same template that builds the real batch user message, so the two can never drift; the example `Output` is hardcoded per format for now (until Step 5c's `decoder.renderSample` takes over).

**Modify:** `src/config/api.js`, `src/apis/trans.js`
**Create:** `src/apis/trans.example.test.js` (8 tests)

- `src/config/api.js` — remove the `Example:`/`Input:`/`Output:` block from `defaultSystemPrompt`, `defaultSystemPromptXml`, `defaultSystemPromptLines` (Rules / Output Format / Fail-safe kept). The subtitle prompt's example (api.js:788) is out of scope: its input is built from subtitle events, not the template.
- `src/apis/trans.js` — module constants: shared example context (`to_lang="zh-CN"`, two segments covering HTML tags + a newline, glossary with an empty-value keep-key demo) plus three hardcoded outputs (`EXAMPLE_OUTPUT_JSON`/`XML`/`LINE`).
  - `renderExampleInput()` → `renderTemplate(JSON_INPUT_TEMPLATE, exampleContext)`.
  - `detectBatchFormat(systemPrompt)` → `xml` (contains `<root>`), `textlines` (`ID | Text`), else `json`.
  - `buildBatchExample(systemPrompt)` → `Example:\nInput: <rendered>\nOutput: <per-format hardcoded>`.
  - In `genTransReq`, the example is appended to the system prompt only when `useBatchFetch && !events`. `useBatchFetch` selects the batch prompt + enables the batch example; `!events` excludes the subtitle path, which reuses `genTransReq` with `useBatchFetch` possibly `true` but has its own protocol.
- `src/apis/trans.example.test.js` — 8 tests: three formats each append the correct output, all three share a byte-identical example input, example input equals a real batch user message with the same data, custom prompt without markers falls back to JSON, and non-batch / subtitle paths never append.

**Known limitations (resolved in later steps):**
- Custom prompts copied from old defaults still embed their own example, so such requests briefly see two examples (until Step 6 makes format explicit).
- Output is a hardcoded placeholder until Step 5c's `decoder.renderSample`.

**Verify:** `npm test -- --runTestsByPath src/apis/trans.example.test.js src/apis/trans.userPrompt.test.js` ✅ (15 tests)

Regression: full suite 478 tests pass (pre-existing unrelated failure: `src/views/Options/Prompts.test.js`).

---

## Step 2: Encoder Presets — ✅ DONE (2026-08-02)

**Modify:** `src/config/api.js` (registry `inputFormatPresets` + `getInputFormatPreset`; tests merged into `ioPreset.test.js`)

**Encoder presets:**

| Encoder | Input Template | Use Case |
|---------|---------------|----------|
| `json` | `{"targetLanguage":{{to_lang\|json}},"segments":[{% for seg in segments %}{"id":{{seg.id}},"text":{{seg.source_text\|json}}}{% if not loop.last %},{% endif %}{% endfor %}],...}` | Most models, reliable |
| `percent` | `Target Language: {{to_lang}}\n...\nSegments:\n{% for seg in segments %}[{{seg.id}}]\n{{seg.source_text}}{% if not loop.last %}\n%%\n\n{% endif %}{% endfor %}` | Small models |
| `plaintext` | `Translate to {{ to_lang }}:\n{% for seg in segments %}{{seg.source_text}}{% if not loop.last %}\n{% endif %}{% endfor %}` | Simplest |
| `custom` | User-defined template (`llmInputTemplate`, 留空回退 json) | Power users |

> Percent 输入 normalize 复用 percent 输出 codec（`%`→`\%`、`\`→`\\`），与 D4 双级转义合并逻辑（percent/percent 只转义一次）一起在 `trans.example.test.js` 验证。

**Test cases (~25):**
- JSON encoder with LITERARY segments: verify valid JSON, special quotes preserved
- JSON encoder with MEDICAL segments: long text, superscripts, special notation
- JSON encoder with TECHNICAL segments: backticks, HTML tags in text
- JSON encoder with LEGAL segments: formal language, long clauses
- JSON encoder with MARKETING segments: exclamation marks, em dashes
- JSON encoder with EDGE_CASE segments: emoji, URLs, nested HTML, mixed scripts
- JSON encoder with DIALOGUE segments: newlines, quotation marks
- Percent encoder with MEDICAL segments: verify all context fields present
- Percent encoder with LITERARY segments: verify glossary_lines rendered
- Plaintext encoder with TECHNICAL segments: verify minimal format
- Each encoder with empty segments list → renders valid empty structure
- Each encoder with single segment → no separator issues
- Each encoder with 10+ segments → correct comma/separation
- Special characters: `"` in JSON text → properly escaped via `|json` filter
- Unicode: CJK, Arabic, Cyrillic all render correctly in templates
- Null/undefined context fields → handled gracefully (empty string)

**Verify:** `npm test -- --runTestsByPath src/apis/encoder.test.js`

---

## Step 3: Decoder Presets (DONE) — ✅ DONE (2026-08-02)

> Implemented on branch `io`. Beyond the original spec:
> - Output example is now **auto-generated** via `parser.render(SAMPLE_TRANSLATIONS)`, replacing the hardcoded `EXAMPLE_OUTPUT_JSON/XML/LINE` + `detectBatchFormat` heuristic lookup in `trans.js`. Verified byte-identical by the existing `trans.example.test.js` golden tests.
> - Instead of a `class`, each format is a **plain-object preset** in a `parserPresets` registry: `{ name, mappingMode, parse, render }`. `render` is the exact inverse of `parse` for the same format, so the sample can never drift from the parser.
> - Added the missing `percent` decoder (`parsePercentTranslationSegments`, `%%` split, by_order) and its `render`.
> - Streaming is untouched and deferred to Step 5/7 (existing `createStreamingJsonParser` / `parseStreamingSegments` still own streaming).

**Modify:** `src/libs/aiResponseParser.js`, `src/apis/trans.js`
**Create:** `src/libs/aiResponseParser.decoder.test.js` (21 tests)

**Decoder presets** (build on upstream's `aiResponseParser.js`):

| Decoder | Parser Function | Render (inverse) | Mapping |
|---------|----------------|------------------|---------|
| `json` | `parseJsonTranslationSegments()` | `renderJsonOutput()` | by_id |
| `xml` | `parseXmlTranslationSegments()` | `renderXmlOutput()` | by_id |
| `textlines` | `parseLineTranslationSegments()` | `renderLineOutput()` | by_id |
| `percent` | `parsePercentTranslationSegments()` | `renderPercentOutput()` | by_order |

**Test cases (21):**
- Render golden bytes: `renderJsonOutput/renderXmlOutput/renderLineOutput` outputs equal the three pinned `EXAMPLE_OUTPUT_*` constants in `trans.example.test.js`
- Percent render mirrors the percent encoder block structure
- Render: empty list, quote/backslash escaping, tolerant of `{id, translation, source_language}` shape
- Percent parser: `%%` split, missing `[id]` → by_order, empty blocks, internal newlines, decodeText, malformed input
- Round-trip `parse(render(x))` for all four presets (incl. documented `<br>` asymmetry for XML and source-drop for line/percent)
- Registry: preset keys, mapping modes, `getParserPreset` fallback

**Verify:** `CI=true pnpm test src/libs/aiResponseParser.decoder.test.js src/libs/aiResponseParser.test.js src/apis/trans.example.test.js src/apis/trans.userPrompt.test.js` ✅ (44 tests)

> Note: `--runTestsByPath` doesn't work with this repo's react-app-rewired jest setup (jest treats it as a test pattern and runs everything); pass file paths positionally instead.

Regression: full suite 499 tests pass (pre-existing unrelated failure: `src/views/Options/Prompts.test.js`).

---

## Step 3.5: Escape Codec & Placeholder Unification — 🧭 ESCAPE ENGINE DONE (2026-08-02)

> Escape engine, preset extension and render wiring are implemented with tests. Remaining: wire the new fields into `trans.js` (decode-side `denormalize` as `decodeText`, `buildBatchInput` normalize, `buildBatchExample` prompt-note) — recorded as Step 5 wiring. `applyPlaceholders` in `template.js` is implemented and tested.

### Problem

The LLM's output must be parseable by the decoder, but translation content can collide with the output format's structural characters:

| Format | Collision | Example failure |
|--------|-----------|-----------------|
| `xml` | content containing `<t>`/`</t>`/`<item>`/`<seg>` | truncated/duplicate segments |
| `textlines` | content containing literal `<br>` or a raw newline + `digits \|` | duplicate ids, spurious segments |
| `percent` | content containing `%%` | data loss at split |
| `json` | (safe — JSON string escaping) | — |

Backslash-escaping cannot protect XML: content `<t>` still contains a literal `<t` that matches `/<(t|item|seg)\b[^>]*>/`. XML **entity escaping** removes the literal `<`, making the tag regex structurally unable to match content.

### `createEscapeCodec(escapes, promptNote?)` engine (`src/libs/aiResponseParser.js`)

```javascript
// escapes: ordered [from, to, reverseTo?] triples; normalize replaces in order,
// denormalize is ONE regex pass; promptNote appended after Output example.
createEscapeCodec(escapes, promptNote) → { normalize, denormalize, promptNote }
```

### Per-format escape table

| preset | normalize (order sensitive) | denormalize (single pass) | promptNote |
|--------|------------------------------|---------------------------|------------|
| `json` | identity | identity | none |
| `xml` | `&`→`&amp;` first, then `<`→`&lt;`, `>`→`&gt;` | `&amp;`/`&lt;`/`&gt;` | preserve `&lt;` `&gt;` `&amp;` verbatim |
| `textlines` | `&`→`&amp;` first, then `<br\s*\/?>`→`&lt;br&gt;`, then `\n`→`<br>` | `&amp;`/`&lt;br&gt;` | preserve `&amp;` `&lt;br&gt;`; use `<br>` for newlines |
| `percent` | `\`→`\\` first, then `%`→`\%` | `\\`/`\%` | preserve `\\` `\%` verbatim |

Decisions locked during review:
- XML uses the **minimal entity set** `&`, `<`, `>` only. `&quot;`/`&apos;` are unnecessary: quotes only matter inside attributes, which the extension itself generates; escaping them adds noise and fidelity risk.
- textlines reuses the **entity style** (not backslash `<br\>`): literal `<br>` becomes `&lt;br&gt;` (contains no literal `<br`, so the parser's `<br>`→`\n` step never touches it), and the **newline marker stays a literal `<br>`**. This makes literal `<br>` vs. newline marker distinguishable.
- `\n`→`<br>` is **folded into textlines normalize** (applies to input `source_text` too), so the model never sees a raw newline + `digits |` and cannot echo a colliding structure. Verified lossless: `foo\n1 | bar` → `foo<br>1 | bar` → model echoes `<br>` → parse → `foo\n1 | bar`.
- `&`/`\` must be escaped **first** in their formats so literal `&lt;`/`\\` in content round-trip (`&amp;lt;` single-pass → `&lt;`, never `<`).
- denormalize must be a **single regex pass**; two sequential replaceAll passes would corrupt `&amp;lt;` → `<` / `\\%` → `%`.

### render/parse ordering (parsers unchanged)

- `render*` runs `normalize(text)` **before** `\n`→`<br>` so newline markers stay literal `<br>`.
- textlines `parse` already does `.replace(/<br\s*\/?>/gi,"\n")` **before** `decodeText` (`aiResponseParser.js:183`), which matches this design without parser changes.
- XML keeps its documented `<br>`-preserved round-trip asymmetry.
- Invariant: `denormalize(parse(render(normalize(x)))) === x` (modulo XML's `<br>` convention).

### Placeholder unification (`src/libs/template.js`)

- New `applyPlaceholders(template, vars)` — tolerant `replaceAll` over `{{key}}`. Unlike `renderTemplate`, it never throws on stray `}}`/`{%` (system prompts are user-configurable); unprovided keys are left as-is.
- Replaces the three duplicated `replaceAll` chains: `genSystemPrompt` (`trans.js:125`), `genUserPrompt` non-batch (`trans.js:215`), `buildSubtitleSystemPrompt` (`trans.js:244`).
- **normalize scope: `source_text` only.** glossary/title/description are NOT normalized (user-visible term table must stay intact).

### Batch input pipeline (`trans.js`, Step 5 wiring)

```javascript
const buildBatchInput = (segments, vars, preset) =>
  renderTemplate(JSON_INPUT_TEMPLATE, {
    ...vars,
    segments: segments.map((seg) => ({
      ...seg,
      source_text: preset.normalize(String(seg.source_text ?? "")),
    })),
  });
```

- `renderExampleInput()` and `genUserPrompt()` batch branch both call `buildBatchInput` — the normalize application point is unique and visible.
- `genTransReq` computes `parser = getParserPreset(detectBatchFormat(systemPrompt))` once, feeds both `buildBatchExample` and `genUserPrompt`.
- `buildBatchExample` appends `parser.promptNote` after `Output:`.
- Non-batch single-segment mode does **not** normalize (no structured output → no collision).

### Test impact

- **textlines golden unchanged** (`<b>` is not `<br`, and `\n`→`<br>` folding produces the same bytes) — confirmed.
- **XML golden changes** (applied): sample `一个<b>React</b>组件` → `一个&lt;b&gt;React&lt;/b&gt;组件` in both `aiResponseParser.decoder.test.js` and `trans.example.test.js`.
- **Example inputs diverge per format** (Step 5 wiring): JSON stays raw `\n`; XML becomes `A &lt;b&gt;React&lt;/b&gt; component.`; textlines becomes `"Line 1<br>Line 2"`. The "all three formats share the same example input" test (`trans.example.test.js:104`) becomes "each format's example input is byte-identical to its own real user message".
- New tests (implemented): escape engine round-trips, single-pass denormalize (`&amp;lt;` never becomes `<`, `\\\%` preserved), textlines newline folding + literal `<br>` escaping + `<br/>` canonicalization, full `denormalize ∘ parse ∘ render ∘ normalize` pipeline per format, preset exposes `normalize`/`denormalize`/`promptNote`, json identity, `applyPlaceholders` (7 tests in `template.test.js`). Full suite: 518 pass (the `Prompts.test.js` import-mock failure is the pre-existing baseline).

### Streaming gap (resolved in Step 5)

`detectStreamFormat` only distinguishes json vs. non-json, while `parseStreamingSegments` serves both XML and textlines — so the streaming yield boundary cannot select the correct denormalize by format alone. **Resolution**: instead of content-based detection, the batch output format is known once from the system prompt; `handleTranslate` threads `batchFormat` into `handleTranslateStreamInternal`, which injects `getParserPreset(batchFormat).denormalize` into both the JSON and the XML/LINE streaming yields (`parseStreamingSegments` gained a `{ decodeText }` option, applied uniformly). The realtime typewriter parser (cosmetic partial text) intentionally does not denormalize.

---

## Step 4: IO Format Resolution — ✅ DONE (2026-08-02)

> 最终架构（2026-08-02 确认）：**输入/输出格式是「聚合翻译提示词」自带的属性，不是独立的 API 级配置**。
> - 预定义聚合提示词（`batch-translation-json/xml/line`）各自绑定固定格式组合，编辑器禁用不可改。
> - 自定义聚合提示词在 Prompt 页编辑器中自由设置 `inputFormat`/`outputFormat`（`inputFormat=custom` 时含自定义模板）。
> - API 页移除 ioPreset 下拉与覆盖字段；格式随所选聚合提示词（`batchPromptSlug`）由 `resolveApiPromptSettings` 内联到 `apiSetting.ioInputFormat/ioOutputFormat/ioInputTemplate`，二者永不漂移。
> - 旧 `ioPreset`/`llmInputFormat`/`llmOutputFormat`/`llmInputTemplate` 数据不迁移、作废（默认 json/json 行为不变）。

**预定义聚合提示词固定格式：**

| 提示词 slug | 输入格式 (`inputFormat`) | 输出格式 (`outputFormat`) |
|-------------|--------------------------|---------------------------|
| `batch-translation-json` | json | json |
| `batch-translation-xml` | json | xml |
| `batch-translation-line` | json | textlines |

**API (config/api.js):**
```javascript
inputFormatPresets            // json/percent/plaintext/custom, each { name, inputTemplate, normalize }
getInputFormatPreset(name, customTemplate) // custom 留空回退 json 模板
resolveIoPreset(inputFormat, outputFormat, inputTemplate)
                              // → { inputFormat, outputFormat }; 未知 inputFormat 回退 json
```

**Input format templates:** percent 复用 `percentCodec.normalize` 保护 `%`/`\`；json 保持上游逐字节结构（从 trans.js 原样移入）；plaintext/custom 为 identity。

**Decode 接线（trans.js `parseAIRes`）:** 显式指定 parser 时先走 `parser.parse()`，无结果回落到通用 dispatcher `parseCompleteTranslationSegments`（仅覆盖 json/xml/textlines）——支持 percent 输出解码，同时保留"提示词与响应格式不一致"旧路径的 JSON→XML→LINE 兜底。

**Verify:** `npm test -- --runTestsByPath src/apis/ioPreset.test.js`

---

## Step 5: Wire Up in trans.js

**Modify:** `src/apis/trans.js` (+ `src/libs/stream.js`)

> 🧭 DONE (2026-08-02). The final wiring differs from the 5a-5e sketch below (which assumed `resolveIoPreset`/encoder presets from Step 4). Actual implementation keeps the byte-identical JSON input template and adds:
> - `buildBatchInput(segments, vars, preset)` — shared by `renderExampleInput` and the batch `genUserPrompt`; applies `preset.normalize` to `source_text` only. JSON → identity, XML → `&lt;b&gt;`, textlines → `\n`→`<br>`.
> - `buildBatchExample` appends `parser.promptNote` after `Output:`.
> - `genTransReq` computes `batchParser = getParserPreset(detectBatchFormat(baseSystemPrompt))` once, feeds `buildBatchExample` and `genUserPrompt`.
> - `parseAIRes(raw, useBatchFetch, parser)` applies `parser.denormalize` uniformly **after** structural parse (no double decode: `<br>`→`\n` folds inside the LINE parser first). `parseTransRes` derives the parser from `systemPrompt`.
> - Streaming: `parseStreamingSegments(content, processedIds, { decodeText })` applies decodeText uniformly; `handleTranslateStreamInternal` injects the batch format's denormalize into JSON + XML/LINE yields.
> - The three replaceAll chains (`genSystemPrompt`, non-batch `genUserPrompt`, `buildSubtitleSystemPrompt`) now use `applyPlaceholders`.

### 5a. Replace `genUserPrompt()` hardcoded JSON

```javascript
// Before (trans.js:152-164):
if (useBatchFetch) {
  const promptObj = {
    targetLanguage: toLang,
    segments: texts.map((text, i) => ({ id: i, text })),
  };
  title && (promptObj.title = title);
  description && (promptObj.description = description);
  Object.keys(glossary).length !== 0 && (promptObj.glossary = glossary);
  tone && (promptObj.tone = tone);
  return JSON.stringify(promptObj);
}

// After:
if (useBatchFetch) {
  const encoder = getEncoderPreset(llmEncoder || "json");
  return renderTemplate(encoder.inputTemplate, {
    to_lang: toLang,
    title,
    description,
    summary,
    tone,
    glossary,
    glossary_lines: formatGlossaryLines(glossary),
    segments: texts.map((text, i) => ({ id: i, source_text: text })),
  });
}
```

### 5b. Add decoder parameter to `parseAIRes()`

```javascript
// Before (trans.js:223):
const parseAIRes = (raw, useBatchFetch = true) => { ... }

// After:
const parseAIRes = (raw, useBatchFetch = true, decoderPreset = null) => {
  if (!raw) return [];
  if (!useBatchFetch) return [[raw]];

  let content = stripMarkdownCodeBlock(raw).trim();

  // If decoder preset specified, use specific parser
  if (decoderPreset) {
    return parseByDecoderPreset(content, decoderPreset);
  }

  // Fallback: auto-detect (existing behavior)
  const structuredSegments = parseCompleteTranslationSegments(content, {
    decodeText: decodeHTMLEntities,
  });
  if (structuredSegments.length > 0) {
    return structuredSegments.map((segment) => segment.translation);
  }
  return content.split("\n").map((line) => {
    const text = decodeHTMLEntities(line.replace(/<br\s*\/?>/gi, "\n").trim());
    return [text, ""];
  });
};
```

### 5c. New function: `buildProtocolAppendix()`

```javascript
const buildProtocolAppendix = (encoder, decoder) => {
  const sampleSegments = [
    { id: 0, source_text: "Hello, world!" },
    { id: 1, source_text: "Line 1\nLine 2" },
  ];
  const sampleTranslations = [
    { id: 0, translation: "你好，世界！", source_language: "en" },
    { id: 1, translation: "第一行\n第二行", source_language: "en" },
  ];

  const sampleInput = renderTemplate(encoder.inputTemplate, {
    ...SAMPLE_PROMPT_CONTEXT,
    segments: sampleSegments,
  });

  const sampleOutput = decoder.renderSample
    ? decoder.renderSample(sampleTranslations)
    : "(see output format)";

  return [
    "Protocol Appendix:",
    `- Input format: ${encoder.name}`,
    `- Output format: ${decoder.name}`,
    `- Output mapping: ${decoder.mappingMode}`,
    "",
    "Sample Input:",
    sampleInput,
    "",
    "Expected Output:",
    sampleOutput,
  ].join("\n");
};
```

### 5d. New function: `buildBatchSystemPrompt()`

```javascript
const buildBatchSystemPrompt = ({
  translationRules,
  encoder,
  decoder,
  tone,
  toLang,
  docInfo,
}) => {
  const rulesPrompt = genSystemPrompt({
    systemPrompt: translationRules || defaultSystemPrompt,
    tone,
    to: toLang,
    toLang,
    docInfo,
  }).trim();

  const appendix = buildProtocolAppendix(encoder, decoder);
  return `${rulesPrompt}\n\n${appendix}`.trim();
};
```

### 5e. Wire up in `genTransReq()`

```javascript
// In genTransReq(), modify the AI branch:
if (API_SPE_TYPES.ai.has(apiType)) {
  const docInfo = externalDocInfo || getDocInfo();
  const { ioPreset, llmEncoder, llmDecoder } = args;
  const { encoder, decoder } = resolveIoPreset(ioPreset, llmEncoder, llmDecoder);

  let baseSystemPrompt = events
    ? buildSubtitleSystemPrompt({ ... })
    : buildBatchSystemPrompt({
        translationRules: useBatchFetch ? systemPrompt : nobatchPrompt,
        encoder,
        decoder,
        tone,
        toLang,
        docInfo,
      });

  args.systemPrompt = baseSystemPrompt;
  args.userPrompt = events
    ? buildSubtitleUserPrompt({ ... })
    : genUserPrompt({
        nobatchUserPrompt,
        useBatchFetch,
        llmEncoder: encoder.name,
        from, to, fromLang, toLang, texts, docInfo, tone, glossary, aiTerms,
      });
}
```

**Verify:** Run all existing tests → no regressions

---

## Step 6: Config Schema & Migration

**Modify:** `src/config/api.js`, `src/config/prompt.js`

### New config fields (batch system prompt):

```javascript
// 每个聚合翻译提示词（config/prompt.js）携带输入/输出格式：
{
  // New fields on batch prompts
  inputFormat: "json" | "percent" | "plaintext" | "custom",
  outputFormat: "json" | "xml" | "textlines" | "percent",
  inputTemplate: "...",  // only when inputFormat === "custom"

  // Existing (kept)
  translationRules: "...",
  tone: "formal",
}
```

### Runtime resolution (config/prompt.js `resolveApiPromptSettings`)

解析 `batchPromptSlug` 后将提示词携带的格式内联到 `apiSetting`：
```javascript
nextApiSetting.ioInputFormat = batchPrompt.inputFormat || "json";
nextApiSetting.ioOutputFormat = batchPrompt.outputFormat || "json";
nextApiSetting.ioInputTemplate = batchPrompt.inputTemplate || "";
```

### Migration

无迁移。旧的 API 级 `ioPreset`/`llmInputFormat`/`llmOutputFormat`/`llmInputTemplate` 字段作废，读取时忽略；默认聚合提示词为 `batch-translation-json`（json/json），行为与旧默认一致。

---

## Step 7: Extend E2E Tests

**Create:** `src/apis/trans.manual.test.js` (adapt from fork)
**Create:** `src/scripts/manual-e2e-ollama.config.json`

**Test matrix:** 3 encoders × 4 decoders × 2 stream modes = **24 cases**

**Each case generates:**
- Encoder-rendered input prompt
- Decoder-expected output format
- Raw LLM response
- Parsed translations
- Success/failure + parse accuracy
- Comparison report across presets

---

## Test Data: Diverse Content Cases

All unit tests (encoder, decoder, template) should use these content cases to ensure coverage across domains and edge cases.

### Category 1: Literary Content

```javascript
const LITERARY_SEGMENTS = [
  {
    id: 0,
    source_text: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness."
  },
  {
    id: 1,
    source_text: "Shall I compare thee to a summer's day? Thou art more lovely and more temperate: Rough winds do shake the darling buds of May, And summer's lease hath all too short a date."
  },
  {
    id: 2,
    source_text: "站在船头，放眼望去，只见江面浩渺，雾气氤氲。远处的山峦若隐若现，宛如一幅泼墨山水画卷。他不禁轻声吟道：'孤帆远影碧空尽，唯见长江天际流。'"
  },
  {
    id: 3,
    source_text: "La vita è una corsa di cavalli, non un cammino di passeggiata. Ogni giorno è una nuova battaglia, ogni momento è una nuova sfida. La vittoria appartiene a chi crede in sé stesso."
  },
  {
    id: 4,
    source_text: "Die Luft war kühl und das Licht war weich, wie der Schimmer einer alten Erinnerung. Sie stand am Fenster und betrachtete den Regen, der leise gegen die Scheiben patschte, ein Rhythmus, der an ferne Trommeln erinnerte."
  }
];
```

### Category 2: Medical / Scientific Content

```javascript
const MEDICAL_SEGMENTS = [
  {
    id: 0,
    source_text: "The patient presents with acute myocardial infarction characterized by ST-segment elevation in leads II, III, and aVF, indicating inferior wall involvement. Troponin I levels are significantly elevated at 15.2 ng/mL (normal < 0.04 ng/mL)."
  },
  {
    id: 1,
    source_text: "Metformin hydrochloride is a first-line pharmacotherapy for type 2 diabetes mellitus. It functions primarily by suppressing hepatic glucose production through inhibition of gluconeogenesis, and secondarily by improving peripheral insulin sensitivity via increased glucose uptake in skeletal muscle."
  },
  {
    id: 2,
    source_text: "The pathological examination revealed a poorly differentiated adenocarcinoma with signet ring cell morphology, invading through the muscularis propria into the subserosal tissue (pT3). Two of fifteen resected lymph nodes showed metastatic involvement (pN1a)."
  },
  {
    id: 3,
    source_text: "患者女性，65岁，因「反复胸闷、气促2年，加重伴双下肢水肿1周」入院。既往有高血压病史15年，2型糖尿病8年。查体：血压160/95mmHg，心率98次/分，双肺底可闻及细湿啰音，双下肢凹陷性水肿(++)。"
  },
  {
    id: 4,
    source_text: "Le syndrome métabolique est défini par la présence d'au moins trois des critères suivants : tour de taille > 102 cm chez l'homme ou > 88 cm chez la femme, triglycéridémie ≥ 150 mg/dL, HDL-cholestérol < 40 mg/dL chez l'homme ou < 50 mg/dL chez la femme, pression artérielle ≥ 130/85 mmHg, glycémie à jeun ≥ 100 mg/dL."
  }
];
```

### Category 3: Technical / Code-Heavy Content

```javascript
const TECHNICAL_SEGMENTS = [
  {
    id: 0,
    source_text: "The `useEffect` hook accepts a callback function and an optional dependency array. If the dependency array is provided, React will only re-run the effect when one of the dependencies changes. If omitted, the effect runs after every render."
  },
  {
    id: 1,
    source_text: "Configure the nginx reverse proxy by adding a location block: `location /api/ { proxy_pass http://localhost:3000; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }`. Ensure `proxy_set_header X-Forwarded-For` is set for correct IP forwarding."
  },
  {
    id: 2,
    source_text: "The algorithm has a time complexity of O(n log n) for the average case and O(n²) for the worst case when the array is already sorted. Space complexity is O(n) due to the auxiliary merge buffer. Consider using `Array.prototype.sort()` with a custom comparator for small datasets."
  },
  {
    id: 3,
    source_text: "在 Kubernetes 集群中部署微服务时，建议使用 `Deployment` 资源管理 Pod 副本数，并配置 `HorizontalPodAutoscaler` 根据 CPU 或内存使用率自动扩缩容。Service 暴露方式推荐使用 `ClusterIP` 配合 Ingress Controller。"
  }
];
```

### Category 4: Legal / Contract Content

```javascript
const LEGAL_SEGMENTS = [
  {
    id: 0,
    source_text: "The Licensor grants the Licensee a non-exclusive, non-transferable, revocable license to use the Software solely for the Licensee's internal business purposes, subject to the terms and conditions of this Agreement and payment of the applicable fees."
  },
  {
    id: 1,
    source_text: "In no event shall either party be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, business opportunities, or goodwill, arising out of or in connection with this Agreement, regardless of the theory of liability."
  },
  {
    id: 2,
    source_text: "本合同项下的争议应首先通过友好协商解决。协商不成的，任何一方均有权将争议提交至中国国际经济贸易仲裁委员会（CIETAC），按照申请仲裁时该会现行有效的仲裁规则在北京进行仲裁。仲裁裁决是终局的，对双方均有约束力。"
  }
];
```

### Category 5: Marketing / Creative Content

```javascript
const MARKETING_SEGMENTS = [
  {
    id: 0,
    source_text: "Introducing the all-new Quantum Pro — where cutting-edge AI meets elegant design. With its 120Hz ProMotion display, A17 Bionic chip, and all-day battery life, it's not just a phone. It's a statement."
  },
  {
    id: 1,
    source_text: "Discover the secret to radiant skin with our patented Triple-Peptide Complex. Clinically proven to reduce fine lines by 47% in just 8 weeks, this luxurious serum penetrates three layers deep to rejuvenate from within."
  },
  {
    id: 2,
    source_text: "Unlock your potential with KISS Translator. Break language barriers instantly. Translate entire web pages with a single click. Support for 50+ languages. AI-powered accuracy that learns from context. Free forever for personal use."
  }
];
```

### Category 6: Mixed / Edge Case Content

```javascript
const EDGE_CASE_SEGMENTS = [
  {
    id: 0,
    source_text: "Simple text with no special characters."
  },
  {
    id: 1,
    source_text: "HTML entities: &amp; &lt; &gt; &quot; &#39; — should be preserved or decoded correctly."
  },
  {
    id: 2,
    source_text: "Inline code: Use `npm install` to install dependencies, then run `npm test`. Configuration in <code>config.json</code> must be valid JSON."
  },
  {
    id: 3,
    source_text: "Nested tags: <div class=\"container\"><p>This is a <strong>bold</strong> and <em>italic</em> text with <a href=\"https://example.com\">a link</a>.</p></div>"
  },
  {
    id: 4,
    source_text: "Newlines in text:\nFirst line continues here.\nSecond line.\nThird line with more content."
  },
  {
    id: 5,
    source_text: "Special characters: 「日本語」「한국어」「العربية」「Русский」 «French» ‹German›"
  },
  {
    id: 6,
    source_text: "Mixed scripts: Hello 你好Bonjour こんにちはمرحبا Привет"
  },
  {
    id: 7,
    source_text: "Empty translation target: this segment should still be translated even if context fields are missing."
  },
  {
    id: 8,
    source_text: "Long segment with many clauses: The system architecture employs a microservices pattern where each service communicates via gRPC for internal calls and exposes REST endpoints for external clients, with an event-driven message broker (RabbitMQ) handling asynchronous workflows, while Redis provides distributed caching and session management, and PostgreSQL serves as the primary data store with read replicas for query load balancing."
  },
  {
    id: 9,
    source_text: "Emoji and symbols: 🎉🚀💻🌍✨ — these should be preserved in translation."
  },
  {
    id: 10,
    source_text: "URLs and emails: Visit https://example.com/path?q=test&lang=en or email support@example.com for help. API endpoint: https://api.example.com/v2/translate"
  },
  {
    id: 11,
    source_text: "Mathematical expressions: The integral ∫₀^∞ e^(-x²) dx equals √π/2. The quadratic formula x = (-b ± √(b²-4ac)) / 2a solves ax² + bx + c = 0."
  }
];
```

### Category 7: Conversational / Dialogue Content

```javascript
const DIALOGUE_SEGMENTS = [
  {
    id: 0,
    source_text: "\"Hey, did you see the game last night?\" she asked, barely concealing her excitement. \"That last-minute goal was absolutely incredible!\""
  },
  {
    id: 1,
    source_text: "Doctor: How long have you been experiencing these symptoms?\nPatient: About three weeks now. It started as a mild discomfort but has gotten progressively worse.\nDoctor: I see. Are you taking any medications currently?"
  },
  {
    id: 2,
    source_text: "A: 老师，这个函数的返回值类型是什么？\nB: 返回值是一个 Promise<string>，也就是说它异步返回一个字符串。\nA: 那如果网络请求失败了呢？\nB: 会被 catch 块捕获，你可以在这里处理错误。"
  }
];
```

### Test Data Usage Matrix

| Test File | Categories Used | Why |
|-----------|----------------|-----|
| `template.test.js` | All | Verify template rendering handles all content types |
| `encoder.test.js` | Literary, Medical, Technical, Edge Cases | Verify encoder renders prompts correctly for diverse content |
| `decoder.test.js` | All | Verify parser extracts translations from diverse LLM outputs |
| `ioPreset.test.js` | Medical, Technical, Edge Cases | Verify preset resolution works across domains |
| `trans.manual.test.js` | All 7 categories | E2E verification across all content types |

### E2E Config: Rich Test Context

```json
{
  "testContext": {
    "title": "KISS Translator Multi-Domain Test",
    "description": "Comprehensive E2E test covering literary, medical, technical, legal, marketing, and edge case content for encoder/decoder validation.",
    "summary": "Tests translation quality and parsing reliability across diverse domains with various content complexities."
  },
  "fromLang": "en",
  "toLang": "zh-CN",
  "glossary": {
    "metformin": "二甲双胍",
    "myocardial infarction": "心肌梗死",
    "microservices": "微服务",
    "useEffect": "useEffect",
    "Kubernetes": "Kubernetes",
    "CIETAC": "中国国际经济贸易仲裁委员会"
  },
  "texts": [
    "The patient presents with acute myocardial infarction characterized by ST-segment elevation in leads II, III, and aVF, indicating inferior wall involvement.",
    "Shall I compare thee to a summer's day? Thou art more lovely and more temperate: Rough winds do shake the darling buds of May, And summer's lease hath all too short a date.",
    "The `useEffect` hook accepts a callback function and an optional dependency array. If the dependency array is provided, React will only re-run the effect when one of the dependencies changes.",
    "The Licensor grants the Licensee a non-exclusive, non-transferable, revocable license to use the Software solely for the Licensee's internal business purposes.",
    "Introducing the all-new Quantum Pro — where cutting-edge AI meets elegant design. With its 120Hz ProMotion display, A17 Bionic chip, and all-day battery life.",
    "HTML entities: &amp; &lt; &gt; &quot; — Inline code: Use `npm install` — Nested: <p><strong>bold</strong> and <em>italic</em></p>",
    "Doctor: How long have you been experiencing these symptoms?\nPatient: About three weeks now. It started as a mild discomfort but has gotten progressively worse."
  ]
}
```

---

## Execution Order

| Step | Files Created/Modified | Tests | Depends On | Status |
|------|----------------------|-------|------------|--------|
| 1 | `libs/template.js`, `libs/template.test.js` | ~30 (7 categories × variable scenarios) | Nothing | ✅ Done (53 tests, +7 userPrompt regression) |
| 1.5 | `config/api.js`, `apis/trans.js`, `apis/trans.example.test.js` | 8 | Step 1 | ✅ Done |
| 2 | `config/api.js`, `apis/encoder.test.js` | ~25 (7 categories × edge cases) | Step 1 | ✅ Done (registry merged into `config/api.js`; tests in `ioPreset.test.js`) |
| 3 | `libs/aiResponseParser.js`, `apis/trans.js`, `libs/aiResponseParser.decoder.test.js` | 21 | Nothing | ✅ Done (+ output example auto-generation) |
| 3.5 | `libs/template.js` (+`applyPlaceholders`), `libs/aiResponseParser.js` (escape codec) | ~+14 (escape + placeholder) | Step 3 | ✅ Done (escape engine + tests) |
| 4 | `config/api.js`, `apis/ioPreset.test.js` | ~15 (cross-category presets) | Steps 2,3 | ✅ Done (输入/输出格式为批处理提示词属性；resolveIoPreset(inputFormat, outputFormat, inputTemplate)) |
| 5 | `apis/trans.js`, `libs/stream.js` | All existing + new | Steps 1-4 | ✅ Done (3.5 wiring: applyPlaceholders, buildBatchInput, promptNote, denormalize decode, streaming) |
| 6 | `config/api.js`, `config/prompt.js` | Migration tests | Step 5 | ✅ Done (批处理提示词携带 inputFormat/outputFormat/inputTemplate；无迁移，旧 io 字段作废) |
| 7 | `apis/trans.manual.test.js`, config JSON | 24 E2E × 7 categories | Step 5 | ⏳ Not started |

## File Summary

| File | Action | Step | Status |
|------|--------|------|--------|
| `src/libs/template.js` | CREATE (+`applyPlaceholders` in 3.5) | 1, 3.5 | ✅ Done (applyPlaceholders added) |
| `src/libs/template.test.js` | CREATE (+7 applyPlaceholders tests) | 1, 3.5 | ✅ Done |
| `src/apis/trans.userPrompt.test.js` | CREATE | 1 (added) | ✅ Done |
| `src/apis/trans.example.test.js` | CREATE | 1.5 | ✅ Done |
| `src/config/api.js` | MODIFY | 2,3,4,6 | ✅ Done (inputFormatPresets + resolveIoPreset(inputFormat, outputFormat, inputTemplate) + 批处理提示词格式字段；1.5 example strip in；IO_PRESET_TABLE 与 defaultApi 4 io 字段已删) |
| `src/libs/aiResponseParser.js` | MODIFY | 3, 3.5 | ✅ Step 3 done; escape codec + preset normalize/denormalize/promptNote done |
| `src/libs/aiResponseParser.decoder.test.js` | CREATE | 3 | ✅ Done |
| `src/apis/encoder.test.js` | CREATE | 2 | ⏳ Superseded (tests merged into `ioPreset.test.js`) |
| `src/apis/decoder.test.js` | CREATE | 3 | ⏳ Superseded (tests live in `src/libs/aiResponseParser.decoder.test.js`) |
| `src/apis/ioPreset.test.js` | CREATE | 4 | ✅ Done (resolveIoPreset 新签名 + getInputFormatPreset；默认 json/json) |
| `src/apis/trans.js` | MODIFY | 5 | ✅ Done: applyPlaceholders ×3, buildBatchInput, promptNote append, per-preset denormalize decode (non-stream + stream), batchParser threading; Step 4: 格式读取 apiSetting.ioInputFormat/ioOutputFormat/ioInputTemplate（由 resolveApiPromptSettings 内联），genTransReq/parseTransRes/handleTranslate 经 resolveIoPreset；detectBatchFormat 已删除 |
| `src/libs/stream.js` | MODIFY | 5 | ✅ Done: `parseStreamingSegments` accepts `{ decodeText }`, uniform denormalize |
| `src/apis/trans.example.test.js` | MODIFY | 1.5, 5, 4 | ✅ Done (per-format example inputs + decode wiring tests + 格式接线: xml/percent/custom/overrides) |
| `src/views/Options/Apis.js` | MODIFY | 4 | ✅ Done (ioPreset UI 块与 llmInput* 覆盖字段已删；格式随所选聚合提示词) |
| `src/views/Options/Apis.test.js` | MODIFY | 4 | ✅ Done (ioPreset UI 测试移除，断言不再渲染) |
| `src/views/Options/Prompts.js` | MODIFY | 4 | ✅ Done (批处理提示词编辑器增加 输入/输出格式 select + custom 模板框；预定义禁用) |
| `src/config/prompt.js` | MODIFY | 4,6 | ✅ Done (normalizePrompt/STORAGE_FIELDS 新字段 + PRESET_PROMPTS 固定格式 + resolveApiPromptSettings 内联 ioInputFormat/ioOutputFormat/ioInputTemplate) |
| `src/apis/trans.manual.test.js` | CREATE | 7 | ⏳ Pending |
| `src/scripts/manual-e2e-ollama.config.json` | CREATE | 7 | ⏳ Pending |

## Risk Mitigation

1. **Template engine bugs** — extensive unit tests cover edge cases
2. **Parser regression** — upstream's `aiResponseParser.js` is battle-tested, we build on top
3. **Streaming compatibility** — keep existing streaming parsers, add template-based as fallback
4. **Backward compatibility** — migration function maps old configs to new schema
5. **Bundle size** — template engine is ~120 lines, zero dependencies
