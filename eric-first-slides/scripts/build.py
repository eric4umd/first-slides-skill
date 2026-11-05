#!/usr/bin/env python3
"""content.md → 查账 → 单文件 HTML（精确风格 · 讲者提示）

用法（在任何目录下都行，路径可以有中文和空格）：
  python3 <这个 Skill>/scripts/build.py 某某/content.md                 # 在 content.md 旁边写出 <名字>.html 和 <名字>_查账.md（已有同名就写 _v2，不覆盖）
  python3 <这个 Skill>/scripts/build.py 某某/content.md --open          # 做完用默认浏览器打开
  python3 <这个 Skill>/scripts/build.py 某某/content.md -o 输出目录 --name 文件名
  python3 <这个 Skill>/scripts/build.py 某某/content.md --check         # 只查账，不出 HTML
  python3 <这个 Skill>/scripts/build.py --types                         # 列出页型和每个页型要写的字段
  python3 <这个 Skill>/scripts/build.py --doctor                        # 看这台电脑能不能做、字体走哪条路
  Windows 上把 python3 换成 py -3（没在 Windows 上测过）。

只要 Python 3.8 或更新，不用装任何包：
  - 读 content.md 用的 PyYAML 6.0.3（纯 Python 部分）放在 scripts/_vendor/ 里，MIT 许可，见 _vendor/LICENSE-PyYAML.txt。
  - 字体：装了 fontTools（和 brotli）就只裁这一份用到的字，HTML 约 1 MB；没装就用 fonts/ready/ 里事先裁好的常用字体
    （GB2312 全部 6763 个汉字），HTML 约 3 MB，常用字体里没有的字用电脑自带的字体显示，会列出来。

content.md 的写法见 references/content写法.md，页型和字段见 references/页型库.md。简单说：
  开头 --- 之间写这一套的信息（who / deck / section / foot）；
  每页一个 "## 标题"，下面一个 ```yaml 块，第一行 type: 页型名。yaml 块以外的文字是写给自己看的笔记，不进幻灯片。

做三件事：
  1. 查账：数字加起来对不对、公式算不算得通、标题里的数在数据里找不找得到、该有出处的有没有出处。
     有“错”就停下来不出 HTML；只有“提醒”照样出，提醒全写进 查账.md。
  2. 字体：Inter、Noto Sans SC（SIL Open Font License 1.1），内嵌进 HTML。
  3. 单文件 HTML：引擎、样式、字体、内容全在一个文件里，双击就能开，不连网。
"""
import sys
if sys.version_info < (3, 8):
    sys.exit(f'这台电脑的 Python 是 {sys.version.split()[0]}，要 3.8 或更新：换一个新一点的 python3 再运行这条命令。')
for _s in (sys.stdout, sys.stderr):   # Windows 控制台不是 UTF-8 时，中文提示不至于报错
    try: _s.reconfigure(encoding='utf-8', errors='replace')
    except Exception: pass
import argparse, base64, datetime as dt, io, json, math, os, pathlib, re, subprocess, webbrowser
from decimal import Decimal, ROUND_HALF_UP

ROOT = pathlib.Path(__file__).resolve().parent.parent   # Skill 根目录：engine/、fonts/、scripts/ 都在这下面
sys.dont_write_bytecode = True   # 不在 Skill 文件夹里留 __pycache__
sys.path.insert(0, str(ROOT / 'scripts' / '_vendor'))   # 用自带的 PyYAML，跟电脑上装没装、装的哪一版都无关
import yaml


# ───────────────────────── 读 content.md ─────────────────────────
class Loader(yaml.SafeLoader):
    """不把 4:44 读成 284（六十进制），不把 2027-01-11 读成日期对象"""
Loader.yaml_implicit_resolvers = {k: [(t, r) for t, r in v if t not in ('tag:yaml.org,2002:timestamp', 'tag:yaml.org,2002:int', 'tag:yaml.org,2002:float')]
                                  for k, v in yaml.SafeLoader.yaml_implicit_resolvers.items()}
Loader.add_implicit_resolver('tag:yaml.org,2002:int', re.compile(r'^[-+]?(?:0|[1-9][0-9_]*)$'), list('-+0123456789'))
Loader.add_implicit_resolver('tag:yaml.org,2002:float', re.compile(r'^[-+]?(?:[0-9][0-9_]*)?\.[0-9]+$'), list('-+.0123456789'))


def parse_md(text):
    meta, body = {}, text
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.S)
    if m:
        meta = yaml.load(m.group(1), Loader=Loader) or {}
        body = text[m.end():]
    pages, heads = [], []
    parts = re.split(r'^## +(.*)$', body, flags=re.M)
    for i in range(1, len(parts), 2):
        head, chunk = parts[i].strip(), parts[i + 1]
        blk = re.search(r'```ya?ml\s*\n(.*?)```', chunk, re.S)
        if not blk:
            raise SystemExit(f'“## {head}” 下面没有 ```yaml 块')
        try:
            d = yaml.load(blk.group(1), Loader=Loader)
        except yaml.YAMLError as e:
            raise SystemExit(f'“## {head}” 的 yaml 写错了：\n{e}')
        if not isinstance(d, dict):
            raise SystemExit(f'“## {head}” 的 yaml 不是“字段: 值”的样子')
        pages.append(d); heads.append(head)
    return meta, pages, heads


# ───────────────────────── 页型库：每个页型要写什么 ─────────────────────────
# 记号：s 文字；s? 可不写；n 数；n? ；v 显示用的数（写数或带单位的文字都行，原样显示）；d 日期 2027-01-11
#       [x] 一串；{..} 一组字段；lo–hi 是这一串能放几个（多了版面放不下）
def sgn_(v): return ('+' if v > 0 else '−' if v < 0 else '') + fmt(abs(v))
def L(item, lo=1, hi=99, opt=False): return {'list': item, 'lo': lo, 'hi': hi, 'opt': opt}
def O(d, opt=False): return {'obj': d, 'opt': opt}

