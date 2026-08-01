import {
  OPT_LANGS_TO_SPEC,
  OPT_LANGS_SPEC_DEFAULT,
} from "../config";
import { genTransReq, parseTransRes } from "./trans";
import { fetchData } from "../libs/fetch";

/**
 * 测试专用翻译函数，捕获 raw 请求和原始响应。
 * 用于 Prompt 设置页面的测试功能，不修改现有生产代码。
 *
 * @param {Object} options
 * @param {Object} options.apiSetting - 已通过 resolveApiPromptSettings 解析的 API 配置
 * @param {string[]} options.texts - 测试文本数组
 * @param {string} options.fromLang - 源语言代码
 * @param {string} options.toLang - 目标语言代码
 * @param {Object} [options.docInfo] - 页面元数据
 * @param {Object} [options.glossary] - 术语表
 * @returns {Promise<{request: Object, rawResponse: string, parsedResult: Array, error: null}|{request: null, rawResponse: null, parsedResult: null, error: string}>}
 */
export async function testTranslate({
  apiSetting,
  texts,
  fromLang = "en",
  toLang = "zh-CN",
  docInfo = {},
  glossary = {},
}) {
  try {
    const { apiType, httpTimeout } = apiSetting;

    // 1. 获取语言映射
    const langMap = OPT_LANGS_TO_SPEC[apiType] || OPT_LANGS_SPEC_DEFAULT;
    const from = langMap.get(fromLang);
    const to = langMap.get(toLang);

    if (!to) {
      throw new Error(`The target lang: ${toLang} not support`);
    }

    // 2. 构建 HTTP 请求
    const [url, init, userMsg] = await genTransReq({
      ...apiSetting,
      texts,
      from,
      to,
      fromLang,
      toLang,
      langMap,
      glossary,
      hisMsgs: [],
      token: "",
      useStream: false,
      docInfo,
    });

    // 3. 构建请求详情对象（body 从 JSON string 解析回对象以便展示）
    let body = null;
    if (init.body) {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }

    const request = {
      url,
      method: init.method || "POST",
      headers: init.headers || {},
      body,
    };

    // 4. 发送请求获取原始响应
    const rawResponse = await fetchData(url, init, {
      useCache: false,
      usePool: false,
      httpTimeout
    });

    // 5. 解析翻译结果
    const parsedResult = await parseTransRes(rawResponse, {
      texts,
      from,
      to,
      fromLang,
      toLang,
      langMap,
      history: null,
      userMsg,
      ...apiSetting,
    });

    return { request, rawResponse, parsedResult, error: null };
  } catch (err) {
    let errorMsg = err.message;
    try {
      errorMsg = JSON.stringify(JSON.parse(err.message), null, 2);
    } catch {
      // 保持原始错误信息
    }
    return { request: null, rawResponse: null, parsedResult: null, error: errorMsg };
  }
}
