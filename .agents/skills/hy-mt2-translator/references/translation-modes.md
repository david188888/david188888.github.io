# Translation Modes

Hy-MT2 instruction templates. Both `source_lang` and `target_lang` must use the **full language names**:
Chinese names in Chinese prompts, English names in English prompts.

Mode is auto-detected from CLI flags — pass at most one mode flag per run.

## 1. Basic (default, no mode flag)

Chinese prompt:

```
将以下文本翻译为 `{target_lang}`，注意**只需要输出翻译后的结果，不要额外解释**：

{source_text}
```

English prompt:

```
Translate the following text into `{target_lang}`. Note that you should **only output the translated result without any additional explanation**:

{source_text}
```

## 2. Terminology-constrained (`--terminology`)

`--terminology` is a raw string embedded directly into the prompt. Use `\n` to separate multiple term pairs, e.g.
`$'人工智能翻译成Artificial Intelligence\n机器学习翻译成Machine Learning'`.

Chinese prompt:

```
*参考下面的翻译：*
`{text}` 翻译成 `{text}`
`{text}` 翻译成 `{text}`
`{text}` 翻译成 `{text}`
将以下文本翻译为 `{target_lang}`，注意**只需要输出翻译后的结果，不要额外解释**：

{source_text}
```

English prompt:

```
*Reference the following translations:*
`{text}` translates to `{text}`
`{text}` translates to `{text}`
`{text}` translates to `{text}`

Translate the following text into `{target_lang}`. Note that you must **ONLY output the translated result without any additional explanation**:

{source_text}
```

## 3. Style-controlled (`--style`)

Chinese prompt:

```
请将以下文本翻译为 `{target_lang}`。
注意翻译的风格要严格符合【**`{target_style}`**】

{source_text}
```

English prompt:

```
Please translate the following text into `{target_lang}`. Note that the translation style must strictly conform to [**`{target_style}`**]:

{source_text}
```

## 4. Delimiter-preserving (`--preserve-delimiters`)

Chinese prompt:

```
请将以下文本准确翻译为 `{target_lang}`。
你必须在译文中**保留等量的分隔符，绝对不可遗漏、转义或翻译该符号，并注意分隔符的位置**。

{source_text}
```

English prompt:

```
Please accurately translate the following text into `{target_lang}`.
You must **retain the exact same number of delimiters in the translation. Strictly do not omit, escape, or translate these symbols, and pay close attention to their placement**:

{source_text}
```

## 5. Structured data (`--format-type` JSON|HTML|XML|YAML|Markdown)

Chinese prompt:

```
*# 任务目标*
将下方 `{source_text}` 中的 `{format_type}` 格式数据翻译为 `{target_lang}`。

*# 严格约束*
1. **结构锁定**：绝对保持原有的 `{format_type}` 数据结构、缩进和层级完全不变。
2. **选择性翻译**：仅翻译面向用户展示的可见文本内容。
3. **禁止修改**：**严禁**翻译或更改任何代码标签、键名 (Key)、变量占位符（如 `{{var}}`、`${var}`、`%s`、`%d` 等）或代码属性。

*# 数据输入*
{source_text}
```

English prompt:

```
*### Task*
Translate the user-facing text within the following `{format_type}` data into `{target_lang}`.

*### Strict Rules*
1. **Structure Preservation:** You MUST preserve the original `{format_type}` data structure, nesting, hierarchy, and indentation exactly as they are.
2. **Selective Translation:** Translate ONLY the visible, user-facing text content/values.
3. **Strict Non-Translation:** NEVER translate or alter code tags, keys, properties, object names, or variable placeholders. Leave them exactly in their original English/code form.

*### Source Data*
{source_text}
```

## 6. Context-aware (`--context`)

Chinese prompt:

```
*【背景信息】*
`{background_text}`

请结合背景信息将以下文本翻译为 `{target_lang}`。

*【待翻译文本】*
{source_text}
```

English prompt:

```
*[Background Information]*
`{background_text}`

Please translate the following text into `{target_lang}`, taking the provided background information into consideration.

*[Source Text]*
{source_text}
```
