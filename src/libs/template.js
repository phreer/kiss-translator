// A tiny jinja2-like template engine with zero dependencies.
//
// Supported syntax:
//   {{ path|filter }}        variable substitution (path = a.b.c)
//   supported filters:
//   - json: JSON.stringify filter
//   - raw: raw value filter (null/undefined -> empty string)
//
//   {% for item in list %}   loop; body runs once per element
//   {% if [not] path %}      conditional; truthiness of the resolved value
//   {% endfor %} / {% endif %}  close the loop / conditional
//
// Loop context exposes: loop.index (0-based), loop.last (boolean).
// Literal text between tags is rendered as-is (tags are zero-width).

const ALLOWED_FILTERS = new Set(["json", "raw"]);

const applyFilters = (value, filters) => {
  if (filters.length === 0) {
    return value == null ? "" : String(value);
  }
  for (const filter of filters) {
    if (filter === "json") {
      value = value === undefined ? "" : JSON.stringify(value);
    } else {
      value = value == null ? "" : String(value);
    }
  }
  return value;
};

const resolvePath = (path, context) => {
  if (!path) return undefined;
  return path.split(".").reduce((value, key) => {
    if (value == null) return undefined;
    return value[key];
  }, context);
};

const tokenize = (source) => {
  const tokens = [];
  let pos = 0;
  while (pos < source.length) {
    const openIndex = source.slice(pos).search(/\{\{|\{%/);
    const closeIndex = source.slice(pos).search(/\}\}|\%\}/);

    if (openIndex === -1) {
      if (closeIndex !== -1) {
        throw new Error(
          `Template error: stray closing tag "${source.slice(
            pos + closeIndex,
            pos + closeIndex + 2
          )}" at position ${pos + closeIndex}`
        );
      }
      if (pos < source.length) {
        tokens.push({ type: "text", value: source.slice(pos) });
      }
      break;
    }

    if (closeIndex !== -1 && closeIndex < openIndex) {
      throw new Error(
        `Template error: stray closing tag "${source.slice(
          pos + closeIndex,
          pos + closeIndex + 2
        )}" at position ${pos + closeIndex}`
      );
    }

    if (openIndex > 0) {
      tokens.push({ type: "text", value: source.slice(pos, pos + openIndex) });
    }

    const openTag = source.slice(pos + openIndex, pos + openIndex + 2);
    const closeTag = openTag === "{{" ? "}}" : "%}";
    const contentStart = pos + openIndex + 2;
    const closePos = source.indexOf(closeTag, contentStart);

    if (closePos === -1) {
      throw new Error(`Template error: unclosed "${openTag}"`);
    }

    const content = source.slice(contentStart, closePos);
    if (content.includes("{") || content.includes("}")) {
      throw new Error(
        `Template error: malformed expression "${content.trim()}"`
      );
    }

    tokens.push({
      type: openTag === "{{" ? "var" : "block",
      value: content.trim(),
    });
    pos = closePos + 2;
  }
  return tokens;
};

const parseExpression = (expr) => {
  const parts = expr.split("|").map((part) => part.trim());
  const path = parts.shift();
  if (!path) {
    throw new Error(`Template error: empty expression "{{ ${expr} }}"`);
  }
  for (const filter of parts) {
    if (!ALLOWED_FILTERS.has(filter)) {
      throw new Error(`Template error: unknown filter "${filter}"`);
    }
  }
  return { path, filters: parts };
};

const compile = (tokens, stop, indexRef) => {
  const instructions = [];
  while (indexRef.index < tokens.length) {
    const token = tokens[indexRef.index];
    if (token.type === "text") {
      instructions.push(token);
      indexRef.index += 1;
      continue;
    }
    if (token.type === "var") {
      const { path, filters } = parseExpression(token.value);
      instructions.push({ type: "var", path, filters });
      indexRef.index += 1;
      continue;
    }
    // block token
    if (stop && token.value === stop) {
      indexRef.index += 1;
      return instructions;
    }
    if (/^for\b/.test(token.value)) {
      const match = token.value.match(/^for\s+(\S+)\s+in\s+(\S+)$/);
      if (!match) {
        throw new Error(
          `Template error: invalid for statement "${token.value}"`
        );
      }
      indexRef.index += 1;
      const body = compile(tokens, "endfor", indexRef);
      instructions.push({
        type: "for",
        item: match[1],
        listPath: match[2],
        body,
      });
      continue;
    }
    if (/^if\b/.test(token.value)) {
      const condition = token.value.replace(/^if\s*/, "").trim();
      if (!condition || condition === "not") {
        throw new Error(
          `Template error: missing condition in "${token.value}"`
        );
      }
      let negate = false;
      let path = condition;
      if (condition.startsWith("not ")) {
        negate = true;
        path = condition.slice(4).trim();
      }
      indexRef.index += 1;
      const body = compile(tokens, "endif", indexRef);
      instructions.push({ type: "if", negate, path, body });
      continue;
    }
    if (!token.value) {
      throw new Error("Template error: empty block");
    }
    throw new Error(`Template error: unexpected block "${token.value}"`);
  }
  if (stop) {
    throw new Error(`Template error: missing "${stop}"`);
  }
  return instructions;
};

export const compileTemplate = (source) => {
  if (typeof source !== "string") {
    throw new TypeError(
      `Template error: source must be a string, got ${typeof source}`
    );
  }
  return compile(tokenize(source), null, { index: 0 });
};

const renderInstructions = (instructions, context) => {
  let out = "";
  for (const instr of instructions) {
    switch (instr.type) {
      case "text":
        out += instr.value;
        break;
      case "var":
        out += applyFilters(resolvePath(instr.path, context), instr.filters);
        break;
      case "for": {
        const list = resolvePath(instr.listPath, context) || [];
        for (let index = 0; index < list.length; index += 1) {
          const loop = { index, last: index === list.length - 1 };
          out += renderInstructions(instr.body, {
            ...context,
            [instr.item]: list[index],
            loop,
          });
        }
        break;
      }
      case "if": {
        const value = resolvePath(instr.path, context);
        if (instr.negate ? !value : !!value) {
          out += renderInstructions(instr.body, context);
        }
        break;
      }
      default:
        break;
    }
  }
  return out;
};

export const render = (instructions, context = {}) =>
  renderInstructions(instructions, context);

export const renderTemplate = (source, context = {}) =>
  render(compileTemplate(source), context);
