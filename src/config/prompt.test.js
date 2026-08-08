import {
  DEFAULT_BATCH_PROMPT_SLUG,
  DEFAULT_DICTIONARY_PROMPT_SLUG,
  DEFAULT_NOBATCH_PROMPT_SLUG,
  DEFAULT_SUBTITLE_PROMPT_SLUG,
  PRESET_PROMPTS,
  PROMPT_CATEGORY_BATCH_SYSTEM,
  PROMPT_CATEGORY_DICTIONARY,
  PROMPT_CATEGORY_USER,
  PROMPT_MODE_FOLLOW_API,
  PROMPT_MODE_GLOBAL,
  PROMPT_TEMPLATE_CATEGORIES,
  SETTINGS_VERSION_V2,
  SETTINGS_VERSION_V3,
  applyPromptTestOverrides,
  detectLegacyBatchOutputFormat,
  getDictionaryPromptOptions,
  getLegacyBatchPromptMetadata,
  getPromptDisplayName,
  migrateSettingPromptsToV2,
  migrateSettingPromptsToV3,
  normalizeCustomPrompts,
  normalizePrompt,
  removeLegacyApiPromptIds,
  removePromptReferences,
  resolveApiPromptSettings,
} from "./prompt";
import {
  API_SPE_TYPES,
  DEFAULT_API_LIST,
  defaultNobatchPrompt,
  defaultNobatchUserPrompt,
  defaultDictPrompt,
  defaultDictUserPrompt,
  defaultSubtitlePrompt,
  defaultSystemPrompt,
} from "./api";

