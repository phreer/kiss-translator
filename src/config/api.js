export const DEFAULT_HTTP_TIMEOUT = 10000; // 调用超时时间
export const DEFAULT_FETCH_LIMIT = 10; // 默认最大任务数量
export const DEFAULT_FETCH_INTERVAL = 100; // 默认任务间隔时间
export const DEFAULT_BATCH_INTERVAL = 400; // 批处理请求间隔时间
export const DEFAULT_BATCH_SIZE = 10; // 每次最多发送段落数量
export const DEFAULT_BATCH_LENGTH = 10000; // 每次发送最大文字数量
export const DEFAULT_CONTEXT_SIZE = 3; // 上下文会话数量

export const INPUT_PLACE_URL = "{{url}}"; // 占位符
export const INPUT_PLACE_FROM = "{{from}}"; // 占位符
export const INPUT_PLACE_TO = "{{to}}"; // 占位符
export const INPUT_PLACE_FROM_LANG = "{{fromLang}}"; // 占位符
export const INPUT_PLACE_TO_LANG = "{{toLang}}"; // 占位符
export const INPUT_PLACE_TEXT = "{{text}}"; // 占位符
export const INPUT_PLACE_TONE = "{{tone}}"; // 占位符
export const INPUT_PLACE_TITLE = "{{title}}"; // 标题
export const INPUT_PLACE_DESCRIPTION = "{{description}}"; // 描述
export const INPUT_PLACE_SUMMARY = "{{summary}}"; // 摘要
export const INPUT_PLACE_KEY = "{{key}}"; // 占位符
export const INPUT_PLACE_MODEL = "{{model}}"; // 占位符
export const INPUT_PLACE_GLOSSARY = "{{glossary}}"; // 占位符

export const LLM_OUTPUT_FORMAT_AUTO = "auto";
export const LLM_OUTPUT_FORMAT_JSON = "json";
export const LLM_OUTPUT_FORMAT_XML = "xml";
export const LLM_OUTPUT_FORMAT_TEXTLINES = "textlines";
export const LLM_OUTPUT_FORMAT_PERCENT = "percent";
export const LLM_TEMPLATE_PRESET_CUSTOM = "custom";
export const LLM_OUTPUT_MAPPING_BY_ID = "by_id";
export const LLM_OUTPUT_MAPPING_BY_ORDER = "by_order";
export const LLM_OUTPUT_FORMAT_ALL = [
  LLM_OUTPUT_FORMAT_AUTO,
  LLM_OUTPUT_FORMAT_JSON,
  LLM_OUTPUT_FORMAT_XML,
  LLM_OUTPUT_FORMAT_TEXTLINES,
  LLM_OUTPUT_FORMAT_PERCENT,
];

// export const OPT_DICT_BAIDU = "Baidu";
export const OPT_DICT_BING = "Bing";
export const OPT_DICT_YOUDAO = "Youdao";
export const OPT_DICT_ALL = [OPT_DICT_BING, OPT_DICT_YOUDAO];
export const OPT_DICT_MAP = new Set(OPT_DICT_ALL);

export const OPT_SUG_BAIDU = "Baidu";
export const OPT_SUG_YOUDAO = "Youdao";
export const OPT_SUG_ALL = [OPT_SUG_BAIDU, OPT_SUG_YOUDAO];
export const OPT_SUG_MAP = new Set(OPT_SUG_ALL);

export const OPT_TRANS_BUILTINAI = "BuiltinAI";
export const OPT_TRANS_GOOGLE = "Google";
export const OPT_TRANS_GOOGLE_2 = "Google2";
export const OPT_TRANS_MICROSOFT = "Microsoft";
export const OPT_TRANS_AZUREAI = "AzureAI";
export const OPT_TRANS_DEEPL = "DeepL";
export const OPT_TRANS_DEEPLX = "DeepLX";
export const OPT_TRANS_DEEPLFREE = "DeepLFree";
export const OPT_TRANS_EPHONEAI = "ePhoneAI";
export const OPT_TRANS_BAIDU = "Baidu";
export const OPT_TRANS_TENCENT = "Tencent";
export const OPT_TRANS_VOLCENGINE = "Volcengine";
export const OPT_TRANS_OPENAI = "OpenAI";
export const OPT_TRANS_GEMINI = "Gemini";
export const OPT_TRANS_GEMINI_2 = "Gemini2";
export const OPT_TRANS_CLAUDE = "Claude";
export const OPT_TRANS_CLOUDFLAREAI = "CloudflareAI";
export const OPT_TRANS_OLLAMA = "Ollama";
export const OPT_TRANS_OPENROUTER = "OpenRouter";
export const OPT_TRANS_CUSTOMIZE = "Custom";

