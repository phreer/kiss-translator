import queryString from "query-string";
import {
  OPT_TRANS_GOOGLE,
  OPT_TRANS_GOOGLE_2,
  OPT_TRANS_MICROSOFT,
  OPT_TRANS_AZUREAI,
  OPT_TRANS_DEEPL,
  OPT_TRANS_DEEPLFREE,
  OPT_TRANS_DEEPLX,
  OPT_TRANS_EPHONEAI,
  OPT_TRANS_BAIDU,
  OPT_TRANS_TENCENT,
  OPT_TRANS_VOLCENGINE,
  OPT_TRANS_OPENAI,
  OPT_TRANS_GEMINI,
  OPT_TRANS_GEMINI_2,
  OPT_TRANS_CLAUDE,
  OPT_TRANS_CLOUDFLAREAI,
  OPT_TRANS_OLLAMA,
  OPT_TRANS_OPENROUTER,
  OPT_TRANS_CUSTOMIZE,
  API_SPE_TYPES,
  INPUT_PLACE_FROM,
  INPUT_PLACE_TO,
  INPUT_PLACE_TEXT,
  INPUT_PLACE_KEY,
  INPUT_PLACE_MODEL,
  DEFAULT_USER_AGENT,
  defaultSystemPrompt,
  defaultSubtitlePrompt,
  defaultNobatchPrompt,
  defaultNobatchUserPrompt,
  defaultLlmRulesPrompt,
  INPUT_PLACE_TONE,
  INPUT_PLACE_TITLE,
  INPUT_PLACE_DESCRIPTION,
  INPUT_PLACE_TO_LANG,
  INPUT_PLACE_FROM_LANG,
  INPUT_PLACE_GLOSSARY,
  defaultSystemPromptXml,
  defaultSystemPromptLines,
  defaultSystemPromptPercent,
  defaultLlmInputTemplateJson,
  defaultLlmInputSegmentTemplateJson,
  defaultLlmOutputTemplateJson,
  defaultLlmOutputSegmentTemplateJson,
  defaultLlmOutputTemplateXml,
  defaultLlmOutputSegmentTemplateXml,
  defaultLlmOutputTemplateTextLines,
  defaultLlmOutputSegmentTemplateTextLines,
  defaultLlmOutputTemplatePercent,
  defaultLlmOutputSegmentTemplatePercent,
  INPUT_PLACE_SUMMARY,
  LLM_OUTPUT_FORMAT_AUTO,
  LLM_OUTPUT_FORMAT_JSON,
  LLM_OUTPUT_FORMAT_PERCENT,
  LLM_TEMPLATE_PRESET_CUSTOM,
  LLM_OUTPUT_MAPPING_BY_ID,
  LLM_OUTPUT_MAPPING_BY_ORDER,
  detectLlmTemplatePreset,
  LLM_OUTPUT_FORMAT_XML,
  LLM_OUTPUT_FORMAT_TEXTLINES,
  getLlmTemplatePreset,
  resolveLlmOutputFormat,
} from "../config";
import { msAuth } from "../libs/auth";
import { genDeeplFree } from "./deepl";
import { genBaidu } from "./baidu";
import { interpreter } from "../libs/interpreter";
import {
  parseJsonObj,
  extractJson,
  stripMarkdownCodeBlock,
  parseAITerms,
} from "../libs/utils";
import {
  parseStreamingSegments,
  parseStreamingTextLineSegments,
  parseStreamingXmlSegments,
  createStreamingJsonParser,
  detectStreamJsonFormat,
  getStreamDelta,
} from "../libs/stream";
import { kissLog } from "../libs/log";
import { fetchData, fetchStream } from "../libs/fetch";
import { getMsgHistory } from "./history";
import { parseBilingualVtt } from "../subtitle/vtt";
import { getDocInfo } from "../libs/docInfo";

const keyMap = new Map();
const urlMap = new Map();

const TEMPLATE_SEGMENTS_PLACEHOLDER = "{{segments}}";

const jsonTemplateDefaults = {
  llmInputTemplate: defaultLlmInputTemplateJson,
  llmInputSegmentTemplate: defaultLlmInputSegmentTemplateJson,
  llmInputSegmentsSeparator: ",",
  llmOutputTemplate: defaultLlmOutputTemplateJson,
  llmOutputSegmentTemplate: defaultLlmOutputSegmentTemplateJson,
  llmOutputSegmentsSeparator: ",",
  llmOutputMappingMode: LLM_OUTPUT_MAPPING_BY_ID,
};