describe("prompt settings", () => {
  test("migrates v1 inline api prompts into v2 custom prompt references", () => {
    const setting = {
      prompts: [],
      transApis: [
        {
          apiSlug: "openai",
          apiName: "OpenAI",
          systemPrompt: "custom batch system prompt",
          nobatchPrompt: "custom nobatch system prompt",
          nobatchUserPrompt: "custom nobatch user prompt",
          subtitlePrompt: "custom subtitle prompt",
          dictPrompt: "custom dictionary system prompt",
          dictUserPrompt: "custom dictionary user prompt",
        },
      ],
    };

    const migrated = migrateSettingPromptsToV2(setting);
    const api = migrated.transApis[0];

    expect(migrated.version).toBe(SETTINGS_VERSION_V2);
    expect(api.batchPromptSlug).toMatch(/^prompt_migrated_batch_/);
    expect(api.nobatchPromptSlug).toMatch(/^prompt_migrated_nobatch_/);
    expect(api.subtitlePromptSlug).toMatch(/^prompt_migrated_subtitle_/);
    expect(api.dictPromptSlug).toMatch(/^prompt_migrated_dict_/);
    expect(migrated.prompts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: api.batchPromptSlug,
          systemPrompt: "custom batch system prompt",
          userPrompt: "",
        }),
        expect.objectContaining({
          slug: api.nobatchPromptSlug,
          systemPrompt: "custom nobatch system prompt",
          userPrompt: "custom nobatch user prompt",
        }),
        expect.objectContaining({
          slug: api.subtitlePromptSlug,
          systemPrompt: "custom subtitle prompt",
          userPrompt: "",
        }),
        expect.objectContaining({
          slug: api.dictPromptSlug,
          systemPrompt: "custom dictionary system prompt",
          userPrompt: "custom dictionary user prompt",
        }),
      ])
    );
    expect(migrated.prompts).toHaveLength(4);

    const migratedAgain = migrateSettingPromptsToV2(setting);
    expect(migratedAgain.transApis[0].batchPromptSlug).toBe(
      api.batchPromptSlug
    );
    expect(migratedAgain.transApis[0].nobatchPromptSlug).toBe(
      api.nobatchPromptSlug
    );
    expect(migratedAgain.transApis[0].subtitlePromptSlug).toBe(
      api.subtitlePromptSlug
    );
    expect(migratedAgain.transApis[0].dictPromptSlug).toBe(api.dictPromptSlug);
  });

  test("links legacy inline default prompts to presets without creating custom prompts", () => {
    const migrated = migrateSettingPromptsToV2({
      prompts: [],
      transApis: [
        {
          apiSlug: "openai",
          systemPrompt: defaultSystemPrompt,
          nobatchPrompt: defaultNobatchPrompt,
          nobatchUserPrompt: defaultNobatchUserPrompt,
          subtitlePrompt: defaultSubtitlePrompt,
          dictPrompt: defaultDictPrompt,
          dictUserPrompt: defaultDictUserPrompt,
        },
      ],
    });

    expect(migrated.transApis[0]).toMatchObject({
      batchPromptSlug: DEFAULT_BATCH_PROMPT_SLUG,
      nobatchPromptSlug: DEFAULT_NOBATCH_PROMPT_SLUG,
      subtitlePromptSlug: DEFAULT_SUBTITLE_PROMPT_SLUG,
      dictPromptSlug: DEFAULT_DICTIONARY_PROMPT_SLUG,
    });
    expect(migrated.prompts).toEqual([]);
  });

  test("resolves default ai api prompt slugs without storing prompt text", () => {
    const api = DEFAULT_API_LIST.find((item) =>
      API_SPE_TYPES.ai.has(item.apiType)
    );

    expect(api.systemPrompt).toBe("");
    expect(api.nobatchPrompt).toBe("");
    expect(api.nobatchUserPrompt).toBe("");
    expect(api.subtitlePrompt).toBe("");
    expect(api.dictPrompt).toBe("");
    expect(api.dictUserPrompt).toBe("");

    expect(resolveApiPromptSettings(api)).toMatchObject({
      batchPromptSlug: DEFAULT_BATCH_PROMPT_SLUG,
      nobatchPromptSlug: DEFAULT_NOBATCH_PROMPT_SLUG,
      subtitlePromptSlug: DEFAULT_SUBTITLE_PROMPT_SLUG,
      dictPromptSlug: DEFAULT_DICTIONARY_PROMPT_SLUG,
      systemPrompt: defaultSystemPrompt,
      nobatchPrompt: defaultNobatchPrompt,
      nobatchUserPrompt: defaultNobatchUserPrompt,
      subtitlePrompt: defaultSubtitlePrompt,
      dictPrompt: defaultDictPrompt,
      dictUserPrompt: defaultDictUserPrompt,
    });
  });

  test("cleans api and subtitle references when a custom prompt is deleted", () => {
    const setting = {
      transApis: [
        {
          apiSlug: "openai",
          batchPromptSlug: "prompt_deleted",
          nobatchPromptSlug: "prompt_deleted",
          subtitlePromptSlug: "prompt_deleted",
          dictPromptSlug: "prompt_deleted",
          systemPrompt: "deleted batch prompt",
          nobatchPrompt: "deleted nobatch system prompt",
          nobatchUserPrompt: "deleted nobatch user prompt",
          subtitlePrompt: "deleted subtitle prompt",
          dictPrompt: "deleted dictionary prompt",
          dictUserPrompt: "deleted dictionary user prompt",
        },
      ],
      tranboxSetting: {
        aiDictPromptSlug: "prompt_deleted",
      },
      subtitleSetting: {
        segPromptMode: PROMPT_MODE_GLOBAL,
        segPromptSlug: "prompt_deleted",
      },
    };

    const cleaned = removePromptReferences(setting, "prompt_deleted");

    expect(cleaned.transApis[0]).toMatchObject({
      batchPromptSlug: DEFAULT_BATCH_PROMPT_SLUG,
      nobatchPromptSlug: DEFAULT_NOBATCH_PROMPT_SLUG,
      subtitlePromptSlug: DEFAULT_SUBTITLE_PROMPT_SLUG,
      dictPromptSlug: DEFAULT_DICTIONARY_PROMPT_SLUG,
    });
    expect(cleaned.transApis[0]).not.toHaveProperty("systemPrompt");
    expect(cleaned.transApis[0]).not.toHaveProperty("nobatchPrompt");
    expect(cleaned.transApis[0]).not.toHaveProperty("nobatchUserPrompt");
    expect(cleaned.transApis[0]).not.toHaveProperty("subtitlePrompt");
    expect(cleaned.transApis[0]).not.toHaveProperty("dictPrompt");
    expect(cleaned.transApis[0]).not.toHaveProperty("dictUserPrompt");
    expect(cleaned.tranboxSetting).toMatchObject({
      aiDictPromptSlug: PROMPT_MODE_FOLLOW_API,
    });
    expect(cleaned.subtitleSetting).toMatchObject({
      segPromptMode: PROMPT_MODE_FOLLOW_API,
      segPromptSlug: DEFAULT_SUBTITLE_PROMPT_SLUG,
    });

    expect(resolveApiPromptSettings(cleaned.transApis[0])).toMatchObject({
      systemPrompt: defaultSystemPrompt,
      nobatchPrompt: defaultNobatchPrompt,
      nobatchUserPrompt: defaultNobatchUserPrompt,
      subtitlePrompt: defaultSubtitlePrompt,
      dictPrompt: defaultDictPrompt,
      dictUserPrompt: defaultDictUserPrompt,
    });
  });

  test("does not read prompt id fields as prompt references", () => {
    expect(normalizePrompt({ id: "prompt_old_id" }).slug).toBe("");

    const cleaned = removePromptReferences(
      {
        transApis: [
          {
            apiSlug: "openai",
            batchPromptId: "prompt_deleted",
            nobatchPromptId: "prompt_deleted",
            subtitlePromptId: "prompt_deleted",
            dictPromptId: "prompt_deleted",
          },
        ],
        subtitleSetting: {
          segPromptMode: PROMPT_MODE_GLOBAL,
          segPromptId: "prompt_deleted",
        },
      },
      "prompt_deleted"
    );

    expect(cleaned).toEqual({
      transApis: [
        {
          apiSlug: "openai",
          batchPromptId: "prompt_deleted",
          nobatchPromptId: "prompt_deleted",
          subtitlePromptId: "prompt_deleted",
          dictPromptId: "prompt_deleted",
        },
      ],
      subtitleSetting: {
        segPromptMode: PROMPT_MODE_GLOBAL,
        segPromptId: "prompt_deleted",
      },
    });
  });

  test("removes legacy api prompt ids before saving api settings", () => {
    const cleaned = removeLegacyApiPromptIds({
      apiSlug: "openai",
      batchPromptSlug: "prompt_current_batch",
      batchPromptId: "prompt_deleted_batch",
      nobatchPromptSlug: "prompt_current_nobatch",
      nobatchPromptId: "prompt_deleted_nobatch",
      subtitlePromptSlug: "prompt_current_subtitle",
      subtitlePromptId: "prompt_deleted_subtitle",
      dictPromptSlug: "prompt_current_dict",
      dictPromptId: "prompt_deleted_dict",
    });

    expect(cleaned).toMatchObject({
      apiSlug: "openai",
      batchPromptSlug: "prompt_current_batch",
      nobatchPromptSlug: "prompt_current_nobatch",
      subtitlePromptSlug: "prompt_current_subtitle",
      dictPromptSlug: "prompt_current_dict",
    });
    expect(cleaned).not.toHaveProperty("batchPromptId");
    expect(cleaned).not.toHaveProperty("nobatchPromptId");
    expect(cleaned).not.toHaveProperty("subtitlePromptId");
    expect(cleaned).not.toHaveProperty("dictPromptId");
  });

  test("keeps preset nameKey for i18n display but removes it from custom storage", () => {
    const preset = PRESET_PROMPTS[0];
    const i18n = jest.fn((key, fallback) => `${key}:${fallback}`);
    const normalized = normalizeCustomPrompts([
      {
        slug: "prompt_custom",
        category: "user prompt",
        nameKey: "custom_key",
        name: "Custom prompt",
        systemPrompt: "system",
        userPrompt: "user",
      },
    ]);

    expect(getPromptDisplayName(preset, i18n)).toBe(
      `${preset.nameKey}:${preset.name}`
    );
    expect(normalized[0]).toEqual({
      slug: "prompt_custom",
      category: "user prompt",
      name: "Custom prompt",
      systemPrompt: "system",
      userPrompt: "user",
      inputFormat: "",
      outputFormat: "",
    });
  });

  test("exposes dictionary prompt templates", () => {
    expect(PROMPT_TEMPLATE_CATEGORIES).toContain(PROMPT_CATEGORY_DICTIONARY);
    expect(PRESET_PROMPTS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: DEFAULT_DICTIONARY_PROMPT_SLUG,
          category: PROMPT_CATEGORY_DICTIONARY,
          systemPrompt: defaultDictPrompt,
          userPrompt: defaultDictUserPrompt,
        }),
      ])
    );
    expect(getDictionaryPromptOptions(PRESET_PROMPTS)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: DEFAULT_DICTIONARY_PROMPT_SLUG }),
      ])
    );
  });

  test("preset batch prompts bind fixed input/output formats", () => {
    const batchPresets = PRESET_PROMPTS.filter(
      (prompt) => prompt.category === "batch system prompt"
    );
    expect(batchPresets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: "batch-translation-json",
          inputFormat: "json",
          outputFormat: "json",
        }),
        expect.objectContaining({
          slug: "batch-translation-xml",
          inputFormat: "json",
          outputFormat: "xml",
        }),
        expect.objectContaining({
          slug: "batch-translation-line",
          inputFormat: "json",
          outputFormat: "textlines",
        }),
      ])
    );
  });

  test("normalizePrompt carries input/output format fields", () => {
    expect(
      normalizePrompt({
        slug: "prompt_custom",
        inputFormat: "percent",
        outputFormat: "xml",
      })
    ).toMatchObject({
      slug: "prompt_custom",
      inputFormat: "percent",
      outputFormat: "xml",
    });
    expect(normalizePrompt({}).inputFormat).toBe("");
  });

  test("detectLegacyBatchOutputFormat identifies legacy xml/textlines/json prompts", () => {
    expect(detectLegacyBatchOutputFormat(defaultSystemPrompt)).toBe("");
    expect(
      detectLegacyBatchOutputFormat(
        "Act as a translation API. Output raw XML-like format only. No Markdown fences (xml)."
      )
    ).toBe("xml");
    expect(
      detectLegacyBatchOutputFormat(
        'Act as a translation API. Output raw text lines in "ID | Text" format. No Markdown.'
      )
    ).toBe("textlines");
    expect(
      detectLegacyBatchOutputFormat(
        "Act as a translation API. Output a single raw JSON object only."
      )
    ).toBe("json");
  });

  test("normalizePrompt infers formats for legacy batch prompts without format fields", () => {
    expect(
      normalizePrompt({
        slug: "prompt_custom",
        category: PROMPT_CATEGORY_BATCH_SYSTEM,
        systemPrompt:
          "Act as a translation API. Output raw XML-like format only. No Markdown.",
      })
    ).toMatchObject({
      inputFormat: "json",
      outputFormat: "xml",
    });
    expect(
      normalizePrompt({
        slug: "prompt_custom",
        category: PROMPT_CATEGORY_BATCH_SYSTEM,
        systemPrompt:
          'Act as a translation API. Output raw text lines in "ID | Text" format.',
      })
    ).toMatchObject({
      inputFormat: "json",
      outputFormat: "textlines",
    });
    // 保留用户显式设置的格式，不因内容探测覆盖。
    expect(
      normalizePrompt({
        slug: "prompt_custom",
        category: PROMPT_CATEGORY_BATCH_SYSTEM,
        systemPrompt: "Output raw XML-like format only",
        inputFormat: "percent",
        outputFormat: "json",
      })
    ).toMatchObject({
      inputFormat: "percent",
      outputFormat: "json",
    });
    // 非批量分类不参与格式推断。
    expect(
      normalizePrompt({
        slug: "prompt_custom",
        category: PROMPT_CATEGORY_USER,
        systemPrompt: "Output raw XML-like format only",
      })
    ).toMatchObject({ inputFormat: "", outputFormat: "" });
  });

  test("getLegacyBatchPromptMetadata reports detected format and mismatch", () => {
    expect(
      getLegacyBatchPromptMetadata({
        slug: "legacy_xml",
        category: PROMPT_CATEGORY_BATCH_SYSTEM,
        systemPrompt:
          "Act as a translation API. Output raw XML-like format only.",
      })
    ).toEqual({ outputFormat: "xml", mismatched: false });
    expect(
      getLegacyBatchPromptMetadata({
        slug: "legacy_line",
        category: PROMPT_CATEGORY_BATCH_SYSTEM,
        systemPrompt:
          'Act as a translation API. Output raw text lines in "ID | Text" format.',
        outputFormat: "textlines",
      })
    ).toEqual({ outputFormat: "textlines", mismatched: false });
    // 内容识别为 XML，但存储格式为 JSON：标记不一致。
    expect(
      getLegacyBatchPromptMetadata({
        slug: "conflicted",
        category: PROMPT_CATEGORY_BATCH_SYSTEM,
        systemPrompt:
          "Act as a translation API. Output raw XML-like format only.",
        outputFormat: "json",
      })
    ).toEqual({ outputFormat: "xml", mismatched: true });
    // 非批量或无签名的提示词不标记。
    expect(
      getLegacyBatchPromptMetadata({
        slug: "nobatch",
        category: PROMPT_CATEGORY_USER,
        systemPrompt: "Output raw XML-like format only.",
      })
    ).toBeNull();
    expect(
      getLegacyBatchPromptMetadata({
        slug: "modern",
        category: PROMPT_CATEGORY_BATCH_SYSTEM,
        systemPrompt: defaultSystemPrompt,
      })
    ).toBeNull();
  });

  test("migrates legacy inline xml/line batch prompts with detected formats", () => {
    const migrated = migrateSettingPromptsToV2({
      prompts: [],
      transApis: [
        {
          apiSlug: "openai",
          systemPrompt:
            'Act as a translation API. Output raw text lines in "ID | Text" format. No Markdown.',
        },
      ],
    });

    const api = migrated.transApis[0];
    expect(api.batchPromptSlug).toMatch(/^prompt_migrated_batch_/);
    expect(
      migrated.prompts.find((prompt) => prompt.slug === api.batchPromptSlug)
    ).toMatchObject({
      category: PROMPT_CATEGORY_BATCH_SYSTEM,
      inputFormat: "json",
      outputFormat: "textlines",
    });
  });

  test("migrateSettingPromptsToV3 fills formats for legacy prompts and is idempotent", () => {
    const legacyPrompt = {
      slug: "legacy_xml",
      category: PROMPT_CATEGORY_BATCH_SYSTEM,
      name: "Legacy XML",
      systemPrompt:
        "Act as a translation API. Output raw XML-like format only. No nested.",
    };
    const migrated = migrateSettingPromptsToV3({
      version: SETTINGS_VERSION_V2,
      prompts: [legacyPrompt],
    });

    expect(migrated.version).toBe(SETTINGS_VERSION_V3);
    expect(migrated.prompts[0]).toMatchObject({
      slug: "legacy_xml",
      inputFormat: "json",
      outputFormat: "xml",
    });

    // 幂等：再次迁移不改变已补全的数据。
    const migratedAgain = migrateSettingPromptsToV3(migrated);
    expect(migratedAgain.prompts[0]).toEqual(migrated.prompts[0]);
  });

  test("migrateSettingPromptsToV3 keeps explicitly set formats untouched", () => {
    const migrated = migrateSettingPromptsToV3({
      version: SETTINGS_VERSION_V2,
      prompts: [
        {
          slug: "modern",
          category: PROMPT_CATEGORY_BATCH_SYSTEM,
          systemPrompt:
            "Act as a translation API. Output raw XML-like format only.",
          inputFormat: "percent",
          outputFormat: "xml",
        },
      ],
    });
    expect(migrated.prompts[0]).toMatchObject({
      inputFormat: "percent",
      outputFormat: "xml",
    });
  });

  test("resolveApiPromptSettings inlines the batch prompt format into the api setting", () => {
    const api = {
      apiSlug: "openai",
      batchPromptSlug: "batch-translation-xml",
    };
    expect(resolveApiPromptSettings(api)).toMatchObject({
      batchPromptSlug: "batch-translation-xml",
      systemPrompt: defaultSystemPrompt,
      ioInputFormat: "json",
      ioOutputFormat: "xml",
    });
  });

  test("resolveApiPromptSettings falls back to json format for prompts without format", () => {
    const customPrompt = {
      slug: "prompt_custom",
      category: "batch system prompt",
      name: "Custom batch",
      systemPrompt: "Translate it.",
    };
    const api = resolveApiPromptSettings(
      { apiSlug: "openai", batchPromptSlug: "prompt_custom" },
      [customPrompt]
    );
    expect(api).toMatchObject({
      batchPromptSlug: "prompt_custom",
      systemPrompt: "Translate it.",
      ioInputFormat: "json",
      ioOutputFormat: "json",
    });
  });

  test("normalizeCustomPrompts keeps custom prompt formats", () => {
    const normalized = normalizeCustomPrompts([
      {
        slug: "prompt_custom",
        category: "batch system prompt",
        name: "Custom batch",
        systemPrompt: "Translate it.",
        userPrompt: "",
        inputFormat: "percent",
        outputFormat: "xml",
      },
    ]);
    expect(normalized[0]).toMatchObject({
      inputFormat: "percent",
      outputFormat: "xml",
    });
  });
});