// 内置支持的翻译引擎
export const OPT_ALL_TRANS_TYPES = [
  OPT_TRANS_BUILTINAI,
  OPT_TRANS_GOOGLE,
  OPT_TRANS_GOOGLE_2,
  OPT_TRANS_MICROSOFT,
  OPT_TRANS_AZUREAI,
  // OPT_TRANS_BAIDU,
  OPT_TRANS_TENCENT,
  OPT_TRANS_VOLCENGINE,
  OPT_TRANS_DEEPL,
  OPT_TRANS_DEEPLFREE,
  OPT_TRANS_DEEPLX,
  OPT_TRANS_EPHONEAI,
  OPT_TRANS_OPENAI,
  OPT_TRANS_GEMINI,
  OPT_TRANS_GEMINI_2,
  OPT_TRANS_CLAUDE,
  OPT_TRANS_CLOUDFLAREAI,
  OPT_TRANS_OLLAMA,
  OPT_TRANS_OPENROUTER,
  OPT_TRANS_CUSTOMIZE,
];

export const OPT_LANGDETECTOR_ALL = [
  OPT_TRANS_BUILTINAI,
  OPT_TRANS_GOOGLE,
  OPT_TRANS_MICROSOFT,
  OPT_TRANS_BAIDU,
  OPT_TRANS_TENCENT,
];

export const OPT_LANGDETECTOR_MAP = new Set(OPT_LANGDETECTOR_ALL);

// 翻译引擎特殊集合
export const API_SPE_TYPES = {
  // 内置翻译
  builtin: new Set(OPT_ALL_TRANS_TYPES),
  // 机器翻译
  machine: new Set([
    OPT_TRANS_MICROSOFT,
    OPT_TRANS_DEEPLFREE,
    OPT_TRANS_BAIDU,
    OPT_TRANS_TENCENT,
    OPT_TRANS_VOLCENGINE,
  ]),
  // AI翻译
  ai: new Set([
    OPT_TRANS_EPHONEAI,
    OPT_TRANS_OPENAI,
    OPT_TRANS_GEMINI,
    OPT_TRANS_GEMINI_2,
    OPT_TRANS_CLAUDE,
    OPT_TRANS_OLLAMA,
    OPT_TRANS_OPENROUTER,
    OPT_TRANS_CUSTOMIZE,
  ]),
  // 支持多key
  mulkeys: new Set([
    OPT_TRANS_AZUREAI,
    OPT_TRANS_DEEPL,
    OPT_TRANS_OPENAI,
    OPT_TRANS_GEMINI,
    OPT_TRANS_GEMINI_2,
    OPT_TRANS_CLAUDE,
    OPT_TRANS_CLOUDFLAREAI,
    OPT_TRANS_OLLAMA,
    OPT_TRANS_OPENROUTER,
    OPT_TRANS_EPHONEAI,
    OPT_TRANS_CUSTOMIZE,
  ]),
  // 支持批处理
  batch: new Set([
    OPT_TRANS_AZUREAI,
    OPT_TRANS_GOOGLE_2,
    OPT_TRANS_MICROSOFT,
    OPT_TRANS_TENCENT,
    OPT_TRANS_DEEPL,
    OPT_TRANS_OPENAI,
    OPT_TRANS_GEMINI,
    OPT_TRANS_GEMINI_2,
    OPT_TRANS_CLAUDE,
    OPT_TRANS_OLLAMA,
    OPT_TRANS_OPENROUTER,
    OPT_TRANS_EPHONEAI,
    OPT_TRANS_CUSTOMIZE,
  ]),
  // 支持上下文
  context: new Set([
    OPT_TRANS_OPENAI,
    OPT_TRANS_GEMINI,
    OPT_TRANS_GEMINI_2,
    OPT_TRANS_CLAUDE,
    OPT_TRANS_OLLAMA,
    OPT_TRANS_OPENROUTER,
    OPT_TRANS_EPHONEAI,
    OPT_TRANS_CUSTOMIZE,
  ]),
  // 支持流式传输
  stream: new Set([
    OPT_TRANS_OPENAI,
    OPT_TRANS_GEMINI,
    OPT_TRANS_GEMINI_2,
    OPT_TRANS_CLAUDE,
    OPT_TRANS_OLLAMA,
    OPT_TRANS_OPENROUTER,
    OPT_TRANS_EPHONEAI,
  ]),
  // 赞助商
  sponsors: new Set([OPT_TRANS_EPHONEAI]),
};