const outputTemplatePresets = [
  {
    template: defaultLlmOutputTemplateJson,
    segmentTemplate: defaultLlmOutputSegmentTemplateJson,
    format: LLM_OUTPUT_FORMAT_JSON,
    mappingMode: LLM_OUTPUT_MAPPING_BY_ID,
  },
  {
    template: defaultLlmOutputTemplateXml,
    segmentTemplate: defaultLlmOutputSegmentTemplateXml,
    format: LLM_OUTPUT_FORMAT_XML,
    mappingMode: LLM_OUTPUT_MAPPING_BY_ID,
  },
  {
    template: defaultLlmOutputTemplateTextLines,
    segmentTemplate: defaultLlmOutputSegmentTemplateTextLines,
    format: LLM_OUTPUT_FORMAT_TEXTLINES,
    mappingMode: LLM_OUTPUT_MAPPING_BY_ID,
  },
  {
    template: defaultLlmOutputTemplatePercent,
    segmentTemplate: defaultLlmOutputSegmentTemplatePercent,
    format: LLM_OUTPUT_FORMAT_PERCENT,
    mappingMode: LLM_OUTPUT_MAPPING_BY_ORDER,
  },
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toTemplateLiteral = (value, mode) => {
  if (value == null) {
    return mode === "json" ? "null" : "";
  }

  const stringValue = String(value);
  if (mode === "json") {
    return JSON.stringify(stringValue);
  }

  return stringValue;
};

const renderTemplate = (template, values = {}) =>
  Object.entries(values).reduce((result, [key, value]) => {
    result = result.replaceAll(`{{${key}}}`, value ?? "");
    result = result.replaceAll(
      `{{${key}|json}}`,
      toTemplateLiteral(value, "json")
    );
    result = result.replaceAll(
      `{{${key}|raw}}`,
      toTemplateLiteral(value, "raw")
    );
    return result;
  }, template);

const compactJsonTemplate = (template) => template.replace(/\s+/g, "");

const stripJsonLine = (line) => {
  if (!line) return line;

  const trimmed = line.trim();
  if (trimmed === '""' || trimmed === "null") {
    return "";
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return trimmed;
  }
};

const formatGlossaryLines = (glossary = {}) => {
  const entries = Object.entries(glossary);
  if (!entries.length) {
    return "(none)";
  }

  return entries.map(([key, value]) => `- ${key}: ${value}`).join("\n");
};

const renderSegmentsTemplate = ({
  segments,
  segmentTemplate,
  separator,
  valueBuilder,
}) =>
  segments
    .map((segment, index) =>
      renderTemplate(segmentTemplate, valueBuilder(segment, index))
    )
    .join(separator);

const SAMPLE_PROMPT_CONTEXT = {
  to_lang: "zh-CN",
  title: "Landing Page",
  description: "Marketing copy for a developer tool.",
  summary: "A concise product overview for developers.",
  tone: "neutral",
  glossary: { World: "世界" },
  glossary_lines: "- World: 世界",
};

const SAMPLE_PROMPT_SEGMENTS = ["Hello, world!", "Line 1\nLine 2"];

const SAMPLE_PROMPT_OUTPUT_SEGMENTS = [
  {
    id: 0,
    translation: "你好，世界！",
    source_language: "en",
  },
  {
    id: 1,
    translation: "第一行\n第二行",
    source_language: "en",
  },
];

const normalizeLlmTemplates = ({
  llmOutputFormat,
  llmInputTemplate,
  llmInputSegmentTemplate,
  llmInputSegmentsSeparator,
  llmOutputTemplate,
  llmOutputSegmentTemplate,
  llmOutputSegmentsSeparator,
  llmOutputMappingMode,
}) => {
  const preset = getLlmTemplatePreset(llmOutputFormat) || jsonTemplateDefaults;

  return {
    llmInputTemplate: llmInputTemplate || preset.llmInputTemplate,
    llmInputSegmentTemplate:
      llmInputSegmentTemplate || preset.llmInputSegmentTemplate,
    llmInputSegmentsSeparator:
      llmInputSegmentsSeparator ?? preset.llmInputSegmentsSeparator,
    llmOutputTemplate: llmOutputTemplate || preset.llmOutputTemplate,
    llmOutputSegmentTemplate:
      llmOutputSegmentTemplate || preset.llmOutputSegmentTemplate,
    llmOutputSegmentsSeparator:
      llmOutputSegmentsSeparator ?? preset.llmOutputSegmentsSeparator,
    llmOutputMappingMode:
      llmOutputMappingMode ||
      preset.llmOutputMappingMode ||
      LLM_OUTPUT_MAPPING_BY_ID,
  };
};

const buildTemplateMeta = ({
  llmOutputFormat,
  llmInputTemplate,
  llmInputSegmentTemplate,
  llmInputSegmentsSeparator,
  llmOutputTemplate,
  llmOutputSegmentTemplate,
  llmOutputSegmentsSeparator,
  llmOutputMappingMode,
  systemPrompt,
}) => {
  const resolvedFormat = resolveLlmOutputFormat({
    llmOutputFormat,
    systemPrompt,
  });

  return {
    llmOutputFormat: resolvedFormat,
    ...normalizeLlmTemplates({
      llmOutputFormat: resolvedFormat,
      llmInputTemplate,
      llmInputSegmentTemplate,
      llmInputSegmentsSeparator,
      llmOutputTemplate,
      llmOutputSegmentTemplate,
      llmOutputSegmentsSeparator,
      llmOutputMappingMode,
    }),
  };
};

const detectTemplatePreset = ({
  llmOutputTemplate,
  llmOutputSegmentTemplate,
}) =>
  outputTemplatePresets.find(
    (preset) =>
      preset.template === llmOutputTemplate &&
      preset.segmentTemplate === llmOutputSegmentTemplate
  ) || null;

const hasCustomOutputTemplate = (templateMeta) =>
  Boolean(
    templateMeta &&
      templateMeta.llmOutputTemplate &&
      templateMeta.llmOutputSegmentTemplate
  );

const renderTemplateSampleInput = (templateMeta) => {
  const segments = renderSegmentsTemplate({
    segments: SAMPLE_PROMPT_SEGMENTS,
    segmentTemplate: templateMeta.llmInputSegmentTemplate,
    separator: templateMeta.llmInputSegmentsSeparator,
    valueBuilder: (text, index) => ({
      id: index,
      source_text: text,
    }),
  });

  return renderTemplate(templateMeta.llmInputTemplate, {
    ...SAMPLE_PROMPT_CONTEXT,
    segments,
  });
};

const renderTemplateSampleOutput = (templateMeta) => {
  const segments = renderSegmentsTemplate({
    segments: SAMPLE_PROMPT_OUTPUT_SEGMENTS,
    segmentTemplate: templateMeta.llmOutputSegmentTemplate,
    separator: templateMeta.llmOutputSegmentsSeparator,
    valueBuilder: (segment) => segment,
  });

  return renderTemplate(templateMeta.llmOutputTemplate, {
    ...SAMPLE_PROMPT_CONTEXT,
    segments,
  });
};

const buildProtocolAppendix = (templateMeta) => {
  const mappingMode =
    templateMeta.llmOutputMappingMode === LLM_OUTPUT_MAPPING_BY_ORDER
      ? "by output order"
      : "by segment id";

  return [
    "Protocol Appendix:",
    `- Output mapping: ${mappingMode}`,
    `- Input segment separator: ${JSON.stringify(
      templateMeta.llmInputSegmentsSeparator
    )}`,
    `- Output segment separator: ${JSON.stringify(
      templateMeta.llmOutputSegmentsSeparator
    )}`,
    "",
    "Sample Input:",
    renderTemplateSampleInput(templateMeta),
    "",
    "Expected Output:",
    renderTemplateSampleOutput(templateMeta),
  ].join("\n");
};

export const buildBatchSystemPrompt = ({
  translationRules,
  systemPrompt,
  tone,
  from,
  to,
  fromLang,
  toLang,
  texts,
  docInfo,
  templateMeta,
}) => {
  const rulesPrompt = genSystemPrompt({
    systemPrompt: translationRules || defaultLlmRulesPrompt,
    tone,
    from,
    to,
    fromLang,
    toLang,
    texts,
    docInfo,
  }).trim();

  return `${rulesPrompt}\n\n${buildProtocolAppendix(templateMeta)}`.trim();
};

export const getLlmPromptPreview = ({
  translationRules,
  systemPrompt,
  llmOutputFormat,
  llmInputTemplate,
  llmInputSegmentTemplate,
  llmInputSegmentsSeparator,
  llmOutputTemplate,
  llmOutputSegmentTemplate,
  llmOutputSegmentsSeparator,
  llmOutputMappingMode,
}) => {
  const templateMeta = buildTemplateMeta({
    systemPrompt,
    llmOutputFormat,
    llmInputTemplate,
    llmInputSegmentTemplate,
    llmInputSegmentsSeparator,
    llmOutputTemplate,
    llmOutputSegmentTemplate,
    llmOutputSegmentsSeparator,
    llmOutputMappingMode,
  });

  return {
    templateMeta,
    preset: detectLlmTemplatePreset({
      llmOutputFormat,
      llmInputTemplate: templateMeta.llmInputTemplate,
      llmInputSegmentTemplate: templateMeta.llmInputSegmentTemplate,
      llmInputSegmentsSeparator: templateMeta.llmInputSegmentsSeparator,
      llmOutputTemplate: templateMeta.llmOutputTemplate,
      llmOutputSegmentTemplate: templateMeta.llmOutputSegmentTemplate,
      llmOutputSegmentsSeparator: templateMeta.llmOutputSegmentsSeparator,
      llmOutputMappingMode: templateMeta.llmOutputMappingMode,
    }),
    rulesPrompt: genSystemPrompt({
      systemPrompt: translationRules || defaultLlmRulesPrompt,
      tone: SAMPLE_PROMPT_CONTEXT.tone,
      from: "en",
      to: "zh-CN",
      fromLang: "en",
      toLang: SAMPLE_PROMPT_CONTEXT.to_lang,
      texts: SAMPLE_PROMPT_SEGMENTS,
      docInfo: {
        title: SAMPLE_PROMPT_CONTEXT.title,
        description: SAMPLE_PROMPT_CONTEXT.description,
        summary: SAMPLE_PROMPT_CONTEXT.summary,
      },
    }).trim(),
    protocolAppendix: buildProtocolAppendix(templateMeta),
    sampleUserInput: renderTemplateSampleInput(templateMeta),
    sampleOutput: renderTemplateSampleOutput(templateMeta),
  };
};

export const validateTemplateSettings = ({
  llmTemplatePreset,
  llmOutputSegmentTemplate,
  llmOutputSegmentsSeparator,
  llmOutputMappingMode,
  llmInputTemplate,
  llmOutputTemplate,
  useStream,
} = {}) => {
  const warnings = [];

  if (!llmInputTemplate?.includes(TEMPLATE_SEGMENTS_PLACEHOLDER)) {
    warnings.push("Input template should include {{segments}}.");
  }

  if (!llmOutputTemplate?.includes(TEMPLATE_SEGMENTS_PLACEHOLDER)) {
    warnings.push("Output template should include {{segments}}.");
  }

  if (!llmOutputSegmentTemplate?.includes("{{translation")) {
    warnings.push("Output segment template should include {{translation}}.");
  }

  if (
    llmOutputMappingMode === LLM_OUTPUT_MAPPING_BY_ID &&
    !llmOutputSegmentTemplate?.includes("{{id")
  ) {
    warnings.push(
      "by_id mapping requires {{id}} in the output segment template."
    );
  }

  if (
    llmOutputMappingMode === LLM_OUTPUT_MAPPING_BY_ORDER &&
    !llmOutputSegmentsSeparator
  ) {
    warnings.push(
      "by_order mapping should define an output segment separator."
    );
  }

  if (useStream && llmTemplatePreset === LLM_TEMPLATE_PRESET_CUSTOM) {
    warnings.push(
      "Custom templates do not yet support fully generic streaming parsing. Final non-stream parsing is more reliable."
    );
  }

  return warnings;
};

// 轮询key/url
const keyPick = (apiSlug, key = "", cacheMap) => {
  const keys = key
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    return "";
  }

  const preIndex = cacheMap.get(apiSlug) ?? -1;
  const curIndex = (preIndex + 1) % keys.length;
  cacheMap.set(apiSlug, curIndex);

  return keys[curIndex];
};

