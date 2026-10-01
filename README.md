# Better Pawchive

**中文** · [English](README.en.md)

面向 Pawchive 的浏览器扩展：卡片快捷关注、从原平台一键跳转、自动记录已读帖子。
支持 **Microsoft Edge、Google Chrome 和 Mozilla Firefox**。

这是 [Better Coomer / Kemono](https://github.com/SirSalamandra/better-coomer-kemono)
的 Pawchive 新版，开发分支为 **`pawchive`**，保留原项目的 MIT 许可和提交历史。
这是独立维护的社区扩展，与 Pawchive 及来源平台没有官方关系。

## 下载与安装

无需安装 Node.js，也不需要自行编译。

- [下载 Edge / Chrome 安装包](https://github.com/Afrody9387/better-pawchive/releases/latest/download/better-pawchive-chrome.zip)
- [下载 Firefox 安装包](https://github.com/Afrody9387/better-pawchive/releases/latest/download/better-pawchive-firefox.zip)
- [全部版本和更新说明](https://github.com/Afrody9387/better-pawchive/releases)

请下载上述浏览器安装包，不要把 GitHub 自动生成的 **Source code** 压缩包当成扩展安装包。

### Edge / Chrome

1. 解压安装包，保留这个文件夹。
2. Edge 打开 `edge://extensions`；Chrome 打开 `chrome://extensions`。
3. 开启 **开发人员模式 / 开发者模式**。
4. 点击 **加载解压缩的扩展 / 加载已解压的扩展程序**，选择包含 `manifest.json` 的文件夹。
5. 刷新已打开的 Pawchive 和来源平台页面。

### Firefox

当前安装包是未签名的开发版本，只能临时加载。

1. 解压 Firefox 安装包。
2. 打开 `about:debugging#/runtime/this-firefox`。
3. 点击 **临时载入附加组件**，选择解压目录中的 `manifest.json`。
4. 刷新网站页面。Firefox 重启后需要再次临时加载。

### 更新现有安装

关闭插件的数据管理标签页，将新版文件覆盖到**原先加载的文件夹**，
在扩展管理页点击 **重新加载**，再刷新网站页面。保持同一文件夹且不卸载扩展，
有助于保留本地浏览记录。新增站点权限时，浏览器可能要求重新启用扩展。

## 功能

| 功能 | 用法 |
| --- | --- |
| 卡片快捷关注 | 登录 Pawchive 后，在作者搜索和 Similar Artists 卡片上点击 ☆ / ★，直接关注或取消关注，无需进入作者页。 |
| 一键跳转 | 支持的来源页面右下角显示「跳转至 Pawchive」。默认新标签页打开。 |
| 已读标记 | 打开帖子后，列表卡片显示绿色 `viewed`；点击旁边的 `x` 取消已读。 |
| 音频播放器 | 为帖子中的 `.mp3` 和 `.wav` 附件链接添加播放器。 |
| 浏览记录管理 | 扩展图标 → **Manage Data**：查看作者、帖子、元数据和统计，删除记录或清空本地数据库。 |
| 打开方式设置 | **Manage Data → Settings**：选择跳转时是否新建标签页。 |

### 来源平台跳转范围

| 来源 | 支持页面 | 目标 |
| --- | --- | --- |
| Patreon | 作者数字 ID 地址、昵称地址和 `/c/昵称` 页面 | 对应作者存档 |
| Fanbox | 作者主页和帖子，包括子域名与 `/@昵称` 地址 | 作者存档或对应帖子 |
| Pixiv | 作者页、作品页 | 对应作者的 Fanbox 存档 |
| Discord | 含服务器 ID 的频道地址 | 对应服务器存档 |

不支持的页面隐藏按钮。解析失败会提示并保留原页面。
**有效跳转地址不代表内容已被收录**；未收录的内容可能显示 404。
Discord 私信、邀请链接，以及 Fantia、DLsite 不在跳转支持范围内。

### 存档站点

- `pawchive.pw`：快捷关注、已读记录、音频播放器和管理功能。
- `kemono.cr`、`coomer.st`：保留上游已读记录、音频播放器和管理功能；快捷关注仅用于 Pawchive。

## 数据、权限与限制

- 浏览记录存在本机扩展数据库中；关注操作使用你的 Pawchive 网站账号。
- 点击跳转时，必要情况下读取公开页面资料、Pixiv 作品作者 API 或 Pawchive 公开作者列表。
- 来源平台只运行跳转脚本，不记录这些平台上的浏览历史。没有独立遥测服务；网站请求仍会发送到相关网站。
- 改名保留上游数据库名称；不同扩展 ID 的数据不会自动合并。
- Pawchive 作者 API 未提供总帖子数，管理页可能显示 `0 total`。
- 信息补全由访问或打开相关管理页触发，不是定时后台任务。
- 上游数据库仍以作者／帖子 ID 为键，跨平台相同 ID 可能共享浏览记录。
- 网站结构和接口变化可能需要更新扩展。

初次发布通过 **234 项自动化测试**，并用 Patreon、Fanbox 真实公开页面核对过作者解析。
登录状态、Discord 页面和各浏览器完整流程仍需要实际使用验证。

- [Pawchive 功能测试记录](docs/pawchive-validation.md)
- [跳转功能测试步骤](docs/pawchive-jump-validation.md)
- [反馈问题](https://github.com/Afrody9387/better-pawchive/issues)：请附浏览器版本、页面链接、步骤和实际结果，不要提交账号凭据。

## 开发

使用 Node.js 22 或更高版本。

```bash
git clone --branch pawchive https://github.com/Afrody9387/better-pawchive.git
cd better-pawchive
npm ci
npm test -- --runInBand
npm run build -- chrome
# 或 npm run build -- firefox
```

产物位于 `dist/`。每次构建会替换 manifest，请选择要安装的浏览器目标。

## 致谢与许可

- 原项目：[SirSalamandra / better-coomer-kemono](https://github.com/SirSalamandra/better-coomer-kemono)。
- 跳转思路参考子斗子的 [Kemono跳转](https://github.com/ZIDOUZI/kemono-jump-js)，为扩展独立重新实现。
- [MIT License](LICENSE)。分发包保留原作者版权声明和许可。