export const BUILTIN_STONES = [
  "formal", // 正式风格
  "casual", // 口语风格
  "neutral", // 中性风格
  "technical", // 技术风格
  "marketing", // 营销风格
  "Literary", // 文学风格
  "academic", // 学术风格
  "legal", // 法律风格
  "literal", // 直译风格
  "idiomatic", // 意译风格
  "transcreation", // 创译风格
  "machine-like", // 机器风格
  "concise", // 简明风格
];
export const BUILTIN_PLACEHOLDERS = ["{ }", "{{ }}", "[ ]", "[[ ]]"];
export const BUILTIN_PLACETAGS = ["i", "a", "b", "x", "span"];
export const PLACETAG_FORMATS = ["compact", "attribute"]; // 占位符格式：简洁格式、属性格式

export const OPT_LANGS_TO = [
  ["en", "English - English"],
  ["zh-CN", "Simplified Chinese - 简体中文"],
  ["zh-TW", "Traditional Chinese - 繁體中文"],
  ["ar", "Arabic - العربية"],
  ["bg", "Bulgarian - Български"],
  ["ca", "Catalan - Català"],
  ["hr", "Croatian - Hrvatski"],
  ["cs", "Czech - Čeština"],
  ["da", "Danish - Dansk"],
  ["nl", "Dutch - Nederlands"],
  ["fa", "Persian - فارسی"],
  ["fi", "Finnish - Suomi"],
  ["fr", "French - Français"],
  ["de", "German - Deutsch"],
  ["el", "Greek - Ελληνικά"],
  ["hi", "Hindi - हिन्दी"],
  ["hu", "Hungarian - Magyar"],
  ["id", "Indonesian - Indonesia"],
  ["it", "Italian - Italiano"],
  ["ja", "Japanese - 日本語"],
  ["ko", "Korean - 한국어"],
  ["ms", "Malay - Melayu"],
  ["mt", "Maltese - Malti"],
  ["nb", "Norwegian - Norsk Bokmål"],
  ["pl", "Polish - Polski"],
  ["pt", "Portuguese - Português"],
  ["ro", "Romanian - Română"],
  ["ru", "Russian - Русский"],
  ["sk", "Slovak - Slovenčina"],
  ["sl", "Slovenian - Slovenščina"],
  ["es", "Spanish - Español"],
  ["sv", "Swedish - Svenska"],
  ["ta", "Tamil - தமிழ்"],
  ["te", "Telugu - తెలుగు"],
  ["th", "Thai - ไทย"],
  ["tr", "Turkish - Türkçe"],
  ["uk", "Ukrainian - Українська"],
  ["vi", "Vietnamese - Tiếng Việt"],
];
export const OPT_LANGS_LIST = OPT_LANGS_TO.map(([lang]) => lang);
export const OPT_LANGS_FROM = [["auto", "Auto-detect"], ...OPT_LANGS_TO];
export const OPT_LANGS_MAP = new Map(OPT_LANGS_TO);

