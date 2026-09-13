#!/usr/bin/env python3
"""Hy-MT2 translation CLI — implements the command contract documented in SKILL.md.

Single text:   --text "..." or --input-file path
Batch:         --input in.jsonl --output out.jsonl [--workers N]

Backends:
  tencent_cloud  Hy Translation API (default URL built in); needs --model + --api-key
  private_model  Any OpenAI-compatible /v1/chat/completions service (e.g. local
                 Ollama: --url http://localhost:11434/v1 --model hy-mt2-7b --api-key ollama)

Mode is auto-detected from flags; pass at most one mode flag per run:
  --terminology "src1翻译成tgt1\nsrc2翻译成tgt2"
  --style "学术论文严谨风格"
  --preserve-delimiters
  --format-type JSON|HTML|XML|YAML|Markdown
  --context "背景信息"
"""

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

TENCENT_CLOUD_DEFAULT_URL = "https://api.hunyuan.cloud.tencent.com/v1/chat/completions"

# Hy-MT2 recommended sampling parameters (1.8B / 7B), per the official README.
GENERATION = {
    "temperature": 0.7,
    "top_p": 0.6,
    "top_k": 20,
    "repetition_penalty": 1.05,
    "max_tokens": 4096,
}

# abbreviation / Chinese name -> (Chinese full name, English full name)
LANGUAGES = {
    "zh": ("中文", "Chinese"), "en": ("英语", "English"), "fr": ("法语", "French"),
    "pt": ("葡萄牙语", "Portuguese"), "es": ("西班牙语", "Spanish"), "ja": ("日语", "Japanese"),
    "tr": ("土耳其语", "Turkish"), "ru": ("俄语", "Russian"), "ar": ("阿拉伯语", "Arabic"),
    "ko": ("韩语", "Korean"), "th": ("泰语", "Thai"), "it": ("意大利语", "Italian"),
    "de": ("德语", "German"), "vi": ("越南语", "Vietnamese"), "ms": ("马来语", "Malay"),
    "id": ("印尼语", "Indonesian"), "tl": ("菲律宾语", "Filipino"), "hi": ("印地语", "Hindi"),
    "zh-Hant": ("繁体中文", "Traditional Chinese"), "pl": ("波兰语", "Polish"),
    "cs": ("捷克语", "Czech"), "nl": ("荷兰语", "Dutch"), "km": ("高棉语", "Khmer"),
    "my": ("缅甸语", "Burmese"), "fa": ("波斯语", "Persian"), "gu": ("古吉拉特语", "Gujarati"),
    "ur": ("乌尔都语", "Urdu"), "te": ("泰卢固语", "Telugu"), "mr": ("马拉地语", "Marathi"),
    "he": ("希伯来语", "Hebrew"), "bn": ("孟加拉语", "Bengali"), "ta": ("泰米尔语", "Tamil"),
    "uk": ("乌克兰语", "Ukrainian"), "bo": ("藏语", "Tibetan"), "kk": ("哈萨克语", "Kazakh"),
    "mn": ("蒙古语", "Mongolian"), "ug": ("维吾尔语", "Uyghur"), "yue": ("粤语", "Cantonese"),
}
_CN_NAME_TO_ABBR = {names[0]: abbr for abbr, names in LANGUAGES.items()}