const genSystemPrompt = ({
  systemPrompt,
  tone,
  from,
  to,
  fromLang,
  toLang,
  texts,
  docInfo: { title = "", description = "", summary = "" } = {},
}) =>
  systemPrompt
    .replaceAll(INPUT_PLACE_TITLE, title)
    .replaceAll(INPUT_PLACE_DESCRIPTION, description)
    .replaceAll(INPUT_PLACE_SUMMARY, summary)
    .replaceAll(INPUT_PLACE_TONE, tone)
    .replaceAll(INPUT_PLACE_FROM, from)
    .replaceAll(INPUT_PLACE_TO, to)
    .replaceAll(INPUT_PLACE_FROM_LANG, fromLang)
    .replaceAll(INPUT_PLACE_TO_LANG, toLang)
    .replaceAll(INPUT_PLACE_TEXT, texts[0]);

export const genUserPrompt = ({
  nobatchUserPrompt,
  useBatchFetch,
  llmInputTemplate,
  llmInputSegmentTemplate,
  llmInputSegmentsSeparator,
  llmOutputFormat,
  tone,
  glossary = {}, // 规则中的AI专业术语
  aiTerms = "", // 接口中的AI专业术语
  from,
  to,
  fromLang,
  toLang,
  texts,
  systemPrompt,
  docInfo: { title = "", description = "", summary = "" } = {},
}) => {
  if (useBatchFetch) {
    // 合并规则与接口中的AI专业术语
    if (aiTerms) {
      const aiGlossary = parseAITerms(aiTerms);
      glossary = { ...glossary, ...aiGlossary };
    }

    const templateMeta = buildTemplateMeta({
      llmOutputFormat,
      llmInputTemplate,
      llmInputSegmentTemplate,
      llmInputSegmentsSeparator,
      systemPrompt,
    });

    const segments = renderSegmentsTemplate({
      segments: texts,
      segmentTemplate: templateMeta.llmInputSegmentTemplate,
      separator: templateMeta.llmInputSegmentsSeparator,
      valueBuilder: (text, index) => ({
        id: index,
        source_text: text,
      }),
    });

    const rendered = renderTemplate(templateMeta.llmInputTemplate, {
      to_lang: toLang,
      title,
      description,
      summary,
      glossary,
      glossary_lines: formatGlossaryLines(glossary),
      tone,
      segments,
    });

    if (templateMeta.llmInputTemplate === defaultLlmInputTemplateJson) {
      try {
        return JSON.stringify(JSON.parse(compactJsonTemplate(rendered)));
      } catch (error) {
        return rendered;
      }
    }

    return rendered;
  }

  return nobatchUserPrompt
    .replaceAll(INPUT_PLACE_TITLE, title)
    .replaceAll(INPUT_PLACE_DESCRIPTION, description)
    .replaceAll(INPUT_PLACE_SUMMARY, summary)
    .replaceAll(INPUT_PLACE_TONE, tone)
    .replaceAll(INPUT_PLACE_FROM, from)
    .replaceAll(INPUT_PLACE_TO, to)
    .replaceAll(INPUT_PLACE_FROM_LANG, fromLang)
    .replaceAll(INPUT_PLACE_TO_LANG, toLang)
    .replaceAll(INPUT_PLACE_TEXT, texts[0]);
};

const genSubtitlePrompt = ({
  subtitlePrompt,
  tone,
  from,
  to,
  fromLang,
  toLang,
  docInfo: { title = "", description = "", summary = "" } = {},
  aiTerms = "",
}) => {
  const aiGlossary = parseAITerms(aiTerms);
  const glossaryStr = Object.entries(aiGlossary)
    .map(([term, definition]) => `- ${term}: ${definition}`)
    .join("\n");
  return subtitlePrompt
    .replaceAll(INPUT_PLACE_TITLE, title)
    .replaceAll(INPUT_PLACE_DESCRIPTION, description)
    .replaceAll(INPUT_PLACE_SUMMARY, summary)
    .replaceAll(INPUT_PLACE_TONE, tone)
    .replaceAll(INPUT_PLACE_GLOSSARY, glossaryStr)
    .replaceAll(INPUT_PLACE_FROM, from)
    .replaceAll(INPUT_PLACE_TO, to)
    .replaceAll(INPUT_PLACE_FROM_LANG, fromLang)
    .replaceAll(INPUT_PLACE_TO_LANG, toLang);
};

