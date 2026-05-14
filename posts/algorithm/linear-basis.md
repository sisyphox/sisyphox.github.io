# 线性基 (Linear Basis)

**线性基**是处理**异或（XOR）空间**问题的强大工具。给定一组数，它们的线性基是一组**线性无关**的基向量，能够张成与原集合完全相同的异或空间。

## 直觉理解

类比线性代数中的「向量空间的基」：

- 一个向量空间可以由一组基生成
- 同样的，一组数的所有异或组合构成一个「异或空间」
- 线性基就是这个空间的「基」

对于一个整数 `x`，把它看作 `Z₂` 上的向量（每个 bit 是一个维度），线性基就是找到一组线性无关的向量。

## 插入过程

将数 `x` 插入线性基时，从高位向低位扫描：

```
对于 x 的每个为 1 的 bit i（从高到低）：
  如果 basis[i] == 0：
    basis[i] = x，插入成功
  否则：
    x = x XOR basis[i]（消去第 i 位）
```

如果最终 `x` 变为 0，说明它已能被现有基表示，插入失败（即 `x` 是冗余的）。

## 支持的操作

| 操作 | 说明 | 复杂度 |
|------|------|--------|
| `insert(x)` | 插入一个数 | O(log V) |
| `queryMax()` | 查询最大异或和 | O(log V) |
| `queryMin()` | 查询最小非零异或和 | O(log V) |
| `check(x)` | 判断 x 是否能被异或表示 | O(log V) |
| `queryKth(k)` | 查询第 k 小异或和 | O(log² V) |

其中 V 是值域大小（通常是 2⁶⁰ ~ 2⁶³）。

## 应用场景

- **最大异或子集** — 经典问题，贪心取高位
- **异或和计数** — 第 k 小异或和
- **线性基合并** — 结合线段树处理区间查询
- **XOR 生成空间大小** — `2^(basisSize)` 个不同的异或值

## 代码模板

```cpp
#include <bits/stdc++.h>
using namespace std;

class LinearBasis {
private:
    static const int MAX_BITS = 63;
    vector<long long> basis;
    int basisSize;
    bool isReduced = false;

    void reduceToRref() {
        if (isReduced) return;
        for (int i = 0; i < MAX_BITS; ++i) {
            if (basis[i] == 0) continue;
            for (int j = i + 1; j < MAX_BITS; ++j) {
                if (basis[j] & (1LL << i)) {
                    basis[j] ^= basis[i];
                }
            }
        }
        isReduced = true;
    }

public:
    LinearBasis() : basisSize(0), isReduced(false) {
        basis.assign(MAX_BITS, 0);
    }

    bool insert(long long x) {
        isReduced = false;
        for (int i = MAX_BITS - 1; i >= 0; --i) {
            if (x & (1LL << i)) {
                if (basis[i] == 0) {
                    basis[i] = x;
                    basisSize++;
                    return true;
                }
                x ^= basis[i];
            }
        }
        return false;
    }

    long long queryMax() const {
        long long res = 0;
        for (int i = MAX_BITS - 1; i >= 0; --i) {
            res = max(res, res ^ basis[i]);
        }
        return res;
    }

    bool check(long long x) const {
        for (int i = MAX_BITS - 1; i >= 0; --i) {
            x = min(x, x ^ basis[i]);
        }
        return x == 0;
    }

    // 最小非零异或和
    long long queryMin() const {
        for (int i = 0; i < MAX_BITS; ++i) {
            if (basis[i] != 0) {
                return basis[i];
            }
        }
        return 0;
    }

    long long queryKth(long long k) {
        if (k == 0) return 0;
        if (!isReduced) reduceToRref();
        if (k > (1LL << basisSize)) return -1;

        vector<long long> nonZeroBasis;
        for (int i = 0; i < MAX_BITS; ++i) {
            if (basis[i] != 0) {
                nonZeroBasis.push_back(basis[i]);
            }
        }

        k -= 1;
        long long res = 0;
        for (int i = 0; i < basisSize; ++i) {
            if (k & (1LL << i)) {
                res ^= nonZeroBasis[i];
            }
        }
        return res;
    }
};
```

> **注意**：`check(x)` 只能判断 `x` 能否被当前基异或表示。判断「是否存在某个子集的异或和为 0」只能通过插入过程来判断（如果插入失败，即 `x` 被消为 0，说明存在子集异或和为 0）。

## 进阶：带掩码的线性基

上述模板还包含了一个 `LinearBasis1` 类，它在每个基向量上附加了**插入时间戳信息（mask）**，可以追踪某个异或值是由哪些原始元素构成的。这在需要输出方案时非常有用。
