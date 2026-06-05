# 平台公告模块 - 后端接口文档

## 基础信息

- 基础路径：`/api/v1/announcements`
- 认证方式：Bearer Token（Authorization: Bearer <access_token>）
- 响应格式：JSON

---

## 数据模型

### Announcement 公告

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | integer | 自动 | 公告ID，自增主键 |
| title | string | 是 | 公告标题，最大200字符 |
| category | string | 是 | 分类：`update`(功能更新) / `event`(活动) / `tutorial`(教程) |
| summary | string | 是 | 摘要，最大200字符 |
| content | string | 是 | 正文内容，支持HTML格式 |
| cover_image | string | 否 | 封面图片URL |
| is_top | boolean | 否 | 是否置顶，默认false |
| status | string | 是 | 状态：`published`(已发布) / `draft`(草稿) |
| author | string | 自动 | 作者，从JWT token中获取 |
| view_count | integer | 自动 | 浏览量，默认0 |
| created_at | datetime | 自动 | 创建时间 |
| updated_at | datetime | 自动 | 更新时间 |
| published_at | datetime | 自动 | 发布时间，首次发布时设置 |

---

## 接口列表

### 1. 获取公告列表

**GET** `/api/v1/announcements`

获取公告列表，支持分页和筛选。

#### 请求参数（Query）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 否 | 分类筛选：`update` / `event` / `tutorial` |
| status | string | 否 | 状态筛选：`published` / `draft`。不传则仅返回已发布 |
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页条数，默认10，最大100 |

#### 响应示例

```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "title": "AI生成模型全新升级V3.0",
        "category": "update",
        "summary": "全新AI视频生成模型V3.0正式上线",
        "content": "<h2>AI生成模型V3.0正式发布</h2><p>...</p>",
        "cover_image": "",
        "is_top": true,
        "status": "published",
        "author": "系统管理员",
        "view_count": 1280,
        "created_at": "2026-05-16 10:00:00",
        "updated_at": "2026-05-16 10:00:00",
        "published_at": "2026-05-16 10:00:00"
      }
    ],
    "total": 6,
    "page": 1,
    "page_size": 10
  }
}
```

---

### 2. 获取公告详情

**GET** `/api/v1/announcements/:id`

获取单条公告详情，同时浏览量+1。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | integer | 是 | 公告ID |

#### 响应示例

```json
{
  "data": {
    "id": 1,
    "title": "AI生成模型全新升级V3.0",
    "category": "update",
    "summary": "全新AI视频生成模型V3.0正式上线",
    "content": "<h2>AI生成模型V3.0正式发布</h2><p>...</p>",
    "cover_image": "",
    "is_top": true,
    "status": "published",
    "author": "系统管理员",
    "view_count": 1281,
    "created_at": "2026-05-16 10:00:00",
    "updated_at": "2026-05-16 10:00:00",
    "published_at": "2026-05-16 10:00:00"
  }
}
```

#### 错误响应

| 状态码 | code | 说明 |
|--------|------|------|
| 404 | NOT_FOUND | 公告不存在 |

---

### 3. 创建公告

**POST** `/api/v1/announcements`

创建新公告，仅管理员可调用。

#### 请求体

```json
{
  "title": "公告标题",
  "category": "update",
  "summary": "公告摘要",
  "content": "<p>正文内容</p>",
  "cover_image": "",
  "is_top": false,
  "status": "published"
}
```

#### 响应示例

```json
{
  "data": {
    "id": 7,
    "title": "公告标题",
    "category": "update",
    "summary": "公告摘要",
    "content": "<p>正文内容</p>",
    "cover_image": "",
    "is_top": false,
    "status": "published",
    "author": "系统管理员",
    "view_count": 0,
    "created_at": "2026-06-05 10:00:00",
    "updated_at": "2026-06-05 10:00:00",
    "published_at": "2026-06-05 10:00:00"
  }
}
```

#### 错误响应

| 状态码 | code | 说明 |
|--------|------|------|
| 400 | VALIDATION_ERROR | 必填字段缺失 |
| 403 | FORBIDDEN | 非管理员无权操作 |

---

### 4. 更新公告

**PUT** `/api/v1/announcements/:id`

更新公告，仅管理员可调用。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | integer | 是 | 公告ID |

#### 请求体

所有字段均为可选，仅传需要更新的字段：

```json
{
  "title": "新标题",
  "category": "event",
  "summary": "新摘要",
  "content": "<p>新内容</p>",
  "cover_image": "https://example.com/cover.jpg",
  "is_top": true,
  "status": "published"
}
```

#### 响应示例

```json
{
  "data": {
    "id": 1,
    "title": "新标题",
    "category": "event",
    "summary": "新摘要",
    "content": "<p>新内容</p>",
    "cover_image": "https://example.com/cover.jpg",
    "is_top": true,
    "status": "published",
    "author": "系统管理员",
    "view_count": 1280,
    "created_at": "2026-05-16 10:00:00",
    "updated_at": "2026-06-05 12:00:00",
    "published_at": "2026-05-16 10:00:00"
  }
}
```

#### 错误响应

| 状态码 | code | 说明 |
|--------|------|------|
| 404 | NOT_FOUND | 公告不存在 |
| 403 | FORBIDDEN | 非管理员无权操作 |

---

### 5. 删除公告

**DELETE** `/api/v1/announcements/:id`

删除公告，仅管理员可调用。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | integer | 是 | 公告ID |

#### 响应示例

```json
{
  "data": {
    "message": "删除成功"
  }
}
```

#### 错误响应

| 状态码 | code | 说明 |
|--------|------|------|
| 404 | NOT_FOUND | 公告不存在 |
| 403 | FORBIDDEN | 非管理员无权操作 |

---

### 6. 获取最新公告

**GET** `/api/v1/announcements/latest`

获取最新发布的公告列表，用于首页侧边栏展示。

#### 请求参数（Query）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | integer | 否 | 返回条数，默认5，最大20 |

#### 响应示例

```json
{
  "data": [
    {
      "id": 1,
      "title": "AI生成模型全新升级V3.0",
      "category": "update",
      "summary": "全新AI视频生成模型V3.0正式上线",
      "published_at": "2026-05-16 10:00:00"
    }
  ]
}
```

---

## 数据库建表参考（MySQL）

```sql
CREATE TABLE announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL COMMENT '公告标题',
  category ENUM('update', 'event', 'tutorial') NOT NULL COMMENT '分类',
  summary VARCHAR(200) NOT NULL COMMENT '摘要',
  content TEXT NOT NULL COMMENT '正文内容(HTML)',
  cover_image VARCHAR(500) DEFAULT '' COMMENT '封面图片URL',
  is_top TINYINT(1) DEFAULT 0 COMMENT '是否置顶',
  status ENUM('published', 'draft') NOT NULL DEFAULT 'draft' COMMENT '状态',
  author VARCHAR(100) NOT NULL DEFAULT '' COMMENT '作者',
  view_count INT DEFAULT 0 COMMENT '浏览量',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  published_at DATETIME DEFAULT NULL COMMENT '发布时间',
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_published_at (published_at),
  INDEX idx_is_top (is_top)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='平台公告表';
```
