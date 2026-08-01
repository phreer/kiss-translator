import { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LoadingButton from "@mui/lab/LoadingButton";
import Alert from "@mui/material/Alert";
import { useI18n } from "../../hooks/I18n";
import { resolveApiPromptSettings } from "../../config/prompt";
import { OPT_LANGS_LIST } from "../../config/api";
import { testTranslate } from "../../apis/testTranslate";
import { getTestCasesByCategory, getTestTexts } from "../../config/promptTestCases";

const MONO_FONT =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

function TabPanel({ children, value, index, ...props }) {
  if (value !== index) return null;
  return (
    <Box
      role="tabpanel"
      sx={{
        mt: 1,
        maxHeight: 400,
        overflow: "auto",
        bgcolor: "action.hover",
        borderRadius: 1,
        p: 1.5,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

export default function PromptTestDialog({
  open,
  onClose,
  prompt,
  apis,
  prompts,
  subtitleSetting,
}) {
  const i18n = useI18n();
  const testCases = useMemo(
    () => (prompt ? getTestCasesByCategory(prompt.category) : []),
    [prompt]
  );

  const [testCaseId, setTestCaseId] = useState("");
  const [apiSlug, setApiSlug] = useState("");
  const [fromLang, setFromLang] = useState("en");
  const [toLang, setToLang] = useState("zh-CN");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // 初始化默认值
  useEffect(() => {
    if (open) {
      setTestCaseId(testCases[0]?.id || "");
      setApiSlug(apis[0]?.apiSlug || "");
      setFromLang("en");
      setToLang("zh-CN");
      setResult(null);
      setActiveTab(0);
    }
  }, [open, testCases, apis]);

  const selectedApi = useMemo(
    () => apis.find((a) => a.apiSlug === apiSlug),
    [apis, apiSlug]
  );

  const selectedTestCase = useMemo(
    () => testCases.find((c) => c.id === testCaseId),
    [testCases, testCaseId]
  );

  const handleTest = async () => {
    if (!prompt || !selectedApi) return;

    setLoading(true);
    setResult(null);
    try {
      const testCase = testCases.find((c) => c.id === testCaseId);
      if (!testCase) {
        throw new Error("No test case selected");
      }

      // 解析 prompt 到 API 配置
      const resolvedApi = resolveApiPromptSettings(
        { ...selectedApi },
        prompts,
        subtitleSetting
      );

      // 根据 prompt category 覆盖对应的 prompt 字段
      if (prompt.category === "batch system prompt") {
        resolvedApi.systemPrompt = prompt.systemPrompt;
      } else if (prompt.category === "user prompt") {
        resolvedApi.nobatchPrompt = prompt.systemPrompt;
        resolvedApi.nobatchUserPrompt = prompt.userPrompt;
      }

      const testResult = await testTranslate({
        apiSetting: resolvedApi,
        texts: getTestTexts(testCase),
        fromLang,
        toLang,
        docInfo: {},
        glossary: {},
      });

      setResult(testResult);
      // 有结果后切换到翻译结果 tab
      if (!testResult.error) {
        setActiveTab(0);
      }
    } catch (err) {
      setResult({ request: null, rawResponse: null, parsedResult: null, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!prompt) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{i18n("prompt_test")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {!apis || apis.length === 0 ? (
            <Alert severity="warning">{i18n("prompt_test_no_api")}</Alert>
          ) : (
            <>
              {/* 测试用例选择 */}
              <TextField
                size="small"
                select
                label={i18n("prompt_test_case")}
                value={testCaseId}
                onChange={(e) => setTestCaseId(e.target.value)}
              >
                {testCases.map((tc) => (
                  <MenuItem key={tc.id} value={tc.id}>
                    {i18n(tc.nameKey)}
                  </MenuItem>
                ))}
              </TextField>

              {/* API 选择 */}
              <TextField
                size="small"
                select
                label={i18n("prompt_test_select_api")}
                value={apiSlug}
                onChange={(e) => setApiSlug(e.target.value)}
              >
                {apis.map((api) => (
                  <MenuItem key={api.apiSlug} value={api.apiSlug}>
                    {api.apiName}
                  </MenuItem>
                ))}
              </TextField>

              {/* 语言选择 */}
              <Stack direction="row" spacing={2}>
                <TextField
                  size="small"
                  select
                  label={i18n("prompt_test_from", "源语言")}
                  value={fromLang}
                  onChange={(e) => setFromLang(e.target.value)}
                  sx={{ minWidth: 180 }}
                >
                  {OPT_LANGS_LIST.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {lang}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  size="small"
                  select
                  label={i18n("prompt_test_to", "目标语言")}
                  value={toLang}
                  onChange={(e) => setToLang(e.target.value)}
                  sx={{ minWidth: 180 }}
                >
                  {OPT_LANGS_LIST.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {lang}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              {/* 测试按钮 */}
              <LoadingButton
                variant="contained"
                onClick={handleTest}
                loading={loading}
                disabled={!testCaseId || !apiSlug}
              >
                {loading ? i18n("prompt_test_running") : i18n("prompt_test_run")}
              </LoadingButton>

              {/* 错误展示 */}
              {result?.error && (
                <Alert severity="error">
                  <div>{i18n("test_failed")}</div>
                  <pre
                    style={{
                      margin: "8px 0 0",
                      fontFamily: MONO_FONT,
                      fontSize: "0.8rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {result.error}
                  </pre>
                </Alert>
              )}

              {/* 结果展示 */}
              {result && !result.error && (
                <Box>
                  <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{ borderBottom: 1, borderColor: "divider" }}
                  >
                    <Tab label={i18n("prompt_test_result")} />
                    <Tab label={i18n("prompt_test_request")} />
                    <Tab label={i18n("prompt_test_response")} />
                  </Tabs>

                  {/* 翻译结果 */}
                  <TabPanel value={activeTab} index={0}>
                    <Stack spacing={1.5}>
                      {/* 原文 */}
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: "bold", display: "block", mb: 0.5 }}>
                          {i18n("prompt_test_case")}:
                        </Typography>
                        {selectedTestCase?.items?.map((item, i) => (
                          <Box key={i} sx={{ mb: 0.5, pl: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              [{i}]
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontFamily: MONO_FONT, fontSize: "0.85rem" }}
                            >
                              {item.text}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      {/* LLM 翻译结果 + 参考翻译 逐条对照 */}
                      <Box>
                        <Chip
                          label={i18n("prompt_test_result")}
                          size="small"
                          color="primary"
                          variant="filled"
                          sx={{ mb: 0.5 }}
                        />
                        {result.parsedResult?.map((item, i) => {
                          const llmText = Array.isArray(item) ? item[0] : String(item);
                          const refText = selectedTestCase?.items?.[i]?.translation;
                          return (
                            <Box
                              key={i}
                              sx={{
                                mb: 1,
                                pl: 1,
                                borderLeft: 2,
                                borderColor: "primary.main",
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                [{i}]
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontFamily: MONO_FONT, fontSize: "0.85rem" }}
                              >
                                {llmText}
                              </Typography>
                              {refText && (
                                <Box
                                  sx={{
                                    mt: 0.25,
                                    pl: 1,
                                    borderLeft: 2,
                                    borderColor: "success.main",
                                    bgcolor: "action.hover",
                                    borderRadius: 0.5,
                                    py: 0.25,
                                    px: 0.5,
                                  }}
                                >
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold" }}>
                                    {i18n("prompt_test_reference", "参考")}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontFamily: MONO_FONT,
                                      fontSize: "0.85rem",
                                      color: "text.secondary",
                                    }}
                                  >
                                    {refText}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </Stack>
                  </TabPanel>

                  {/* 请求详情 */}
                  <TabPanel value={activeTab} index={1}>
                    <pre
                      style={{
                        margin: 0,
                        fontFamily: MONO_FONT,
                        fontSize: "0.8rem",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {JSON.stringify(result.request, null, 2)}
                    </pre>
                  </TabPanel>

                  {/* 原始响应 */}
                  <TabPanel value={activeTab} index={2}>
                    <pre
                      style={{
                        margin: 0,
                        fontFamily: MONO_FONT,
                        fontSize: "0.8rem",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {typeof result.rawResponse === "string"
                        ? result.rawResponse
                        : JSON.stringify(result.rawResponse, null, 2)}
                    </pre>
                  </TabPanel>
                </Box>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{i18n("close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
