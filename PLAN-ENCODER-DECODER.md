# Encoder/Decoder Architecture Implementation Plan

## Goal

Add configurable LLM input/output formats to kiss-translator, using:
- **Encoder**: jinja2-like template for LLM input (replaces hardcoded JSON)
- **Decoder**: predefined output format presets (json, xml, textlines, percent)
- **IO Presets**: combined encoder+decoder pairs for simple configuration

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

## Step 1: Template Engine

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

**Test cases (~30):**
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

**Verify:** `npm test -- --runTestsByPath src/libs/template.test.js`

---

## Step 2: Encoder Presets

**Modify:** `src/config/api.js`
**Create:** `src/apis/encoder.test.js` (~15 tests)

**Encoder presets:**

| Encoder | Input Template | Use Case |
|---------|---------------|----------|
| `json` | `{"targetLanguage":{{to_lang\|json}},"segments":[{% for seg in segments %}{"id":{{seg.id}},"text":{{seg.source_text\|json}}}{% if not loop.last %},{% endif %}{% endfor %}],...}` | Most models, reliable |
| `percent` | `Target Language: {{to_lang}}\n...\nSegments:\n{% for seg in segments %}[{{seg.id}}]\n{{seg.source_text}}{% if not loop.last %}\n%%\n\n{% endif %}{% endfor %}` | Small models |
| `plaintext` | `Translate to {{ to_lang }}:\n{% for seg in segments %}{{seg.source_text}}{% if not loop.last %}\n{% endif %}{% endfor %}` | Simplest |
| `custom` | User-defined template | Power users |

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

## Step 3: Decoder Presets

**Modify:** `src/config/api.js`
**Create:** `src/apis/decoder.test.js` (~15 tests)

**Decoder presets** (build on upstream's `aiResponseParser.js`):

| Decoder | Parser Function | Mapping |
|---------|----------------|---------|
| `json` | `parseJsonTranslationSegments()` | by_id |
| `xml` | `parseXmlTranslationSegments()` | by_id |
| `textlines` | `parseLineTranslationSegments()` | by_id |
| `percent` | split on `%%` | by_order |

**Test cases:**
- Each preset parses valid LLM output correctly
- JSON: markdown-wrapped, extra text around JSON, nested objects
- XML: different tag names (t, item, seg), attributes, inner HTML
- TextLines: pipe-separated, missing ids, `<br>` handling
- Percent: %% separation, empty segments
- Edge cases: empty input, malformed output

**Verify:** `npm test -- --runTestsByPath src/apis/decoder.test.js`

---

## Step 4: IO Preset Resolution

**Modify:** `src/config/api.js`
**Create:** `src/apis/ioPreset.test.js` (~10 tests)

**IO presets:**

| Preset | Encoder | Decoder |
|--------|---------|---------|
| `json` | json | json |
| `xml` | json | xml |
| `textlines` | json | textlines |
| `percent` | percent | percent |
| `custom` | custom | custom |

**API:**
```javascript
resolveIoPreset(preset) → { encoder: EncoderPreset, decoder: DecoderPreset }
resolveIoConfig(preset, encoder?, decoder?) → { inputTemplate, ... }
```

**Verify:** `npm test -- --runTestsByPath src/apis/ioPreset.test.js`

---

## Step 5: Wire Up in trans.js

**Modify:** `src/apis/trans.js`

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

**Modify:** `src/config/api.js`

### New config fields per API:

```javascript
{
  // New fields
  ioPreset: "json" | "xml" | "textlines" | "percent" | "custom",
  llmEncoder: "json" | "percent" | "plaintext" | "custom",
  llmDecoder: "json" | "xml" | "textlines" | "percent" | "custom",
  llmInputTemplate: "...",  // only when encoder is "custom"

  // Existing (kept)
  translationRules: "...",
  tone: "formal",
}
```

### Migration function:

```javascript
export const migrateUpstreamApi = (api) => ({
  ...api,
  ioPreset: api.ioPreset || "json",
  llmEncoder: api.llmEncoder || "json",
  llmDecoder: api.llmDecoder || "json",
  translationRules: api.translationRules || defaultSystemPrompt,
});
```

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

| Step | Files Created/Modified | Tests | Depends On |
|------|----------------------|-------|------------|
| 1 | `libs/template.js`, `libs/template.test.js` | ~30 (7 categories × variable scenarios) | Nothing |
| 2 | `config/api.js`, `apis/encoder.test.js` | ~25 (7 categories × edge cases) | Step 1 |
| 3 | `config/api.js`, `apis/decoder.test.js` | ~30 (7 categories × parse scenarios) | Nothing |
| 4 | `config/api.js`, `apis/ioPreset.test.js` | ~15 (cross-category presets) | Steps 2,3 |
| 5 | `apis/trans.js` | All existing + new | Steps 1-4 |
| 6 | `config/api.js` | Migration tests | Step 5 |
| 7 | `apis/trans.manual.test.js`, config JSON | 24 E2E × 7 categories | Step 5 |

## File Summary

| File | Action | Step |
|------|--------|------|
| `src/libs/template.js` | CREATE | 1 |
| `src/libs/template.test.js` | CREATE | 1 |
| `src/config/api.js` | MODIFY | 2,3,4,6 |
| `src/apis/encoder.test.js` | CREATE | 2 |
| `src/apis/decoder.test.js` | CREATE | 3 |
| `src/apis/ioPreset.test.js` | CREATE | 4 |
| `src/apis/trans.js` | MODIFY | 5 |
| `src/apis/trans.manual.test.js` | CREATE | 7 |
| `src/scripts/manual-e2e-ollama.config.json` | CREATE | 7 |

## Risk Mitigation

1. **Template engine bugs** — extensive unit tests cover edge cases
2. **Parser regression** — upstream's `aiResponseParser.js` is battle-tested, we build on top
3. **Streaming compatibility** — keep existing streaming parsers, add template-based as fallback
4. **Backward compatibility** — migration function maps old configs to new schema
5. **Bundle size** — template engine is ~120 lines, zero dependencies