// CODE->名称
export const OPT_LANGS_SPEC_NAME = new Map(
  OPT_LANGS_FROM.map(([key, val]) => [key, val.split(" - ")[0]])
);
export const OPT_LANGS_SPEC_DEFAULT = new Map(
  OPT_LANGS_FROM.map(([key]) => [key, key])
);
export const OPT_LANGS_SPEC_DEFAULT_UC = new Map(
  OPT_LANGS_FROM.map(([key]) => [key, key.toUpperCase()])
);
export const OPT_LANGS_TO_SPEC = {
  [OPT_TRANS_BUILTINAI]: new Map([
    ...OPT_LANGS_SPEC_DEFAULT,
    ["zh-CN", "zh-Hans"],
    ["zh-TW", "zh-Hant"],
  ]),
  [OPT_TRANS_GOOGLE]: OPT_LANGS_SPEC_DEFAULT,
  [OPT_TRANS_GOOGLE_2]: OPT_LANGS_SPEC_DEFAULT,
  [OPT_TRANS_MICROSOFT]: new Map([
    ...OPT_LANGS_SPEC_DEFAULT,
    ["auto", ""],
    ["zh-CN", "zh-Hans"],
    ["zh-TW", "zh-Hant"],
  ]),
  [OPT_TRANS_AZUREAI]: new Map([
    ...OPT_LANGS_SPEC_DEFAULT,
    ["auto", ""],
    ["zh-CN", "zh-Hans"],
    ["zh-TW", "zh-Hant"],
  ]),
  [OPT_TRANS_DEEPL]: new Map([
    ...OPT_LANGS_SPEC_DEFAULT_UC,
    ["auto", ""],
    ["zh-CN", "ZH"],
    ["zh-TW", "ZH"],
  ]),
  [OPT_TRANS_DEEPLFREE]: new Map([
    ...OPT_LANGS_SPEC_DEFAULT_UC,
    ["auto", "auto"],
    ["zh-CN", "ZH"],
    ["zh-TW", "ZH"],
  ]),
  [OPT_TRANS_DEEPLX]: new Map([
    ...OPT_LANGS_SPEC_DEFAULT_UC,
    ["auto", "auto"],
    ["zh-CN", "ZH"],
    ["zh-TW", "ZH"],
  ]),
  [OPT_TRANS_VOLCENGINE]: new Map([
    ...OPT_LANGS_SPEC_DEFAULT,
    ["auto", "auto"],
    ["zh-CN", "zh"],
    ["zh-TW", "zh-Hant"],
  ]),
  [OPT_TRANS_BAIDU]: new Map([
    ...OPT_LANGS_SPEC_DEFAULT,
    ["zh-CN", "zh"],
    ["zh-TW", "cht"],
    ["ar", "ara"],
    ["bg", "bul"],
    ["ca", "cat"],
    ["hr", "hrv"],
    ["da", "dan"],
    ["fi", "fin"],
    ["fr", "fra"],
    ["hi", "mai"],
    ["ja", "jp"],
    ["ko", "kor"],
    ["ms", "may"],
    ["mt", "mlt"],
    ["nb", "nor"],
    ["ro", "rom"],
    ["ru", "ru"],
    ["sl", "slo"],
    ["es", "spa"],
    ["sv", "swe"],
    ["ta", "tam"],
    ["te", "tel"],
    ["uk", "ukr"],
    ["vi", "vie"],
  ]),
  [OPT_TRANS_TENCENT]: new Map([
    ["auto", "auto"],
    ["zh-CN", "zh"],
    ["zh-TW", "zh"],
    ["en", "en"],
    ["ar", "ar"],
    ["de", "de"],
    ["ru", "ru"],
    ["fr", "fr"],
    ["fi", "fil"],
    ["ko", "ko"],
    ["ms", "ms"],
    ["pt", "pt"],
    ["ja", "ja"],
    ["th", "th"],
    ["tr", "tr"],
    ["es", "es"],
    ["it", "it"],
    ["hi", "hi"],
    ["id", "id"],
    ["vi", "vi"],
  ]),
  [OPT_TRANS_EPHONEAI]: OPT_LANGS_SPEC_NAME,
  [OPT_TRANS_OPENAI]: OPT_LANGS_SPEC_NAME,
  [OPT_TRANS_GEMINI]: OPT_LANGS_SPEC_NAME,
  [OPT_TRANS_GEMINI_2]: OPT_LANGS_SPEC_NAME,
  [OPT_TRANS_CLAUDE]: OPT_LANGS_SPEC_NAME,
  [OPT_TRANS_OLLAMA]: OPT_LANGS_SPEC_NAME,
  [OPT_TRANS_OPENROUTER]: OPT_LANGS_SPEC_NAME,
  [OPT_TRANS_CLOUDFLAREAI]: new Map([
    ...OPT_LANGS_SPEC_DEFAULT,
    ["auto", "en"],
    ["zh-CN", "zh"],
    ["zh-TW", "zh"],
  ]),
  [OPT_TRANS_CUSTOMIZE]: OPT_LANGS_SPEC_NAME,
};

const specToCode = (m) =>
  new Map(
    Array.from(m.entries()).map(([k, v]) => {
      if (v === "") {
        return ["auto", "auto"];
      }
      if (v === "zh" || v === "ZH") {
        return [v, "zh-CN"];
      }
      return [v, k];
    })
  );

// 名称->CODE
export const OPT_LANGS_TO_CODE = {};
Object.entries(OPT_LANGS_TO_SPEC).forEach(([t, m]) => {
  OPT_LANGS_TO_CODE[t] = specToCode(m);
});

export const defaultNobatchPrompt = `You are a professional, authentic machine translation engine.`;
export const defaultNobatchUserPrompt = `# Context
Title: ${INPUT_PLACE_TITLE}
Description: ${INPUT_PLACE_DESCRIPTION}
Summary: ${INPUT_PLACE_SUMMARY}
Tone: ${INPUT_PLACE_TONE}

# Task
Translate the Source Text below to ${INPUT_PLACE_TO}.
1. Use the Context to ensure accuracy.
2. Adapt the wording to match the specified Tone.
3. Output ONLY the translated text. No markdown, no explanations.

Source Text: ${INPUT_PLACE_TEXT}

Translated Text:`;

