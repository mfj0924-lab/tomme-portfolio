# 已确认的新版使用正式网址发布。

网站主地址为 https://tomme-portfolio.pages.dev/ ，备用地址为 https://mfj0924-lab.github.io/tomme-portfolio/ 。GitHub 的 main 分支用于触发两个平台已有的自动部署。

## 正式页面与预览入口共用内容。

正式入口为 `/`、`/projects/`、`/method/` 和 `/projects/{slug}/`。这些入口使用已经确认的 `src/pages/preview/` 页面组件；`src/data/preview.ts` 中的 `previewPath` 为所有导航生成正式网址。`/preview/` 的旧入口仍可访问，并指向对应的正式页面作为搜索引擎首选网址。

原来的 `/about/` 和 `/ai-collaboration/` 转到 `/method/`。五个项目的原有地址继续保留。设计实验文件保留在本地，本次未发布。

展示版简历仍使用原有下载路径，另增加 ATS 下载入口。两份新版简历补充数据分析与 AI 应用岗位方向，以及蓝色可点击作品集链接。简历原文件保留在本地资料文件夹，仓库中原有展示版也可从此前提交取回。

## 两个平台使用各自的网站路径。

普通 `npm run build` 构建 GitHub Pages 版本，路径前缀为 `/tomme-portfolio`。Cloudflare Pages 自动设置 `CF_PAGES=1`，构建路径前缀为 `/`；本地可通过 `DEPLOY_TARGET=cloudflare` 指定同一配置。

这次发布只运行必要构建。用户自行检查页面效果及简历排版，没有额外进行视觉检查或交互回归测试。

## 旧版保存在发布前的 Git 提交中。

发布前的线上版本对应 `150c86e9b009380fe5defd978979cfc4a6bb6243`。如需回退，应先保存后续修改，再通过新的回退提交恢复目标版本，避免强制改写 main 的历史。
