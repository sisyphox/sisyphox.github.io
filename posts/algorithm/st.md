# 稀疏表 (Sparse Table)

**ST 表**（Sparse Table）是一种用于**静态区间查询**的数据结构。它能在 O(1) 时间内回答区间 RMQ（Range Minimum/Maximum Query）等**幂等操作**的查询。

## 幂等操作

一个操作 `op` 是幂等的，当且仅当 `op(x, x) = x`。例如：

| 操作 | 幂等？ |
|------|--------|
| min | ✅ |
| max | ✅ |
| gcd | ✅ |
| lcm | ✅ |
| & (位与) | ✅ |
| \| (位或) | ✅ |
| + (加法) | ❌ |

## 核心思想：倍增

`st[i][j]` 表示从 `i` 开始、长度为 `2^j` 的区间的聚合值。

```
st[i][0] = a[i]                           // 长度 1
st[i][1] = op(a[i], a[i+1])               // 长度 2
st[i][2] = op(a[i..i+3])                  // 长度 4
...
st[i][j] = op(st[i][j-1], st[i+2^(j-1)][j-1])  // 两段拼合
```

### 查询 O(1) 的秘密

查询 `[l, r]` 时，设 `k = floor(log2(r-l+1))`，则：

```
answer = op(st[l][k], st[r - 2^k + 1][k])
```

两段区间 `[l, l+2^k-1]` 和 `[r-2^k+1, r]` 必然**覆盖**整个查询区间。由于操作是幂等的，重叠部分不影响结果！

```
区间:  [l_____________r]
段1:   [l____l+2^k-1]
段2:         [r-2^k+1____r]
                ↑ 重叠区域不影响结果
```

## 时间复杂度

| 操作 | 复杂度 |
|------|--------|
| 建表 | O(n log n) |
| 查询 | O(1) |

> ST 表不支持修改。如果需要修改，请使用线段树或树状数组。

## 代码模板

```cpp
#include <bits/stdc++.h>
using namespace std;

template<typename T>
class ST {
public:
    vector<vector<T>> st;
    int sz;
    function<T(T, T)> op; // op can be max, min, gcd, lcm, &, |, etc.

    ST(vector<T>& x, function<T(T, T)> f) : op(std::move(f)) {
        sz = x.size();
        int K = log2(sz);
        st.resize(sz, vector<T>(K + 1));
        for (int i = 0; i < sz; i++) st[i][0] = x[i];
        for (int j = 1; j <= K; j++) {
            for (int i = 0; i + (1 << j) - 1 < sz; i++) {
                st[i][j] = op(st[i][j - 1], st[i + (1 << (j - 1))][j - 1]);
            }
        }
    }

    T get(int l, int r) {
        int K = log2(r - l + 1);
        return op(st[l][K], st[r - (1 << K) + 1][K]);
    }
};

// 使用示例
void solve() {
    int n, m; cin >> n >> m;
    vector<int> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];
    ST<int> st(a, [&](int a, int b) { return __gcd(a, b); });
    for (int i = 1; i <= m; i++) {
        int l, r; cin >> l >> r;
        cout << st.get(l, r) << endl;
    }
}
```

> **提示**：`log2()` 函数在 C++ 中是 O(1) 的。如果你追求极致速度，可以预处理 `Log2` 数组。

## 对比总结

| 特性 | ST 表 | 线段树 | 树状数组 |
|------|-------|--------|----------|
| 查询 | **O(1)** | O(log n) | O(log n) |
| 修改 | ❌ 不支持 | O(log n) | O(log n) |
| 操作类型 | 仅幂等操作 | 任意可合并操作 | 仅可逆操作 (和/异或) |
| 内存 | O(n log n) | O(4n) | O(n) |

选择建议：**静态 RMQ 选 ST 表，动态修改选线段树，前缀和类问题选树状数组。**