PT = {
    'cover': ('封面：一个大数 + 两张三层卡（期初期末、另外几个数）+ 每周走势', {
        'big': O({'sign': 's?', 'v': 'v', 'unit': 's?', 'src': 's?', 'how': 's?'}),
        'from': O({'label': 's', 'v': 'v', 'src': 's?'}), 'to': O({'label': 's', 'v': 'v', 'src': 's?'}),
        'kpis': L({'label': 's', 'a': 'v', 'b': 'v', 'unit': 's?', 'src': 's?'}, 2, 3),
        'ftCard': O({'label': 's', 'tag': 's?', 'say': 's?'}, opt=True), 'kpisCard': O({'label': 's', 'say': 's?', 'note': 's?'}, opt=True),
        'bridge': 's?', 'weeks': L('n', 6, 31), 'weeksLabel': 's?', 'weeksSrc': 's?'}),
    'trend': ('趋势：一条线，标出转折、两段平均、一个低谷', {
        'unit': 's?', 'weeks': L('n', 6, 31, opt=True), 'event': O({'at': 'n', 'text': 's'}, opt=True),
        'avg': L({'from': 'n', 'to': 'n', 'label': 's'}, 2, 2, opt=True), 'dip': O({'at': 'n', 'text': 's'}, opt=True), 'src': 's?'}),
    'target': ('目标对照：每个目标一行，做到没做到一眼看出', {
        'goals': L({'label': 's', 'target': 'n', 'actual': 'n', 'unit': 's?', 'lower': 'b?', 'dg': 'n?', 'src': 's?'}, 3, 5), 'miss': 's?', 'missOn': 's?'}),
    'kpis': ('六个数：每格一个数 + 变化 + 一句话 + 一条小走势', {
        'tiles': L({'label': 's', 'v': 'v', 'unit': 's?', 'd': 'v', 'good': 's?', 'bad': 'b?', 'say': 's?', 'spark': L('n', 4, 31), 'agg': 's?', 'src': 's?'}, 6, 6), 'vs': 's?', 'note': 's?'}),
    'bridge': ('拆解桥：从起点一步步走到终点，每步多少', {
        'start': O({'label': 's', 'v': 'n', 'src': 's?'}), 'end': O({'label': 's', 'v': 'n', 'src': 's?'}),
        'steps': L({'label': 's', 'v': 'n', 'note': 's?', 'src': 's?', 'a': 'n?', 'b': 'n?', 'pct': 'b?', 'inv': 'b?', 'rest': 'b?'}, 2, 6),
        'unit': 's?', 'kind': 's?', 'scale': 'n?', 'negOn': 's?'}),
    'argue': ('论证：一个主张 + 三条依据 + 一条反方和回应', {
        'claim': 's', 'evidence': L({'n': 's', 'tag': 's', 'big': 'v', 'unit': 's?', 'text': 's', 'detail': 's?', 'bars': L('bar', 2, 3), 'src': 's?'}, 3, 3),
        'counter': O({'q': 's', 'a': 's', 'src': 's?'}, opt=True)}),
    'dist': ('分布：一个点一个人，前后两排对照，按分数线数人', {
        'a': O({'label': 's', 'scores': L('n', 10, 80), 'src': 's?'}), 'b': O({'label': 's', 'scores': L('n', 10, 80), 'src': 's?'}),
        'cuts': L('n', 2, 2), 'unit': 's?', 'next': 's?', 'follow': 's?'}),
    'heat': ('格子表：一行一个人、一列一周（1 按时 2 迟交 0 没交）', {
        'grid': 's', 'ev': 'n?', 'who': L('s', 0, 4, opt=True), 'src': 's?'}),
    'compare': ('前后对比：同一件事以前花多久、现在花多久', {
        'n': 'n', 'a': O({'label': 's', 'perSec': 'n', 'total': 's', 'ret': 's?', 'src': 's?'}),
        'b': O({'label': 's', 'perSec': 'n', 'total': 's', 'ret': 's?', 'src': 's?'}),
        'split': L({'who': 's', 'text': 's'}, 2, 2)}),
    'compose': ('构成对比：一样东西拆成几块，前后两条对照', {
        'parts': L('s', 2, 5), 'a': O({'label': 's', 'v': L('n', 2, 5), 'src': 's?'}), 'b': O({'label': 's', 'v': L('n', 2, 5), 'src': 's?'}),
        'unit': 's?', 'note': 's?', 'chart': 's?', 'per': 's?', 'pick': 's?', 'bigLabel': 's?', 'noteLabel': 's?', 'sumLabel': 's?',
        'at': 's?', 'doing': 's?', 'done': 's?'}),
    'process': ('流程：几步，每步谁做、花多久，标出最关键的一步', {
        'steps': L({'day': 's', 'who': 's', 'text': 's', 'time': 's', 'note': 's?', 'key': 'b?'}, 3, 5), 'why': 's?', 'otherLabel': 's?'}),
    'versions': ('改了几版：每版还剩几处毛病、你说了什么', {
        'vers': L({'v': 's', 'n': 'n', 'note': 's', 'said': 'b?'}, 2, 5), 'src': 's?'}),
    'gallery': ('作品墙：三份东西并排（目前画的是练习单的样子）', {
        'items': L({'tag': 's', 'name': 's', 'meta': 's?', 'note': 's?', 'who': 's?'}, 3, 3), 'passage': 's?', 'note': 's?'}),
    'funnel': ('漏斗：一步步还剩多少，掉得最多的那一步', {
        'stages': L({'label': 's', 'v': 'n'}, 3, 6), 'unit': 's?', 'chart': 's?', 'fix': 's?', 'fixLabel': 's?', 'by': 's?', 'src': 's?'}),
    'rank': ('排行：从大到小一根根条，平均一根虚线，最高是最低的几倍', {
        'items': L({'label': 's', 'v': 'n', 'src': 's?'}, 3, 8), 'unit': 's?', 'metric': 's?', 'itemLabel': 's?', 'hot': 'n?', 'note': 's?', 'noteLabel': 's?', 'src': 's?'}),
    'quote': ('原话：一句原话 + 多少人这么说', {
        'quote': 's', 'who': 's', 'n': 'n?', 'k': 'n?', 'stat': 's?', 'statSrc': 's?', 'quote2': 's?', 'who2': 's?'}),
    'voices': ('多条原话：好的不好的都放上来', {
        'items': L({'text': 's', 'tag': 's?', 'tone': 's?'}, 4, 8), 'src': 's?'}),
    'chapter': ('章节页：大编号 + 这一部分讲什么', {
        'no': 's', 'parts': L('s', 2, 4)}),
    'options': ('两个方案对照，标出推荐哪个', {
        'plans': L({'key': 's', 'name': 's', 'vals': 'map', 'risk': 's?', 'note': 's?'}, 2, 2),
        'rows': L({'k': 's', 'label': 's', 'unit': 's?', 'short': 's?'}, 2, 5), 'pick': 's', 'src': 's?'}),
    'gantt': ('时间表：几件事从哪天到哪天，几个关键日子', {
        'start': 'd', 'end': 'd', 'rows': L({'label': 's', 'who': 's?', 'from': 'd', 'to': 'd', 'key': 'b?'}, 3, 7),
        'miles': L({'at': 'd', 'label': 's'}, 0, 3, opt=True), 'src': 's?'}),
    'risk': ('风险：会不会发生 × 影响多大，每件一条退路', {
        'items': L({'n': 's', 'text': 's', 'p': 'n', 'i': 'n', 'plan': 's'}, 2, 4)}),
    'people': ('分工：几个人各做什么、每周多花多久', {
        'people': L({'name': 's', 'role': 's', 'does': 's', 'time': 's'}, 2, 5), 'note': 's?', 'bottom': O({'label': 's', 'text': 's'}, opt=True)}),
    'calc': ('推演器：几个能拖的数，一个公式，标题跟着变（标题里写 {hours}）', {
        'params': L({'key': 's', 'label': 's', 'min': 'n', 'max': 'n', 'step': 'n', 'def': 'n', 'unit': 's?', 'note': 's?'}, 2, 5),
        'formula': 's', 'formulaText': 's?', 'result': O({'label': 's', 'unit': 's?', 'digits': 'n?'}), 'assume': 's?', 'src': 's?'}),
    'ask': ('请批：要什么、换来什么、哪天前定', {
        'needs': L({'text': 's', 'sub': 's?'}, 1, 3), 'gets': L({'v': 'v', 'unit': 's?', 'text': 's', 'src': 's?'}, 1, 3),
        'deadline': 's', 'asof': 'd', 'due': 'd', 'next': L({'at': 'd', 'label': 's'}, 2, 5), 'nextSrc': 's?'}),
    # —— 讲者提示方向（2026-11-03）：一页一个主角，细节进讲者备注 notes ——
    'cue': ('提示页：一句引子 + 一个大数 + 一句判断（标题），点一下出一条安静的小图', {
        'lead': 's?', 'big': O({'sign': 's?', 'pre': 's?', 'v': 'v', 'exact': 'n?', 'unit': 's?', 'tone': 's?', 'src': 's?', 'how': 's?'}), 'sub': 's?',
        'band': 'x?',   # v2.3：false 不加封面那截底板；{ text: '…' } 换掉底板上的字
        'pair': L({'label': 's', 'v': 'v', 'unit': 's?', 'hi': 'b?', 'src': 's?'}, 2, 2, opt=True),   # v2.4：右边一栏两块竖块比一对数（没有 strip 时才画）
        'strip': O({'kind': 's', 'v': L('n', 4, 31, opt=True), 'hiFrom': 'n?', 'labels': L({'at': 'n', 'text': 's', 'hi': 'b?'}, 0, 4, opt=True),
                    'steps': L({'label': 's', 'v': 'n'}, 3, 5, opt=True), 'hi': 'n?', 'items': L({'label': 's', 'ok': 'b', 'src': 's?'}, 3, 6, opt=True), 'src': 's?'}, opt=True)}),
    'cue3': ('核心论证：标题是主张，三列各一个数 + 一句话', {
        'items': L({'v': 'v', 'sign': 's?', 'unit': 's?', 'tone': 's?', 'text': 's', 'sub': 's?', 'src': 's?', 'how': 's?', 'gridUnit': 's?', 'grid': 'b?'}, 2, 3)}),
    'cueline': ('数据页：一条线占满整页，只标转折和前后两段平均', {
        'series': L('n', 6, 31), 'event': O({'at': 'n', 'text': 's'}), 'avg': L({'from': 'n', 'to': 'n', 'label': 's', 'how': 's?'}, 2, 2), 'unit': 's?', 'max': 'n?', 'src': 's?',
        'start': 'n?', 'avgDigits': 'n?', 'maxStep': 'n?'}),   # v2.3：start 第一个点是几月；event.at、avg 的 from／to 写月份
    'cueask': ('请批（提示版）：哪天前、批哪两件、换来什么', {
        'lead': 's', 'needs': L({'v': 'v', 'unit': 's?', 'text': 's', 'src': 's?', 'how': 's?'}, 1, 2), 'gets': O({'pre': 's?', 'v': 'v', 'exact': 'n?', 'unit': 's?', 'text': 's', 'src': 's?', 'how': 's?', 'link': 'b?', 'linkNote': 's?', 'exactUnit': 's?', 'exactDigits': 'n?'}),
        'due': 'd?'}),   # v2.3：due 写了就按它画那一周；不写照旧从 lead 里读“X 月 X 日（周X）”
    'cuebridge': ('数据页：多出来的从哪来，一项一格，柱子只画变化那一截（hi 那项强调色，往下走的斜纹）', {
        'start': O({'label': 's', 'v': 'n', 'src': 's?'}), 'end': O({'label': 's', 'v': 'n', 'src': 's?'}),
        'steps': L({'label': 's', 'v': 'n', 'hi': 'b?', 'src': 's?'}, 2, 5), 'lo': 'n', 'hi': 'n', 'unit': 's?', 'digits': 'n?'}),
    'cueshift': ('数据页：钱从哪挪到哪，去年今年两根长条，同一项连起来，今年下面写多了少了多少', {
        'parts': L('s', 2, 5), 'a': O({'label': 's', 'v': L('n', 2, 5), 'src': 's?'}), 'b': O({'label': 's', 'v': L('n', 2, 5), 'src': 's?'}), 'hi': 's?', 'unit': 's?', 'digits': 'n?',
        'tall': 'b?'}),   # v2.4：tall: true 两根长条加高、拉开，占满标题下面
    'cuepick': ('提示页：两个做法，推荐的那个是主角（推荐 X＋强调色大数），另一个缩成右边对照；底下一行选它多什么，单位跟两个做法一样', {
        'lead': 's', 'plans': L({'key': 's', 'name': 's', 'pre': 's?', 'v': 'v', 'exact': 'n?', 'unit': 's?', 'text': 's', 'pick': 'b?', 'src': 's?', 'how': 's?'}, 2, 2),
        'diff': O({'text': 's', 'pre': 's?', 'v': 'v', 'exact': 'n?', 'unit': 's?', 'src': 's?', 'how': 's?'})}),
    'cuecalc': ('推演器（提示版）：几根能拖的滑块，右边只有结果一个大数；算式和假设进备注', {
        'params': L({'key': 's', 'label': 's', 'min': 'n', 'max': 'n', 'step': 'n', 'def': 'n', 'unit': 's?', 'note': 's?'}, 2, 4),
        'formula': 's', 'formulaText': 's?', 'result': O({'label': 's', 'pre': 's?', 'unit': 's?', 'approx': 's?', 'digits': 'n?'}), 'sub': 's?', 'src': 's?',
        'grid': 'x?', 'limit': 'n?', 'limitLabel': 's?', 'limitMax': 'n?'}),   # v2.3：grid false／{rows, cols, label}；limit 上限线
}
# 这 6 个页型是照一份老师学期总结的样张做的，代码里还写死了那份样张的话（“按时交作业”“C 档题”“另外 3 位老师”、练习单的样子），
# 放别人的内容会把那些话带进去，所以这里不让用，查账报“错”，并说换成哪个页型。
SAMPLE_ONLY = {'calc': '推演器换成 cuecalc', 'compare': '前后对比换成 cue3（v 写成“92 → 143”）或 cueshift',
               'heat': '每周走势换成 cueline，或 cue 加 strip（kind: bars）', 'voices': '原话换成 quote',
               'gantt': '时间安排写进 cueask 的 needs 和 due，或者用 process', 'gallery': '这个页型画的是练习单，不能放图片，先不用'}
