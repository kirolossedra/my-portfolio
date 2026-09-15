"""Conservative Markdown-to-retrieval text. Raw fragments remain untouched.

Syntax is removed contextually; code content and identifiers are protected.
Table cells retain order and row boundaries, including negative evidence.
"""
import html
import re


def inline(text):
    protected = []
    def keep(match):
        protected.append(match.group(2))
        return f'\x00{len(protected)-1}\x00'
    text = re.sub(r'(`+)(.+?)\1', keep, text)
    # Balanced parentheses in ordinary inline destinations, including filenames.
    text = re.sub(r'!?\[([^\]]+)\]\((?:[^()]|\([^()]*\))*\)', r'\1', text)
    text = re.sub(r'\[([^\]]+)\]\[[^\]]*\]', r'\1', text)
    text = re.sub(r'<(https?://[^>]+)>', r'\1', text)
    for mark in ('**', '__', '~~', '*', '_'):
        pattern = r'(?<![\w/])' + re.escape(mark) + r'(?=\S)(.+?)(?<=\S)' + re.escape(mark) + r'(?![\w/])'
        text = re.sub(pattern, r'\1', text)
    text = re.sub(r'<br\s*/?>', ' ', text, flags=re.I)
    text = re.sub(r'\\([\\`*{}\[\]()#+.!_|>~-])', r'\1', text)
    text = re.sub(r'\x00(\d+)\x00', lambda m: protected[int(m.group(1))], text)
    return html.unescape(text)


def clean_markdown(text):
    output = []
    fence = None
    prose_fence = False
    for line in text.splitlines():
        marker = re.match(r'^\s*(`{3,}|~{3,})(.*)$', line)
        if marker:
            if fence is None:
                fence = marker.group(1)
                prose_fence = marker.group(2).strip().lower() in ('', 'text', 'markdown', 'md')
                continue
            if marker.group(1)[0] == fence[0] and len(marker.group(1)) >= len(fence) and not marker.group(2).strip():
                fence = None
                continue
        if fence is not None and not prose_fence:
            output.append(line)
            continue
        if re.match(r'^\s*\[[^\]]+\]:\s*\S+', line):
            continue
        if re.fullmatch(r'\s*(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,}|={3,})\s*', line):
            output.append('')
            continue
        line = re.sub(r'^\s{0,3}#{1,6}\s+', '', line)
        line = re.sub(r'\s+#+\s*$', '', line)
        line = re.sub(r'^\s*>\s?', '', line)
        line = re.sub(r'^\s*(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s*)?', '', line)
        stripped = line.strip()
        if stripped.startswith('|') and stripped.endswith('|'):
            cells = re.split(r'(?<!\\)\|', stripped[1:-1])
            if all(re.fullmatch(r'\s*:?-{3,}:?\s*', c) for c in cells):
                continue
            line = '; '.join(inline(c.strip()) for c in cells)
        else:
            line = inline(line)
        output.append(line.rstrip())
    return re.sub(r'\n{3,}', '\n\n', '\n'.join(output)).strip()
