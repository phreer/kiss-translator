const FONT_STACK_BY_LANG = {
  "zh-CN": [
    '"PingFang SC"',
    '"Hiragino Sans GB"',
    '"Microsoft YaHei"',
    '"Noto Sans CJK SC"',
    '"Source Han Sans SC"',
    '"WenQuanYi Micro Hei"',
    "sans-serif",
  ].join(", "),
  "zh-TW": [
    '"PingFang TC"',
    '"Heiti TC"',
    '"Microsoft JhengHei"',
    '"Noto Sans CJK TC"',
    '"Source Han Sans TC"',
    "sans-serif",
  ].join(", "),
  ja: [
    '"Hiragino Sans"',
    '"Yu Gothic"',
    '"Meiryo"',
    '"Noto Sans CJK JP"',
    '"Source Han Sans JP"',
    "sans-serif",
  ].join(", "),
  ko: [
    '"Apple SD Gothic Neo"',
    '"Malgun Gothic"',
    '"Noto Sans CJK KR"',
    '"Source Han Sans KR"',
    "sans-serif",
  ].join(", "),
};

export const normalizeLocaleLang = (lang = "") => {
  const normalized = String(lang).trim().toLowerCase();

  if (!normalized) return "";
  if (
    normalized === "zh" ||
    normalized === "zh-cn" ||
    normalized === "zh-hans"
  ) {
    return "zh-CN";
  }
  if (
    normalized === "zh-tw" ||
    normalized === "zh-hk" ||
    normalized === "zh-mo" ||
    normalized === "zh-hant"
  ) {
    return "zh-TW";
  }
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("ko")) return "ko";

  return lang;
};

export const applyLocaleTypography = (element, lang = "") => {
  if (!element) return;

  const normalizedLang = normalizeLocaleLang(lang);
  if (normalizedLang) {
    element.setAttribute("lang", normalizedLang);
  }

  const fontFamily = FONT_STACK_BY_LANG[normalizedLang];
  if (fontFamily) {
    element.style.fontFamily = fontFamily;
  }
};

export const getLocaleFontFamily = (lang = "") => {
  const normalizedLang = normalizeLocaleLang(lang);
  return FONT_STACK_BY_LANG[normalizedLang] || "";
};
