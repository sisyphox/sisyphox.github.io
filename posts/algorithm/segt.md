# 线段树 (Segment Tree)

**线段树**是一种用于维护区间信息的分治数据结构。它能在 O(log n) 的时间内完成**单点修改**和**区间查询**。

## 核心思想

线段树是一棵**完全二叉树**，每个节点代表一个区间：

- 根节点覆盖整个数组 `[0, n-1]`
- 每个节点将区间对半分割给左右子节点
- 叶子节点对应单个元素

```
                    [0,7] sum=36
                   /         \
            [0,3] sum=10     [4,7] sum=26
           /       \         /       \
      [0,1]=3   [2,3]=7  [4,5]=11  [6,7]=15
      /   \     /   \    /   \     /   \
    [0]=1 [1]=2 [2]=3 [3]=4 [4]=5 [5]=6 [6]=7 [7]=8
```

每个节点存储其区间内所有元素的**聚合信息**（和、最大值、最小值、GCD 等）。

## 节点编号技巧

使用数组存储树，根节点下标为 0，对节点 `u`：
- 左儿子：`u * 2 + 1`
- 右儿子：`u * 2 + 2`

这样树的大小只需要 `4 * n`。

## 操作分析

### 区间查询

查询 `[L, R]` 时，从根出发：
- 若当前节点区间完全在 `[L, R]` 内 → 直接返回
- 若当前节点区间与 `[L, R]` 无交集 → 返回零值
- 否则递归左右子节点，合并结果

### 单点修改

修改位置 `pos` 时，沿树一路向下更新，回溯时重新合并。

## 时间复杂度

| 操作 | 复杂度 |
|------|--------|
| 建树 | O(n) |
| 单点修改 | O(log n) |
| 区间查询 | O(log n) |

## 应用场景

- 区间求和 / 求最值
- 区间 GCD / LCM
- 配合懒标记实现区间修改
- 求逆序对（离线）

## 代码模板

```cpp
#include <bits/stdc++.h>
using namespace std;

// 单点修改，区间查询线段树
template<typename T>
class Segt {
private:
    vector<T> tree;
    int sz;
    // merge 为两个节点合并的规则
    T merge(T a, T b) {
        return a + b;
    }
    void add(int u, int l, int r, int x, T d, bool is_set) {
        if (l == r) {
            assert(r == x);
            if (is_set) tree[u] = d;
            else tree[u] += d;
            return;
        }
        int lc = u * 2 + 1, rc = u * 2 + 2, mid = (l + r) >> 1;
        if (x <= mid) add(lc, l, mid, x, d, is_set);
        else add(rc, mid + 1, r, x, d, is_set);
        tree[u] = merge(tree[lc], tree[rc]);
    }
    T query(int u, int l, int r, int L, int R) {
        if (L <= l && r <= R) {
            return tree[u];
        }
        int lc = u * 2 + 1, rc = u * 2 + 2, mid = (l + r) >> 1;
        if (mid >= R) return query(lc, l, mid, L, R);
        else if (mid < L) return query(rc, mid + 1, r, L, R);
        else return merge(query(lc, l, mid, L, R), query(rc, mid + 1, r, L, R));
    }
    void build(int u, int l, int r, vector<T>& nums) {
        if (l == r) {
            tree[u] = nums[l];
            return;
        }
        int lc = u * 2 + 1, rc = u * 2 + 2, mid = (l + r) >> 1;
        build(lc, l, mid, nums);
        build(rc, mid + 1, r, nums);
        tree[u] = merge(tree[lc], tree[rc]);
    }
public:
    Segt(int sz) {
        this->sz = sz;
        tree.resize(4 * sz);
    }
    void build(vector<T>& nums) {
        assert(sz == nums.size());
        build(0, 0, sz - 1, nums);
    }
    // pos 处加 d
    void add(int pos, T d) {
        add(0, 0, sz - 1, pos, d, false);
    }
    // pos 处设为 d
    void set(int pos, T d) {
        add(0, 0, sz - 1, pos, d, true);
    }
    // 查询 [l, r] 区间 merge
    T query(int l, int r) {
        return query(0, 0, sz - 1, l, r);
    }
};
```

> **提示**：如果需要区间修改（如区间加、区间赋值），需要引入**懒标记**（Lazy Tag）机制，在节点上额外维护一个 tag，push_down 时传递给子节点。
