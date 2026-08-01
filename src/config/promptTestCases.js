import { PROMPT_CATEGORY_USER, PROMPT_CATEGORY_BATCH_SYSTEM } from "./prompt";

/**
 * Non-batch 翻译测试用例（user prompt）
 */
export const NOBATCH_TEST_CASES = [
  {
    id: "simple",
    nameKey: "prompt_test_simple",
    items: [
      {
        text: "The quick brown fox jumps over the lazy dog.",
        translation: "敏捷的棕色狐狸跳过了懒狗。",
      },
    ],
    description: "基础功能验证",
  },
  {
    id: "long",
    nameKey: "prompt_test_long",
    items: [
      {
        text: "Artificial intelligence has transformed numerous industries in recent years, from healthcare diagnostics to autonomous vehicles. Machine learning models can now analyze vast datasets to identify patterns that would take humans months or even years to detect. However, this rapid advancement also raises important ethical questions about privacy, job displacement, and the responsible use of these powerful technologies. As we continue to integrate AI into our daily lives, it becomes crucial to establish robust frameworks that ensure these tools serve humanity's best interests while minimizing potential harms.",
        translation:
          "近年来，人工智能已经改变了众多行业，从医疗诊断到自动驾驶汽车。机器学习模型现在可以分析海量数据集，识别出人类需要数月甚至数年才能发现的模式。然而，这种快速发展也引发了关于隐私、工作岗位替代以及这些强大技术负责任使用的重要伦理问题。随着我们继续将人工智能融入日常生活，建立健全的框架以确保这些工具服务于人类最大利益并尽量减少潜在危害变得至关重要。",
      },
    ],
    description: "测试长文本处理能力",
  },
  {
    id: "code",
    nameKey: "prompt_test_code",
    items: [
      {
        text: 'To implement a simple hello world in JavaScript, use the following code:\nfunction hello() {\n  return "world";\n}\n\nYou can call it with console.log(hello()). The function takes no arguments and returns a string. For debugging, use the browser\'s developer tools (F12) or Node.js inspector.',
        translation:
          '要在 JavaScript 中实现简单的 hello world，请使用以下代码：\nfunction hello() {\n  return "world";\n}\n\n你可以通过 console.log(hello()) 来调用它。该函数不接受任何参数，返回一个字符串。要进行调试，请使用浏览器的开发者工具（F12）或 Node.js 检查器。',
      },
    ],
    description: "测试代码片段保留",
  },
  {
    id: "multi_line",
    nameKey: "prompt_test_multi_line",
    items: [
      {
        text: "First, we need to understand the basic architecture of the system.",
        translation: "首先，我们需要了解系统的基本架构。",
      },
      {
        text: "Second, the data flow between components must be clearly defined.",
        translation: "其次，组件之间的数据流必须被明确定义。",
      },
      {
        text: "Third, error handling should cover all edge cases.",
        translation: "第三，错误处理应该覆盖所有边缘情况。",
      },
      {
        text: "Finally, testing ensures everything works as expected.",
        translation: "最后，测试确保一切按预期运行。",
      },
    ],
    description: "测试多行文本处理",
  },
  {
    id: "literary",
    nameKey: "prompt_test_literary",
    items: [
      {
        text: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us, we were all going direct to Heaven, we were all going direct the other way.",
        translation:
          "这是最好的时代，这是最坏的时代，这是智慧的年头，这是愚蠢的年头，这是信仰的时期，这是怀疑的时期，这是光明的季节，这是黑暗的季节，这是希望之春，这是失望之冬，我们面前应有尽有，我们面前一无所有，我们都将直奔天堂，我们都将直奔相反的方向。",
      },
      {
        text: "All happy families are alike; each unhappy family is unhappy in its own way. Everything was in confusion in the Oblonskys' house. The wife had discovered that the husband was carrying on an intrigue with a French girl, who had been a governess in their family, and she had announced to her husband that she could not go on living in the same house with him.",
        translation:
          "幸福的家庭都是相似的，不幸的家庭各有各的不幸。奥布隆斯基家里一切都混乱了。妻子发觉丈夫和从前的法国家庭女教师有暧昧关系，就向丈夫声明，她不能再和他同在一个屋子里住下去了。",
      },
      {
        text: "He was an old man who fished alone in a skiff in the Gulf Stream and he had gone eighty-four days now without taking a fish. In the first forty days a boy had been with him. But after forty days without a fish the boy's parents had told him that the old man was now definitely and finally salao, which is the worst form of unlucky.",
        translation:
          "他是个独自在湾流中一条小船上钓鱼的老人，至今已去了八十四天，一条鱼也没逮住。头四十天里，有个男孩子跟他在一起。可是过了四十天还没捉到一条鱼，孩子的父母对他说，老人如今准是十足地倒了血霉，这是最糟糕的运气。",
      },
    ],
    description: "测试文学作品翻译",
  },
  {
    id: "medical",
    nameKey: "prompt_test_medical",
    items: [
      {
        text: "The patient presents with acute onset of chest pain radiating to the left arm, accompanied by diaphoresis and dyspnea. Initial assessment reveals elevated troponin levels at 2.4 ng/mL (normal < 0.04 ng/mL) and ST-segment elevation in leads II, III, and aVF on the electrocardiogram. These findings are consistent with an acute inferior wall myocardial infarction. The patient should be immediately started on dual antiplatelet therapy with aspirin 325 mg and ticagrelor 180 mg loading dose, followed by anticoagulation with unfractionated heparin.",
        translation:
          "患者表现为急性胸痛，放射至左臂，伴有出汗和呼吸困难。初步检查显示肌钙蛋白水平升高至 2.4 ng/mL（正常值 < 0.04 ng/mL），心电图 II、III 和 aVF 导联 ST 段抬高。这些发现与急性下壁心肌梗死一致。应立即开始双重抗血小板治疗，使用阿司匹林 325 mg 和替格瑞洛 180 mg 负荷剂量，随后使用普通肝素进行抗凝治疗。",
      },
      {
        text: "Diagnosis: Type 2 Diabetes Mellitus with inadequate glycemic control. Current HbA1c is 8.9%, indicating poor long-term glucose management. The patient reports occasional hypoglycemic episodes despite elevated HbA1c, suggesting significant glycemic variability. Recommended treatment modification includes initiation of continuous glucose monitoring, adjustment of insulin glargine from 20 units to 28 units subcutaneously at bedtime, and addition of metformin 1000 mg twice daily with meals. Patient education on carbohydrate counting and insulin dose adjustment is essential.",
        translation:
          "诊断：2 型糖尿病伴血糖控制不佳。当前糖化血红蛋白为 8.9%，表明长期血糖管理较差。患者报告尽管糖化血红蛋白升高但仍偶有低血糖发作，提示血糖变异性显著。推荐的治疗调整包括启动持续血糖监测、将甘精胰岛素从睡前 20 单位皮下注射调整为 28 单位，以及加用二甲双胍 1000 mg 随餐每日两次。对患者进行碳水化合物计数和胰岛素剂量调整的教育至关重要。",
      },
      {
        text: "The magnetic resonance imaging of the brain reveals a 2.3 cm contrast-enhancing lesion in the right temporal lobe with surrounding vasogenic edema causing mild mass effect on the right lateral ventricle. The lesion demonstrates irregular peripheral enhancement with central necrosis, which is highly suggestive of a high-grade glioma, most likely glioblastoma multiforme (WHO Grade IV). Differential diagnosis includes metastatic disease, brain abscess, and primary CNS lymphoma. Neurosurgical consultation is recommended for stereotactic biopsy and histopathological confirmation.",
        translation:
          "脑部磁共振成像显示右侧颞叶有一 2.3 cm 对比增强病灶，周围伴有血管源性水肿，对右侧脑室造成轻度占位效应。病灶显示不规则外周强化伴中心坏死，高度提示高级别胶质瘤，最可能为多形性胶质母细胞瘤（WHO IV 级）。鉴别诊断包括转移性疾病、脑脓肿和原发性中枢神经系统淋巴瘤。建议神经外科会诊进行立体定向活检和组织病理学确认。",
      },
    ],
    description: "测试医学专业术语翻译",
  },
];

