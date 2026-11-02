<img alt="image" src="https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20260118224558-e1kdo6x.png" />

## 🙏 赞助商

| 赞助商 | 说明 |
| --- | --- |
| ![17873186772188803ff9ca56b8aefe5fa96dcb51eb47d-20260821211408-jzsp68c.jpg](https://raw.githubusercontent.com/Achuan-2/PicBed/pic/assets/17873186772188803ff9ca56b8aefe5fa96dcb51eb47d-20260821211408-jzsp68c.jpg) | 感谢 APIMart 赞助了本项目！APIMart 是专注 AI 图片/视频生成的低价 API 平台，GPT-Image-2 低至 $0.006/张，1 美元可出图 160+ 张。图片、视频一套异步 API 通吃，提交任务拿 ID、回调取结果，跑批万张不超时、换模型不改代码。按量付费、无月费，通过此[注册链接](https://go.apimart.ai/gh-slidesci)注册即可开用。 |

## 📝开发背景

我经常需要向AI咨询各种问题，每次需要用AI根据我的笔记内容做出解答，总是要复制粘贴到其他AI软件，并且一个AI的回答往往不能令我满意，所以我经常会把同一个问题复制粘贴去询问不同AI模型，非常麻烦。

于是我自己在思源笔记里开发了一个AI插件

- 支持直接拖动笔记内容询问AI，还支持多模型同时问答功能，省去繁琐的复制粘贴操作。
- 支持保存不同预设，针对不同场景（写论文、写博客、写代码）切换模型和prompt
- 支持agent模式，支持让AI对笔记内容进行查询和修改

## 📝更新日志

见[CHANGELOG.md](https://github.com/Achuan-2/siyuan-plugin-copilot/blob/main/CHANGELOG.md)

博客
- [思源笔记 Copilot 插件用法分享：多模型同时回答](https://zhuanlan.zhihu.com/p/1972794055470633397)
- [思源笔记 Copilot 插件 v0.7.0：支持会话重命名标题，AI 自动生成标题](https://zhuanlan.zhihu.com/p/1983095685197873937)
- [思源笔记 Copilot 插件 v0.8.0：预设支持选择模型，支持根据场景快速切换模型](https://zhuanlan.zhihu.com/p/1983121374013842503)
- [思源笔记 Copilot 插件 v1.2.0：支持nanobanana生图和编辑图片](https://zhuanlan.zhihu.com/p/2000977023364011834)
- [思源笔记 Copilot 插件如何使用Achuan-2 API](https://zhuanlan.zhihu.com/p/2002765436090093989)
- [思源笔记 Copilot 插件 v1.6.0：新增网页小程序、快捷翻译对话框](https://zhuanlan.zhihu.com/p/2003514802849485761)
- [思源笔记Copilot v2.0：Agent能力增强，获取网页内容、SOUL等更多工具上线 - 知乎](https://zhuanlan.zhihu.com/p/2015574496401190989)
- [思源笔记Copilot v2.3.9 丨新增生图模式，支持GPT-image 2和nanobanana](https://www.zhihu.com/question/2030082882098680763/answer/2031427831587132821)
- [思源笔记Copilot v2.4 支持自定义Skill](https://zhuanlan.zhihu.com/p/2041977039469688501)

## ✨主要功能介绍

### AI模型添加

多平台AI支持

- 插件内置常见平台（OpenAI、Google Gemini、DeepSeek、火山引擎）
- 也支持添加任意兼容 OpenAI API 的平台，灵活切换聊天模型

模型设置

- 支持独立配置每个模型的参数（温度、最大 tokens）
- 标识模型特殊能力（思考模式、视觉支持）

<img alt="image" src="https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20260204180535-27ex0wd.png" />


<img alt="image" src="https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20260118225029-2f5k1mt.png" />


### 多模态支持

- 思源笔记内容：可通过拖拽块、拖拽页签、拖拽文档树的文档实现笔记内容一键发送给AI。拖动标题有特殊优化，是把标题下的所有内容发送给AI
- 图片上传：支持粘贴、上传图片，还支持拖动图片块直接上传
- 文件上传（支持 Markdown、文本文件等）

### 聊天模式切换：ask、agent

- ask 模式：日常问答，支持选择多个模型同时回复，选择满意回答

  直接拖拽笔记内容进行多模型问答

  <img alt="拖拽标题询问" src="https://assets.b3logfile.com/siyuan/1610205759005/assets/拖拽标题询问-20260118231116-9olhf3h.gif" />

  多模型回答结果

  <img alt="image" src="https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20260118231241-74cd19k.png" />

- agent 模式：提供工具，让AI实现自助查询笔记内容、编辑笔记、创建文档等功能

  agent模式可以选择AI可以使用的工具

  <img alt="image" src="https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20260118231449-4pdqcll.png" style="width: 498px;" />

### 会话管理

- 支持保存对话历史，支持对历史记录进行置顶和删除
- 支持复制对话为Markdown
- 支持保存对话为文档

<img alt="image" src="https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20260118231854-tf2zh9n.png" />

### 预设管理

- 预设支持

  - 设置上下文消息数
  - Temperature
  - 临时系统提示词
  - 指定聊天模式
  - 选择特点模型

  <img alt="image" src="https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20260118232101-zf7zy42.png" />
- 支持保存预设，快速切换预设

  <img alt="image" src="https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20260118232042-1g4kam2.png" style="width: 396px;" />

  <img alt="image" src="https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20260118232314-3qj0h1p.png" style="width: 366px;" />

### 提示词管理

支持把常用提示词进行保存

<img alt="image" src="https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20260118232429-ymzcjdg.png" />

<img alt="image" src="https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20260118232510-3e5duhz.png" />

## **注意事项**

使用本插件需要自备 AI 平台的 API 密钥，插件本身不提供 AI 服务。请遵守各平台的使用条款和隐私政策，以及法律法规。


## 🔧 开发相关

如何打包插件

```bash
pnpm install
pnpm run dev
```

## 📄 许可证

GPL3 License

## 🙏 致谢

- 基于 [plugin-sample-vite-svelte](https://github.com/siyuan-note/plugin-sample-vite-svelte/) 模板开发
- 参考了[sy-f-misc](https://github.com/frostime/sy-f-misc)的GPT对话功能实现
- 参考了[cherry studio](https://github.com/CherryHQ/cherry-studio)的功能设计和交互设计

## ❤️项目贡献者

<a href="https://github.com/Achuan-2/siyuan-plugin-copilot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Achuan-2/siyuan-plugin-copilot" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## ❤️用爱发电

如果喜欢我的插件，欢迎给GitHub仓库点star和微信赞赏，这会激励我继续完善此插件和开发新插件。

<img alt="image" src="https://assets.b3logfile.com/siyuan/1610205759005/assets/network-asset-image-20250614123558-fuhir5v.png" />

### MCP 模式：向外部 Agent 暴露选定工具

MCP 模式把已存在的 Copilot 工具能力作为 MCP Streamable HTTP 服务提供给外部 Agent。切换到 **MCP 模式**后，侧栏仅保留“选择暴露工具”和“复制连接提示词”两个操作；外部工具白名单与 Agent/问答模式相互独立。

- 服务仅在思源桌面版运行，监听 `127.0.0.1:17331/mcp`，并自动生成 Bearer Token。
- 外部 Agent 无法直接访问本机回环地址时，可用 HTTPS 隧道映射本机 `17331` 端口（例如 `ngrok http 17331`），然后在 **设置 → MCP 网关** 填入公网 MCP URL，格式为 `https://你的隧道域名/mcp`。
- MCP 模式中的工具选择器就是对外授权白名单；未选择的工具不会出现在 `tools/list`，也不能被调用。问答卡片工具不暴露，因为它需要 Copilot 窗口内交互。
- MCP 服务支持 `tools/list`、`tools/call`，并提供 `mcp-gateway://about` 使用说明。复制的提示词包含 URL 和 Bearer Token；请仅发给可信的 Agent，不要放入公开文档或提交到 Git。
- 服务只绑定本机，不要把 `17331` 端口直接暴露到公网。远程访问务必使用 HTTPS 隧道或受保护的反向代理。

### Windows 一键构建安装与源码归档

- 双击项目根目录的 `一键构建并安装.bat`：自动安装依赖（如果缺少）、构建插件、检测思源工作空间并将产物复制到 `data/plugins/siyuan-plugin-copilot`。需要先启动思源；多工作空间时会提示选择。安装后在思源插件列表刷新并启用/更新插件。
- 双击 `一键压缩源码.bat`：生成源码压缩包到 `source-archives/`。脚本会排除 `.git`、`node_modules`、构建产物、缓存、日志和以前生成的归档包；依赖锁文件和项目源码仍会保留。