const parseAIResByJson = (content) => {
  try {
    const jsonStr = extractJson(content);
    if (!jsonStr) {
      return null;
    }

    const parsed = JSON.parse(jsonStr);
    const list = Array.isArray(parsed)
      ? parsed
      : parsed.translations || (parsed.result ? [parsed.result] : [parsed]);

    if (
      list.length > 0 &&
      (list[0].text !== undefined || list[0].translations)
    ) {
      return list.map((item) => [
        String(item.text || ""),
        String(item.sourceLanguage || ""),
      ]);
    }
  } catch (e) {
    //
  }

  return null;
};

const parseAIResByXml = (content) => {
  const xmlTagPattern = /<(t|item|seg)\b/i;
  if (!xmlTagPattern.test(content)) {
    return null;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const elements = doc.querySelectorAll("t, item, seg");

    if (elements.length > 0) {
      return Array.from(elements).map((el) => [
        el.innerHTML.trim(),
        el.getAttribute("sourceLanguage") || "",
      ]);
    }
  } catch (e) {
    //
  }

  return null;
};

const parseAIResByTextLines = (content) =>
  content.split("\n").map((line) => {
    const pipeMatch = line.match(/^\d+\s*\|\s*(.*)/);
    if (pipeMatch) {
      return [pipeMatch[1].trim(), ""];
    }

    const text = line.replace(/<br\s*\/?>/gi, "\n").trim();
    return [text, ""];
  });

const parseAIResByPercent = (content) =>
  content.split(/\n?\s*%%\s*\n?/).map((segment) => [segment.trim(), ""]);

const compileSegmentTemplateRegex = (segmentTemplate) => {
  const tokenRegex = /{{(id|translation|source_language)(\|json|\|raw)?}}/g;
  let cursor = 0;
  let pattern = "";
  let match;
  const fields = [];

  while ((match = tokenRegex.exec(segmentTemplate)) !== null) {
    const [token, field, modifier = ""] = match;
    pattern += escapeRegExp(segmentTemplate.slice(cursor, match.index));
    pattern += field === "id" ? "(\\d+)" : "([\\s\\S]*?)";
    fields.push({ field, modifier });
    cursor = match.index + token.length;
  }

  pattern += escapeRegExp(segmentTemplate.slice(cursor));
  return { regex: new RegExp(`^${pattern}$`), fields };
};

const parseWithTemplateBySegments = ({
  content,
  llmOutputTemplate,
  llmOutputSegmentTemplate,
  llmOutputSegmentsSeparator,
  llmOutputMappingMode,
}) => {
  if (!llmOutputSegmentTemplate) return null;

  let body = content;
  if (
    llmOutputTemplate &&
    llmOutputTemplate.includes(TEMPLATE_SEGMENTS_PLACEHOLDER)
  ) {
    const [prefix = "", suffix = ""] = llmOutputTemplate.split(
      TEMPLATE_SEGMENTS_PLACEHOLDER
    );
    if (prefix && body.startsWith(prefix)) {
      body = body.slice(prefix.length);
    }
    if (suffix && body.endsWith(suffix)) {
      body = body.slice(0, body.length - suffix.length);
    }
  }

  const separator = llmOutputSegmentsSeparator ?? "\n";
  const chunks = separator ? body.split(separator) : [body];
  const { regex, fields } = compileSegmentTemplateRegex(
    llmOutputSegmentTemplate
  );
  const parsed = [];

  chunks.forEach((chunk, index) => {
    const trimmed = chunk.trim();
    if (!trimmed) return;

    const match = trimmed.match(regex);
    if (!match) {
      if (llmOutputMappingMode === LLM_OUTPUT_MAPPING_BY_ORDER) {
        parsed.push([trimmed, ""]);
      }
      return;
    }

    let id = index;
    let translation = "";
    let sourceLanguage = "";

    fields.forEach((field, fieldIndex) => {
      const rawValue = match[fieldIndex + 1];
      const normalized =
        field.modifier === "|json" ? stripJsonLine(rawValue) : rawValue;

      if (field.field === "id") {
        id = parseInt(normalized, 10);
      } else if (field.field === "translation") {
        translation = String(normalized ?? "");
      } else if (field.field === "source_language") {
        sourceLanguage = String(normalized ?? "");
      }
    });

    if (llmOutputMappingMode === LLM_OUTPUT_MAPPING_BY_ID) {
      parsed[id] = [translation, sourceLanguage];
    } else {
      parsed.push([translation, sourceLanguage]);
    }
  });

  return parsed.filter((item) => item !== undefined);
};

export const parseAIRes = (
  raw,
  useBatchFetch = true,
  llmOutputFormat,
  templateMeta = null
) => {
  if (!raw) {
    return [];
  }

  if (!useBatchFetch) {
    return [[raw]];
  }

  // try {
  //   const jsonString = extractJson(raw);
  //   if (!jsonString) return [];

  //   const data = JSON.parse(jsonString);
  //   if (Array.isArray(data.translations)) {
  //     // todo: 考虑序号id可能会打乱
  //     return data.translations.map((item) => [
  //       item?.text ?? "",
  //       item?.sourceLanguage ?? "",
  //     ]);
  //   }
  // } catch (err) {
  //   kissLog("parse AI Res", err);
  // }
  // return [];

  let content = stripMarkdownCodeBlock(raw).trim();
  if (
    (!templateMeta || !hasCustomOutputTemplate(templateMeta)) &&
    (llmOutputFormat === LLM_OUTPUT_FORMAT_AUTO ||
      llmOutputFormat === undefined ||
      llmOutputFormat === null)
  ) {
    return (
      parseAIResByJson(content) ||
      parseAIResByXml(content) ||
      (content.includes("%%") ? parseAIResByPercent(content) : null) ||
      parseAIResByTextLines(content)
    );
  }

  const templates = templateMeta
    ? buildTemplateMeta(templateMeta)
    : buildTemplateMeta({ llmOutputFormat });
  const preset = detectTemplatePreset({
    llmOutputTemplate: templates.llmOutputTemplate,
    llmOutputSegmentTemplate: templates.llmOutputSegmentTemplate,
  });

  if (!preset) {
    return (
      parseWithTemplateBySegments({
        content,
        llmOutputTemplate: templates.llmOutputTemplate,
        llmOutputSegmentTemplate: templates.llmOutputSegmentTemplate,
        llmOutputSegmentsSeparator: templates.llmOutputSegmentsSeparator,
        llmOutputMappingMode: templates.llmOutputMappingMode,
      }) || []
    );
  }

  switch (preset.format) {
    case LLM_OUTPUT_FORMAT_JSON:
      return parseAIResByJson(content) || [];
    case LLM_OUTPUT_FORMAT_XML:
      return parseAIResByXml(content) || [];
    case LLM_OUTPUT_FORMAT_TEXTLINES:
      return parseAIResByTextLines(content);
    case LLM_OUTPUT_FORMAT_PERCENT:
      return parseAIResByPercent(content);
    case LLM_OUTPUT_FORMAT_AUTO:
    case undefined:
    case null:
      return (
        parseAIResByJson(content) ||
        parseAIResByXml(content) ||
        (content.includes("%%") ? parseAIResByPercent(content) : null) ||
        parseAIResByTextLines(content)
      );
    default:
      return parseAIResByTextLines(content);
  }
};

