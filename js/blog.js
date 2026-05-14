/**
 * Sisyphox Blog — 核心逻辑
 * 从 posts.json 加载文章列表, 从 .md 文件渲染文章内容
 */

const BLOG = {
    posts: [],
    currentPost: null,

    /**
     * 初始化 — 判断当前是首页还是文章页
     */
    async init() {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get("post");
        const page = params.get("page");

        if (slug) {
            await this.loadPostList();
            await this.renderPost(slug);
        } else if (page === "about") {
            this.renderAbout();
        } else {
            await this.loadPostList();
            this.renderHome();
        }
    },

    /**
     * 加载文章列表 JSON
     */
    async loadPostList() {
        try {
            const resp = await fetch("/posts.json");
            if (!resp.ok) throw new Error("posts.json not found");
            this.posts = await resp.json();
            // 按日期倒序排列
            this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (err) {
            console.error("加载文章列表失败:", err);
            this.posts = [];
        }
    },

    /**
     * 渲染首页 — 文章列表
     */
    renderHome() {
        const main = document.querySelector("main");
        if (!main) return;

        if (this.posts.length === 0) {
            main.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📝</div>
                    <p>还没有文章, 开始写第一篇吧。</p>
                    <p style="font-size:0.85rem;margin-top:0.5rem;">
                        在 <code>posts/</code> 目录下创建 <code>.md</code> 文件,<br>
                        然后在 <code>posts.json</code> 中注册即可。
                    </p>
                </div>
            `;
            return;
        }

        const postsHTML = this.posts
            .map((post) => {
                const dateStr = this.formatDate(post.date);
                const tagsHTML = post.tags
                    ? post.tags
                          .map((t) => `<span class="post-tag">#${t}</span>`)
                          .join("")
                    : "";
                return `
                <li class="post-item">
                    <a href="/?post=${post.slug}">
                        <h2 class="post-title">${post.title}</h2>
                        <div class="post-meta">
                            <span>📅 ${dateStr}</span>
                            ${tagsHTML}
                        </div>
                        ${post.excerpt ? `<p class="post-excerpt">${post.excerpt}</p>` : ""}
                    </a>
                </li>
            `;
            })
            .join("");

        main.innerHTML = `
            <h1 class="page-title">博客</h1>
            <p class="page-subtitle">记录思考, 分享所得。</p>
            <ul class="post-list">
                ${postsHTML}
            </ul>
        `;

        this.setActiveNav("博客");
    },

    /**
     * 渲染单篇文章
     */
    async renderPost(slug) {
        const main = document.querySelector("main");
        if (!main) return;

        // 找文章元数据
        const post = this.posts.find((p) => p.slug === slug);
        if (!post) {
            main.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🔍</div>
                    <p>找不到这篇文章。</p>
                    <a href="/" class="back-link" style="margin-top:1rem;">← 返回首页</a>
                </div>
            `;
            return;
        }

        // 显示 loading
        main.innerHTML = `
            <div class="loading">
                <div class="loading-dots">
                    <span></span><span></span><span></span>
                </div>
                <p style="margin-top:0.8rem;">加载中...</p>
            </div>
        `;

        // 加载 Markdown 文件
        try {
            const resp = await fetch(`/posts/${slug}.md`);
            if (!resp.ok) throw new Error(`无法加载 /posts/${slug}.md`);
            const md = await resp.text();
            const html = marked.parse(md);

            const dateStr = this.formatDate(post.date);
            const tagsHTML = post.tags
                ? post.tags
                      .map((t) => `<span class="post-tag">#${t}</span>`)
                      .join("")
                : "";

            // 找到前后文章
            const idx = this.posts.findIndex((p) => p.slug === slug);
            const prevPost =
                idx < this.posts.length - 1 ? this.posts[idx + 1] : null;
            const nextPost = idx > 0 ? this.posts[idx - 1] : null;

            main.innerHTML = `
                <a href="/" class="back-link">← 返回</a>
                <article>
                    <header class="post-header">
                        <h1>${post.title}</h1>
                        <div class="post-meta">
                            <span>📅 ${dateStr}</span>
                            ${tagsHTML}
                        </div>
                    </header>
                    <div class="post-content">
                        ${html}
                    </div>
                </article>
                <nav class="post-navigation">
                    <div class="post-nav-item prev">
                        ${
                            prevPost
                                ? `
                            <a href="/?post=${prevPost.slug}">
                                <div class="post-nav-label">← 上一篇</div>
                                <div class="post-nav-title">${prevPost.title}</div>
                            </a>
                        `
                                : ""
                        }
                    </div>
                    <div class="post-nav-item next">
                        ${
                            nextPost
                                ? `
                            <a href="/?post=${nextPost.slug}">
                                <div class="post-nav-label">下一篇 →</div>
                                <div class="post-nav-title">${nextPost.title}</div>
                            </a>
                        `
                                : ""
                        }
                    </div>
                </nav>
            `;

            this.setActiveNav("博客");
            document.title = `${post.title} — Sisyphox`;
        } catch (err) {
            console.error("加载文章失败:", err);
            main.innerHTML = `
                <div class="empty-state">
                    <div class="icon">😵</div>
                    <p>文章加载失败。</p>
                    <p style="font-size:0.85rem;margin-top:0.5rem;">${err.message}</p>
                    <a href="/" class="back-link" style="margin-top:1rem;">← 返回首页</a>
                </div>
            `;
        }
    },

    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        if (!dateStr) return "未知日期";
        // 如果是 ISO 格式 (如 2024-12-01), 直接用作中文格式
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }
        try {
            const d = new Date(dateStr);
            return d.toISOString().slice(0, 10);
        } catch {
            return dateStr;
        }
    },

    /**
     * 渲染关于页面
     */
    renderAbout() {
        const main = document.querySelector("main");
        if (!main) return;

        document.title = "关于 — Sisyphox";

        main.innerHTML = `
            <h1 class="page-title">关于</h1>
            <div class="post-content">
                <p>
                    你好，我是 <strong>Sisyphox</strong>。
                </p>
                <p>
                    这里是我的个人博客，用来记录技术思考、读书笔记和生活感悟。
                </p>
                <p>
                    博客托管在 <a href="https://github.com/sisyphox/sisyphox.github.io" target="_blank" rel="noopener">GitHub Pages</a>，
                    所有内容使用 Markdown 编写，通过 marked.js 在客户端渲染。
                </p>
                <p>
                    如果你对某个话题感兴趣，欢迎通过 GitHub 与我交流。
                </p>
                <hr>
                <h2>关于名字</h2>
                <p>
                    <em>Sisyphus</em>（西西弗斯）是希腊神话中被罚永远推石上山的人物。
                    加缪说：<strong>「应当想象西西弗斯是幸福的。」</strong>
                </p>
                <p>
                    在重复的劳作中找到意义，这或许就是生活的真相。
                </p>
            </div>
        `;

        this.setActiveNav("关于");
    },

    /**
     * 高亮当前导航项
     */
    setActiveNav(label) {
        document.querySelectorAll(".site-nav a").forEach((a) => {
            a.classList.toggle("active", a.textContent.trim() === label);
        });
    },
};

// ——— 页面加载完成后启动 ———
document.addEventListener("DOMContentLoaded", () => BLOG.init());
