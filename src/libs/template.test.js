import {
  applyPlaceholders,
  compileTemplate,
  render,
  renderTemplate,
} from "./template";

const LITERARY_SEGMENTS = [
  {
    id: 0,
    source_text:
      "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.",
  },
  {
    id: 1,
    source_text:
      "Shall I compare thee to a summer's day? Thou art more lovely and more temperate: Rough winds do shake the darling buds of May, And summer's lease hath all too short a date.",
  },
  {
    id: 2,
    source_text:
      "站在船头，放眼望去，只见江面浩渺，雾气氤氲。远处的山峦若隐若现，宛如一幅泼墨山水画卷。他不禁轻声吟道：'孤帆远影碧空尽，唯见长江天际流。'",
  },
  {
    id: 3,
    source_text:
      "La vita è una corsa di cavalli, non un cammino di passeggiata. Ogni giorno è una nuova battaglia, ogni momento è una nuova sfida. La vittoria appartiene a chi crede in sé stesso.",
  },
  {
    id: 4,
    source_text:
      "Die Luft war kühl und das Licht war weich, wie der Schimmer einer alten Erinnerung. Sie stand am Fenster und betrachtete den Regen, der leise gegen die Scheiben patschte, ein Rhythmus, der an ferne Trommeln erinnerte.",
  },
];

const MEDICAL_SEGMENTS = [
  {
    id: 0,
    source_text:
      "The patient presents with acute myocardial infarction characterized by ST-segment elevation in leads II, III, and aVF, indicating inferior wall involvement. Troponin I levels are significantly elevated at 15.2 ng/mL (normal < 0.04 ng/mL).",
  },
  {
    id: 1,
    source_text:
      "Metformin hydrochloride is a first-line pharmacotherapy for type 2 diabetes mellitus. It functions primarily by suppressing hepatic glucose production through inhibition of gluconeogenesis, and secondarily by improving peripheral insulin sensitivity via increased glucose uptake in skeletal muscle.",
  },
  {
    id: 2,
    source_text:
      "The pathological examination revealed a poorly differentiated adenocarcinoma with signet ring cell morphology, invading through the muscularis propria into the subserosal tissue (pT3). Two of fifteen resected lymph nodes showed metastatic involvement (pN1a).",
  },
  {
    id: 3,
    source_text:
      "患者女性，65岁，因「反复胸闷、气促2年，加重伴双下肢水肿1周」入院。既往有高血压病史15年，2型糖尿病8年。查体：血压160/95mmHg，心率98次/分，双肺底可闻及细湿啰音，双下肢凹陷性水肿(++)。",
  },
  {
    id: 4,
    source_text:
      "Le syndrome métabolique est défini par la présence d'au moins trois des critères suivants : tour de taille > 102 cm chez l'homme ou > 88 cm chez la femme, triglycéridémie ≥ 150 mg/dL, HDL-cholestérol < 40 mg/dL chez l'homme ou < 50 mg/dL chez la femme, pression artérielle ≥ 130/85 mmHg, glycémie à jeun ≥ 100 mg/dL.",
  },
];

const TECHNICAL_SEGMENTS = [
  {
    id: 0,
    source_text:
      "The `useEffect` hook accepts a callback function and an optional dependency array. If the dependency array is provided, React will only re-run the effect when one of the dependencies changes. If omitted, the effect runs after every render.",
  },
  {
    id: 1,
    source_text:
      "Configure the nginx reverse proxy by adding a location block: `location /api/ { proxy_pass http://localhost:3000; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }`. Ensure `proxy_set_header X-Forwarded-For` is set for correct IP forwarding.",
  },
  {
    id: 2,
    source_text:
      "The algorithm has a time complexity of O(n log n) for the average case and O(n²) for the worst case when the array is already sorted. Space complexity is O(n) due to the auxiliary merge buffer. Consider using `Array.prototype.sort()` with a custom comparator for small datasets.",
  },
  {
    id: 3,
    source_text:
      "在 Kubernetes 集群中部署微服务时，建议使用 `Deployment` 资源管理 Pod 副本数，并配置 `HorizontalPodAutoscaler` 根据 CPU 或内存使用率自动扩缩容。Service 暴露方式推荐使用 `ClusterIP` 配合 Ingress Controller。",
  },
];