const parseSTRes = (raw) => {
  if (!raw) {
    return [];
  }

  try {
    // const jsonString = extractJson(raw);
    // const data = JSON.parse(jsonString);
    const data = parseBilingualVtt(raw);
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    kissLog("parse AI Res: subtitle", err);
  }

  return [];
};

const genGoogle = ({ texts, from, to, url, key }) => {
  const params = queryString.stringify({
    client: "gtx",
    dt: "t",
    dj: 1,
    ie: "UTF-8",
    sl: from,
    tl: to,
    q: texts.join(" "),
  });
  url = `${url}?${params}`;
  const headers = {
    "Content-type": "application/json",
  };
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }

  return { url, headers, method: "GET" };
};

const genGoogle2 = ({ texts, from, to, url, key }) => {
  const body = [[texts, from, to], "wt_lib"];
  const headers = {
    "Content-Type": "application/json+protobuf",
    "X-Goog-API-Key": key,
  };

  return { url, body, headers };
};

const genMicrosoft = ({ texts, from, to, token }) => {
  const params = queryString.stringify({
    from,
    to,
    "api-version": "3.0",
  });
  const url = `https://api-edge.cognitive.microsofttranslator.com/translate?${params}`;
  const headers = {
    "Content-type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const body = texts.map((text) => ({ Text: text }));

  return { url, body, headers };
};

const genAzureAI = ({ texts, from, to, url, key, region }) => {
  const params = queryString.stringify({
    from,
    to,
  });
  url = url.endsWith("&") ? `${url}${params}` : `${url}&${params}`;
  const headers = {
    "Content-type": "application/json",
    "Ocp-Apim-Subscription-Key": key,
    "Ocp-Apim-Subscription-Region": region,
  };
  const body = texts.map((text) => ({ Text: text }));

  return { url, body, headers };
};

const genDeepl = ({ texts, from, to, url, key }) => {
  const body = {
    text: texts,
    target_lang: to,
    source_lang: from,
    // split_sentences: "0",
  };
  const headers = {
    "Content-type": "application/json",
    Authorization: `DeepL-Auth-Key ${key}`,
  };

  return { url, body, headers };
};

const genDeeplX = ({ texts, from, to, url, key }) => {
  const body = {
    text: texts.join(" "),
    target_lang: to,
    source_lang: from,
  };

  const headers = {
    "Content-type": "application/json",
  };
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }

  return { url, body, headers };
};

const genTencent = ({ texts, from, to }) => {
  const body = {
    header: {
      fn: "auto_translation",
      client_key:
        "browser-chrome-110.0.0-Mac OS-df4bd4c5-a65d-44b2-a40f-42f34f3535f2-1677486696487",
    },
    type: "plain",
    model_category: "normal",
    source: {
      text_list: texts,
      lang: from,
    },
    target: {
      lang: to,
    },
  };

  const url = "https://transmart.qq.com/api/imt";
  const headers = {
    "Content-Type": "application/json",
    "user-agent": DEFAULT_USER_AGENT,
    referer: "https://transmart.qq.com/zh-CN/index",
  };

  return { url, body, headers };
};

const genVolcengine = ({ texts, from, to }) => {
  const body = {
    source_language: from,
    target_language: to,
    text: texts.join(" "),
  };

  const url = "https://translate.volcengine.com/crx/translate/v1";
  const headers = {
    "Content-type": "application/json",
  };

  return { url, body, headers };
};

const genOpenAI = ({
  url,
  key,
  systemPrompt,
  userPrompt,
  model,
  temperature,
  maxTokens,
  hisMsgs = [],
  useStream = false,
}) => {
  const userMsg = {
    role: "user",
    content: userPrompt,
  };
  const body = {
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...hisMsgs,
      userMsg,
    ],
    temperature,
    max_completion_tokens: maxTokens,
    stream: useStream,
  };

  const headers = {
    "Content-type": "application/json",
    Authorization: `Bearer ${key}`, // OpenAI
    // "api-key": key, // Azure OpenAI
  };

  return { url, body, headers, userMsg };
};

const genGemini = ({
  url,
  key,
  systemPrompt,
  userPrompt,
  model,
  temperature,
  maxTokens,
  hisMsgs = [],
  useStream = false,
}) => {
  url = url
    .replaceAll(INPUT_PLACE_MODEL, model)
    .replaceAll(INPUT_PLACE_KEY, key);

  // 流式传输使用 streamGenerateContent 端点
  if (useStream) {
    url = url.replace(":generateContent", ":streamGenerateContent");
    url += (url.includes("?") ? "&" : "?") + "alt=sse";
  }

  const userMsg = { role: "user", parts: [{ text: userPrompt }] };
  const body = {
    // system_instruction: {
    //   parts: {
    //     text: systemPrompt,
    //   },
    // },
    contents: [
      {
        role: "model",
        parts: [{ text: systemPrompt }],
      },
      ...hisMsgs,
      userMsg,
    ],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
      // topP: 0.8,
      // topK: 10,
    },
    // thinkingConfig: {
    //   thinkingBudget: 0,
    // },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE",
      },
    ],
  };
  const headers = {
    "Content-type": "application/json",
    "x-goog-api-key": key,
  };

  return { url, body, headers, userMsg };
};

const genGemini2 = ({
  url,
  key,
  systemPrompt,
  userPrompt,
  model,
  temperature,
  maxTokens,
  hisMsgs = [],
  useStream = false,
}) => {
  const userMsg = {
    role: "user",
    content: userPrompt,
  };
  const body = {
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...hisMsgs,
      userMsg,
    ],
    temperature,
    max_tokens: maxTokens,
    stream: useStream,
  };

  const headers = {
    "Content-type": "application/json",
    Authorization: `Bearer ${key}`,
  };

  return { url, body, headers, userMsg };
};

const genClaude = ({
  url,
  key,
  systemPrompt,
  userPrompt,
  model,
  temperature,
  maxTokens,
  hisMsgs = [],
  useStream = false,
}) => {
  const userMsg = {
    role: "user",
    content: userPrompt,
  };
  const body = {
    model,
    system: systemPrompt,
    messages: [...hisMsgs, userMsg],
    temperature,
    max_tokens: maxTokens,
    stream: useStream,
  };

  const headers = {
    "Content-type": "application/json",
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
    "x-api-key": key,
  };

  return { url, body, headers, userMsg };
};

const genOpenRouter = ({
  url,
  key,
  systemPrompt,
  userPrompt,
  model,
  temperature,
  maxTokens,
  hisMsgs = [],
  useStream = false,
}) => {
  const userMsg = {
    role: "user",
    content: userPrompt,
  };
  const body = {
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...hisMsgs,
      userMsg,
    ],
    temperature,
    max_tokens: maxTokens,
    stream: useStream,
  };

  const headers = {
    "Content-type": "application/json",
    Authorization: `Bearer ${key}`,
  };

  return { url, body, headers, userMsg };
};