export const defaultLlmRulesPrompt = `Act as a precise translation engine.

Translate all provided source segments into ${INPUT_PLACE_TO_LANG}.

Rules:
1. Preserve HTML tags, placeholders, entities, protected text, and whitespace structure unless translation naturally requires punctuation changes.
2. Follow the glossary strictly. If a glossary value is empty, keep the original term.
3. Use the provided title, description, and summary only as context. Do not repeat them in the output.
4. Apply the requested tone: ${INPUT_PLACE_TONE}.
5. Return only the translated result that matches the protocol appendix. No commentary or markdown fences.`;

export const defaultSystemPrompt = defaultLlmRulesPrompt;

export const defaultSystemPromptXml = defaultLlmRulesPrompt;

export const defaultSystemPromptLines = defaultLlmRulesPrompt;

export const defaultSystemPromptPercent = defaultLlmRulesPrompt;

export const defaultLlmInputTemplateJson = `{"targetLanguage":{{to_lang|json}},"title":{{title|json}},"description":{{description|json}},"summary":{{summary|json}},"segments":[{{segments}}],"glossary":{{glossary|json}},"tone":{{tone|json}}}`;

export const defaultLlmInputSegmentTemplateJson = `{"id":{{id}},"text":{{source_text|json}}}`;

export const defaultLlmInputTemplatePercent = `Target Language: {{to_lang}}
Title: {{title}}
Description: {{description}}
Summary: {{summary}}
Tone: {{tone}}

Glossary:
{{glossary_lines}}

Segments:
{{segments}}`;

export const defaultLlmInputSegmentTemplatePercent = `[{{id}}]
{{source_text}}`;

export const defaultLlmOutputTemplateJson = `{"translations":[{{segments}}]}`;
export const defaultLlmOutputSegmentTemplateJson = `{"id":{{id}},"text":{{translation|json}},"sourceLanguage":{{source_language|json}}}`;

export const defaultLlmOutputTemplateXml = `<root>
{{segments}}
</root>`;
export const defaultLlmOutputSegmentTemplateXml = `<t id="{{id}}" sourceLanguage="{{source_language}}">{{translation}}</t>`;

export const defaultLlmOutputTemplateTextLines = `{{segments}}`;
export const defaultLlmOutputSegmentTemplateTextLines = `{{id}} | {{translation}}`;

export const defaultLlmOutputTemplatePercent = `{{segments}}`;
export const defaultLlmOutputSegmentTemplatePercent = `{{translation}}`;

export const getLlmTemplatePreset = (llmOutputFormat) => {
  switch (llmOutputFormat) {
    case LLM_OUTPUT_FORMAT_JSON:
      return {
        llmInputTemplate: defaultLlmInputTemplateJson,
        llmInputSegmentTemplate: defaultLlmInputSegmentTemplateJson,
        llmInputSegmentsSeparator: ",",
        llmOutputTemplate: defaultLlmOutputTemplateJson,
        llmOutputSegmentTemplate: defaultLlmOutputSegmentTemplateJson,
        llmOutputSegmentsSeparator: ",",
        llmOutputMappingMode: LLM_OUTPUT_MAPPING_BY_ID,
      };
    case LLM_OUTPUT_FORMAT_XML:
      return {
        llmInputTemplate: defaultLlmInputTemplateJson,
        llmInputSegmentTemplate: defaultLlmInputSegmentTemplateJson,
        llmInputSegmentsSeparator: ",",
        llmOutputTemplate: defaultLlmOutputTemplateXml,
        llmOutputSegmentTemplate: defaultLlmOutputSegmentTemplateXml,
        llmOutputSegmentsSeparator: "\n",
        llmOutputMappingMode: LLM_OUTPUT_MAPPING_BY_ID,
      };
    case LLM_OUTPUT_FORMAT_TEXTLINES:
      return {
        llmInputTemplate: defaultLlmInputTemplateJson,
        llmInputSegmentTemplate: defaultLlmInputSegmentTemplateJson,
        llmInputSegmentsSeparator: ",",
        llmOutputTemplate: defaultLlmOutputTemplateTextLines,
        llmOutputSegmentTemplate: defaultLlmOutputSegmentTemplateTextLines,
        llmOutputSegmentsSeparator: "\n",
        llmOutputMappingMode: LLM_OUTPUT_MAPPING_BY_ID,
      };
    case LLM_OUTPUT_FORMAT_PERCENT:
      return {
        llmInputTemplate: defaultLlmInputTemplatePercent,
        llmInputSegmentTemplate: defaultLlmInputSegmentTemplatePercent,
        llmInputSegmentsSeparator: "\n%%\n",
        llmOutputTemplate: defaultLlmOutputTemplatePercent,
        llmOutputSegmentTemplate: defaultLlmOutputSegmentTemplatePercent,
        llmOutputSegmentsSeparator: "\n%%\n",
        llmOutputMappingMode: LLM_OUTPUT_MAPPING_BY_ORDER,
      };
    default:
      return null;
  }
};

