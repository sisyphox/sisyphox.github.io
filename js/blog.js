/**
 * Sisyphox Blog — 核心逻辑
 * 功能: 分类筛选 / 搜索 / TOC 侧边栏 / Header 自动隐藏 / 暗色切换
 */

const BLOG = {
    posts: [],
    currentCategory: null,
    searchQuery: "",

    /* ==========================================
       初始化入口
       ========================================== */
    async init() {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get("post");
        const page = params.get("page");
        const cat = params.get("category");

        if (slug) {
            await this.loadPostList();
            await this.renderPost(slug);
        } else if (page === "about") {
            this.renderAbout();
        } else {
            await this.loadPostList();
            this.currentCategory = cat;
            this.renderHome();
        }

        this.initHeaderScroll();
        this.initThemeToggle();
    },

    /* ==========================================
       Header 滚动隐藏
       ========================================== */
    initHeaderScroll() {
        const header = document.querySelector(".site-header");
        if (!header) return;

        let lastScrollY = window.scrollY;
        const threshold = 10; // 最小滚动阈值

        window.addEventListener(
            "scroll",
            () => {
                const currentScrollY = window.scrollY;

                if (currentScrollY < threshold) {
                    // 在页面最顶部时始终显示
                    header.classList.remove("hidden");
                } else if (currentScrollY > lastScrollY + threshold) {
                    // 向下滚动 → 隐藏
                    header.classList.add("hidden");
                } else if (currentScrollY < lastScrollY - threshold) {
                    // 向上滚动 → 显示
                    header.classList.remove("hidden");
                }

                lastScrollY = currentScrollY;
            },
            { passive: true },
        );
    },

    /* ==========================================
       暗色模式切换（移到 JS 统一管理）
       ========================================== */
    initThemeToggle() {
        const toggle = document.getElementById("themeToggle");
        const STORAGE_KEY = "sisyphox-theme";

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "dark") {
            document.documentElement.classList.add("dark-mode");
        } else if (saved === "light") {
            document.documentElement.classList.remove("dark-mode");
        }

        if (toggle) {
            toggle.addEventListener("click", () => {
                const isDark =
                    document.documentElement.classList.toggle("dark-mode");
                localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
            });
        }
    },

    /* ==========================================
       加载文章列表
       ========================================== */
    async loadPostList() {
        try {
            const resp = await fetch("/posts.json");
            if (!resp.ok) throw new Error("posts.json not found");
            this.posts = await resp.json();
            this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (err) {
            console.error("加载文章列表失败:", err);
            this.posts = [];
        }
    },

    getCategories() {
        const cats = new Set();
        this.posts.forEach((p) => {
            if (p.category) cats.add(p.category);
        });
        return Array.from(cats);
    },

    /* ==========================================
       首页 — 文章列表 + 搜索 + 分类
       ========================================== */
    renderHome() {
        const main = document.querySelector("main");
        if (!main) return;
        document.body.classList.remove("has-toc");

        if (this.posts.length === 0) {
            main.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📝</div>
                    <p>还没有文章, 开始写第一篇吧。</p>
                </div>`;
            return;
        }

        const categories = this.getCategories();

        // 生成 HTML
        const tabsHTML =
            categories.length > 0
                ? `
            <div class="category-tabs">
                <a href="/" class="category-tab ${!this.currentCategory ? "active" : ""}">全部</a>
                ${categories
                    .map(
                        (c) => `
                    <a href="/?category=${encodeURIComponent(c)}" class="category-tab ${this.currentCategory === c ? "active" : ""}">${c}</a>
                `,
                    )
                    .join("")}
            </div>`
                : "";

        main.innerHTML = `
            <h1 class="page-title">博客</h1>
            <p class="page-subtitle">记录思考, 分享所得。</p>
            <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" id="searchInput"
                       placeholder="搜索文章标题、标签、摘要..."
                       value="${this.escapeHtml(this.searchQuery)}">
            </div>
            ${tabsHTML}
            <div id="postListContainer"></div>
        `;

        // 绑定搜索事件
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.searchQuery = e.target.value;
                this.renderPostList();
            });
            // 自动聚焦（如果正在搜索）
            if (this.searchQuery) {
                searchInput.focus();
                searchInput.setSelectionRange(
                    searchInput.value.length,
                    searchInput.value.length,
                );
            }
        }

        this.renderPostList();
        this.setActiveNav("博客");
    },

    /**
     * 渲染文章列表（受分类和搜索过滤）
     */
    renderPostList() {
        const container = document.getElementById("postListContainer");
        if (!container) return;

        let filtered = this.currentCategory
            ? this.posts.filter((p) => p.category === this.currentCategory)
            : [...this.posts];

        // 搜索过滤
        const q = this.searchQuery.trim().toLowerCase();
        if (q) {
            filtered = filtered.filter((p) => {
                return (
                    (p.title && p.title.toLowerCase().includes(q)) ||
                    (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
                    (p.tags &&
                        p.tags.some((t) => t.toLowerCase().includes(q))) ||
                    (p.category && p.category.toLowerCase().includes(q))
                );
            });
        }

        if (filtered.length === 0) {
            container.innerHTML = `<div class="search-empty">
                ${q ? `没有找到匹配「${this.escapeHtml(q)}」的文章` : "这个分类下还没有文章。"}
            </div>`;
            return;
        }

        const postsHTML = filtered
            .map((post) => {
                const dateStr = this.formatDate(post.date);
                const tagsHTML = post.tags
                    ? post.tags
                          .map((t) => `<span class="post-tag">#${t}</span>`)
                          .join("")
                    : "";
                const catHTML = post.category
                    ? `<span class="post-category">📂 ${post.category}</span>`
                    : "";
                return `
                <li class="post-item">
                    <a href="/?post=${post.slug}">
                        <h2 class="post-title">${post.title}</h2>
                        <div class="post-meta">
                            <span>📅 ${dateStr}</span>
                            ${catHTML}
                            ${tagsHTML}
                        </div>
                        ${post.excerpt ? `<p class="post-excerpt">${post.excerpt}</p>` : ""}
                    </a>
                </li>`;
            })
            .join("");

        container.innerHTML = `<ul class="post-list">${postsHTML}</ul>`;
    },

    /* ==========================================
       文章详情页
       ========================================== */
    async renderPost(slug) {
        const main = document.querySelector("main");
        if (!main) return;

        const post = this.posts.find((p) => p.slug === slug);
        if (!post) {
            main.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🔍</div>
                    <p>找不到这篇文章。</p>
                    <a href="/" class="back-link" style="margin-top:1rem;">← 返回首页</a>
                </div>`;
            return;
        }

        main.innerHTML = `
            <div class="loading"><div class="loading-dots">
                <span></span><span></span><span></span>
            </div><p style="margin-top:0.8rem;">加载中...</p></div>`;

        try {
            // 使用 dir 字段构建路径
            const postPath = post.dir
                ? `/posts/${post.dir}/${slug}.md`
                : `/posts/${slug}.md`;
            const resp = await fetch(postPath);
            if (!resp.ok) throw new Error(`无法加载 ${postPath}`);
            const md = await resp.text();

            if (typeof marked.setOptions === "function") {
                marked.setOptions({ breaks: true, gfm: true });
            }
            const html = marked.parse(md);

            const dateStr = this.formatDate(post.date);
            const tagsHTML = post.tags
                ? post.tags
                      .map((t) => `<span class="post-tag">#${t}</span>`)
                      .join("")
                : "";
            const catHTML = post.category
                ? `<a href="/?category=${encodeURIComponent(post.category)}" class="post-category-link">📂 ${post.category}</a>`
                : "";

            const idx = this.posts.findIndex((p) => p.slug === slug);
            const prevPost =
                idx < this.posts.length - 1 ? this.posts[idx + 1] : null;
            const nextPost = idx > 0 ? this.posts[idx - 1] : null;

            // 临时渲染以生成 TOC
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = html;
            const tocHTML = this.buildTOC(tempDiv);

            // 有 TOC 时放宽容器宽度
            if (tocHTML) {
                document.body.classList.add("has-toc");
            } else {
                document.body.classList.remove("has-toc");
            }

            main.innerHTML = `
                <a href="/" class="back-link">← 返回</a>
                <div class="post-page-layout">
                    <div class="post-main">
                        <article>
                            <header class="post-header">
                                <h1>${post.title}</h1>
                                <div class="post-meta">
                                    <span>📅 ${dateStr}</span>
                                    ${catHTML}
                                    ${tagsHTML}
                                </div>
                            </header>
                            <div class="post-content" id="postContent">
                                ${html}
                            </div>
                        </article>
                        <nav class="post-navigation">
                            <div class="post-nav-item prev">
                                ${
                                    prevPost
                                        ? `<a href="/?post=${prevPost.slug}">
                                    <div class="post-nav-label">← 上一篇</div>
                                    <div class="post-nav-title">${prevPost.title}</div>
                                </a>`
                                        : ""
                                }
                            </div>
                            <div class="post-nav-item next">
                                ${
                                    nextPost
                                        ? `<a href="/?post=${nextPost.slug}">
                                    <div class="post-nav-label">下一篇 →</div>
                                    <div class="post-nav-title">${nextPost.title}</div>
                                </a>`
                                        : ""
                                }
                            </div>
                        </nav>
                    </div>
                    ${
                        tocHTML
                            ? `
                    <aside class="toc-sidebar">
                        <nav class="toc-sticky" id="tocSticky">
                            <div class="toc-title">📑 目录</div>
                            ${tocHTML}
                        </nav>
                    </aside>`
                            : ""
                    }
                </div>`;

            // 给正文标题加 id，以便 TOC 锚点定位
            this.addHeadingIds();
            // 监听滚动高亮 TOC
            this.initTOCHighlight();

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
                </div>`;
        }
    },

    /* ==========================================
       TOC 目录生成
       ========================================== */
    buildTOC(container) {
        const headings = container.querySelectorAll("h1, h2, h3");
        if (headings.length < 2) return ""; // 少于2个标题不生成 TOC

        let html = "<ul>";
        headings.forEach((h, i) => {
            const tag = h.tagName.toLowerCase();
            const cls = "toc-" + tag;
            const text = h.textContent.trim();
            // 生成 id
            const id = "heading-" + i;
            h.id = id;
            html += `<li><a href="#${id}" class="${cls}">${text}</a></li>`;
        });
        html += "</ul>";
        return html;
    },

    /**
     * 给已渲染的正文中的标题加上 id（匹配 TOC）
     */
    addHeadingIds() {
        const content = document.getElementById("postContent");
        if (!content) return;
        const headings = content.querySelectorAll("h1, h2, h3");
        headings.forEach((h, i) => {
            h.id = "heading-" + i;
        });
    },

    /**
     * IntersectionObserver 高亮当前 TOC 项
     */
    initTOCHighlight() {
        const tocLinks = document.querySelectorAll(".toc-sticky a");
        const headings = document.querySelectorAll(
            "#postContent h1, #postContent h2, #postContent h3",
        );
        if (tocLinks.length === 0 || headings.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const id = entry.target.id;
                    const link = document.querySelector(
                        `.toc-sticky a[href="#${id}"]`,
                    );
                    if (link) {
                        if (entry.isIntersecting) {
                            tocLinks.forEach((l) =>
                                l.classList.remove("active"),
                            );
                            link.classList.add("active");
                        }
                    }
                });
            },
            {
                rootMargin: "-80px 0px -70% 0px",
                threshold: 0,
            },
        );

        headings.forEach((h) => observer.observe(h));
    },

    /* ==========================================
       关于页面
       ========================================== */
    renderAbout() {
        const main = document.querySelector("main");
        if (!main) return;
        document.body.classList.remove("has-toc");
        document.title = "关于 — Sisyphox";
        main.innerHTML = `
            <h1 class="page-title">关于</h1>
            <div class="post-content">
                <p>你好，我是 <strong>Sisyphox</strong>。</p>
                <p>这里是我的个人博客，主要分享计算机相关的知识，包括数据结构、算法、系统设计等内容。</p>
                <p>博客托管在 <a href="https://github.com/sisyphox/sisyphox.github.io" target="_blank" rel="noopener">GitHub Pages</a>，所有内容使用 Markdown 编写。</p>
                <hr>
                <h2>关于名字</h2>
                <p><em>Sisyphus</em>（西西弗斯）是希腊神话中被罚永远推石上山的人物。加缪说：<strong>「应当想象西西弗斯是幸福的。」</strong></p>
            </div>`;
        this.setActiveNav("关于");
    },

    /* ==========================================
       工具方法
       ========================================== */
    formatDate(dateStr) {
        if (!dateStr) return "未知日期";
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        try {
            return new Date(dateStr).toISOString().slice(0, 10);
        } catch {
            return dateStr;
        }
    },

    escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    },

    setActiveNav(label) {
        document.querySelectorAll(".site-nav a").forEach((a) => {
            a.classList.toggle("active", a.textContent.trim() === label);
        });
    },
};

document.addEventListener("DOMContentLoaded", () => BLOG.init());