const genOllama = ({
  // think,
  url,
  key,
  systemPrompt,
  userPrompt,
  model,
  temperature,
  maxTokens,
  hisMsgs = [],
  useStream = false,
}) => {
  const userMsg = {
    role: "user",
    content: userPrompt,
  };
  const body = {
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...hisMsgs,
      userMsg,
    ],
    temperature,
    max_tokens: maxTokens,
    // think,
    stream: useStream,
  };

  const headers = {
    "Content-type": "application/json",
  };
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }

  return { url, body, headers, userMsg };
};

const genCloudflareAI = ({ texts, from, to, url, key }) => {
  const body = {
    text: texts.join(" "),
    source_lang: from,
    target_lang: to,
  };

  const headers = {
    "Content-type": "application/json",
    Authorization: `Bearer ${key}`,
  };

  return { url, body, headers };
};

const genCustom = ({ texts, fromLang, toLang, url, key, useBatchFetch }) => {
  const body = useBatchFetch
    ? { texts, from: fromLang, to: toLang }
    : { text: texts[0], from: fromLang, to: toLang };
  const headers = {
    "Content-type": "application/json",
    Authorization: `Bearer ${key}`,
  };

  return { url, body, headers };
};

const genReqFuncs = {
  [OPT_TRANS_GOOGLE]: genGoogle,
  [OPT_TRANS_GOOGLE_2]: genGoogle2,
  [OPT_TRANS_MICROSOFT]: genMicrosoft,
  [OPT_TRANS_AZUREAI]: genAzureAI,
  [OPT_TRANS_DEEPL]: genDeepl,
  [OPT_TRANS_DEEPLFREE]: genDeeplFree,
  [OPT_TRANS_DEEPLX]: genDeeplX,
  [OPT_TRANS_EPHONEAI]: genOpenAI,
  [OPT_TRANS_BAIDU]: genBaidu,
  [OPT_TRANS_TENCENT]: genTencent,
  [OPT_TRANS_VOLCENGINE]: genVolcengine,
  [OPT_TRANS_OPENAI]: genOpenAI,
  [OPT_TRANS_GEMINI]: genGemini,
  [OPT_TRANS_GEMINI_2]: genGemini2,
  [OPT_TRANS_CLAUDE]: genClaude,
  [OPT_TRANS_CLOUDFLAREAI]: genCloudflareAI,
  [OPT_TRANS_OLLAMA]: genOllama,
  [OPT_TRANS_OPENROUTER]: genOpenRouter,
  [OPT_TRANS_CUSTOMIZE]: genCustom,
};

const genInit = ({
  url = "",
  body = null,
  headers = {},
  userMsg = null,
  method = "POST",
}) => {
  if (!url) {
    throw new Error("genInit: url is empty");
  }

  const init = {
    method,
    headers,
  };
  if (method !== "GET" && method !== "HEAD" && body) {
    let payload = JSON.stringify(body);
    const id = body?.params?.id;
    if (id) {
      payload = payload.replace(
        'method":"',
        (id + 3) % 13 === 0 || (id + 5) % 29 === 0
          ? 'method" : "'
          : 'method": "'
      );
    }
    Object.assign(init, { body: payload });
  }

  return [url, init, userMsg];
};

/**
 * 构造翻译接口请求参数
 * @param {*}
 * @returns
 */
export const genTransReq = async ({ reqHook, ...args }) => {
  const {
    apiType,
    apiSlug,
    key,
    translationRules,
    systemPrompt,
    subtitlePrompt,
    // userPrompt,
    nobatchPrompt = defaultNobatchPrompt,
    nobatchUserPrompt = defaultNobatchUserPrompt,
    llmInputTemplate,
    llmInputSegmentTemplate,
    llmInputSegmentsSeparator,
    llmOutputTemplate,
    llmOutputSegmentTemplate,
    llmOutputSegmentsSeparator,
    llmOutputMappingMode,
    llmOutputFormat,
    useBatchFetch,
    from,
    to,
    fromLang,
    toLang,
    texts,
    glossary,
    aiTerms,
    customHeader,
    customBody,
    events,
    tone,
  } = args;

  if (API_SPE_TYPES.mulkeys.has(apiType)) {
    args.key = keyPick(apiSlug, key, keyMap);
  }

  if (apiType === OPT_TRANS_DEEPLX) {
    args.url = keyPick(apiSlug, args.url, urlMap);
  }

  if (API_SPE_TYPES.ai.has(apiType)) {
    const docInfo = getDocInfo();

    args.systemPrompt = events
      ? genSubtitlePrompt({
          subtitlePrompt,
          from,
          to,
          fromLang,
          toLang,
          texts,
          docInfo,
          tone,
          aiTerms,
        })
      : useBatchFetch
        ? buildBatchSystemPrompt({
            translationRules,
            systemPrompt,
            from,
            to,
            fromLang,
            toLang,
            texts,
            docInfo,
            tone,
            templateMeta: buildTemplateMeta({
              llmOutputFormat,
              llmInputTemplate,
              llmInputSegmentTemplate,
              llmInputSegmentsSeparator,
              llmOutputTemplate,
              llmOutputSegmentTemplate,
              llmOutputSegmentsSeparator,
              llmOutputMappingMode,
              translationRules,
              systemPrompt,
            }),
          })
        : genSystemPrompt({
            systemPrompt: nobatchPrompt,
            from,
            to,
            fromLang,
            toLang,
            texts,
            docInfo,
            tone,
          });
    args.userPrompt = events
      ? JSON.stringify(events)
      : genUserPrompt({
          nobatchUserPrompt,
          useBatchFetch,
          llmInputTemplate,
          llmInputSegmentTemplate,
          llmInputSegmentsSeparator,
          llmOutputFormat,
          from,
          to,
          fromLang,
          toLang,
          texts,
          docInfo,
          tone,
          glossary,
          aiTerms,
          systemPrompt,
        });
  }

  const {
    url = "",
    body = null,
    headers = {},
    userMsg = null,
    method = "POST",
  } = genReqFuncs[apiType](args);

  // 合并用户自定义headers和body
  if (customHeader?.trim()) {
    Object.assign(headers, parseJsonObj(customHeader));
  }
  if (customBody?.trim()) {
    Object.assign(body, parseJsonObj(customBody));
  }

  // 执行 request hook
  if (reqHook?.trim() && !events) {
    try {
      const req = {
        url,
        body,
        headers,
        userMsg,
        method,
      };
      interpreter.run(`exports.reqHook = ${reqHook}`);
      const hookResult = await interpreter.exports.reqHook(
        {
          ...args,
          defaultSystemPrompt,
          defaultSystemPromptPercent,
          defaultSystemPromptXml,
          defaultSystemPromptLines,
          defaultSubtitlePrompt,
          defaultNobatchPrompt,
          defaultNobatchUserPrompt,
          req,
        },
        req
      );
      if (hookResult && hookResult.url) {
        return genInit(hookResult);
      }
    } catch (err) {
      kissLog("run req hook", err);
      throw new Error(`Request hook error: ${err.message}`);
    }
  }

  return genInit({ url, body, headers, userMsg, method });
};

/**
 * 解析翻译接口返回数据
 * @param {*} res
 * @param {*} param3
 * @returns
 */