PROMPTS_ZH = {
    "basic": "将以下文本翻译为 `{tl}`，注意**只需要输出翻译后的结果，不要额外解释**：\n\n{src}",
    "terminology": "*参考下面的翻译：*\n{terms}\n将以下文本翻译为 `{tl}`，注意**只需要输出翻译后的结果，不要额外解释**：\n\n{src}",
    "style": "请将以下文本翻译为 `{tl}`。\n注意翻译的风格要严格符合【**`{style}`**】\n\n{src}",
    "delimiters": "请将以下文本准确翻译为 `{tl}`。\n你必须在译文中**保留等量的分隔符，绝对不可遗漏、转义或翻译该符号，并注意分隔符的位置**。\n\n{src}",
    "structured": "*# 任务目标*\n将下方文本中的 {fmt} 格式数据翻译为 `{tl}`。\n\n*# 严格约束*\n1. **结构锁定**：绝对保持原有的 {fmt} 数据结构、缩进和层级完全不变。\n2. **选择性翻译**：仅翻译面向用户展示的可见文本内容。\n3. **禁止修改**：**严禁**翻译或更改任何代码标签、键名 (Key)、变量占位符（如 `{{{{var}}}}`、`${{var}}`、`%s`、`%d` 等）或代码属性。\n\n*# 数据输入*\n{src}",
    "context": "*【背景信息】*\n{ctx}\n\n请结合背景信息将以下文本翻译为 `{tl}`。\n\n*【待翻译文本】*\n{src}",
}

PROMPTS_EN = {
    "basic": "Translate the following text into `{tl}`. Note that you should **only output the translated result without any additional explanation**:\n\n{src}",
    "terminology": "*Reference the following translations:*\n{terms}\n\nTranslate the following text into `{tl}`. Note that you must **ONLY output the translated result without any additional explanation**:\n\n{src}",
    "style": "Please translate the following text into `{tl}`. Note that the translation style must strictly conform to [**`{style}`**]:\n\n{src}",
    "delimiters": "Please accurately translate the following text into `{tl}`.\nYou must **retain the exact same number of delimiters in the translation. Strictly do not omit, escape, or translate these symbols, and pay close attention to their placement**:\n\n{src}",
    "structured": "*### Task*\nTranslate the user-facing text within the following {fmt} data into `{tl}`.\n\n*### Strict Rules*\n1. **Structure Preservation:** You MUST preserve the original {fmt} data structure, nesting, hierarchy, and indentation exactly as they are.\n2. **Selective Translation:** Translate ONLY the visible, user-facing text content/values.\n3. **Strict Non-Translation:** NEVER translate or alter code tags, keys, properties, object names, or variable placeholders. Leave them exactly in their original English/code form.\n\n*### Source Data*\n{src}",
    "context": "*[Background Information]*\n{ctx}\n\nPlease translate the following text into `{tl}`, taking the provided background information into consideration.\n\n*[Source Text]*\n{src}",
}


def resolve_language(value):
    """Accept an abbreviation (`en`) or a Chinese name (`英语`); return (abbr, zh_name, en_name)."""
    value = value.strip()
    if value in LANGUAGES:
        abbr = value
    elif value in _CN_NAME_TO_ABBR:
        abbr = _CN_NAME_TO_ABBR[value]
    else:
        sys.exit(f"Sorry, that language is outside my supported range: {value}")
    return abbr, LANGUAGES[abbr][0], LANGUAGES[abbr][1]


def pick_mode(args):
    modes = []
    if args.format_type:
        modes.append("structured")
    if args.terminology:
        modes.append("terminology")
    if args.style:
        modes.append("style")
    if args.context:
        modes.append("context")
    if args.preserve_delimiters:
        modes.append("delimiters")
    if len(modes) > 1:
        sys.exit(f"Pass at most one mode flag per run, got: {', '.join(modes)}")
    return modes[0] if modes else "basic"


def build_prompt(source_text, target_lang, mode, args, prompt_lang):
    """prompt_lang 'zh' uses Chinese templates (Chinese target names), 'en' English ones."""
    templates = PROMPTS_ZH if prompt_lang == "zh" else PROMPTS_EN
    _, zh_name, en_name = resolve_language(target_lang)
    tl = zh_name if prompt_lang == "zh" else en_name
    kwargs = {"tl": tl, "src": source_text}
    if mode == "terminology":
        terms = args.terminology if prompt_lang == "zh" else args.terminology.replace("翻译成", " translates to ")
        kwargs["terms"] = terms
    elif mode == "style":
        kwargs["style"] = args.style
    elif mode == "context":
        kwargs["ctx"] = args.context
    elif mode == "structured":
        kwargs["fmt"] = args.format_type
    return templates[mode].format(**kwargs)