COMMON = {'type': 's', 'kicker': 's?', 'title': 's', 'stand': 's?', 'notes': L('s', 0, 8, opt=True), 'turn': 's?'}
TURNS = ('chapter', 'grow', 'cols', 'rise', 'step', 'carry', 'close', 'hatch')   # turn: 指定这一页翻进来的做法（讲者提示页）
CUE_T = ('cue', 'cue3', 'cueline', 'cueask', 'cuebridge', 'cueshift', 'cuepick', 'cuecalc')   # 8 种提示页
# 哪些地方要写出处（src）。写在这里的路径没有 src，S 键核查时会标成“没写出处”。
NEED_SRC = {
    'cover': ['big', 'from', 'to', 'kpis[]'], 'trend': ['.'], 'target': ['goals[]'], 'kpis': ['tiles[]'],
    'bridge': ['start', 'end', 'steps[]'], 'argue': ['evidence[]', 'counter'], 'dist': ['a', 'b'], 'heat': ['.'],
    'compare': ['a', 'b'], 'compose': ['a', 'b'], 'versions': ['.'], 'funnel': ['.'], 'rank': ['.'], 'voices': ['.'],
    'options': ['.'], 'gantt': ['.'], 'calc': ['.'], 'ask': ['gets[]'],
    'cuebridge': ['start', 'end', 'steps[]'], 'cueshift': ['a', 'b'], 'cuepick': ['plans[]'], 'cuecalc': ['.'],
    'cue': ['pair[]'],   # v2.4：一对竖块每块都要出处；没写 pair 的提示页不查
}


# ───────────────────────── 查账 ─────────────────────────
class Book:
    def __init__(self): self.err, self.warn, self.ok = [], [], []
    def e(self, where, msg): self.err.append((where, msg))
    def w(self, where, msg): self.warn.append((where, msg))
    def k(self, where, msg): self.ok.append((where, msg))


def isnum(x): return isinstance(x, (int, float)) and not isinstance(x, bool)
def num(x):
    if isnum(x): return float(x)
    if isinstance(x, str):
        m = re.fullmatch(r'\s*([-+−]?)\s*(\d[\d,]*(?:\.\d+)?)\s*', x)
        if m: return (-1 if m.group(1) in '-−' and m.group(1) else 1) * float(m.group(2).replace(',', ''))
    return None
def rnd(v, d=0):
    """四舍五入，跟引擎一样：先去掉浮点尾巴（24.549999… 按 24.55 算 → 24.6）"""
    return float(Decimal(repr(round(v, 9))).quantize(Decimal(1).scaleb(-d), ROUND_HALF_UP))
def dec(x):
    s = str(x); return len(s.split('.')[1]) if '.' in s else 0
def fmt(v, d=1):
    v = round(v, d); return str(int(v)) if v == int(v) else f'{v:.{d}f}'.rstrip('0').rstrip('.')
def date(s):
    try: return dt.date.fromisoformat(str(s))
    except ValueError: return None


def check_shape(bk, where, spec, val, path):
    """字段齐不齐、类型对不对、一串放几个"""
    if isinstance(spec, dict) and 'list' not in spec and 'obj' not in spec: spec = O(spec)
    if isinstance(spec, dict) and 'list' in spec:
        if val is None:
            if not spec['opt']: bk.e(where, f'{path} 没写')
            return
        if not isinstance(val, list): bk.e(where, f'{path} 要写成一串（- 开头）'); return
        if not spec['lo'] <= len(val) <= spec['hi']:
            rng = f"{spec['lo']}" if spec['lo'] == spec['hi'] else f"{spec['lo']}–{spec['hi']}"
            bk.e(where, f'{path} 写了 {len(val)} 个，这个页型放 {rng} 个')
        for i, x in enumerate(val): check_shape(bk, where, spec['list'], x, f'{path}[{i + 1}]')
        return
    if isinstance(spec, dict) and 'obj' in spec:
        if val is None:
            if not spec['opt']: bk.e(where, f'{path} 没写')
            return
        if not isinstance(val, dict): bk.e(where, f'{path} 要写成几个“字段: 值”'); return
        for k, s in spec['obj'].items(): check_shape(bk, where, s, val.get(k), f'{path}.{k}')
        for k in val:
            if k not in spec['obj']: bk.w(where, f'{path}.{k} 这个页型不认识，会被忽略')
        return
    opt = spec.endswith('?'); base = spec.rstrip('?')
    if val is None:
        if not opt: bk.e(where, f'{path} 没写')
        return
    if base == 's' and not isinstance(val, str): bk.e(where, f'{path} 要写文字')
    if base == 'n' and not isnum(val): bk.e(where, f'{path} 要写一个数（不带单位）')
    if base == 'v' and not (isinstance(val, str) or isnum(val)): bk.e(where, f'{path} 要写数或文字')
    if base == 'b' and not isinstance(val, bool): bk.e(where, f'{path} 写 true 或 false')
    if base == 'd' and not date(val): bk.e(where, f'{path} 日期写成 2027-01-11 这样')
    if base == 'map' and not isinstance(val, dict): bk.e(where, f'{path} 要写成几个“字段: 数”')
    if base == 'bar' and not (isinstance(val, list) and 3 <= len(val) <= 4 and isinstance(val[0], str) and isnum(val[1])):
        bk.e(where, f'{path} 写成 [名字, 数, 显示的字]，重点那根加第 4 个 1')


def walk_src(d, path):
    """按 NEED_SRC 的路径取出要有出处的那几组"""
    if path == '.': return [('这一页', d)]
    if path.endswith('[]'):
        arr = d.get(path[:-2]) or []
        return [(f'{path[:-2]}[{i + 1}]', x) for i, x in enumerate(arr) if isinstance(x, dict)]
    x = d.get(path); return [(path, x)] if isinstance(x, dict) else []


NUM_RE = re.compile(r'(?<![\d.])\d{1,3}(?:,\d{3})+(?:\.\d+)?|(?<![\d.])\d+(?:\.\d+)?')
def nums_in(s): return [m.group(0).replace(',', '') for m in NUM_RE.finditer(s)]
def all_numbers(x, skip=()):
    out = []
    if isinstance(x, dict):
        for k, v in x.items():
            if k not in skip: out += all_numbers(v)
    elif isinstance(x, list):
        for v in x: out += all_numbers(v)
    elif isnum(x): out.append(float(x))
    elif isinstance(x, str): out += [float(n) for n in nums_in(x)]
    return out


def say_check(bk, where, name, say, max_px, known):
    """卡片里那句 24px 的话：一行写完（中文按 24px、其余按 14px 估），里面的数要在数据里找得到"""
    px = sum(24 if ord(c) >= 0x2E80 else 14 for c in str(say))
    if px > max_px: bk.e(where, f"{name}那句话太长，一行放不下（约 {px}px，最多 {max_px}px）：删短，细节挪进出处")
    for s_ in nums_in(str(say)):
        x = float(s_); dg = dec(s_)
        if not any(abs(round(k, dg) - x) < 1e-9 for k in known): bk.w(where, f"{name}那句话里的 {s_} 在数据里找不到（也算不出来）")


def calc_eval(page):
    keys = [p['key'] for p in page['params']]
    f = page.get('formula', '')
    toks = re.findall(r'[A-Za-z_]\w*|\d+(?:\.\d+)?|[-+*/()]|\S', f)
    bad = [t for t in toks if not (t in keys or re.fullmatch(r'\d+(?:\.\d+)?|[-+*/()]', t))]
    if bad: return None, f'公式里有认不出的东西：{" ".join(bad)}（只能用参数名、数字和 + − × ÷ 括号）'
    env = {p['key']: float(p['def']) for p in page['params']}
    try: return eval(f, {'__builtins__': {}}, env), None   # 只剩参数名、数字和运算符，上面已经筛过
    except Exception as e: return None, f'公式算不出来：{e}'