export const detectLlmTemplatePreset = ({
  llmOutputFormat,
  llmInputTemplate,
  llmInputSegmentTemplate,
  llmInputSegmentsSeparator,
  llmOutputTemplate,
  llmOutputSegmentTemplate,
  llmOutputSegmentsSeparator,
  llmOutputMappingMode,
} = {}) => {
  const formats = [
    LLM_OUTPUT_FORMAT_JSON,
    LLM_OUTPUT_FORMAT_XML,
    LLM_OUTPUT_FORMAT_TEXTLINES,
    LLM_OUTPUT_FORMAT_PERCENT,
  ];

  if (
    !llmInputTemplate &&
    !llmInputSegmentTemplate &&
    !llmOutputTemplate &&
    !llmOutputSegmentTemplate &&
    formats.includes(llmOutputFormat)
  ) {
    return llmOutputFormat;
  }

  const matched = formats.find((format) => {
    const preset = getLlmTemplatePreset(format);
    return (
      preset &&
      preset.llmInputTemplate === llmInputTemplate &&
      preset.llmInputSegmentTemplate === llmInputSegmentTemplate &&
      preset.llmInputSegmentsSeparator === llmInputSegmentsSeparator &&
      preset.llmOutputTemplate === llmOutputTemplate &&
      preset.llmOutputSegmentTemplate === llmOutputSegmentTemplate &&
      preset.llmOutputSegmentsSeparator === llmOutputSegmentsSeparator &&
      preset.llmOutputMappingMode === llmOutputMappingMode
    );
  });

  return matched || LLM_TEMPLATE_PRESET_CUSTOM;
};

export const resolveLlmOutputFormat = ({ llmOutputFormat } = {}) => {
  if (LLM_OUTPUT_FORMAT_ALL.includes(llmOutputFormat)) {
    return llmOutputFormat;
  }

  return LLM_OUTPUT_FORMAT_AUTO;
};

export const migrateLegacyLlmApi = (api = {}) => {
  if (!api?.useBatchFetch) {
    return api;
  }

  const preset = detectLlmTemplatePreset({
    llmOutputFormat: api.llmOutputFormat,
    llmInputTemplate: api.llmInputTemplate,
    llmInputSegmentTemplate: api.llmInputSegmentTemplate,
    llmInputSegmentsSeparator: api.llmInputSegmentsSeparator,
    llmOutputTemplate: api.llmOutputTemplate,
    llmOutputSegmentTemplate: api.llmOutputSegmentTemplate,
    llmOutputSegmentsSeparator: api.llmOutputSegmentsSeparator,
    llmOutputMappingMode: api.llmOutputMappingMode,
  });

  const needsTemplateBackfill =
    preset !== LLM_TEMPLATE_PRESET_CUSTOM &&
    (!api.llmInputTemplate || !api.llmOutputTemplate);

  const needsTranslationRulesBackfill = !api.translationRules;

  if (!needsTemplateBackfill && !needsTranslationRulesBackfill) {
    return api;
  }

  const fallbackFormat =
    preset !== LLM_TEMPLATE_PRESET_CUSTOM
      ? preset
      : resolveLlmOutputFormat({ llmOutputFormat: api.llmOutputFormat }) ||
        LLM_OUTPUT_FORMAT_XML;

  const nextPreset =
    fallbackFormat === LLM_OUTPUT_FORMAT_AUTO
      ? LLM_OUTPUT_FORMAT_XML
      : fallbackFormat;
  const templatePreset = getLlmTemplatePreset(nextPreset);

  return {
    ...api,
    translationRules: api.translationRules || defaultLlmRulesPrompt,
    llmOutputFormat:
      nextPreset === LLM_TEMPLATE_PRESET_CUSTOM
        ? api.llmOutputFormat
        : nextPreset,
    ...(templatePreset || {}),
  };
};

export const migrateLegacyLlmApis = (apis = []) => {
  let changed = false;
  const nextApis = apis.map((api) => {
    const migrated = migrateLegacyLlmApi(api);
    if (migrated !== api) {
      changed = true;
    }
    return migrated;
  });

  return { changed, apis: nextApis };
};

// const defaultSubtitlePrompt = `Goal: Convert raw subtitle event JSON into a clean, sentence-based JSON array.

