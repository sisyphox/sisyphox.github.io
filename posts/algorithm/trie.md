# 字典树 (Trie)

**Trie**（字典树，又称前缀树）是一种用于高效存储和检索字符串集合的树形数据结构。它的核心优势是：利用字符串的公共前缀来减少查询时间。

## 核心思想

每个节点代表一个字符，从根到某个节点的路径构成一个字符串的前缀。节点的子节点用字符映射表存储。

```
           root
         /  |  \
        c   d   h
       /    |    \
      a     o     e
     / \    |     |
    r  t    g     l
            |     |
            s     l
                  |
                  o
```

上图存储了：`car`, `cat`, `dogs`, `hello`

## 节点设计

常用两种方式存储子节点：

1. **数组**：`nxt[node][26]` — 适合小写字母，速度快
2. **哈希表**：`unordered_map<char, int>` — 省空间，适合大字符集

## 时间复杂度

| 操作 | 复杂度 |
|------|--------|
| 插入字符串 | O(\|S\|) |
| 查询字符串 | O(\|S\|) |
| 前缀查询 | O(\|S\|) |

其中 `|S|` 为字符串长度。注意 Trie 的空间复杂度较高——最坏 O(字符集大小 × 节点数)。

## 应用场景

- **字符串查找** — 判断一个字符串是否在集合中
- **前缀匹配** — 自动补全、IP 路由最长前缀匹配
- **异或问题** — 01-Trie 用于最大异或对
- **AC 自动机** — 多模式匹配的基础结构

## 代码模板

```cpp
#include <bits/stdc++.h>
using namespace std;
#define int long long
const int N = 1e5 + 5;

class Trie {
private:
    static int nxt[N][26];
    static int cnt[N];
    static int top;
    int root;
    int new_node() {
        return ++top;
    }
public:
    Trie() {
        root = new_node();
    }
    void insert(const string& x) {
        int u = root;
        for (auto c : x) {
            if (!nxt[u][c - 'a']) {
                nxt[u][c - 'a'] = new_node();
            }
            u = nxt[u][c - 'a'];
        }
        cnt[u]++;
    }
    int query(const string& x) {
        int u = root;
        for (auto c : x) {
            if (nxt[u][c - 'a']) {
                u = nxt[u][c - 'a'];
            } else {
                return 0;
            }
        }
        return cnt[u];
    }
};
int Trie::nxt[N][26] = {0};
int Trie::cnt[N] = {0};
int Trie::top = 0;
```

> **提示**：上述实现使用静态数组 `nxt` 和 `cnt`，`top` 是节点计数器。如果你想在函数体内创建多个 Trie，可以考虑把数组改为动态（`vector`），或者在外部确保 `top` 被重置。

## 变种：01-Trie

将 Trie 用于**二进制数**的存储（每个节点只有 0/1 两个子节点），常用于处理异或相关的最优化问题（如「数组中两个数的最大异或值」）。