def normalize_endpoint(url):
    url = url.rstrip("/")
    if not url.endswith("/chat/completions"):
        url += "/chat/completions"
    return url


def call_api(endpoint, model, api_key, prompt, attempts=3):
    body = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        **GENERATION,
    }
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    last_error = None
    for attempt in range(1, attempts + 1):
        req = urllib.request.Request(
            endpoint, data=json.dumps(body).encode("utf-8"), headers=headers, method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=600) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            return payload["choices"][0]["message"]["content"].strip()
        except (urllib.error.URLError, urllib.error.HTTPError, KeyError, json.JSONDecodeError) as e:
            last_error = e
            if attempt < attempts:
                time.sleep(2 * attempt)
    raise SystemExit(f"Translation request failed after {attempts} attempts: {last_error}")


def translate_one(text, args, endpoint, mode):
    prompt_lang = "zh" if any("一" <= ch <= "鿿" for ch in text[:200]) else "en"
    prompt = build_prompt(text, args.target_lang, mode, args, prompt_lang)
    return call_api(endpoint, args.model, args.api_key, prompt)


def run_batch(args, endpoint, mode):
    with open(args.input, encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]

    done = 0
    try:
        with open(args.output, encoding="utf-8") as f:
            done = sum(1 for line in f if line.strip())
        print(f"Resuming: {done} records already in {args.output}", file=sys.stderr)
    except FileNotFoundError:
        pass

    pending = records[done:]
    failures = 0

    def work(item):
        idx, record = item
        text = record.get("text") or record.get("source_text")
        if not text:
            return idx, record, False
        record = dict(record)
        record["translation"] = translate_one(text, args, endpoint, mode)
        return idx, record, True

    with open(args.output, "a", encoding="utf-8") as out:
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            for n, (idx, record, ok) in enumerate(
                pool.map(work, enumerate(pending, start=done)), start=1
            ):
                failures += 0 if ok else 1
                out.write(json.dumps(record, ensure_ascii=False) + "\n")
                if n % 10 == 0 or n == len(pending):
                    print(f"Progress: {done + n}/{len(records)}", file=sys.stderr)

    print(f"Batch done: {len(records) - done - failures} translated, {failures} failed -> {args.output}")
    if failures:
        sys.exit(1)


def main():
    p = argparse.ArgumentParser(description="Hy-MT2 translation CLI")
    p.add_argument("--text")
    p.add_argument("--input-file")
    p.add_argument("--input", help="batch input JSONL (each line: text or source_text)")
    p.add_argument("--output", help="batch output JSONL (appends a translation field)")
    p.add_argument("--target-lang", required=True, help="abbr (en) or Chinese name (英语)")
    p.add_argument("--backend", required=True, choices=["tencent_cloud", "private_model"])
    p.add_argument("--url", help="endpoint URL; optional for tencent_cloud (built-in default)")
    p.add_argument("--model", required=True)
    p.add_argument("--api-key")
    p.add_argument("--terminology")
    p.add_argument("--style")
    p.add_argument("--preserve-delimiters", action="store_true")
    p.add_argument("--format-type", choices=["JSON", "HTML", "XML", "YAML", "Markdown"])
    p.add_argument("--context")
    p.add_argument("--workers", type=int, default=4)
    args = p.parse_args()

    endpoint = normalize_endpoint(
        args.url or (TENCENT_CLOUD_DEFAULT_URL if args.backend == "tencent_cloud" else "")
    )
    if args.backend == "private_model" and not args.url:
        p.error("--url is required for private_model")
    resolve_language(args.target_lang)
    mode = pick_mode(args)

    if args.input and args.output:
        run_batch(args, endpoint, mode)
        return

    if args.text is not None:
        source = args.text
    elif args.input_file:
        with open(args.input_file, encoding="utf-8") as f:
            source = f.read()
    else:
        p.error("provide --text, --input-file, or --input + --output")

    print(translate_one(source, args, endpoint, mode))


if __name__ == "__main__":
    main()
