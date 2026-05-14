# 可持久化线段树 (Persistent Segment Tree)

**可持久化线段树**（又称主席树 / President Tree）是一种支持**访问历史版本**的线段树。每次修改操作不覆盖原节点，而是创建新的节点，形成版本链。

## 为什么要持久化？

普通线段树修改后，旧数据就丢失了。但如果我们需要：

- 查询「第 k 次修改前」的区间和
- 查询区间 `[L, R]` 内的第 k 小值

就需要**可持久化**：每次修改只新建 O(log n) 个节点，其余节点与旧版本共享。

## 核心思想：动态开点 + 共享节点

```
        版本 0              版本 1（修改了 pos=2）
        [0,3]               [0,3]'  ← 新节点
       /     \              /     \
    [0,1]   [2,3]       [0,1]    [2,3]' ← 新节点
    /  \    /  \         /  \     /  \
  [0] [1] [2] [3]     [0] [1]  [2]' [3]  ← 只有 [2]' 是新的
                                       ↑ [3] 与版本 0 共享
```

每次更新只新建从根到叶子的路径（O(log n) 个节点），其余节点与前一版本共享。

## 时空复杂度

| 操作 | 复杂度 |
|------|--------|
| 单点修改（创建新版本） | O(log n) 时间，O(log n) 空间 |
| 区间查询（指定版本） | O(log n) |
| 总空间 | O(n log n)（建树 + m 次修改） |

## 应用场景

- **静态区间第 k 小** — 主席树经典应用
- **历史版本查询** — 回溯到任意历史状态
- **区间不同数个数** — 可持久化维护 last 位置
- **树上路径第 k 小** — 结合 LCA

## 代码模板

```cpp
#include <bits/stdc++.h>
using namespace std;

class Segt {
private:
    struct node {
        int lc = 0, rc = 0, x = 0;
        node(int val = 0) { x = val; }
    };
    vector<node> tree;
    int sz, id = 0;

    void push_up(int u) {
        tree[u].x = tree[tree[u].lc].x + tree[tree[u].rc].x;
    }

    int update(int v, int l, int r, int x, int d) {
        int u = ++id;
        if (l == r && r == x) {
            tree[u].x = tree[v].x + d;
            return u;
        }
        int mid = (l + r) >> 1, lc, rc;
        if (x <= mid) {
            lc = update(tree[v].lc, l, mid, x, d);
            rc = tree[v].rc;
        } else {
            rc = update(tree[v].rc, mid + 1, r, x, d);
            lc = tree[v].lc;
        }
        tree[u].lc = lc, tree[u].rc = rc;
        push_up(u);
        return u;
    }

    // 此处 query 不会产生新节点
    int query(int u, int v, int l, int r, int tar) {
        if (l == r) return tree[v].x - tree[u].x;
        int l_sum = tree[tree[v].lc].x - tree[tree[u].lc].x;
        int mid = (l + r) >> 1;
        if (tar <= mid) {
            return query(tree[u].lc, tree[v].lc, l, mid, tar);
        } else {
            return l_sum + query(tree[u].rc, tree[v].rc, mid + 1, r, tar);
        }
    }

public:
    // n 是结点最多个数，线段树区间为 [0, maxl)
    Segt(int n, int maxl) {
        sz = maxl;
        tree.resize(n << 5);
    }

    // 在版本号为 u 的树上对 pos 位置更新 d
    int update(int u, int pos, int d) {
        return update(u, 0, sz - 1, pos, d);
    }

    // 在 v - u 的版本上查询 tar
    int query(int u, int v, int tar) {
        return query(u, v, 0, sz - 1, tar);
    }
};
```

> **提示**：`tree.resize(n << 5)` 预留了 `n * 32` 个节点的空间。`update` 返回新版本的根节点编号，调用者需要保存这个返回值作为新版本来管理版本链。

## 经典应用：区间第 k 小

1. 将数组元素离散化到 `[0, maxl)`
2. 从左到右遍历数组，每次基于上一个版本插入当前元素（`d=+1`）
3. 查询 `[L, R]` 第 k 小时，在版本 `R` 和 `L-1` 的差树上二分

```cpp
// 伪代码
vector<int> roots(n + 1);
roots[0] = 0;  // 空树
for (int i = 1; i <= n; i++) {
    roots[i] = segt.update(roots[i - 1], a[i], +1);
}
// 查询 [l, r] 中第 k 小：
int ans = segt.kth(roots[l - 1], roots[r], k);
```
