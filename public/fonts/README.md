# 网站使用本地字体。

字体由 `PreviewLayout.astro` 引入，正式页面和保留的预览入口共用同一套字体。浏览器从本站读取 WOFF2 文件，无须连接 Google Fonts。

| 文件 | 来源与用途 | 大小 |
| --- | --- | --- |
| `fraunces-700.woff2` | [Fraunces](https://github.com/google/fonts/tree/main/ofl/fraunces) 的正体，用于英文标题、卡片项目名与首页粒子姓名。 | 17,628 字节 |
| `fraunces-signature-700.woff2` | 同一字体的斜体，用于导航、页脚与入场页的小号 Tomme 署名。 | 22,248 字节 |
| `noto-serif-sc-700.woff2` | [Noto Serif SC](https://github.com/google/fonts/tree/main/ofl/notoserifsc) 的 700 字重，用于中文页面标题、项目章节标题和方法论主节点。 | 178,924 字节 |

三份字体共 218,800 字节，约 214 KiB。首页正文仍使用系统黑体；首页只需两份英文字体，合计 39,876 字节，约 39 KiB。中文页面需要第三份字体。正文、按钮、小标题与图内说明不使用宋体。字体设置为 `font-display: swap`，字体加载失败时继续显示系统备用字体。

## 字体授权文件随网站保留。

两款字体均附带 SIL Open Font License 1.1。原始版权声明及完整条款保存在本目录的 `OFL-fraunces.txt`、`OFL-notoserifsc.txt`，未改写。本站分发版本裁剪了字符并固定字重；代码中的 `Tomme Fraunces`、`Tomme Signature`、`Tomme Song` 是 CSS 名称，字体来源仍为上述作者。

下载源对应的 Git blob SHA 如下：

- Fraunces 正体：`8210f9488d3c732359a9292dd09aca3f2bae830e`。
- Fraunces 斜体：`2ddf59a11b89a3d6b2816ea6ae7965026c08143a`。
- Noto Serif SC：`eab063faf229160a52d3760f5555150e4eb9e5bf`。

## 修改中文标题后，可以重新生成字体。

当前中文文件保留从 `src` 中 `.astro`、`.ts` 文件收集的 967 个中文与标点字符。新增字符未被收录时仍会显示系统备用字形；若要使新标题的字形一致，需要重新运行生成脚本。

将上游字体源文件放入仓库的 `tmp/font-sources`：

- `Fraunces[SOFT,WONK,opsz,wght].ttf`。
- `Fraunces-Italic[SOFT,WONK,opsz,wght].ttf`。
- `NotoSerifSC[wght].ttf`。

生成工具为 Python 的 FontTools 与 Brotli。可以在临时目录安装工具，并指定本机 Python 路径：

```powershell
python -m pip install --target tmp/font-tools fonttools brotli
$env:FONTTOOLS_PYTHON = (Get-Command python).Source
node scripts/prepare-preview-fonts.mjs
```

Fraunces 正体固定 `wght=700, opsz=72, SOFT=30, WONK=1`，斜体固定 `wght=700, opsz=48, SOFT=30, WONK=1`；Noto Serif SC 固定 `wght=700`。输出文件写入 `public/fonts`。网站正常构建直接使用已经生成的字体，不依赖 Python，也不会在构建时下载字体。