/**
 * Batch 翻译测试用例（batch system prompt）
 */
export const BATCH_TEST_CASES = [
  {
    id: "simple_batch",
    nameKey: "prompt_test_batch_simple",
    items: [
      { text: "Hello, world!", translation: "你好，世界！" },
      { text: "This is a test.", translation: "这是一次测试。" },
      { text: "Good morning!", translation: "早上好！" },
      { text: "Thank you.", translation: "谢谢。" },
    ],
    description: "简单多段落批量翻译",
  },
  {
    id: "large_batch",
    nameKey: "prompt_test_batch_large",
    items: [
      {
        text: "This project provides a lightweight, cross-platform translation solution that works as a browser extension, userscript, and standalone web application. It supports multiple translation engines including Google Translate, DeepL, OpenAI, and several other providers, allowing users to choose the service that best fits their needs and budget.",
        translation:
          "本项目提供了一个轻量级、跨平台的翻译解决方案，可作为浏览器扩展、用户脚本和独立 Web 应用程序使用。它支持多种翻译引擎，包括 Google 翻译、DeepL、OpenAI 以及其他多个服务提供商，允许用户选择最适合其需求和预算的服务。",
      },
      {
        text: "To install the extension, download the latest release from the official repository and load it as an unpacked extension in your browser's developer mode. For Firefox users, you can install it directly from the Firefox Add-ons store. The userscript version can be installed via Tampermonkey or Greasemonkey by visiting the installation page and clicking the install button.",
        translation:
          "要安装扩展程序，请从官方仓库下载最新版本，并在浏览器的开发者模式下以未打包扩展的形式加载。对于 Firefox 用户，可以直接从 Firefox 附加组件商店安装。用户脚本版本可以通过 Tampermonkey 或 Greasemonkey 安装，只需访问安装页面并点击安装按钮即可。",
      },
      {
        text: "The configuration panel allows you to customize translation behavior, including source and target language selection, translation engine preference, and display style. You can choose between inline translation, popup tooltips, or a side-by-side bilingual view. Advanced users can also configure custom API endpoints and authentication keys for self-hosted translation services.",
        translation:
          "配置面板允许您自定义翻译行为，包括源语言和目标语言选择、翻译引擎偏好以及显示样式。您可以选择行内翻译、弹出工具提示或并排双语视图。高级用户还可以为自托管翻译服务配置自定义 API 端点和身份验证密钥。",
      },
      {
        text: "Once installed, simply select any text on a webpage and a translation icon will appear nearby. Click the icon to see the translation displayed in your chosen format. You can also hover over text to get instant translations, or use the keyboard shortcut to toggle translation mode for the entire page. The extension remembers your preferences across sessions.",
        translation:
          "安装完成后，只需在网页上选择任意文本，附近就会出现一个翻译图标。点击图标即可查看以您选择的格式显示的翻译。您也可以将鼠标悬停在文本上以获取即时翻译，或使用键盘快捷键为整个页面切换翻译模式。扩展会记住您在各会话之间的偏好设置。",
      },
      {
        text: "Beyond basic translation, the tool supports batch translation of multiple paragraphs, automatic language detection, and glossary management for consistent terminology. You can create custom glossaries to ensure domain-specific terms are always translated correctly. The extension also integrates with popular documentation platforms for seamless technical writing workflows.",
        translation:
          "除了基本翻译功能外，该工具还支持多段落批量翻译、自动语言检测以及用于保持术语一致性的词汇表管理。您可以创建自定义词汇表，确保特定领域的术语始终得到正确翻译。该扩展还与流行的文档平台集成，实现无缝的技术写作工作流程。",
      },
      {
        text: "If you encounter issues, first check that your API keys are valid and have sufficient quota. Some translation engines have rate limits that may cause temporary failures. Clearing the browser cache and reinstalling the extension often resolves display issues. For persistent problems, enable debug logging in the settings panel and submit the log file through the issue tracker.",
        translation:
          "如果遇到问题，请首先检查您的 API 密钥是否有效且具有足够的配额。某些翻译引擎有速率限制，可能会导致临时故障。清除浏览器缓存并重新安装扩展通常可以解决显示问题。对于持续性问题，请在设置面板中启用调试日志，并通过问题追踪器提交日志文件。",
      },
      {
        text: "The full API documentation covers all available configuration options, event hooks, and integration methods. The API supports both synchronous and asynchronous translation calls, with built-in retry logic for handling transient network failures. Comprehensive code examples are provided for JavaScript, Python, and common server-side frameworks.",
        translation:
          "完整的 API 文档涵盖了所有可用的配置选项、事件钩子和集成方法。该 API 支持同步和异步翻译调用，并内置重试逻辑以处理瞬态网络故障。文档提供了 JavaScript、Python 和常见服务端框架的全面代码示例。",
      },
      {
        text: "To improve translation speed, enable the local cache feature which stores previously translated segments. Reduce the debounce interval for real-time translation, or increase it to minimize API calls. For large documents, use the chunked translation mode that splits text into optimal segments. Connection pooling and request batching are automatically managed by the translation client.",
        translation:
          "要提高翻译速度，请启用本地缓存功能，该功能会存储先前翻译过的片段。减小实时翻译的防抖间隔，或增大它以减少 API 调用。对于大型文档，使用分块翻译模式将文本分割成最佳片段。连接池和请求批处理由翻译客户端自动管理。",
      },
      {
        text: "All API keys and tokens are stored locally using encrypted storage provided by the browser extension API. No translation data is sent to third-party servers beyond the selected translation provider. The extension implements Content Security Policy headers to prevent injection attacks, and all network requests use HTTPS with certificate pinning where supported.",
        translation:
          "所有 API 密钥和令牌都使用浏览器扩展 API 提供的加密存储本地存储。除所选翻译提供商外，翻译数据不会发送到第三方服务器。该扩展实现了内容安全策略头以防止注入攻击，所有网络请求在支持的情况下均使用带有证书锁定的 HTTPS。",
      },
      {
        text: "Production deployments should use the pre-built distribution packages rather than building from source. Set environment variables for API keys instead of hardcoding them in configuration files. Use a reverse proxy for self-hosted translation services to enable TLS termination and load balancing. Monitor resource usage as high-volume translation can consume significant API quota.",
        translation:
          "生产部署应使用预构建的分发包而非从源代码构建。将 API 密钥设置为环境变量，而非在配置文件中硬编码。为自托管翻译服务使用反向代理以实现 TLS 终止和负载均衡。监控资源使用情况，因为大量翻译可能会消耗大量 API 配额。",
      },
      {
        text: "The extension exposes translation metrics through a built-in dashboard, showing request counts, latency histograms, and error rates. Configure log rotation to prevent excessive disk usage in long-running environments. Integrate with Prometheus or Grafana for centralized monitoring. Set up alerts for API quota exhaustion or prolonged error rate spikes.",
        translation:
          "该扩展通过内置仪表板公开翻译指标，显示请求计数、延迟直方图和错误率。配置日志轮转以防止长时间运行环境中的磁盘使用过多。与 Prometheus 或 Grafana 集成进行集中监控。为 API 配额耗尽或持续的错误率峰值设置警报。",
      },
      {
        text: "Automated backups of user settings and glossaries can be enabled through the sync feature, which stores encrypted backups in your cloud storage of choice. To restore from a backup, import the backup file in the settings panel. In disaster recovery scenarios, a fresh installation combined with backup import will fully restore your environment within minutes.",
        translation:
          "用户设置和词汇表的自动备份可以通过同步功能启用，该功能会将加密备份存储在您选择的云存储中。要从备份恢复，请在设置面板中导入备份文件。在灾难恢复场景中，全新安装结合备份导入将在几分钟内完全恢复您的环境。",
      },
    ],
    description: "大批量段落测试",
  },
  {
    id: "code_batch",
    nameKey: "prompt_test_batch_code",
    items: [
      {
        text: "Regular paragraph text that needs translation.",
        translation: "需要翻译的普通段落文本。",
      },
      {
        text: "Code example: function main() {\n  return 42;\n}",
        translation: "代码示例：function main() {\n  return 42;\n}",
      },
      {
        text: "Another regular paragraph after the code.",
        translation: "代码之后的另一段普通段落。",
      },
      {
        text: 'JSON format: {"key": "value", "count": 10, "nested": true}',
        translation: 'JSON 格式：{"key": "value", "count": 10, "nested": true}',
      },
      {
        text: "Final paragraph to complete the batch.",
        translation: "完成本批次翻译的最后一段。",
      },
    ],
    description: "混合代码和文本的批量翻译",
  },
  {
    id: "mixed_length",
    nameKey: "prompt_test_batch_mixed",
    items: [
      { text: "Short.", translation: "短句。" },
      {
        text: "A medium length sentence that contains more words to translate.",
        translation: "一个中等长度的句子，包含更多需要翻译的词语。",
      },
      {
        text: "A very long paragraph that tests how the model handles longer segments in batch mode. This should have enough content to be meaningful and test the translation quality properly.",
        translation:
          "一个很长的段落，用于测试模型在批量模式下如何处理较长的片段。这应该有足够的内容来产生有意义的结果并正确测试翻译质量。",
      },
      { text: "Tiny.", translation: "极短。" },
      {
        text: "Another medium-sized segment here for testing.",
        translation: "另一个用于测试的中等长度片段。",
      },
    ],
    description: "不同长度段落混合测试",
  },
  {
    id: "literary_batch",
    nameKey: "prompt_test_batch_literary",
    items: [
      {
        text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters.",
        translation:
          "凡是有钱的单身汉，总想娶位太太，这已经成了一条举世公认的真理。这样的单身汉，每逢新搬到一个地方，四邻八舍虽然完全不了解他的性情如何，见解如何，可是，既然这样的一条真理早已在人们心目中根深蒂固，因此人们总是把他看作自己某一个女儿理所应得的一笔财产。",
      },
      {
        text: "In the beginning God created the heaven and the earth. And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters. And God said, Let there be light: and there was light. And God saw the light, that it was good: and God divided the light from the darkness.",
        translation:
          "起初，神创造天地。地是空虚混沌，渊面黑暗；神的灵运行在水面上。神说：「要有光」，就有了光。神看光是好的，就把光暗分开了。",
      },
      {
        text: "Call me Ishmael. Some years ago — never mind how long precisely — having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation.",
        translation:
          "叫我以实玛利吧。几年前——别管多久——我手头没几个钱，岸上也没什么特别吸引我的事，我想不如去海上逛逛，看看世界的水色。这是我排遣忧郁、调节血液循环的老办法。",
      },
      {
        text: "Last night I dreamt I went to Manderley again. It seemed to me that I was driven through the gates of Manderley along the winding drive, and when we came to the house it stood, a thing of splendour, a jewel among trees, a dream-thing, a thing of beauty. The drive wound away in front of me, twisting and turning as it had always done, but as I advanced I was aware that a change had come upon the drive.",
        translation:
          "昨夜我又梦见自己回到了曼陀丽。恍惚间，我仿佛坐在车里穿过曼陀丽的大门，沿着蜿蜒的车道驶去，眼前出现了那座庄园——宛如一颗镶嵌在树丛中的宝石，如梦似幻，美不胜收。车道在我面前蜿蜒伸展，一如既往地曲折迂回，但当我向前行驶时，我察觉到车道发生了某种变化。",
      },
    ],
    description: "测试文学作品批量翻译",
  },
  {
    id: "tech_article_batch",
    nameKey: "prompt_test_batch_tech_article",
    items: [
      {
        text: "{1}                       Please enjoy this week's edition, and, as always, thank you for{2}                       supporting LWN.net.{3}",
        translation:
          "{1}                       请享受本周的刊期，一如既往，感谢您{2}                       支持 LWN.net。{3}",
      },
      {
        text: "Debating the role of large language models in the kernel community",
        translation: "围绕大语言模型在内核社区中的角色展开辩论",
      },
      {
        text: "{1}The kernel community's guidance regarding LLM-generated code was <i1>added to the kernel</i1>, at the{2}end of 2025 for the 7.0 release, after long discussions in the Linux{3}Foundation's Technical Advisory Board (TAB) and on the mailing lists.  The{4}<i2>coding-assistants.rst</i2>{5}file states that, when a code submission has been partially or entirely{6}generated by an LLM, the patch should carry an Assisted-by tag in this{7}format:{8}",
        translation:
          "{1}内核社区关于 LLM 生成代码的指导方针在 Linux{2}基金会技术顾问委员会（TAB）和邮件列表上经过长期讨论后，于{3}2025 年底作为 7.0 版本的一部分<i1>被添加到内核中</i1>。{4}<i2>coding-assistants.rst</i2>{5}文件指出，当代码提交部分或全部{6}由 LLM 生成时，补丁应携带如下格式的 Assisted-by 标签：{7}{8}",
      },
      {
        text: "{1}The purpose of this tag was to document the use of an LLM, and to alert{2}reviewers and maintainers to that fact.  It also contains the name of the{3}specific tool used.  That information was deemed potentially useful in case{4}a specific LLM turns out to have a tendency toward specific bugs or ends up{5}in copyright-related trouble; it would make it possible for developers to{6}review patches generated by the problematic model and, possibly, modify or{7}remove them.{8}",
        translation:
          "{1}这个标签的目的是记录 LLM 的使用情况，并提醒{2}审查者和维护者注意这一事实。它还包含所使用的{3}具体工具的名称。这些信息被认为在以下情况下可能有用：{4}某个特定的 LLM 被发现倾向于产生特定的 bug，或者陷入{5}版权相关的麻烦；它将使开发者能够{6}审查由有问题的模型生成的补丁，并可能进行修改或{7}删除。{8}",
      },
      {
        text: "{1}Since then, this tag has not won over all developers.  As of 7.2-rc4, over{2}1,200 commits carry Assisted-by tags.  There is, however, clearly a{3}significant stream of machine-generated patches that do not carry that tag;{4}sometimes that is a result of ignorance of the rules, but other times the{5}origin of the code is, seemingly, being deliberately obscured.  As a{6}result, the tag's usefulness as an indicator of LLM involvement is unclear{7}at best.  Meanwhile, some developers see placing the names of specific LLMs{8}into the kernel's development history as a form of advertising.  All told, many{9}wonder whether the tag adds any value at all.{10}",
        translation:
          "{1}此后，这个标签并未赢得所有开发者的认可。截至 7.2-rc4，已有{2}超过 1,200 个提交携带了 Assisted-by 标签。然而，显然有{3}大量机器生成的补丁并未携带该标签；{4}有时这是由于不了解规则，但有时代码的{5}来源似乎被刻意隐瞒了。因此，{6}该标签作为 LLM 参与指标的有用性充其量是{7}不确定的。同时，一些开发者认为将特定 LLM 的名称{8}写入内核开发历史是一种广告行为。总而言之，许多人{9}怀疑这个标签是否增加了任何价值。{10}",
      },
      {
        text: "{1}This discussion came to the fore at the beginning of July when Christian{2}Brauner <i1>suggested</i1>{3}removing the tag or, at least, removing the name of the specific model{4}used:{5}",
        translation:
          "{1}这场讨论在七月初浮出水面，当时 Christian{2}Brauner <i1>建议</i1>{3}移除该标签，或者至少移除所使用的具体模型{4}名称：{5}",
      },
      {
        text: "{1}      I acknowledge that my stance is even more radical: imho we would{2}   just stop it with any disclosure requirements completely. It's{3}        useless imho.  We already see that other than core contributors{4}     most people don't care and will just not disclose their usage of{5}    AI. I think this is entirely pointless and worse it brings in{6}      undefined legal status as well. It's not like recent events of{7}        pulling certain models from the face of the earth have made this{8}    any less concerning.{9}",
        translation:
          "{1}      我承认我的立场更加激进：在我看来我们应该{2}   完全停止任何披露要求。这在我看来{3}        毫无用处。我们已经看到，除了核心贡献者之外{4}     大多数人并不在乎，也不会披露他们使用{5}    AI 的情况。我认为这完全没有意义，更糟糕的是它还带来了{6}      未定义的法律地位。最近从地球上{7}        撤下某些模型的事件也没有让这个问题{8}    变得不那么令人担忧。{9}",
      },
      {
        text: "{1}      But fine, if we want to do this can we please just dumb it down to{2}",
        translation: "{1}      好吧，如果我们想这样做，能不能把它简化成{2}",
      },
      {
        text: "{1}Jeff Layton later followed this up with <i1>a separate{2}patch</i1> removing the attribution requirement entirely.  Some developers{3}were clearly in favor of that; networking maintainer Jakub Kicinski <i2>let it be known</i2> that{4}he simply removes those tags from patches he applies, essentially{5}undermining the previous decision made by the TAB and the community.{6}Others have not taken that step, but expressed little love for the tag.{7}",
        translation:
          "{1}Jeff Layton 后来提交了<i1>一个单独的{2}补丁</i1>，完全移除了归属要求。一些开发者{3}显然支持这样做；网络维护者 Jakub Kicinski <i2>表示</i2>他{4}直接从他应用的补丁中移除了这些标签，实际上{5}破坏了 TAB 和社区之前的决定。{6}其他人没有采取这一步骤，但也对该标签表示了{7}不满。{8}",
      },
      {
        text: '{1}There are developers, though, who would like to see its use continue.  Greg{2}Kroah-Hartman <i1>described</i1> it as a{3}signal that an LLM was involved in the creation of a patch, and that the{4}result should be reviewed more closely.  Lorenzo Stoakes <i2>characterized</i2> the current{5}policy as being " < i3 > about empowering maintainers to push back</i3> ".  This{6}contingent would like to see the Assisted-by requirement stay in force,{7}perhaps with better enforcement if possible.{8}',
        translation:
          "{1}不过，也有开发者希望看到它的使用继续下去。Greg{2}Kroah-Hartman <i1>将其描述为</i1>一个{3}表明 LLM 参与了补丁创建的信号，并且应该对结果进行更严格的{4}审查。Lorenzo Stoakes <i2>将</i2>当前{5}政策定性为「关于赋予维护者拒绝的权力」。这一{6}群体希望看到 Assisted-by 要求继续生效，{7}如果可能的话，或许能有更好的执行力度。{8}",
      },
      {
        text: "{1}In the end, there appeared to be enough support for keeping the tag to{2}prevent its outright removal, but nobody was willing to defend requiring{3}disclosure of the specific tool used.  So the consensus <i1>seemed</i1> to be{4}to go with Brauner's initial suggestion, perhaps with a more focused{5}changelog.  A new revision has not yet appeared, though, and it may well be{6}that a final decision on this policy will not be made until the Maintainers{7}Summit in October.{8}",
        translation:
          "{1}最终，似乎有足够的支持保留该标签以{2}防止其被彻底移除，但没有人愿意为要求{3}披露所使用的具体工具进行辩护。因此共识{4}似乎是采纳 Brauner 最初的建议，或许附带更简洁的{5}变更日志。不过，新的修订版本尚未出现，最终关于此政策的决定{6}很可能要等到十月的维护者{7}峰会才会做出。{8}",
      },
      {
        text: "{1}While the use of LLMs to write code is clearly on the increase in the{2}community, LLMs are still much more widely used for the review of patches{3}rather than their creation.  The <i1>Sashiko{4}review tool</i1>, in particular, has seen extensive adoption by many{5}subsystems, and maintainers increasingly expect developers to respond to{6}the reviews it emits.  But these tools depend heavily on the willingness of{7}corporations to fund their use, which drives a couple of concerns: will{8}that generosity continue in the future, and will the community become so{9}dependent on those tools that a future rugpull could substantially hurt the{10}development process?{11}",
        translation:
          "{1}虽然 LLM 在社区中用于编写代码的情况明显在增加，但 LLM{2}仍然更广泛地用于审查补丁{3}而非创建补丁。特别是 <i1>Sashiko{4}审查工具</i1>，已被许多{5}子系统广泛采用，维护者越来越期望开发者对{6}其发出的审查做出回应。但这些工具在很大程度上依赖于{7}企业资助其使用的意愿，这引发了一些担忧：这种{8}慷慨在未来是否会持续，社区是否会变得如此{9}依赖这些工具，以至于未来的突然撤回可能会严重损害{10}开发进程？{11}",
      },
      {
        text: "{1}Roman Gushchin, the most active developer behind Sashiko, raised this{2}concern in his <i1>proposal</i1> for a{3}Maintainers Summit discussion:{4}",
        translation:
          "{1}Roman Gushchin，Sashiko 背后最活跃的开发者，在他的{2}维护者峰会讨论<i1>提案</i1>中{3}提出了这一担忧：{4}",
      },
      {
        text: "{1}      Several kernel engineers and maintainers have rightfully expressed{2} concerns about relying on infrastructure provided by a single{3} company without clear formal guarantees. It would be great to{4}       discuss what a more sustainable model could realistically look like{5} and how we might get there.{6}",
        translation:
          "{1}      多位内核工程师和维护者已经合理地表达了{2}对依赖单一公司提供的基础设施而没有明确正式保证的担忧。讨论一个更可持续的模型{3}       实际上可能是什么样子，以及我们如何实现这一目标，{4}       将是非常有益的。{5}{6}",
      },
      {
        text: "{1}I have also <i1>brought this{2}issue up</i1> in the community more than once.  Two decades ago, the{3}community's reliance on BitKeeper led to a major shock when access to that{4}proprietary tool <i2>was suddenly withdrawn</i2>.{5}Depending on another proprietary tool now risks a similar shock, and this{6}time the community may not be able to depend on Torvalds creating a{7}replacement over a long weekend.{8}",
        translation:
          "{1}我也在社区中<i1>多次提出过{2}这个问题</i1>。二十年前，社区对 BitKeeper 的依赖导致了当{3}对该专有工具的访问权限<i2>被突然撤回</i2>时的重大冲击。{4}如今依赖另一个专有工具面临着类似的冲击风险，而且这次{5}社区可能无法指望 Torvalds 在一个长周末内{6}创造出替代品。{7}{8}",
      },
      {
        text: "{1}Many of the responses to this question have leaned on the idea that, while{2}LLM-based tools help the community to be more productive, there is no real{3}risk of becoming dependent on them.  Sasha Levin, for example, <i1>said</i1>: \"<i2>if AI suddenly goes away{4}tomorrow it'll suck for me, but I'll just go back to writing my tools{5}manually like I did before</i2>\".  The earlier part of that email, though,{6}read:{7}",
        translation:
          "{1}许多对此问题的回答都倾向于这样一种观点：虽然{2}基于 LLM 的工具帮助社区提高了生产力，但并没有真正{3}产生依赖的风险。例如 Sasha Levin <i1>说</i1>：「<i2>如果 AI 明天突然消失{4}对我来说会很糟糕，但我只会回到像以前一样手动{5}编写工具的状态</i2>」。然而，那封邮件的前半部分{6}写道：{7}",
      },
      {
        text: "{1}      In the past year or two I was able to rewrite most of my ugly{2}      scripts, automate so many of the processes I used to do manually,{3}     and just improve so many quality of life items thanks to AI. Look{4}   even at the CVE process that was created last year: so much of the{5}  infrastructure used to drive it was created with AI.{6}",
        translation:
          "{1}      在过去一两年里，得益于 AI，我得以重写了大部分粗糙的{2}      脚本，将许多过去手动执行的流程自动化，{3}     并大幅提升了生活质量的方方面面。看看{4}   去年创建的 CVE 流程：驱动它的大部分{5}  基础设施都是用 AI 创建的。{6}",
      },
      {
        text: "{1}Or consider <i1>the words of another{2}long-time kernel developer</i1>, Dave Chinner, in an entirely different{3}conversation:{4}",
        translation:
          "{1}或者考虑<i1>另一位资深内核开发者</i1> Dave Chinner 在一个完全不同的{2}对话中{3}所说的：{4}",
      },
      {
        text: "{1}      I have learnt how to drive LLMs well enough that I don't need to{2}   write code anymore. The LLM functions as my code editor that is{3}       capable of extremely fancy DWIM predictive text insertion. For{4}      someone who hates the process of typing out code, this has been a{5}   revelation.{6}",
        translation:
          "{1}      我已经学会了如何足够好地使用 LLM，以至于我不再需要{2}   编写代码了。LLM 充当我的代码编辑器，能够{3}       进行极其精巧的 DWIM 预测性文本插入。对于{4}      讨厌编写代码过程的人来说，这简直是一个{5}   启示。{6}",
      },
      {
        text: "{1}The authors of words like that may not feel dependent on these tools, but{2}they have nonetheless clearly given LLM-based tools a major role in how{3}they get their work done.{4}",
        translation:
          "{1}说出这些话的人可能并不觉得依赖这些工具，但他们{2}显然已经让基于 LLM 的工具在他们的{3}工作方式中扮演了重要角色。{4}",
      },
    ],
    description: "LWN 技术文章批量翻译",
  },
  {
    id: "medical_batch",
    nameKey: "prompt_test_batch_medical",
    items: [
      {
        text: "The patient is a 58-year-old male presenting with a 3-day history of progressive dyspnea, orthopnea, and bilateral lower extremity edema. Past medical history is significant for hypertension, type 2 diabetes mellitus, and ischemic cardiomyopathy with an ejection fraction of 25%. Current medications include lisinopril 20 mg daily, metoprolol succinate 100 mg daily, furosemide 40 mg twice daily, and warfarin 5 mg daily. On examination, the patient appears anxious and is using accessory muscles of respiration.",
        translation:
          "患者为 58 岁男性，主诉进行性呼吸困难、端坐呼吸和双下肢水肿 3 天。既往史有高血压、2 型糖尿病和缺血性心肌病，射血分数 25%。当前用药包括赖诺普利 20 mg 每日一次、琥珀酸美托洛尔 100 mg 每日一次、呋塞米 40 mg 每日两次和华法林 5 mg 每日一次。查体见患者焦虑，正使用辅助呼吸肌呼吸。",
      },
      {
        text: "The chest radiograph demonstrates cardiomegaly with a cardiothoracic ratio of 0.65, bilateral pleural effusions more prominent on the right, pulmonary vascular congestion with cephalization of vessels, and interstitial edema manifesting as Kerley B lines. The aortic knob appears calcified. No focal consolidation or pneumothorax is identified. These findings are consistent with decompensated congestive heart failure.",
        translation:
          "胸部 X 线片显示心影增大，心胸比 0.65，双侧胸腔积液右侧更明显，肺血管充血伴血管头向化，间质性水肿表现为 Kerley B 线。主动脉弓可见钙化。未见局灶性实变或气胸。这些发现与失代偿性充血性心力衰竭一致。",
      },
      {
        text: "Laboratory results reveal a complete blood count with hemoglobin 10.2 g/dL (decreased), hematocrit 30.6% (decreased), white blood cell count 12,400/mm³ (elevated with neutrophilic predominance at 85%), and platelet count 245,000/mm³ (normal). Comprehensive metabolic panel shows sodium 131 mEq/L (low), potassium 5.1 mEq/L (high), creatinine 2.8 mg/dL (significantly elevated from baseline 1.4), BUN 58 mg/dL (elevated), and BNP 2,840 pg/mL (markedly elevated). Liver function tests show ALT 68 U/L and AST 72 U/L, both mildly elevated, suggesting hepatic congestion.",
        translation:
          "实验室检查结果显示全血细胞计数：血红蛋白 10.2 g/dL（降低）、红细胞压积 30.6%（降低）、白细胞计数 12,400/mm³（升高，中性粒细胞占 85%）、血小板计数 245,000/mm³（正常）。综合代谢面板显示钠 131 mEq/L（偏低）、钾 5.1 mEq/L（偏高）、肌酐 2.8 mg/dL（较基线 1.4 显著升高）、血尿素氮 58 mg/dL（升高）、BNP 2,840 pg/mL（显著升高）。肝功能检查显示 ALT 68 U/L 和 AST 72 U/L，均轻度升高，提示肝淤血。",
      },
      {
        text: "Echocardiography reveals severe left ventricular systolic dysfunction with an ejection fraction of 20%, moderate mitral regurgitation, tricuspid regurgitation with an estimated pulmonary artery systolic pressure of 55 mmHg, and a small pericardial effusion without evidence of tamponade physiology. The left ventricular end-diastolic dimension is 6.8 cm (dilated), and the left atrium is moderately enlarged at 5.2 cm. Regional wall motion abnormalities are noted in the anterior and anteroseptal segments, consistent with prior myocardial infarction.",
        translation:
          "超声心动图显示严重左心室收缩功能障碍，射血分数 20%，中度二尖瓣反流，三尖瓣反流伴估测肺动脉收缩压 55 mmHg，少量心包积液无心脏压塞征象。左心室舒张末内径 6.8 cm（扩大），左心房中度增大至 5.2 cm。前壁和前间隔节段可见室壁运动异常，与陈旧性心肌梗死一致。",
      },
    ],
    description: "测试医学专业术语批量翻译",
  },
];

/**
 * 根据测试用例提取 texts 数组（传给 testTranslate）
 */
export function getTestTexts(testCase) {
  return (testCase?.items || []).map((item) => item.text);
}

/**
 * 根据测试用例提取 translations 数组（用于参考翻译展示）
 */
export function getTestTranslations(testCase) {
  return (testCase?.items || []).map((item) => item.translation);
}

/**
 * 根据 prompt category 返回对应的测试用例列表
 */
export function getTestCasesByCategory(category) {
  if (category === PROMPT_CATEGORY_BATCH_SYSTEM) {
    return BATCH_TEST_CASES;
  }
  if (category === PROMPT_CATEGORY_USER) {
    return NOBATCH_TEST_CASES;
  }
  return [];
}