// Output (valid JSON array, output ONLY this array):
// [{
//   "text": "string",        // Full sentence with correct punctuation
//   "translation": "string", // Translation in ${INPUT_PLACE_TO}
//   "start": int,            // Start time (ms)
//   "end": int,              // End time (ms)
// }]

// Guidelines:
// 1. **Segmentation**: Merge sequential 'utf8' strings from 'segs' into full sentences, merging groups logically.
// 2. **Punctuation**: Ensure proper sentence-final punctuation (., ?, !); add if missing.
// 3. **Translation**: Translate 'text' into ${INPUT_PLACE_TO}, place result in 'translation'.
// 4. **Special Cases**: '[Music]' (and similar cues) are standalone entries. Translate appropriately (e.g., '[音乐]', '[Musique]').
// `;

export const defaultSubtitlePrompt = `# Context
Title: ${INPUT_PLACE_TITLE}
Description: ${INPUT_PLACE_DESCRIPTION}
Summary: ${INPUT_PLACE_SUMMARY}
Tone: ${INPUT_PLACE_TONE}

# Glossary (Terminology):
${INPUT_PLACE_GLOSSARY}

# Task
Convert the input word-level timestamp JSON into a bilingual VTT file. Target Language: ${INPUT_PLACE_TO}.

# Rules
1. Merge words into complete sentences first.
2. Split long sentences into readable cues (max 42 chars/line, natural pauses).
3. Strict Glossary Adherence: Use the provided Glossary for specific terms. If a word in the source text matches a key in the glossary, you MUST use the corresponding translation provided.
4. Translate using the provided Context and Tone. Keep non-speech sounds (e.g., [Music]) as is.
5. Convert timestamps to standard VTT format (MM:SS.mmm).
6. Output ONLY the raw VTT content. No markdown, no notes.

# VTT Format Example
WEBVTT

1000 --> 3500
Hello world!
你好，世界！

4000 --> 6000
Good morning.
早上好。`;

const defaultRequestHook = `async (args, { url, body, headers, userMsg, method } = {}) => {
  console.log("request hook args:", { args, url, body, headers, userMsg, method });
  // return { url, body, headers, userMsg, method };
};`;

const defaultResponseHook = `async ({ res, ...args }) => {
  console.log("reaponse hook args:", { res, args });
  // const translations = [["你好", "zh"]];
  // const modelMsg = "";
  // return { translations, modelMsg };
};`;

// 翻译接口默认参数
const defaultApi = {
  apiSlug: "", // 唯一标识
  apiName: "", // 接口名称
  apiType: "", // 接口类型
  url: "",
  key: "",
  model: "", // 模型名称
  translationRules: defaultLlmRulesPrompt,
  systemPrompt: defaultLlmRulesPrompt,
  llmOutputFormat: LLM_OUTPUT_FORMAT_XML,
  llmInputTemplate: defaultLlmInputTemplateJson,
  llmInputSegmentTemplate: defaultLlmInputSegmentTemplateJson,
  llmInputSegmentsSeparator: ",",
  llmOutputTemplate: defaultLlmOutputTemplateXml,
  llmOutputSegmentTemplate: defaultLlmOutputSegmentTemplateXml,
  llmOutputSegmentsSeparator: "\n",
  llmOutputMappingMode: LLM_OUTPUT_MAPPING_BY_ID,
  subtitlePrompt: defaultSubtitlePrompt,
  nobatchPrompt: defaultNobatchPrompt,
  nobatchUserPrompt: defaultNobatchUserPrompt,
  userPrompt: "",
  tone: BUILTIN_STONES[0], // 翻译风格
  placeholder: BUILTIN_PLACEHOLDERS[0], // 占位符
  placetag: BUILTIN_PLACETAGS[0], // 占位标签
  aiTerms: "", // AI智能专业术语 （todo: 备用）
  customHeader: "",
  customBody: "",
  reqHook: "", // request 钩子函数
  resHook: "", // response 钩子函数
  fetchLimit: DEFAULT_FETCH_LIMIT, // 最大请求数量
  fetchInterval: DEFAULT_FETCH_INTERVAL, // 请求间隔时间
  httpTimeout: DEFAULT_HTTP_TIMEOUT * 3, // 请求超时时间
  batchInterval: DEFAULT_BATCH_INTERVAL, // 批处理请求间隔时间
  batchSize: DEFAULT_BATCH_SIZE, // 每次最多发送段落数量
  batchLength: DEFAULT_BATCH_LENGTH, // 每次发送最大文字数量
  useBatchFetch: false, // 是否启用聚合发送请求
  useStream: false, // 是否启用流式传输
  useContext: false, // 是否启用智能上下文
  contextSize: DEFAULT_CONTEXT_SIZE, // 智能上下文保留会话数
  temperature: 0.0,
  maxTokens: 20480,
  // think: false, // (OpenAI 兼容接口未支持，暂时移除)
  // thinkIgnore: "qwen3,deepseek-r1", // (OpenAI 兼容接口未支持，暂时移除)
  isDisabled: false, // 是否不显示,
  region: "", // Azure 专用
  sortOrder: 0, // 排序权重，数值越小越靠前
  placetagFormat: "compact", // 占位符格式：compact(<a1>) 或 attribute(<a i=1>)
};