const EDGE_CASE_SEGMENTS = [
  { id: 0, source_text: "Simple text with no special characters." },
  {
    id: 1,
    source_text:
      "HTML entities: &amp; &lt; &gt; &quot; &#39; — should be preserved or decoded correctly.",
  },
  {
    id: 2,
    source_text:
      "Inline code: Use `npm install` to install dependencies, then run `npm test`. Configuration in <code>config.json</code> must be valid JSON.",
  },
  {
    id: 3,
    source_text:
      'Nested tags: <div class="container"><p>This is a <strong>bold</strong> and <em>italic</em> text with <a href="https://example.com">a link</a>.</p></div>',
  },
  {
    id: 4,
    source_text:
      "Newlines in text:\nFirst line continues here.\nSecond line.\nThird line with more content.",
  },
  {
    id: 5,
    source_text:
      "Special characters: 「日本語」「한국어」「العربية」「Русский」 «French» ‹German›",
  },
  {
    id: 6,
    source_text: "Mixed scripts: Hello 你好Bonjour こんにちはمرحبا Привет",
  },
  {
    id: 7,
    source_text:
      "Empty translation target: this segment should still be translated even if context fields are missing.",
  },
  {
    id: 8,
    source_text:
      "Long segment with many clauses: The system architecture employs a microservices pattern where each service communicates via gRPC for internal calls and exposes REST endpoints for external clients, with an event-driven message broker (RabbitMQ) handling asynchronous workflows, while Redis provides distributed caching and session management, and PostgreSQL serves as the primary data store with read replicas for query load balancing.",
  },
  {
    id: 9,
    source_text:
      "Emoji and symbols: 🎉🚀💻🌍✨ — these should be preserved in translation.",
  },
  {
    id: 10,
    source_text:
      "URLs and emails: Visit https://example.com/path?q=test&lang=en or email support@example.com for help. API endpoint: https://api.example.com/v2/translate",
  },
  {
    id: 11,
    source_text:
      "Mathematical expressions: The integral ∫₀^∞ e^(-x²) dx equals √π/2. The quadratic formula x = (-b ± √(b²-4ac)) / 2a solves ax² + bx + c = 0.",
  },
];

const DIALOGUE_SEGMENTS = [
  {
    id: 0,
    source_text:
      '"Hey, did you see the game last night?" she asked, barely concealing her excitement. "That last-minute goal was absolutely incredible!"',
  },
  {
    id: 1,
    source_text:
      "Doctor: How long have you been experiencing these symptoms?\nPatient: About three weeks now. It started as a mild discomfort but has gotten progressively worse.\nDoctor: I see. Are you taking any medications currently?",
  },
  {
    id: 2,
    source_text:
      "A: 老师，这个函数的返回值类型是什么？\nB: 返回值是一个 Promise<string>，也就是说它异步返回一个字符串。\nA: 那如果网络请求失败了呢？\nB: 会被 catch 块捕获，你可以在这里处理错误。",
  },
];

