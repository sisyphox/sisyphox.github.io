# Sisyphox Blog

我的个人博客，托管在 [GitHub Pages](https://pages.github.com)。

## 功能

- 📝 **Markdown 写作** — 在 `posts/` 下写 `.md` 文件
- 📂 **分类模块** — 按知识模块分目录存放，首页自动生成分类筛选标签
- 🔍 **实时搜索** — 搜索文章标题、标签、摘要
- 📑 **目录侧边栏** — 桌面端自动从标题生成导航目录，滚动高亮当前位置
- 🌓 **暗色模式** — 自动跟随系统 / 手动切换，偏好持久化
- 👆 **智能 Header** — 向下滚动自动隐藏，向上滚动显示，不遮挡阅读
- 📱 **响应式** — 适配手机、平板、桌面端

## 如何发布新文章

1. 在对应分类目录下创建 `.md` 文件：
   ```
   posts/
   ├── algorithm/     ← 数据结构 & 算法
   │   └── my-post.md
   ├── misc/          ← 随笔杂谈
   └── ...            ← 按需新建目录
   ```

2. 在 `posts.json` 中添加元数据：

```json
{
    "title": "文章标题",
    "slug": "my-post",
    "date": "2026-05-14",
    "dir": "algorithm",
    "category": "数据结构",
    "tags": ["标签1", "标签2"],
    "excerpt": "文章摘要，显示在首页列表。"
}
```

3. Push 到 GitHub，完成！

## 本地预览

```bash
python -m http.server 8080
# 打开 http://localhost:8080
```

## 目录结构

```
├── index.html
├── 404.html
├── posts.json              # 文章元数据（标题、分类、路径等）
├── css/style.css
├── js/blog.js
└── posts/
    ├── algorithm/          # 数据结构与算法
    │   ├── dsu.md
    │   ├── segt.md
    │   ├── trie.md
    │   ├── st.md
    │   ├── lichao-tree.md
    │   ├── linear-basis.md
    │   └── persistent-segt.md
    └── misc/               # 随笔
        └── hello-world.md
```
