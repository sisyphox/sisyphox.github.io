# 李超线段树 (Li Chao Segment Tree)

**李超线段树**是一种用于维护**直线/线段集合**、支持**查询某点处最值**的数据结构。它由李超（Li Chao）提出，常用于斜率优化 DP 等场景。

## 解决的问题

维护一个直线集合，支持两种操作：

- 插入一条直线 `y = kx + b`（或线段：只在 `[l, r]` 上有效）
- 查询在 `x` 坐标处，所有直线（或线段）中 `y` 的最大值

## 核心思想

李超线段树在每个节点上存储**该区间中点处最优的直线**。

插入一条新直线时，比较它在区间中点处的值：

1. 若新直线在中点更优 → 交换（当前节点持有新直线，旧直线下传）
2. 根据端点处谁更优，决定下传到左子树还是右子树

```
插入直线 new：y = 2x + 1
当前节点持有：y = x + 5   (区间 [0, 10], 中点 x=5)

中点处: new(5)=11, old(5)=10 → new 更优 → 交换
现在节点持有 y=2x+1, 下传 y=x+5

左端点: new(0)=1, old(0)=5 → old 更优 → 下传到左子树
```

每次下传只进入一个子树，因此每次插入是 O(log C)，其中 C 是坐标范围。

## 时间复杂度

| 操作 | 复杂度 |
|------|--------|
| 插入直线 | O(log C) |
| 插入线段 | O(log² C) |
| 查询某点最值 | O(log C) |

> 若坐标范围很大（如 `1e9`），需要动态开点。

## 应用场景

- **斜率优化 DP** — 将 DP 转移视为直线插入与查询
- **凸包技巧** (Convex Hull Trick) — 李超树是 CHT 的一种实现
- **维护一次函数的最值查询**

## 代码模板

```cpp
#include <vector>
#include <algorithm>
using namespace std;
using ll = long long;

class LiChaoTree {
    static const ll INF = 4e18;               // 根据值域调整

    struct Line {
        ll k, b;
        Line(ll k = 0, ll b = -INF) : k(k), b(b) {}  // 默认直线为空（极小值）
        ll operator()(int x) const { return k * x + b; }
    };

    struct Node {
        Line line;
        int left, right;
        Node() : line(), left(-1), right(-1) {}
    };

    vector<Node> tree;
    int xmin, xmax;

    int new_node() {
        tree.emplace_back();
        return (int)tree.size() - 1;
    }

    // 在节点 [l, r] 中插入直线 newline
    void add_line(int idx, int l, int r, Line newline) {
        int mid = l + (r - l) / 2;
        bool left_better = newline(l) > tree[idx].line(l);
        bool mid_better  = newline(mid) > tree[idx].line(mid);

        if (mid_better) {
            swap(tree[idx].line, newline);
        }
        if (l == r) return;

        if (left_better != mid_better) {
            if (tree[idx].left == -1) tree[idx].left = new_node();
            add_line(tree[idx].left, l, mid, newline);
        } else {
            if (tree[idx].right == -1) tree[idx].right = new_node();
            add_line(tree[idx].right, mid + 1, r, newline);
        }
    }

    // 在节点 [l, r] 中插入线段 [ql, qr] 对应的直线 newline
    void add_segment(int idx, int l, int r, int ql, int qr, Line newline) {
        if (ql <= l && r <= qr) {
            add_line(idx, l, r, newline);
            return;
        }
        int mid = l + (r - l) / 2;
        if (ql <= mid) {
            if (tree[idx].left == -1) tree[idx].left = new_node();
            add_segment(tree[idx].left, l, mid, ql, qr, newline);
        }
        if (qr > mid) {
            if (tree[idx].right == -1) tree[idx].right = new_node();
            add_segment(tree[idx].right, mid + 1, r, ql, qr, newline);
        }
    }

    ll query(int idx, int l, int r, int x) const {
        if (idx == -1) return -INF;
        ll res = tree[idx].line(x);
        if (l == r) return res;
        int mid = l + (r - l) / 2;
        if (x <= mid)
            return max(res, query(tree[idx].left, l, mid, x));
        else
            return max(res, query(tree[idx].right, mid + 1, r, x));
    }

public:
    // 构造时传入坐标范围 [xmin, xmax]
    LiChaoTree(int xmin, int xmax) : xmin(xmin), xmax(xmax) {
        tree.reserve(128);
        new_node(); // 创建根节点 0
    }

    // 插入一条贯穿整个值域的直线
    void add_line(ll k, ll b) {
        add_segment(0, xmin, xmax, xmin, xmax, Line(k, b));
    }

    // 插入一条在区间 [l, r] 上的线段 (直线 y = kx + b)
    void add_segment(int l, int r, ll k, ll b) {
        add_segment(0, xmin, xmax, l, r, Line(k, b));
    }

    // 查询 x 处的最大值
    ll query(int x) const {
        return query(0, xmin, xmax, x);
    }
};
```

> **提示**：`INF` 需要根据值域调整，确保不会被真实数据超过。默认 line 的 `b = -INF` 使得空节点查询返回极小值。