describe("template engine", () => {
  describe("variable substitution", () => {
    test("substitutes a simple variable", () => {
      expect(renderTemplate("Hello {{name}}!", { name: "World" })).toBe(
        "Hello World!"
      );
    });

    test("trims whitespace around variable tags", () => {
      expect(renderTemplate("{{  name  }}", { name: "x" })).toBe("x");
    });

    test("renders empty string for missing variable", () => {
      expect(renderTemplate("[{{missing}}]", {})).toBe("[]");
    });

    test("renders empty string for null value", () => {
      expect(renderTemplate("[{{value}}]", { value: null })).toBe("[]");
    });

    test("resolves dotted paths", () => {
      expect(
        renderTemplate("{{user.profile.name}}", {
          user: { profile: { name: "Ada" } },
        })
      ).toBe("Ada");
    });
  });

  describe("filters", () => {
    test("json filter stringifies strings with quotes and newlines", () => {
      expect(
        renderTemplate("{{text|json}}", { text: 'a "quote"\nand \\ slash' })
      ).toBe(JSON.stringify('a "quote"\nand \\ slash'));
    });

    test("json filter preserves unicode", () => {
      expect(renderTemplate("{{text|json}}", { text: "你好 مرحبا" })).toBe(
        '"你好 مرحبا"'
      );
    });

    test("json filter stringifies objects", () => {
      expect(renderTemplate("{{obj|json}}", { obj: { a: 1, b: "x" } })).toBe(
        '{"a":1,"b":"x"}'
      );
    });

    test("json filter renders empty string for undefined", () => {
      expect(renderTemplate("[{{missing|json}}]", {})).toBe("[]");
    });

    test("raw filter renders null as empty string", () => {
      expect(renderTemplate("[{{value|raw}}]", { value: null })).toBe("[]");
      expect(renderTemplate("[{{value|raw}}]", { value: undefined })).toBe(
        "[]"
      );
    });

    test("raw filter keeps numbers", () => {
      expect(renderTemplate("{{value|raw}}", { value: 42 })).toBe("42");
    });
  });

  describe("for loops", () => {
    test("renders basic loop body", () => {
      expect(
        renderTemplate("{% for item in items %}<{{item}}>{% endfor %}", {
          items: ["a", "b", "c"],
        })
      ).toBe("<a><b><c>");
    });

    test("loop.index is 0-based", () => {
      expect(
        renderTemplate(
          "{% for item in items %}{{loop.index}}:{{item}} {% endfor %}",
          {
            items: ["a", "b"],
          }
        )
      ).toBe("0:a 1:b ");
    });

    test("loop.last is true only on the final element", () => {
      expect(
        renderTemplate(
          "{% for item in items %}{{item}}{% if loop.last %}<last>{% endif %}{% endfor %}",
          { items: ["a", "b", "c"] }
        )
      ).toBe("abc<last>");
    });

    test("renders nothing for an empty list", () => {
      expect(
        renderTemplate("[{% for item in items %}{{item}}{% endfor %}]", {
          items: [],
        })
      ).toBe("[]");
    });

    test("supports nested loops", () => {
      expect(
        renderTemplate(
          "{% for row in grid %}[{% for cell in row %}{{cell}}{% endfor %}]{% endfor %}",
          {
            grid: [
              [1, 2],
              [3, 4],
            ],
          }
        )
      ).toBe("[12][34]");
    });

    test("nested loop restores outer loop variables", () => {
      expect(
        renderTemplate(
          "{% for row in grid %}{{loop.index}}:{% for cell in row %}{{cell}}{% endfor %}{% if loop.last %}.{% endif %}{% endfor %}",
          { grid: [["a"], ["b"]] }
        )
      ).toBe("0:a1:b.");
    });

    test("if not loop.last acts as a separator", () => {
      const template =
        "{% for seg in segments %}{{seg.id}}{% if not loop.last %},{% endif %}{% endfor %}";
      expect(
        renderTemplate(template, {
          segments: [{ id: 1 }, { id: 2 }, { id: 3 }],
        })
      ).toBe("1,2,3");
      expect(renderTemplate(template, { segments: [{ id: 1 }] })).toBe("1");
    });
  });

  describe("if conditions", () => {
    test("renders body for truthy value", () => {
      expect(
        renderTemplate("{% if flag %}yes{% endif %}", { flag: true })
      ).toBe("yes");
    });

    test("skips body for falsy value", () => {
      expect(renderTemplate("{% if flag %}yes{% endif %}", { flag: "" })).toBe(
        ""
      );
      expect(renderTemplate("{% if flag %}yes{% endif %}", { flag: 0 })).toBe(
        ""
      );
    });

    test("not inverts the condition", () => {
      expect(
        renderTemplate("{% if not flag %}no{% endif %}", { flag: false })
      ).toBe("no");
      expect(
        renderTemplate("{% if not flag %}no{% endif %}", { flag: true })
      ).toBe("");
    });

    test("if empty object is truthy (matches JS semantics)", () => {
      expect(
        renderTemplate("{% if glossary %}has{% endif %}", { glossary: {} })
      ).toBe("has");
    });
  });

  describe("complex templates with domain content", () => {
    test("LITERARY: JSON array template with for + if", () => {
      const template =
        '{"segments":[{% for seg in segments %}{"id":{{seg.id}},"text":{{seg.source_text|json}}}{% if not loop.last %},{% endif %}{% endfor %}]}';
      const output = renderTemplate(template, { segments: LITERARY_SEGMENTS });
      expect(() => JSON.parse(output)).not.toThrow();
      const parsed = JSON.parse(output);
      expect(parsed.segments).toHaveLength(5);
      expect(parsed.segments[2].text).toBe(LITERARY_SEGMENTS[2].source_text);
      expect(parsed.segments[0].id).toBe(0);
    });

    test("MEDICAL: percent-separated list with long text", () => {
      const template =
        "Segments:\n{% for seg in segments %}[{{seg.id}}]\n{{seg.source_text}}{% if not loop.last %}\n%%\n\n{% endif %}{% endfor %}";
      const output = renderTemplate(template, { segments: MEDICAL_SEGMENTS });
      expect(output).toContain("[0]");
      expect(output).toContain(MEDICAL_SEGMENTS[0].source_text);
      expect(output).toContain("[3]");
      expect(output.split("%%").length - 1).toBe(4);
    });

    test("TECHNICAL: text with backticks and HTML preserved", () => {
      const template =
        "{% for seg in segments %}{{seg.id}}: {{seg.source_text}}\n{% endfor %}";
      const output = renderTemplate(template, { segments: TECHNICAL_SEGMENTS });
      expect(output).toContain("`useEffect`");
      expect(output).toContain("`location /api/ {");
      expect(output).toContain("O(n log n)");
      expect(output).toContain("HorizontalPodAutoscaler");
    });

    test("EDGE_CASE: emoji, URLs, nested tags, mixed scripts", () => {
      const template =
        "{% for seg in segments %}{{seg.source_text|json}}\n{% endfor %}";
      const output = renderTemplate(template, { segments: EDGE_CASE_SEGMENTS });
      const parsed = output
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      expect(parsed).toEqual(EDGE_CASE_SEGMENTS.map((seg) => seg.source_text));
    });

    test("DIALOGUE: newlines and quotation marks preserved", () => {
      const template =
        "{% for seg in segments %}{{seg.source_text}}\n{% endfor %}";
      const output = renderTemplate(template, { segments: DIALOGUE_SEGMENTS });
      expect(output).toContain('"Hey, did you see the game last night?"');
      expect(output).toContain("Doctor: How long have you been");
      expect(output).toContain("Promise<string>");
    });

    test("glossary object renders as JSON when guarded", () => {
      const template = '{"glossary":{{glossary|json}}}';
      const glossary = {
        "myocardial infarction": "心肌梗死",
        metformin: "二甲双胍",
      };
      expect(JSON.parse(renderTemplate(template, { glossary }))).toEqual({
        glossary,
      });
    });
  });

  describe("unicode handling", () => {
    test("renders CJK, Arabic, Cyrillic, accented Latin", () => {
      const data = {
        cn: "中文",
        ar: "مرحبا",
        cy: "Привет",
        la: "sé déjà nîño",
      };
      const template = "{{cn}}|{{ar}}|{{cy}}|{{la}}";
      expect(renderTemplate(template, data)).toBe(
        "中文|مرحبا|Привет|sé déjà nîño"
      );
    });

    test("json filter keeps unicode but escapes special characters", () => {
      const text = "«French» ‹German› 「日本語」";
      const output = renderTemplate("{{text|json}}", { text });
      expect(JSON.parse(output)).toBe(text);
    });
  });

  describe("special characters in loop body", () => {
    test("quotes, newlines, and HTML entities are preserved", () => {
      const items = [
        "a \"quote\" and 'single'",
        "line1\nline2",
        "&amp; &lt; &gt;",
      ];
      const template = "{% for item in items %}{{item}}\n{% endfor %}";
      expect(renderTemplate(template, { items })).toBe(
        "a \"quote\" and 'single'\nline1\nline2\n&amp; &lt; &gt;\n"
      );
    });

    test("json filter escapes newlines and quotes in loop body", () => {
      const items = ['say "hi"', "a\nb"];
      const template =
        "{% for item in items %}{{item|json}}{% if not loop.last %},{% endif %}{% endfor %}";
      const output = renderTemplate(template, { items });
      expect(JSON.parse(`[${output}]`)).toEqual(items);
    });
  });

  describe("large lists", () => {
    test("renders 12 segments without truncation", () => {
      const template =
        '{% for seg in segments %}{"id":{{seg.id}},"text":{{seg.source_text|json}}}{% if not loop.last %},{% endif %}{% endfor %}';
      const output = renderTemplate(template, { segments: EDGE_CASE_SEGMENTS });
      const expected = EDGE_CASE_SEGMENTS.map(({ id, source_text }) => ({
        id,
        text: source_text,
      }));
      expect(JSON.parse(`[${output}]`)).toEqual(expected);
      expect(JSON.parse(`[${output}]`)).toHaveLength(12);
    });
  });

  describe("compileTemplate + render API", () => {
    test("compiles once and renders multiple contexts", () => {
      const instructions = compileTemplate("Hello {{name}}!");
      expect(render(instructions, { name: "A" })).toBe("Hello A!");
      expect(render(instructions, { name: "B" })).toBe("Hello B!");
    });
  });

  describe("error handling", () => {
    test("throws on missing endif at end of template", () => {
      expect(() => compileTemplate("{% if flag %}x")).toThrow(
        /missing "endif"/
      );
    });

    test("throws on unexpected endfor while inside if", () => {
      expect(() => compileTemplate("{% if flag %}x{% endfor %}")).toThrow(
        /unexpected block/
      );
    });

    test("throws on missing endfor", () => {
      expect(() => compileTemplate("{% for i in items %}{{i}}")).toThrow(
        /missing "endfor"/
      );
    });

    test("throws on unknown block keyword", () => {
      expect(() => compileTemplate("{% unknown %}")).toThrow(
        /unexpected block/
      );
    });

    test("throws on empty block", () => {
      expect(() => compileTemplate("x{% %}y")).toThrow(/empty block/);
    });

    test("throws on extra closing tag at top level", () => {
      expect(() => compileTemplate("x{% endif %}y")).toThrow(
        /unexpected block/
      );
    });

    test("throws on unclosed {{ tag", () => {
      expect(() => compileTemplate("a {{ b")).toThrow(/unclosed "\{\{"/);
    });

    test("throws on unclosed {% tag", () => {
      expect(() => compileTemplate("a {% if x")).toThrow(/unclosed "\{%"/);
    });

    test("throws on stray closing tag }}", () => {
      expect(() => compileTemplate("a }} b")).toThrow(/stray closing tag/);
    });

    test("throws on stray closing tag %}", () => {
      expect(() => compileTemplate("a %} b")).toThrow(/stray closing tag/);
    });

    test("throws on empty variable expression", () => {
      expect(() => compileTemplate("[{{ }}]")).toThrow(/empty expression/);
      expect(() => compileTemplate("{{}}")).toThrow(/empty expression/);
    });

    test("throws on nested braces in expression", () => {
      expect(() => compileTemplate("{{ {{ x }} }}")).toThrow(
        /malformed expression/
      );
    });

    test("throws on unknown filter", () => {
      expect(() => compileTemplate("{{ x|upper }}")).toThrow(
        /unknown filter "upper"/
      );
    });

    test("throws on trailing empty filter", () => {
      expect(() => compileTemplate("{{ x| }}")).toThrow(/unknown filter/);
    });

    test("throws on empty if condition", () => {
      expect(() => compileTemplate("{% if %}x{% endif %}")).toThrow(
        /missing condition/
      );
    });

    test("throws on bare not in if condition", () => {
      expect(() => compileTemplate("{% if not %}x{% endif %}")).toThrow(
        /missing condition/
      );
    });

    test("throws on for statement without list", () => {
      expect(() => compileTemplate("{% for x in %}y{% endfor %}")).toThrow(
        /invalid for statement/
      );
    });

    test("throws on for statement without item", () => {
      expect(() => compileTemplate("{% for in xs %}y{% endfor %}")).toThrow(
        /invalid for statement/
      );
    });

    test("throws on non-string source", () => {
      expect(() => renderTemplate(null)).toThrow(TypeError);
      expect(() => compileTemplate(123)).toThrow(/must be a string/);
    });
  });

  describe("applyPlaceholders", () => {
    test("replaces provided placeholders", () => {
      expect(
        applyPlaceholders("{{title}} - {{text}}", {
          title: "T",
          text: "X",
        })
      ).toBe("T - X");
    });

    test("leaves unprovided placeholders untouched", () => {
      expect(applyPlaceholders("{{title}} {{missing}}", { title: "T" })).toBe(
        "T {{missing}}"
      );
    });

    test("renders null and undefined values as empty string", () => {
      expect(
        applyPlaceholders("[{{title}}][{{text}}]", {
          title: null,
          text: undefined,
        })
      ).toBe("[][]");
    });

    test("tolerates stray closing tags that the template engine rejects", () => {
      expect(
        applyPlaceholders("a }} b {% {{title}}", { title: "T" })
      ).toBe("a }} b {% T");
    });

    test("replaces multiple occurrences of the same placeholder", () => {
      expect(applyPlaceholders("{{tone}}/{{tone}}", { tone: "formal" })).toBe(
        "formal/formal"
      );
    });

    test("is tolerant of non-string templates", () => {
      expect(applyPlaceholders(null, {})).toBe("");
      expect(applyPlaceholders(undefined, { title: "T" })).toBe("");
    });

    test("does not re-substitute a value that itself contains a placeholder", () => {
      expect(applyPlaceholders("{{text}}", { text: "{{title}}" })).toBe(
        "{{title}}"
      );
    });
  });
});