const defaultApiOpts = {
  [OPT_TRANS_BUILTINAI]: defaultApi,
  [OPT_TRANS_GOOGLE]: {
    ...defaultApi,
    url: "https://translate.googleapis.com/translate_a/single",
  },
  [OPT_TRANS_GOOGLE_2]: {
    ...defaultApi,
    url: "https://translate-pa.googleapis.com/v1/translateHtml",
    key: "AIzaSyATBXajvzQLTDHEQbcpq0Ihe0vWDHmO520",
    useBatchFetch: true,
    placetag: "a",
    placetagFormat: "attribute",
  },
  [OPT_TRANS_MICROSOFT]: {
    ...defaultApi,
    useBatchFetch: true,
  },
  [OPT_TRANS_AZUREAI]: {
    ...defaultApi,
    url: "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0",
    useBatchFetch: true,
  },
  [OPT_TRANS_BAIDU]: {
    ...defaultApi,
  },
  [OPT_TRANS_TENCENT]: {
    ...defaultApi,
    useBatchFetch: true,
  },
  [OPT_TRANS_VOLCENGINE]: {
    ...defaultApi,
  },
  [OPT_TRANS_DEEPL]: {
    ...defaultApi,
    url: "https://api-free.deepl.com/v2/translate",
    useBatchFetch: true,
  },
  [OPT_TRANS_DEEPLFREE]: {
    ...defaultApi,
    fetchLimit: 1,
  },
  [OPT_TRANS_DEEPLX]: {
    ...defaultApi,
    url: "http://localhost:1188/translate",
  },
  [OPT_TRANS_EPHONEAI]: {
    ...defaultApi,
    url: "https://api.ephone.ai/v1/chat/completions",
  },
  [OPT_TRANS_OPENAI]: {
    ...defaultApi,
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4",
    useBatchFetch: true,
  },
  [OPT_TRANS_GEMINI]: {
    ...defaultApi,
    url: `https://generativelanguage.googleapis.com/v1/models/${INPUT_PLACE_MODEL}:generateContent`,
    model: "gemini-2.5-flash",
    useBatchFetch: true,
  },
  [OPT_TRANS_GEMINI_2]: {
    ...defaultApi,
    url: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
    model: "gemini-2.0-flash",
    useBatchFetch: true,
  },
  [OPT_TRANS_CLAUDE]: {
    ...defaultApi,
    url: "https://api.anthropic.com/v1/messages",
    model: "claude-3-haiku-20240307",
    useBatchFetch: true,
  },
  [OPT_TRANS_CLOUDFLAREAI]: {
    ...defaultApi,
    url: "https://api.cloudflare.com/client/v4/accounts/{{ACCOUNT_ID}}/ai/run/@cf/meta/m2m100-1.2b",
  },
  [OPT_TRANS_OLLAMA]: {
    ...defaultApi,
    url: "http://localhost:11434/v1/chat/completions",
    model: "llama3.1",
    llmOutputFormat: LLM_OUTPUT_FORMAT_PERCENT,
    ...getLlmTemplatePreset(LLM_OUTPUT_FORMAT_PERCENT),
    useBatchFetch: true,
  },
  [OPT_TRANS_OPENROUTER]: {
    ...defaultApi,
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "openai/gpt-4o",
    useBatchFetch: true,
  },
  [OPT_TRANS_CUSTOMIZE]: {
    ...defaultApi,
    reqHook: defaultRequestHook,
    resHook: defaultResponseHook,
  },
};

// 内置翻译接口列表（带参数）
export const DEFAULT_API_LIST = OPT_ALL_TRANS_TYPES.map((apiType) => ({
  ...defaultApiOpts[apiType],
  apiSlug: apiType,
  apiName: apiType,
  apiType,
}));

export const DEFAULT_API_TYPE = OPT_TRANS_MICROSOFT;
export const DEFAULT_API_SETTING = DEFAULT_API_LIST.find(
  (a) => a.apiType === DEFAULT_API_TYPE
);