export const parseTransRes = async (
  res,
  {
    texts,
    from,
    to,
    fromLang,
    toLang,
    langMap,
    resHook,
    // thinkIgnore,
    history,
    userMsg,
    apiType,
    useBatchFetch,
    llmOutputFormat,
    systemPrompt,
    llmInputTemplate,
    llmInputSegmentTemplate,
    llmInputSegmentsSeparator,
    llmOutputTemplate,
    llmOutputSegmentTemplate,
    llmOutputSegmentsSeparator,
    llmOutputMappingMode,
  }
) => {
  const templateMeta = buildTemplateMeta({
    llmOutputFormat,
    systemPrompt,
    llmInputTemplate,
    llmInputSegmentTemplate,
    llmInputSegmentsSeparator,
    llmOutputTemplate,
    llmOutputSegmentTemplate,
    llmOutputSegmentsSeparator,
    llmOutputMappingMode,
  });

  // 执行 response hook
  if (resHook?.trim()) {
    try {
      interpreter.run(`exports.resHook = ${resHook}`);
      const hookResult = await interpreter.exports.resHook({
        apiType,
        userMsg,
        res,
        texts,
        from,
        to,
        fromLang,
        toLang,
        langMap,
        extractJson,
        parseAIRes,
      });
      if (hookResult && Array.isArray(hookResult.translations)) {
        if (history && userMsg && hookResult.modelMsg) {
          history.add(userMsg, hookResult.modelMsg);
        }
        return hookResult.translations;
      } else if (Array.isArray(hookResult)) {
        return hookResult;
      }
    } catch (err) {
      kissLog("run res hook", err);
      throw new Error(`Response hook error: ${err.message}`);
    }
  }

  let modelMsg = "";

  // todo: 根据结果抛出实际异常信息
  switch (apiType) {
    case OPT_TRANS_GOOGLE:
      return [[res?.sentences?.map((item) => item.trans).join(" "), res?.src]];
    case OPT_TRANS_GOOGLE_2:
      return res?.[0]?.map((_, i) => [res?.[0]?.[i], res?.[1]?.[i]]);
    case OPT_TRANS_MICROSOFT:
    case OPT_TRANS_AZUREAI:
      return res?.map((item) => [
        item.translations.map((item) => item.text).join(" "),
        item.detectedLanguage?.language,
      ]);
    case OPT_TRANS_DEEPL:
      return res?.translations?.map((item) => [
        item.text,
        item.detected_source_language,
      ]);
    case OPT_TRANS_DEEPLFREE:
      return [
        [
          res?.result?.texts?.map((item) => item.text).join(" "),
          res?.result?.lang,
        ],
      ];
    case OPT_TRANS_DEEPLX:
      return [[res?.data, res?.source_lang]];
    case OPT_TRANS_BAIDU:
      if (res.type === 1) {
        return [
          [
            Object.keys(JSON.parse(res.result).content[0].mean[0].cont)[0],
            res.from,
          ],
        ];
      } else if (res.type === 2) {
        return [[res.data.map((item) => item.dst).join(" "), res.from]];
      }
      break;
    case OPT_TRANS_TENCENT:
      return res?.auto_translation?.map((text) => [text, res?.src_lang]);
    case OPT_TRANS_VOLCENGINE:
      return [[res?.translation, res?.detected_language]];
    case OPT_TRANS_EPHONEAI:
    case OPT_TRANS_OPENAI:
    case OPT_TRANS_GEMINI_2:
    case OPT_TRANS_OPENROUTER:
      modelMsg = res?.choices?.[0]?.message;
      if (history && userMsg && modelMsg) {
        history.add(userMsg, {
          role: modelMsg.role,
          content: modelMsg.content,
        });
      }
      return parseAIRes(
        modelMsg?.content,
        useBatchFetch,
        templateMeta.llmOutputFormat,
        templateMeta
      );
    case OPT_TRANS_GEMINI:
      modelMsg = res?.candidates?.[0]?.content;
      if (history && userMsg && modelMsg) {
        history.add(userMsg, modelMsg);
      }
      return parseAIRes(
        modelMsg?.parts?.[0]?.text ?? "",
        useBatchFetch,
        templateMeta.llmOutputFormat,
        templateMeta
      );
    case OPT_TRANS_CLAUDE:
      modelMsg = { role: res?.role, content: res?.content?.text };
      if (history && userMsg && modelMsg) {
        history.add(userMsg, {
          role: modelMsg.role,
          content: modelMsg.content,
        });
      }
      return parseAIRes(
        res?.content?.[0]?.text ?? "",
        useBatchFetch,
        templateMeta.llmOutputFormat,
        templateMeta
      );
    case OPT_TRANS_CLOUDFLAREAI:
      return [[res?.result?.translated_text]];
    case OPT_TRANS_OLLAMA:
      modelMsg = res?.choices?.[0]?.message;

      // const deepModels = thinkIgnore
      //   .split(",")
      //   .filter((model) => model?.trim());
      // if (deepModels.some((model) => res?.model?.startsWith(model))) {
      //   modelMsg?.content.replace(/<think>[\s\S]*<\/think>/i, "");
      // }

      if (history && userMsg && modelMsg) {
        history.add(userMsg, {
          role: modelMsg.role,
          content: modelMsg.content,
        });
      }
      return parseAIRes(
        modelMsg?.content,
        useBatchFetch,
        templateMeta.llmOutputFormat,
        templateMeta
      );
    case OPT_TRANS_CUSTOMIZE:
      if (useBatchFetch) {
        return (res?.translations ?? res)?.map((item) => [item.text, item.src]);
      }
      return [[res.text, res.src || res.from]];
    default:
  }

  throw new Error("parse translate result: apiType not matched", apiType);
};

/**
 * 发送翻译请求并解析
 * 支持流式和非流式两种模式
 * @param {*} texts 待翻译文本数组
 * @param {*} options 翻译选项
 * @yields {{id: number, result: [string, string]}} 流式模式下逐个返回结果
 * @returns {Promise<Array>} 非流式模式下返回完整结果数组
 */