describe("applyPromptTestOverrides", () => {
  test("batch prompt forces batch mode and inlines its format", () => {
    const prompt = {
      category: PROMPT_CATEGORY_BATCH_SYSTEM,
      systemPrompt: "Custom batch rules.",
      inputFormat: "percent",
      outputFormat: "xml",
    };
    expect(applyPromptTestOverrides({ useBatchFetch: false }, prompt)).toEqual({
      useBatchFetch: true,
      systemPrompt: "Custom batch rules.",
      ioInputFormat: "percent",
      ioOutputFormat: "xml",
    });
  });

  test("batch prompt falls back to json/json for empty formats", () => {
    const prompt = {
      category: PROMPT_CATEGORY_BATCH_SYSTEM,
      systemPrompt: "Rules.",
      inputFormat: "",
      outputFormat: "",
    };
    expect(applyPromptTestOverrides({}, prompt)).toEqual({
      useBatchFetch: true,
      systemPrompt: "Rules.",
      ioInputFormat: "json",
      ioOutputFormat: "json",
    });
  });

  test("user prompt forces non-batch mode and overrides nobatch fields", () => {
    const prompt = {
      category: PROMPT_CATEGORY_USER,
      systemPrompt: "Custom nobatch.",
      userPrompt: "Custom user.",
    };
    expect(applyPromptTestOverrides({ useBatchFetch: true }, prompt)).toEqual({
      useBatchFetch: false,
      nobatchPrompt: "Custom nobatch.",
      nobatchUserPrompt: "Custom user.",
    });
  });

  test("other categories pass through unchanged without mutating the input", () => {
    const api = { useBatchFetch: true, apiSlug: "openai" };
    const prompt = {
      category: PROMPT_CATEGORY_DICTIONARY,
      systemPrompt: "Dict.",
    };
    const result = applyPromptTestOverrides(api, prompt);
    expect(result).toEqual(api);
    expect(result).not.toBe(api);
  });
});
