# Sisyphox Blog

我的个人博客，托管在 [GitHub Pages](https://pages.github.com)。

## 如何发布新文章

1. 在 `posts/` 目录下创建一个 `.md` 文件，例如 `posts/my-post.md`
2. 在 `posts.json` 中添加文章的元数据：

```json
{
    "title": "文章标题",
    "slug": "my-post",
    "date": "2025-01-15",
    "tags": ["标签1", "标签2"],
    "excerpt": "文章摘要，显示在首页列表。"
}
```

3. Push 到 GitHub，完成！

## 本地预览

项目是纯静态的，直接用任意 HTTP 服务器即可预览：

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .

# 然后打开 http://localhost:8080
```

## 技术栈

- **marked.js** — Markdown 渲染
- **原生 CSS** — 响应式 / 暗色模式
- **原生 JS** — 零依赖路由和渲染

## 目录结构

```
├── index.html      # 主页
├── 404.html        # 404 页面
├── posts.json      # 文章清单（元数据）
├── css/
│   └── style.css   # 样式
├── js/
│   └── blog.js     # 核心逻辑
└── posts/
    └── *.md        # 文章（Markdown）
```