def audit(meta, pages, heads):
    bk = Book()
    if len(pages) > 20: bk.w('整套', f'写了 {len(pages)} 页，偏多：看看有没有能并到备注里的页')
    for k in ('who', 'deck', 'foot'):
        if not meta.get(k): bk.w('开头信息', f'没写 {k}' + ('（页脚）' if k == 'foot' else ''))
    types = [p.get('type') for p in pages]
    pd = meta.get('period', '周')
    if pd not in ('周', '月', '天'): bk.e('开头信息', f'period 只能写 周、月、天，现在写的是 {pd}')
    if pd == '天' and not re.match(r'^\d{4}-\d{2}-\d{2}$', str(meta.get('periodStart', ''))): bk.e('开头信息', 'period 是 天 时，periodStart 要写第一天的日期，比如 2026-10-01')
    if pd == '月' and not (isinstance(meta.get('periodStart', 1), int) and 1 <= meta.get('periodStart', 1) <= 12): bk.e('开头信息', 'period 是 月 时，periodStart 写从几月开始（1–12），不写就是 1 月')
    def no_say(x):   # 去掉卡片那句话本身，免得自己对自己
        if isinstance(x, dict): return {k: no_say(v) for k, v in x.items() if k not in ('say', 'ftCard', 'kpisCard', 'title', 'notes')}
        return [no_say(v) for v in x] if isinstance(x, list) else x
    deck_nums = [x for p in pages for x in all_numbers(no_say(p))]   # 整套里写过的数（卡片那句话可以引别页的数）
    calc = next((p for p in pages if p.get('type') in ('calc', 'cuecalc')), None)
    calc_v = None
    if calc and isinstance(calc.get('params'), list):
        calc_v, _ = calc_eval(calc)

    for i, (d, head) in enumerate(zip(pages, heads)):
        t = d.get('type'); where = f'第 {i + 1} 页 {t or "?"}（{head}）'
        if t not in PT: bk.e(where, f'没有“{t}”这个页型。能用的：{"、".join(PT)}'); continue
        if t in SAMPLE_ONLY: bk.e(where, f'{t} 这个页型还带着样张里写死的字，不能用：{SAMPLE_ONLY[t]}'); continue
        spec = {**COMMON, **PT[t][1]}
        for k, s in spec.items(): check_shape(bk, where, s, d.get(k), k)
        for k in d:
            if k not in spec: bk.w(where, f'{k} 这个页型不认识，会被忽略')
        if d.get('turn') and d['turn'] not in TURNS: bk.e(where, f"turn: {d['turn']} 不认识，能写的：{'、'.join(TURNS)}")
        if 'band' in d and not (d['band'] is False or (isinstance(d['band'], dict) and set(d['band']) <= {'text'})): bk.e(where, 'band 写 false，或者写 text: 底板上的字')
        if t == 'cuecalc' and 'grid' in d:
            g_ = d['grid']; ks_ = [x.get('key') for x in d.get('params') or []]
            if not (g_ is False or (isinstance(g_, dict) and g_.get('rows') in ks_ and g_.get('cols') in ks_)): bk.e(where, 'grid 写 false，或者写 rows、cols（两个参数的 key）和 label')
        if t == 'cuecalc' and isnum(d.get('limit')):
            v_, e_ = calc_eval(d)
            if not e_:
                dg_ = (d.get('result') or {}).get('digits') or 0; vs_ = round(v_, dg_)
                bk.k(where, f"上限 {fmt(d['limit'], dg_)}：默认值 {fmt(vs_, dg_)}，{'超出 ' + fmt(vs_ - d['limit'], dg_) if vs_ > d['limit'] else '在上限以内'}")
            if any(abs(float(s_) - d['limit']) < 1e-9 for s_ in nums_in(str(d.get('limitLabel') or ''))):
                bk.w(where, f"limitLabel 里写了 {fmt(d['limit'], dg_ if not e_ else 0)}，画面上这个数会出现两遍：limitLabel 只写名字，数和单位会自己加上")
        if t == 'cuecalc' and isinstance(d.get('sub'), str) and sum(28 if ord(c) >= 0x2E80 else 16 for c in d['sub']) > 660 * 2:
            bk.w(where, 'sub 在结果大数下面超过两行（28px，一行约 660px）：删短，细节挪进 notes')
        if any(w_[0] == where for w_ in bk.err): continue   # 形状不对就先不往下算

        known = all_numbers(d, skip=('title', 'stand', 'kicker', 'ftCard', 'kpisCard', 'notes'))
        title = d['title']
        if d.get('stand') and t in CUE_T:   # 提示页的样式里 stand 不上屏，只有手机版用
            bk.w(where, 'stand 在提示页上不显示，只在手机版里出现：要让听的人看到，写进这一页看得见的字段（见页型库开头“提示页上看得见哪几句”）')
        if d.get('stand'):   # 精确风导语一行写完：中文按 18px、其余按 10px 估
            px = sum(18 if ord(c) >= 0x2E80 else 10 for c in str(d['stand']))
            if px > 1680: bk.e(where, f"导语太长，一行放不下（约 {px}px，最多 1680px）：删到 90 个字以内，或者把一部分挪进出处")
        if calc_v is not None:
            title = title.replace('{hours}', fmt(round(calc_v), 0)).replace('{calc}', fmt(calc_v, (calc.get('result') or {}).get('digits') or 0))
        for lst in [v for v in d.values() if isinstance(v, list)]: known.append(len(lst))
        # —— 讲者提示页：字数按投影字号估宽，算得出的数补进 known ——
        def wpx(x, cjk, oth): return sum(cjk if ord(c) >= 0x2E80 else oth * 0.4 if c == ' ' else oth for c in str(x))
        if t in ('cue', 'cueask'):
            if t == 'cue' and wpx(title, 44, 25) > 1680: bk.e(where, f"标题在提示页上是 44px 的一句话，一行放不下（约 {wpx(title, 44, 25):.0f}px，最多 1680px）")
            if d.get('lead') and wpx(d['lead'], 34, 19) > 1680: bk.e(where, 'lead 一行放不下（34px）')
            if d.get('sub') and wpx(d['sub'], 28, 16) > 1680: bk.e(where, 'sub 一行放不下（28px）')
            st_ = d.get('strip') or {}
            if st_.get('steps'):
                vs = [x['v'] for x in st_['steps']]; known += [a_ - b_ for a_, b_ in zip(vs, vs[1:])]
            if st_.get('items'):
                its = st_['items']; known += [sum(1 for x in its if x['ok']), sum(1 for x in its if not x['ok']), len(its)]
            if t == 'cueask':
                if len(d['needs']) == 1: bk.w(where, 'needs 只写了一件，右边那一半会空着：能写两件就写两件，真只有一件也可以')
                for x in d['needs']:
                    if wpx(x['text'], 30, 17) > 812 * 2: bk.e(where, f"需要那句“{x['text']}”超过两行（30px，一列 812px）")
        if t == 'cue3':
            for x in d['items']:
                if wpx(x['text'], 30, 17) > 522 * 2: bk.w(where, f"“{x['text']}”在一列里超过两行（30px，一列约 522px）")
                if x.get('sub') and wpx(x['sub'], 24, 14) > 522 * 2: bk.w(where, f"“{x['sub']}”在一列里超过两行（24px）")
        if t == 'cueline':
            w = d['series']; known += [w[-1], max(w), min(w)]; s0 = d.get('start') or 1; ad = d.get('avgDigits') or 0
            ix = lambda m: m - s0 + 1   # 月份 → 第几个点
            known += [s0, s0 + len(w) - 1]
            if not 1 <= ix(d['event']['at']) <= len(w): bk.e(where, f"event.at {d['event']['at']} 月不在 {s0}–{s0 + len(w) - 1} 月里")
            ms = []
            for a in d['avg']:
                if not 1 <= ix(a['from']) <= ix(a['to']) <= len(w): bk.e(where, f"平均的区间 {a['from']}–{a['to']} 月不在 {s0}–{s0 + len(w) - 1} 月里"); continue
                seg = w[ix(a['from']) - 1:ix(a['to'])]; m_ = rnd(sum(seg) / len(seg), ad); ms.append(m_); known.append(m_)
                bk.k(where, f"{a['label']}：{a['from']}–{a['to']} 月 {len(seg)} 个数平均 {fmt(sum(seg) / len(seg), 3)}，屏上 {fmt(m_, ad)}")
            if len(ms) == 2: known.append(rnd(ms[1] - ms[0], ad))
        if calc_v is not None: known += [calc_v]
        def approx_ok(o, nm):
            if not isinstance(o, dict) or o.get('exact') is None: return
            sv, ex = num(o['v']), float(o['exact']); scl = 1e4 if str(o.get('unit', '')).startswith('万') else 1; dg_ = dec(o['v'])
            if sv is None: bk.e(where, f"{nm} 写了 exact，v 要写成数"); return
            ok = abs(ex / scl - sv) <= 0.5 * 10 ** -dg_ + 1e-9 or (dg_ == 0 and sv % 100 == 0 and abs(ex / scl - sv) <= 50)
            if ok: bk.k(where, f"{nm} 显示 {o.get('pre', '')}{o['v']}{o.get('unit', '')}，精确是 {fmt(ex)}，取整对得上")
            elif scl > 1 and abs(ex - sv) <= 0.5 * 10 ** -dg_ + 1e-9: bk.e(where, f"{nm} 显示 {o['v']}{o.get('unit', '')}，exact 写的 {fmt(ex)} 是按“万”写的：单位以“万”开头时 exact 写成元，这里应填 {fmt(ex * scl, 2)}")
            else: bk.e(where, f"{nm} 显示 {o['v']}{o.get('unit', '')}，精确是 {fmt(ex)}，取整对不上" + (f"（单位以“万”开头时 exact 写成元：{o['v']}{o.get('unit', '')} 写 {fmt(sv * scl, 2)} 左右的数）" if scl > 1 else ''))
            if calc_v is not None and o.get('exact') and abs(ex - calc_v) > 0.5 and nm.endswith('（推演器）'): bk.e(where, f"{nm} 精确数 {fmt(ex)} 和推演器默认算出来的 {fmt(calc_v)} 不一样")
            known.extend([ex / scl, ex])
        for nm_, o_ in [('大数', d.get('big')), ('换来', d.get('gets')), ('差', d.get('diff'))] + [(f"方案 {x.get('key')}", x) for x in d.get('plans') or [] if isinstance(x, dict)]:
            approx_ok(o_, nm_)
        for nm_, o_ in [('大数', d.get('big'))] + [(f"第 {i + 1} 项", x) for k_ in ('items', 'needs') for i, x in enumerate(d.get(k_) or [])]:
            if isinstance(o_, dict) and o_.get('sign') and str(o_.get('v', '')).strip()[:1] in ('+', '-', '−'):
                bk.e(where, f"{nm_} 的 v 已经带了正负号（{o_['v']}），sign 又写了 {o_['sign']}，会显示两个号：留一个就行")
        known += [x / 1e4 for x in list(known) if isnum(x) and abs(x) >= 1e4] + [round(x, -2) for x in list(known) if isnum(x) and abs(x) >= 1000]
        if t == 'cuebridge':
            s_ = d['start']['v'] + sum(x['v'] for x in d['steps'])
            if abs(s_ - d['end']['v']) > 1e-9: bk.e(where, f"起点 {fmt(d['start']['v'])} 加各项 = {fmt(s_)}，终点写的是 {fmt(d['end']['v'])}")
            else: bk.k(where, f"{fmt(d['start']['v'])} + 各项 = {fmt(s_)} = 终点")
            vs_ = [d['start']['v'], d['end']['v']]; cum_ = d['start']['v']
            for x in d['steps']: cum_ += x['v']; vs_.append(cum_)
            if not (d['lo'] < min(vs_) and d['hi'] > max(vs_)): bk.e(where, f"lo、hi 要把 {fmt(min(vs_))}–{fmt(max(vs_))} 包进去")
            if sum(1 for x in d['steps'] if x.get('hi')) > 1: bk.w(where, '标了不止一项 hi；一页一个主角')
            known += [d['end']['v'] - d['start']['v']] + [abs(x['v']) for x in d['steps']]
        if t == 'cueshift':
            A_, B_ = d['a']['v'], d['b']['v']
            if not len(A_) == len(B_) == len(d['parts']): bk.e(where, f"parts {len(d['parts'])} 块，a {len(A_)} 个数，b {len(B_)} 个数，要一样多")
            else:
                known += [sum(A_), sum(B_), sum(B_) - sum(A_)] + [abs(b_ - a_) for a_, b_ in zip(A_, B_)]
                bk.k(where, f"合计 {fmt(sum(A_))} → {fmt(sum(B_))}，差 {sgn_(sum(B_) - sum(A_))}；每项差 " + '、'.join(f"{p_} {sgn_(b_ - a_)}" for p_, a_, b_ in zip(d['parts'], A_, B_)))
            if d.get('hi') and d['hi'] not in d['parts']: bk.e(where, f"hi: {d['hi']} 不在 parts 里")
        if t == 'cuepick':
            if sum(1 for x in d['plans'] if x.get('pick')) != 1: bk.e(where, '两个做法里要有且只有一个 pick: true')
            ex_ = [x.get('exact') for x in d['plans']]
            if all(isnum(x) for x in ex_) and isnum(d['diff'].get('exact')) and abs(abs(ex_[0] - ex_[1]) - d['diff']['exact']) > 0.5:
                bk.e(where, f"两个做法差 {fmt(abs(ex_[0] - ex_[1]))}，diff.exact 写的是 {fmt(d['diff']['exact'])}")
            elif all(isnum(x) for x in ex_): bk.k(where, f"两个做法差 {fmt(abs(ex_[0] - ex_[1]))}，和 diff 一致")
            # 听众会拿屏上两个数心算差：屏上写的差要跟心算出来的一样（独立复核 P3-1：2.2 万 − 1.9 万 心算 3,000，屏上写约 2,900）
            scl_ = lambda o: 1e4 if str(o.get('unit', '')).startswith('万') else 1
            sv_ = [num(x['v']) for x in d['plans']] + [num(d['diff']['v'])]
            if None not in sv_:
                ment_ = abs(sv_[0] * scl_(d['plans'][0]) - sv_[1] * scl_(d['plans'][1])); dsh_ = sv_[2] * scl_(d['diff'])
                if abs(ment_ - dsh_) > 0.5 * 10 ** -dec(d['diff']['v']) * scl_(d['diff']) + 1e-6:
                    bk.w(where, f"屏上两个做法是 {d['plans'][0]['v']}{d['plans'][0].get('unit', '')} 和 {d['plans'][1]['v']}{d['plans'][1].get('unit', '')}，听众心算差 {fmt(ment_)}，差那行写的是 {d['diff']['v']}{d['diff'].get('unit', '')}；改成同一个单位、同样取整")
                else: bk.k(where, f"屏上两个数心算的差 = 差那行写的 {d['diff'].get('pre', '')}{d['diff']['v']}{d['diff'].get('unit', '')}")
            if calc_v is not None:
                pk_ = next((x for x in d['plans'] if x.get('pick')), {})
                if isnum(pk_.get('exact')) and abs(pk_['exact'] - calc_v) > 0.5: bk.e(where, f"推荐的做法精确数 {fmt(pk_['exact'])}，推演器默认算出来 {fmt(calc_v)}")
                elif isnum(pk_.get('exact')): bk.k(where, f"推荐的做法 {fmt(pk_['exact'])} = 推演器默认值")
        if t == 'cuecalc':
            for p_ in d['params']:
                if not p_['min'] <= p_['def'] <= p_['max']: bk.e(where, f"“{p_['label']}”默认值 {p_['def']} 不在 {p_['min']}–{p_['max']} 里")
            v_, err_ = calc_eval(d)
            if err_: bk.e(where, err_)
            else:
                r_ = d.get('result') or {}
                if r_.get('approx') == '万': bk.k(where, f"{d['formula']}，默认值算出来 {fmt(v_)}，屏上显示 约 {v_ / 1e4:.{r_.get('digits', 1)}f}{r_.get('unit', '')}")
                else: bk.k(where, f"{d['formula']}，默认值算出来 {fmt(v_, 2)}{r_.get('unit', '')}")
        if t == 'cueask' and (d.get('gets') or {}).get('link'):
            if calc_v is None: bk.e(where, 'gets.link 要跟推演器联动，但这份里没有推演页')
            elif not isnum(d['gets'].get('exact')): bk.e(where, 'gets.link 要写 exact（推演器默认值的精确数），不然拖回默认时对不上')
            else:
                g_ = d['gets']; ps_ = [x for x in calc.get('params') or [] if isnum(x.get('def'))]
                for s_ in nums_in(' '.join(str(g_.get(k) or '') for k in ('pre', 'text'))):
                    hit = next((x for x in ps_ if abs(float(s_) - x['def']) < 1e-9), None)
                    if hit: bk.w(where, f"gets.link 开着，换来那句话里写了 {s_}，这是推演器“{hit.get('label', '')}”的默认值：拖滑块时大数会变，这句话里的 {s_} 不变，前后会对不上。这句话里别写会跟着滑块变的数")
        if t == 'cueask' and calc_v is not None and isnum((d.get('gets') or {}).get('exact')):
            if abs(d['gets']['exact'] - calc_v) > 0.5: bk.e(where, f"换来的精确数 {fmt(d['gets']['exact'])}，推演器默认算出来 {fmt(calc_v)}")
            else: bk.k(where, f"换来的 {fmt(d['gets']['exact'])} = 推演器默认值")
        if t in ('process', 'versions'): known += list(range(1, len(d.get('steps') or d.get('vers') or []) + 1))   # 第 N 步、第 N 版

        # —— 每个页型自己的账 ——
        if t == 'compose' and all(isinstance(x, (int, float)) for x in d['a']['v'] + d['b']['v']):
            ta, tb = sum(d['a']['v']), sum(d['b']['v']); known += [ta, tb, abs(tb - ta)] + [abs(y - x) for x, y in zip(d['a']['v'], d['b']['v'])]
        if t == 'argue':   # 依据里几根条加起来（比如“会员日 2,600 + 其他 1,860”）
            for e in d.get('evidence') or []:
                vs = [b_[1] for b_ in e.get('bars') or [] if isinstance(b_, list) and len(b_) > 1 and isinstance(b_[1], (int, float))]
                if len(vs) > 1: known.append(sum(vs))
        if t == 'cover':
            a, b, big = num(d['from']['v']), num(d['to']['v']), num(d['big']['v'])
            sg = -1 if d['big'].get('sign') in ('-', '−') else 1
            tol = 0.5
            if None not in (a, b, big):
                tol = 0.5 * 10 ** -max(dec(d['from']['v']), dec(d['to']['v']), dec(d['big']['v']))
                if abs((b - a) - sg * big) > tol + 1e-9: bk.e(where, f"大数 {d['big'].get('sign', '')}{d['big']['v']} 对不上：{fmt(b)} − {fmt(a)} = {fmt(b - a, 2)}")
                else: bk.k(where, f"{fmt(b)} − {fmt(a)} = {fmt(b - a, 2)}，和大数一致")
            if d['weeks'] and b is not None and abs(sum(d['weeks']) - b) <= tol + 1e-9:
                bk.k(where, f"走势 {len(d['weeks'])} 个数加起来 {fmt(sum(d['weeks']), dec(d['to']['v']))}，和{d['to'].get('label', '期末')}一致")
            elif d['weeks'] and b is not None and abs(d['weeks'][-1] - b) > 1e-9:
                bk.w(where, f"每周走势最后一周是 {fmt(d['weeks'][-1])}，期末写的是 {fmt(b)}；如果是两种测法，在 weeksLabel 里写清楚")
            for k in d['kpis']:
                x, y = num(k['a']), num(k['b'])
                if x is not None and y is not None: known += [abs(y - x)]
            known += [b - a] if None not in (a, b) else []
            fc, kc = d.get('ftCard') or {}, d.get('kpisCard') or {}
            if not d.get('ftCard') or not d.get('kpisCard'): bk.w(where, '没写 ftCard／kpisCard：封面右边两张卡的顶栏只能用默认名字，也没有那句 24px 的话')
            if a and b is not None: known += [abs(b - a) / a * 100]
            for nm, o in (('卡 01（ftCard）', fc), ('卡 02（kpisCard）', kc)):
                if o.get('say'): say_check(bk, where, nm, o['say'], 408, known)
                if o.get('note'):   # 16px 一行：中文 16、空格 4、其余 9，卡内宽 408
                    px = sum(16 if ord(c) >= 0x2E80 else 4 if c == ' ' else 9 for c in str(o['note']))
                    if px > 408: bk.e(where, f"{nm} note 一行放不下（约 {px}px，最多 408px）：删短，细节挪进出处")
                for k_ in ('tag', 'note'):
                    for s_ in nums_in(str(o.get(k_) or '')):
                        if not any(abs(round(x, dec(s_)) - float(s_)) < 1e-9 for x in known): bk.w(where, f"{nm} {k_} 里的 {s_} 在数据里找不到（也算不出来）")
        if t == 'trend':
            cov = next((p for p in pages if p.get('type') == 'cover'), None)
            w = d.get('weeks') or (cov or {}).get('weeks')
            if not w: bk.e(where, '没有每周的数：这一页写 weeks，或者前面要有带 weeks 的封面'); continue
            n = len(w); known += [w[-1], max(w), min(w), n, w.index(max(w)) + 1, round(w[-1] - w[0], 1)]
            for o in (d.get('event'), d.get('dip')):
                if o and not 1 <= o['at'] <= n: bk.e(where, f"第 {o['at']} 周不在 1–{n} 周里")
            ms = []
            for g in d.get('avg') or []:
                if not 1 <= g['from'] <= g['to'] <= n: bk.e(where, f"平均的区间 {g['from']}–{g['to']} 周不对"); continue
                ms.append(sum(w[g['from'] - 1:g['to']]) / (g['to'] - g['from'] + 1))
            known += ms + ([ms[1] - ms[0]] if len(ms) == 2 else [])
            if d.get('event'):
                at = d['event']['at']; known.append(sum(1 for j in range(at, n) if w[j] > w[j - 1]))
                known.append(n - at)
        if t == 'target':
            met = 0
            for g in d['goals']:
                ok = g['actual'] <= g['target'] if g.get('lower') else g['actual'] >= g['target']
                met += ok; dev = abs(g['actual'] - g['target'])
                known += [dev, dev / g['target'] * 100 if g['target'] else 0]
            known += [met, len(d['goals']) - met, len(d['goals'])]
            if d.get('missOn'):
                bad = [g['label'] for g in d['goals'] if not (g['actual'] <= g['target'] if g.get('lower') else g['actual'] >= g['target'])]
                if d['missOn'] not in bad: bk.e(where, f"missOn 写的“{d['missOn']}”不是没做到的目标；没做到的是：{'、'.join(bad) or '没有'}")
            bk.k(where, f"做到 {met}／{len(d['goals'])} 个（按 target 和 actual 算，lower: true 的越少越好）")
        if t == 'kpis':
            for k in d['tiles']:
                v = num(k['v'])
                sp_ = k['spark']; ag = k.get('agg')
                if v is None or not sp_: continue
                if ag == '合计':   # 显示的是这一段的合计，小走势是每一天（每周）的数
                    if abs(sum(sp_) - v) > 0.5 * 10 ** -dec(k['v']) + 1e-9: bk.w(where, f"“{k['label']}”显示 {k['v']}，小走势加起来是 {fmt(sum(sp_), 2)}")
                elif ag == '平均':   # 率、客单价：显示的多半是加权平均，和简单平均会差一点，差 3% 以内不提醒
                    m_ = sum(sp_) / len(sp_)
                    if abs(m_ - v) > max(0.5 * 10 ** -dec(k['v']), abs(v) * 0.03) + 1e-9: bk.w(where, f"“{k['label']}”显示 {k['v']}，小走势的平均是 {fmt(m_, 2)}")
                elif abs(sp_[-1] - v) > 1e-9:
                    bk.w(where, f"“{k['label']}”显示 {k['v']}，小走势最后一个是 {fmt(sp_[-1])}；如果显示的是合计或平均，写 agg: 合计 或 agg: 平均")
            known += [sum(1 for k in d['tiles'] if not k.get('bad')), sum(1 for k in d['tiles'] if k.get('bad'))]
            for k in d['tiles']:   # 精确风每张卡三层：顶栏、大数＋一句 24px、底部小线
                if not k.get('say'): bk.w(where, f"“{k['label']}”没写 say：每张卡要一句 24px 的话（这一格最该记住的事）"); continue
                sp_ = k['spark']; v_ = num(k['v'])
                kn = all_numbers(k, skip=('say',)) + list(range(1, len(sp_) + 1)) + [max(sp_) - min(sp_), sp_[-1] - sp_[0]] + deck_nums
                if v_: kn += [x / v_ * 100 for x in sp_] + [v_ / x for x in sp_ if x]
                say_check(bk, where, f"“{k['label']}”", k['say'], 490, kn)
        if t == 'bridge':
            s = d['start']['v'] + sum(x['v'] for x in d['steps'])
            dg = max([dec(d['start']['v']), dec(d['end']['v'])] + [dec(x['v']) for x in d['steps']])
            if abs(s - d['end']['v']) > 0.5 * 10 ** -dg + 1e-9:
                bk.e(where, f"起点 {fmt(d['start']['v'])} 加各步 = {fmt(s, dg)}，终点写的是 {fmt(d['end']['v'])}，差 {fmt(d['end']['v'] - s, dg)}")
            else: bk.k(where, f"{fmt(d['start']['v'])} + 各步 = {fmt(s, dg)} = 终点")
            fs = [x for x in d['steps'] if 'a' in x and 'b' in x and not x.get('rest')]
            if fs and d.get('kind') == '加':   # 各项相加（比如按渠道拆）：每一步就是 b − a
                for x in fs:
                    if abs((x['b'] - x['a']) - x['v']) > 0.5 * 10 ** -dg + 1e-9: bk.e(where, f"“{x['label']}”{fmt(x['a'])} → {fmt(x['b'])} 是 {fmt(x['b'] - x['a'], dg)}，写的是 {fmt(x['v'])}")
                    else: bk.k(where, f"“{x['label']}”{fmt(x['a'])} → {fmt(x['b'])}，{sgn_(x['b'] - x['a'])}，和写的一致")
            elif fs:   # 写了 a、b：各项相乘，按写的顺序一项一项换成新值，每一步重算一遍
                val = lambda x, k: (1 - x[k] / 100) if x.get('inv') else (x[k] / 100 if x.get('pct') else x[k])
                sc = d.get('scale') or 1; cur = [val(x, 'a') for x in fs]; prod = lambda c: math.prod(c) / sc
                m0 = prod(cur); bk.k(where, f"按公式，起点算出来 {fmt(m0, dg + 1)}（写的 {fmt(d['start']['v'])}）")
                for i, x in enumerate(fs):
                    p0 = prod(cur); cur[i] = val(x, 'b'); stp = prod(cur) - p0
                    if abs(round(stp, dg) - x['v']) > 1e-9: bk.e(where, f"“{x['label']}”这一步按公式是 {fmt(stp, dg)}，写的是 {fmt(x['v'])}")
                    else: bk.k(where, f"“{x['label']}”按公式重算 {fmt(stp, dg + 1)}，和写的一致")
                    known.append(stp)
                rs = [x for x in d['steps'] if x.get('rest')]
                if not rs and abs(prod(cur) - m0 - (d['end']['v'] - d['start']['v'])) > 0.5 * 10 ** -dg + 1e-9:
                    bk.w(where, f"公式各步加起来 {fmt(prod(cur) - m0, dg)}，起点到终点是 {fmt(d['end']['v'] - d['start']['v'], dg)}；差的部分加一步 rest: true（四舍五入、口径差）")
            elif len(d['steps']) >= 3: bk.w(where, '拆解桥没写每一步的 a、b，查账只能对总数，算不了每一步；能写就写上')
            tot_ = d['end']['v'] - d['start']['v']
            for x in d['steps']:   # rest 只该吃掉一点点报数差；吃得太多，说明公式或数有问题
                if x.get('rest') and tot_ and abs(x['v']) > abs(tot_) * 0.02 + 1e-9: bk.w(where, f"“{x['label']}”这一步 {fmt(x['v'])} 超过总变化 {fmt(tot_)} 的 2%；报数差不该这么大，先查公式和数")
            if d.get('negOn') and not any(x['label'] == d['negOn'] and x['v'] < 0 for x in d['steps']): bk.e(where, f"negOn 写的“{d['negOn']}”不是往下走的那一步")
            tot = d['end']['v'] - d['start']['v']; pos = [x['v'] for x in d['steps']]
            known += [abs(v) for v in pos] + [tot, sum(v for v in pos if v > 0)]
            for a_ in range(len(pos)):
                for b_ in range(a_ + 1, len(pos)):
                    known += [pos[a_] + pos[b_], (pos[a_] + pos[b_]) / tot * 100 if tot else 0]
        if t == 'dist':
            lo, hi = d['cuts']
            for side in ('a', 'b'):
                sc = d[side]['scores']
                known += [sum(1 for x in sc if x < lo), sum(1 for x in sc if x >= hi), sum(1 for x in sc if lo <= x < hi), sum(sc) / len(sc), len(sc)]
            if len(d['a']['scores']) != len(d['b']['scores']): bk.w(where, f"前后人数不一样：{len(d['a']['scores'])} 和 {len(d['b']['scores'])}")
        if t == 'heat':
            rows = d['grid'].split('|')
            if len({len(r) for r in rows}) != 1: bk.e(where, f"每一行格子数不一样：{sorted({len(r) for r in rows})}"); continue
            if set(d['grid']) - set('012|'): bk.e(where, 'grid 只能写 0 1 2 和 |')
            n = len(rows[0]); per = [sum(r[j] == '1' for r in rows) for j in range(n)]
            known += per + [len(rows), n, sum(1 for r in rows if '1' not in r)]
            known += [sum(per[:5]) / 5, sum(per[-5:]) / 5] if n >= 10 else []
            if d.get('ev') and not 1 <= d['ev'] <= n: bk.e(where, f"ev 第 {d['ev']} 周不在 1–{n} 里")
        if t == 'compare':
            mins = {}
            for side in ('a', 'b'):
                o = d[side]; sec = o['perSec'] * d['n']; m = re.fullmatch(r'(\d+):(\d\d)', str(o['total']))
                if not m: bk.e(where, f"{side}.total 写成 小时:分钟，比如 4:44"); continue
                want = int(m.group(1)) * 60 + int(m.group(2)); mins[side] = want
                if abs(sec / 60 - want) > 1: bk.e(where, f"{o['label']}：每份 {o['perSec']} 秒 × {d['n']} = {int(sec // 3600)}:{int(sec % 3600 // 60):02d}，写的是 {o['total']}")
                else: bk.k(where, f"{o['label']}：{o['perSec']} 秒 × {d['n']} ≈ {o['total']}")
                known += [int(m.group(1)), int(m.group(2)), o['perSec'] // 60, o['perSec'] % 60]
            if len(mins) == 2:
                df = mins['a'] - mins['b']; known += [df // 60, df % 60, df / mins['a'] * 100 if mins['a'] else 0]
        if t == 'compose':
            A, B = d['a']['v'], d['b']['v']
            if not len(A) == len(B) == len(d['parts']): bk.e(where, f"parts {len(d['parts'])} 块，a {len(A)} 个数，b {len(B)} 个数，要一样多"); continue
            known += [sum(A), sum(B), sum(A) - sum(B)] + [a_ - b_ for a_, b_ in zip(A, B)]
            df_ = sum(B) - sum(A); bk.k(where, f"合计 {fmt(sum(A))} → {fmt(sum(B))}，{'多' if df_ > 0 else '少' if df_ < 0 else '一样'} {fmt(abs(df_))}")
        if t == 'funnel':
            v = [s['v'] for s in d['stages']]
            if any(b_ > a_ for a_, b_ in zip(v, v[1:])): bk.e(where, f"漏斗往下走反而变多了：{v}")
            dr = [a_ - b_ for a_, b_ in zip(v, v[1:])]; known += dr + [v[-1] / v[0] * 100 if v[0] else 0] + [x / v[i] * 100 for i, x in enumerate(dr) if v[i]] + [x / v[0] * 100 for x in v]
            if d.get('by') not in (None, '比例', '人数'): bk.e(where, 'by 只能写 比例 或 人数')
        if t == 'rank':
            v = [x['v'] for x in d['items']]
            if v != sorted(v, reverse=True): bk.w(where, '没按从大到小写；页面会自动排，名次以页面为准')
            if min(v) > 0: known.append(max(v) / min(v))
            known += [sum(v) / len(v), sum(v), max(v) / sum(v) * 100 if sum(v) else 0] + ([v[0] / v[1]] if len(v) > 1 and v[1] else [])
        if t == 'quote' and d.get('n') and d.get('k') is not None:
            if d['k'] > d['n']: bk.e(where, f"k={d['k']} 比 n={d['n']} 还多")
            known.append(d['k'] / d['n'] * 100)
        if t == 'options':
            keys = [p['key'] for p in d['plans']]
            if d['pick'] not in keys: bk.e(where, f"pick: {d['pick']} 不是 {'/'.join(keys)} 里的")
            for r in d['rows']:
                for p in d['plans']:
                    if r['k'] not in p['vals'] or not isnum(p['vals'][r['k']]): bk.e(where, f"方案 {p['key']} 的 vals 里没有数 {r['k']}")
            if calc_v is not None and any(r['k'] == 'hours' for r in d['rows']):
                pv = next((p for p in d['plans'] if p['key'] == d['pick']), {}).get('vals', {}).get('hours')
                if isnum(pv) and abs(pv - round(calc_v)) > 0.5: bk.w(where, f"推荐方案 hours={pv}，推演器默认算出来 {fmt(calc_v)}")
            for r in d['rows']:
                vs = [p['vals'].get(r['k']) for p in d['plans']]
                if all(isnum(x) for x in vs): known.append(abs(vs[0] - vs[1]))
        if t == 'gantt':
            s0, s1 = date(d['start']), date(d['end'])
            if s0 > s1: bk.e(where, 'start 比 end 晚')
            for r in d['rows']:
                a_, b_ = date(r['from']), date(r['to'])
                if a_ > b_: bk.e(where, f"“{r['label']}”开始比结束晚")
                if a_ < s0 or b_ > s1: bk.e(where, f"“{r['label']}”跑到时间表外面去了")
            for m in d.get('miles') or []:
                if not s0 <= date(m['at']) <= s1: bk.e(where, f"关键日子 {m['at']} 在时间表外面")
            days = (s1 - s0).days + 1; known += [days, round(days / 7), days // 7]
        if t == 'risk':
            for x in d['items']:
                if not (1 <= x['p'] <= 3 and 1 <= x['i'] <= 3): bk.e(where, f"“{x['text']}”的 p、i 要在 1–3 之间")
        if t == 'calc':
            keys = [p['key'] for p in d['params']]
            if len(set(keys)) != len(keys): bk.e(where, '参数 key 有重复')
            for p in d['params']:
                if not p['min'] <= p['def'] <= p['max']: bk.e(where, f"“{p['label']}”默认值 {p['def']} 不在 {p['min']}–{p['max']} 里")
                if p['step'] <= 0: bk.e(where, f"“{p['label']}”step 要大于 0")
            v, err = calc_eval(d)
            if err: bk.e(where, err)
            else:
                bk.k(where, f"{d['formula']}，默认值算出来 {fmt(v, 2)}{(d['result'] or {}).get('unit', '')}")
                if '{hours}' not in d['title'] and '{calc}' not in d['title']: bk.w(where, '标题里没写 {hours}，拖滑块时标题不会跟着变')
        if t == 'ask':
            a_, b_ = date(d['asof']), date(d['due'])
            if a_ > b_: bk.e(where, 'asof（今天）比 due（截止）晚')
            ds = [date(x['at']) for x in d['next']]
            if ds != sorted(ds): bk.e(where, 'next 的日子没按先后排')
            if ds: known += [(ds[-1] - ds[0]).days + 1, (ds[-1] - ds[0]).days, (b_ - a_).days]
            for g in d['gets']:
                if '{hours}' in str(g['v']) and calc_v is None: bk.e(where, '写了 {hours}，但这一套没有推演器（calc）页')
        if t in ('gantt', 'ask'):
            for x in all_numbers(d, skip=('title', 'stand', 'kicker')): pass
            for s in re.findall(r'\d{4}-\d\d-\d\d', json.dumps(d, ensure_ascii=False)):
                dd = date(s); known += [dd.month, dd.day] if dd else []

        # —— 出处 ——
        for p_ in NEED_SRC.get(t, []):
            for nm, o in walk_src(d, p_):
                if not (o.get('src') or o.get('statSrc')): bk.w(where, f'{nm} 没写出处（src），按 S 核查会标出来')

        # —— 标题里的数，在这页数据里找得到吗 ——
        if t == 'chapter': continue   # 章节页没有数据，标题是讲下一部分的
        for s in nums_in(re.sub(r'(?<![\d.,])(1[0-2]|[1-9])\s*月', '月', title)):   # “10 月”是月份名，不当数据查
            x = float(s); dg = dec(s)
            if not any(abs(round(k, dg) - x) < 1e-9 for k in known):
                bk.w(where, f'标题里的 {s} 在这页数据里找不到（也算不出来）')
    return bk


# ───────────────────────── 字体 ─────────────────────────
FONT_NOTE = '/* Inter、Noto Sans SC：SIL Open Font License 1.1（见 fonts/OFL-*.txt）'
EXTRA = set('—–·×÷≈→←↑↓…，。、：；！？（）《》「」“”％＋－−＝／')


def _chars(text):
    cs = set(text) | {chr(c) for c in range(0x20, 0x7F)} | EXTRA
    return {c for c in cs if c >= ' '}


def font_subset(text):
    """装了 fontTools：只裁这一份用到的字（最小）。没装 fontTools 会抛 ImportError，交给上一层换路。"""
    from fontTools import subset
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    try:
        import brotli  # noqa: F401  woff2 要它；没有就存成 woff（大一点，照样能用）
        flavor, fmt_ = 'woff2', 'woff2'
    except ImportError:
        flavor, fmt_ = 'woff', 'woff'
    src = ROOT / 'fonts' / 'full'
    chars = _chars(text)
    latin = {c for c in chars if ord(c) < 0x2E80}

    def freeze_tnum(f):
        gsub = f['GSUB'].table; m = {}
        for fr in gsub.FeatureList.FeatureRecord:
            if fr.FeatureTag != 'tnum': continue
            for li in fr.Feature.LookupListIndex:
                for st in gsub.LookupList.Lookup[li].SubTable:
                    st = getattr(st, 'ExtSubTable', st); m.update(getattr(st, 'mapping', {}) or {})
        for t in f['cmap'].tables:
            for cp, g in list(t.cmap.items()):
                if 0x30 <= cp <= 0x39 and g in m: t.cmap[cp] = m[g]
    faces = [('Inter', 'Inter[opsz,wght].ttf', {'opsz': 32, 'wght': (300, 600)}, latin, '300 600'),
             ('Noto Sans SC', 'NotoSansSC[wght].ttf', {'wght': (300, 600)}, chars, '300 600')]
    css, total = [FONT_NOTE + '，只留了这一份用到的字 */'], 0
    for fam, fn, axes, cs, wt in faces:
        # recalcTimestamp=False：不把“现在的时间”写进字体 head 表，同样的输入每次出一样的字节
        f = TTFont(src / fn, recalcTimestamp=False)
        f = instancer.instantiateVariableFont(f, axes); tmp = io.BytesIO(); f.save(tmp); tmp.seek(0); f = TTFont(tmp, recalcTimestamp=False)
        if fam == 'Inter': freeze_tnum(f)
        opt = subset.Options(); opt.flavor = flavor; opt.layout_features = ['*']; opt.name_IDs = ['*']; opt.notdef_outline = True
        sub = subset.Subsetter(opt); sub.populate(unicodes=[ord(c) for c in cs]); sub.subset(f)
        out = io.BytesIO(); f.flavor = flavor; f.save(out); b = out.getvalue(); total += len(b)
        css.append(f"@font-face{{font-family:'{fam}';font-weight:{wt};font-style:normal;font-display:block;src:url(data:font/{fmt_};base64,{base64.b64encode(b).decode()}) format('{fmt_}')}}")
    return '\n'.join(css), total, len(chars), f'只裁用到的字（{flavor}）', []


def font_ready(text):
    """没有 fontTools：用 fonts/ready/ 里事先裁好的字体。里面没有的字列出来，浏览器会用电脑自带的字体显示它们。"""
    rd = ROOT / 'fonts' / 'ready'
    cover = set((rd / 'covered.txt').read_text('utf-8'))
    chars = _chars(text)
    missing = sorted(c for c in chars if c not in cover and not c.isspace())
    css, total = [FONT_NOTE + '，事先裁好的常用字 */'], 0
    for fam, fn in (('Inter', 'Inter-latin.woff2'), ('Noto Sans SC', 'NotoSansSC-common.woff2')):
        b = (rd / fn).read_bytes(); total += len(b)
        css.append(f"@font-face{{font-family:'{fam}';font-weight:300 600;font-style:normal;font-display:block;src:url(data:font/woff2;base64,{base64.b64encode(b).decode()}) format('woff2')}}")
    return '\n'.join(css), total, len(chars), '事先裁好的常用字体', missing


def font_css(text, mode='auto'):
    """返回 (css, 字节数, 字数, 走的哪条路, 没覆盖到的字, 提示)。不管哪条路失败都不停下：最后一条路是不嵌字体、用电脑自带的字体。"""
    notes = []
    if mode in ('auto', 'subset'):
        try:
            return (*font_subset(text), notes)
        except ImportError:
            if mode == 'subset': notes.append('没装 fontTools，换成事先裁好的常用字体')
        except Exception as e:
            notes.append(f'裁字体出错（{type(e).__name__}: {e}），换成事先裁好的常用字体')
    if mode in ('auto', 'subset', 'ready'):
        try:
            return (*font_ready(text), notes)
        except Exception as e:
            notes.append(f'事先裁好的字体读不到（{type(e).__name__}: {e}），这一份不嵌字体，用电脑自带的字体')
    return '/* 没有嵌字体：用电脑自带的字体 */', 0, len(_chars(text)), '电脑自带的字体', [], notes


def open_file(path):
    """用默认浏览器打开。macOS 用 open，Windows 用 os.startfile，别的用 xdg-open；都不行就交给 webbrowser。"""
    try:
        if sys.platform == 'darwin': subprocess.run(['open', str(path)], check=True); return True
        if os.name == 'nt': os.startfile(str(path)); return True   # noqa（只在 Windows 上有）
        subprocess.run(['xdg-open', str(path)], check=True); return True
    except Exception:
        try: return webbrowser.open(path.as_uri())
        except Exception: return False


def doctor():
    print(f'Python {sys.version.split()[0]}（{sys.executable}）：能用。')
    print('读 content.md：用 Skill 自带的 PyYAML，不用装。')
    try:
        import fontTools; v = fontTools.version
        try: import brotli; b = '有 brotli，字体存 woff2'
        except ImportError: b = '没有 brotli，字体存成 woff（大一点，不影响用）'
        print(f'字体：有 fontTools {v}，{b}；只裁用到的字，HTML 约 1 MB。')
    except ImportError:
        ok = all((ROOT / 'fonts' / 'ready' / f).exists() for f in ('Inter-latin.woff2', 'NotoSansSC-common.woff2', 'covered.txt'))
        print('字体：没有 fontTools，' + ('用事先裁好的常用字体，HTML 约 3 MB，不用装别的。' if ok else 'fonts/ready/ 里的字体也不在，会用电脑自带的字体。'))
        print('  想让文件小一点（可选）：在用户目录下建一个虚拟环境装 fonttools 和 brotli，再用那个环境的 python 运行，见 SKILL.md“环境”一节。')
    for d in ('engine', 'fonts/ready'):
        print(f'{d}/：' + ('在' if (ROOT / d).is_dir() else '不在（这个 Skill 不完整，重新拷一份）'))


# ───────────────────────── 拼单文件 ─────────────────────────
def strip_comments(text, kind):
    """嵌进 HTML 前去掉开发注释（只去整行的 // 注释和从行首开始的 /* */ 块；行尾注释不动），engine/ 原文件不改。"""
    if kind == 'css': return re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    out, inblk = [], False
    for ln in text.split('\n'):
        t = ln.strip()
        if inblk:
            if '*/' in t: inblk = False; rest = ln.split('*/', 1)[1]
            else: continue
            if rest.strip(): out.append(rest)
            continue
        if t.startswith('//'): continue
        if t.startswith('/*'):
            if '*/' in t[2:]:
                rest = t[2:].split('*/', 1)[1]
                if rest.strip(): out.append(rest)
            else: inblk = True
            continue
        out.append(ln)
    return '\n'.join(out)


def build_html(meta, pages, title, presenter=True, font_mode='auto'):
    content = 'window.DECK_CONTENT = ' + json.dumps({'meta': meta, 'pages': pages}, ensure_ascii=False, indent=1) + ';'
    tpl = (ROOT / 'engine' / 'page.html').read_text('utf-8')
    js_files = re.findall(r'src="(engine/[^"]+)"', tpl)
    css_files = [h for h in re.findall(r'href="([^"]+)"', tpl) if h.startswith('engine/')]
    if not presenter:   # 不带讲者视图（--no-presenter）：模板里两行照旧，只是不嵌这两个文件
        js_files = [f for f in js_files if 'presenter' not in f]; css_files = [f for f in css_files if 'presenter' not in f]
        tpl = re.sub(r'\n<(?:link|script)[^\n]*presenter\.(?:css|js)[^\n]*', '', tpl)
    src_js = {f: strip_comments((ROOT / f).read_text('utf-8'), 'js') for f in js_files}
    src_css = {f: strip_comments((ROOT / f).read_text('utf-8'), 'css') for f in css_files}
    engine_text = ''.join(list(src_js.values()) + list(src_css.values()))
    fcss, fbytes, nchar, froute, fmiss, fnotes = font_css(content + engine_text, font_mode)
    def esc_js(s): return s.replace('</script', '<\\/script')
    styles = '\n'.join(['<style>\n' + fcss + '\n</style>'] + ['<style>\n' + src_css[f] + '\n</style>' for f in css_files])
    scripts = '\n'.join(['<script>\n' + esc_js(content) + '\n</script>'] + ['<script>\n' + esc_js(src_js[f]) + '\n</script>' for f in js_files])
    html = re.sub(r'<!--STYLE-->.*?<!--/STYLE-->', lambda m: styles, tpl, flags=re.S)
    html = re.sub(r'<!--SCRIPT-->.*?<!--/SCRIPT-->', lambda m: scripts, html, flags=re.S)
    html = re.sub(r'<title>.*?</title>', lambda m: f'<title>{title}</title>', html)
    html = html.replace('data-skin="precise"', 'data-skin="precise" data-lock="report"', 1)
    return html, fbytes, nchar, froute, fmiss, fnotes


def report_md(bk, src, pages, out_html):
    L_ = [f'# 查账 · {src.name}', '', f'生成时间 {dt.datetime.now():%Y-%m-%d %H:%M}，共 {len(pages)} 页。', '']
    L_ += [f'**错 {len(bk.err)} 处，提醒 {len(bk.warn)} 处，算对了 {len(bk.ok)} 处。**' + ('' if not bk.err else '有错，没出 HTML。'), '']
    for name, rows in (('错（要改）', bk.err), ('提醒（看一眼，确认没问题可以不改）', bk.warn), ('算对了的', bk.ok)):
        if not rows: continue
        L_ += [f'## {name}', '']
        L_ += [f'- {w}：{m}' for w, m in rows] + ['']
    if out_html: L_ += [f'HTML：{out_html.name}', '']
    return '\n'.join(L_)


def main():
    ap = argparse.ArgumentParser(description='content.md → 查账 → 单文件 HTML')
    ap.add_argument('md', nargs='?'); ap.add_argument('-o', '--out'); ap.add_argument('--name')
    ap.add_argument('--types', action='store_true', help='列出页型和字段'); ap.add_argument('--check', action='store_true', help='只查账，不出 HTML')
    ap.add_argument('--no-presenter', action='store_true', help='不带讲者视图（双窗口）')
    ap.add_argument('--open', action='store_true', help='做完用默认浏览器打开')
    ap.add_argument('--doctor', action='store_true', help='看这台电脑能不能做、字体走哪条路')
    ap.add_argument('--font', choices=('auto', 'subset', 'ready', 'system'), default='auto', help='字体走哪条路：auto 先裁、裁不了用常用字体；ready 直接用常用字体；system 不嵌字体')
    a = ap.parse_args()
    if a.doctor: doctor(); return
    if a.types:
        for k, (desc, sp) in PT.items():
            if k in SAMPLE_ONLY: continue
            print(f'\n{k} — {desc}')
            for f, s in sp.items(): print(f'  {f}: {json.dumps(s, ensure_ascii=False) if not isinstance(s, str) else s}')
        return
    if not a.md: ap.error('要给 content.md 的路径')
    src = pathlib.Path(a.md).expanduser().resolve(); out = pathlib.Path(a.out).expanduser().resolve() if a.out else src.parent
    if not src.is_file(): sys.exit(f'找不到 {src}：先把 content.md 写好，再把它的完整路径放进这条命令。')
    try: text = src.read_text('utf-8-sig')
    except UnicodeDecodeError: sys.exit(f'{src.name} 不是 UTF-8 编码：用 UTF-8 重新存一遍再运行。')
    meta, pages, heads = parse_md(text)
    if not pages: sys.exit(f'{src.name} 里没有一页：每页要一个“## 标题”加一个 ```yaml 块，见 references/content写法.md 第六节。')
    bk = audit(meta, pages, heads)
    out.mkdir(parents=True, exist_ok=True)
    print(f'查账：错 {len(bk.err)}，提醒 {len(bk.warn)}，算对 {len(bk.ok)}')
    for w, m in bk.err: print(f'  错  {w}：{m}')
    for w, m in bk.warn: print(f'  提醒 {w}：{m}')
    html_path = None
    name = a.name or re.sub(r'[\\/:*?"<>|]', '', f"{meta.get('who', '')} {meta.get('deck', '幻灯片')}").strip().replace(' · ', '_').replace(' ', '_') or '幻灯片'
    k = 1   # 不覆盖旧版：同名 HTML 已经有了就写 _v2、_v3……；查账跟它对应的 HTML 用同一个号。
    stem = name  # 号只看 HTML：只查账（--check）不占号，下一次出 HTML 时同号的查账会换成新的
    while (out / f'{stem}.html').exists():
        k += 1; stem = f'{name}_v{k}'
    if not bk.err and not a.check:
        html_path = out / f'{stem}.html'
        meta = {'section': meta.get('deck', ''), **meta}
        html, fb, nc, froute, fmiss, fnotes = build_html(meta, pages, f"{meta.get('deck', '')} · {meta.get('who', '')}", presenter=not a.no_presenter, font_mode='system' if a.font == 'system' else a.font)
        html_path.write_text(html, 'utf-8')
        for n_ in fnotes: print(f'  提示 字体：{n_}')
        if fmiss: print(f'  提示 字体：这 {len(fmiss)} 个字常用字体里没有，会用电脑自带的字体显示：{"".join(fmiss[:40])}' + ('…' if len(fmiss) > 40 else ''))
        print(f'字体 {fb // 1024} KB（{froute}，{nc} 个字），HTML {len(html.encode()) // 1024} KB → {html_path}')
        if a.open: print('已用默认浏览器打开。' if open_file(html_path) else f'没能自动打开：请双击 {html_path}')
    rp = out / f'{stem}_查账.md'
    rp.write_text(report_md(bk, src, pages, html_path), 'utf-8')
    if bk.err: print(f'有“错”，没出 HTML。改好 content.md 再运行一次；每一条写在 {rp}')
    sys.exit(1 if bk.err else 0)


if __name__ == '__main__':
    main()