export async function* handleTranslate(
  texts = [],
  { from, to, fromLang, toLang, langMap, glossary, apiSetting, usePool }
) {
  let history = null;
  let hisMsgs = [];
  const {
    apiType,
    apiSlug,
    contextSize,
    useContext,
    fetchInterval,
    fetchLimit,
    httpTimeout,
    useStream,
  } = apiSetting;
  if (useContext && API_SPE_TYPES.context.has(apiType)) {
    history = getMsgHistory(apiSlug, contextSize);
    hisMsgs = history.getAll();
  }

  const enableStream = useStream && API_SPE_TYPES.stream.has(apiType);

  let token = "";
  if (apiType === OPT_TRANS_MICROSOFT) {
    token = await msAuth();
    if (!token) {
      throw new Error("got msauth error");
    }
  }

  const [input, init, userMsg] = await genTransReq({
    texts,
    from,
    to,
    fromLang,
    toLang,
    langMap,
    glossary,
    hisMsgs,
    token,
    useStream: enableStream,
    ...apiSetting,
  });

  if (enableStream) {
    yield* handleTranslateStreamInternal(texts, input, init, {
      apiType,
      history,
      userMsg,
      usePool,
      fetchInterval,
      fetchLimit,
      httpTimeout,
      llmOutputFormat: apiSetting.llmOutputFormat,
      systemPrompt: apiSetting.systemPrompt,
      llmInputTemplate: apiSetting.llmInputTemplate,
      llmInputSegmentTemplate: apiSetting.llmInputSegmentTemplate,
      llmInputSegmentsSeparator: apiSetting.llmInputSegmentsSeparator,
      llmOutputTemplate: apiSetting.llmOutputTemplate,
      llmOutputSegmentTemplate: apiSetting.llmOutputSegmentTemplate,
      llmOutputSegmentsSeparator: apiSetting.llmOutputSegmentsSeparator,
      llmOutputMappingMode: apiSetting.llmOutputMappingMode,
    });
  } else {
    const response = await fetchData(input, init, {
      useCache: false,
      usePool,
      fetchInterval,
      fetchLimit,
      httpTimeout,
    });
    if (!response) {
      throw new Error("translate got empty response");
    }

    const result = await parseTransRes(response, {
      texts,
      from,
      to,
      fromLang,
      toLang,
      langMap,
      history,
      userMsg,
      ...apiSetting,
    });
    if (!result?.length) {
      throw new Error("translate got an unexpected result");
    }

    for (let i = 0; i < result.length; i++) {
      yield { id: i, result: result[i] };
    }
  }
}

/**
 * 内部流式翻译处理
 */
async function* handleTranslateStreamInternal(
  texts,
  input,
  init,
  {
    apiType,
    history,
    userMsg,
    usePool,
    fetchInterval,
    fetchLimit,
    httpTimeout,
    llmOutputFormat,
    systemPrompt,
    llmInputTemplate,
    llmInputSegmentTemplate,
    llmInputSegmentsSeparator,
    llmOutputTemplate,
    llmOutputSegmentTemplate,
    llmOutputSegmentsSeparator,
    llmOutputMappingMode,
  }
) {
  const results = new Array(texts.length).fill(null);
  let fullContent = "";
  const processedIds = new Set();
  const templateMeta = buildTemplateMeta({
    llmOutputFormat,
    systemPrompt,
    llmInputTemplate,
    llmInputSegmentTemplate,
    llmInputSegmentsSeparator,
    llmOutputTemplate,
    llmOutputSegmentTemplate,
    llmOutputSegmentsSeparator,
    llmOutputMappingMode,
  });

  const jsonParser = createStreamingJsonParser();
  let isJsonFormat = false;
  let formatDetected = false;

  const parseStreamSegments = () => {
    switch (templateMeta.llmOutputFormat) {
      case LLM_OUTPUT_FORMAT_XML:
        return parseStreamingXmlSegments(fullContent, processedIds);
      case LLM_OUTPUT_FORMAT_TEXTLINES:
        return parseStreamingTextLineSegments(fullContent, processedIds);
      case LLM_OUTPUT_FORMAT_PERCENT:
        return parseStreamingSegments(fullContent, processedIds);
      case LLM_OUTPUT_FORMAT_AUTO:
      default:
        return parseStreamingSegments(fullContent, processedIds);
    }
  };

  try {
    for await (const rawData of fetchStream(input, init, {
      useCache: false,
      usePool,
      fetchInterval,
      fetchLimit,
      httpTimeout,
    })) {
      try {
        const json = JSON.parse(rawData);
        const delta = getStreamDelta(json, apiType);

        if (delta) {
          fullContent += delta;
          fullContent = stripMarkdownCodeBlock(fullContent, true);

          if (!formatDetected) {
            const { isJson, detected } = detectStreamJsonFormat(
              templateMeta.llmOutputFormat,
              fullContent
            );
            if (detected) {
              formatDetected = true;
              isJsonFormat = isJson;
              // 格式检测成功后，将累积的内容写入解析器
              if (isJsonFormat) {
                for (const { id, translation } of jsonParser.write(
                  fullContent
                )) {
                  results[id] = translation;
                  yield { id, result: translation };
                }
              }
            }
          } else if (isJsonFormat) {
            for (const { id, translation } of jsonParser.write(delta)) {
              results[id] = translation;
              yield { id, result: translation };
            }
          } else {
            for (const { id, translation } of parseStreamSegments()) {
              results[id] = translation;
              yield { id, result: translation };
            }
          }
        }
      } catch (e) {
        // 忽略解析错误
      }
    }

    if (isJsonFormat) {
      jsonParser.end();
    }
  } catch (error) {
    kissLog("handleTranslateStream error", error);
    throw error;
  }

  // 最终再解析一次，捕获可能遗漏的段落
  const hasEmpty = results.some((r) => !r);
  if (hasEmpty) {
    const parsed = parseAIRes(
      fullContent,
      true,
      templateMeta.llmOutputFormat,
      templateMeta
    );
    for (let i = 0; i < texts.length && i < parsed.length; i++) {
      if (!results[i]) {
        results[i] = parsed[i];
        yield { id: i, result: results[i] };
      }
    }
  }

  if (history && userMsg) {
    if (apiType === OPT_TRANS_GEMINI) {
      history.add(userMsg, {
        role: "model",
        parts: [{ text: fullContent }],
      });
    } else {
      history.add(userMsg, {
        role: "assistant",
        content: fullContent,
      });
    }
  }
}

/**
 * Microsoft语言识别聚合及解析
 * @param {*} texts
 * @returns
 */
export const handleMicrosoftLangdetect = async (texts = []) => {
  const token = await msAuth();
  const input =
    "https://api-edge.cognitive.microsofttranslator.com/detect?api-version=3.0";
  const init = {
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    method: "POST",
    body: JSON.stringify(texts.map((text) => ({ Text: text }))),
  };

  const res = await fetchData(input, init, {
    useCache: false,
  });

  if (Array.isArray(res)) {
    return res.map((r) => r.language);
  }

  return [];
};

/**
 * 字幕翻译
 * @param {*} param0
 * @returns
 */
export const handleSubtitle = async ({ events, from, to, apiSetting }) => {
  const { apiType, fetchInterval, fetchLimit, httpTimeout } = apiSetting;

  const [input, init] = await genTransReq({
    ...apiSetting,
    events,
    from,
    to,
  });

  const res = await fetchData(input, init, {
    useCache: false,
    usePool: true,
    fetchInterval,
    fetchLimit,
    httpTimeout,
  });
  if (!res) {
    kissLog("subtitle got empty response");
    return [];
  }

  switch (apiType) {
    case OPT_TRANS_OPENAI:
    case OPT_TRANS_GEMINI_2:
    case OPT_TRANS_OPENROUTER:
    case OPT_TRANS_OLLAMA:
      return parseSTRes(res?.choices?.[0]?.message?.content ?? "");
    case OPT_TRANS_GEMINI:
      return parseSTRes(res?.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
    case OPT_TRANS_CLAUDE:
      return parseSTRes(res?.content?.[0]?.text ?? "");
    case OPT_TRANS_CUSTOMIZE:
      return res;
    default:
  }

  return [];
};
