# 登录认证 API 文档

> 本文档说明"多厂商媒体生成 API"的登录相关接口（不含注册、找回密码、修改密码、token 撤销等流程）。
>
> 涉及数据库表：[`system_admins`](../../database/sql/schema/01_system_admins.sql)、[`enterprises`](../../database/sql/schema/02_companies.sql)、[`accounts`](../../database/sql/schema/04_company_employees.sql)。

---

## 1. 概述

### 1.1 三类登录身份

| `user_type` | 含义 | 数据表 | `login_id` 字段 | 示例 |
| --- | --- | --- | --- | --- |
| `admin` | 系统管理员 | `system_admins` | `name` | `系统管理员` |
| `enterprise` | 企业 | `enterprises` | `enterprise_id` | `demo-company` |
| `employee` | 企业账号 | `accounts` | `account_id` 或 `email` | `demo-company90010001` / `admin@demo-company.com` |

> 注：项目的设计文档（`00_user_system_design.md`）原本规划了"企业管理员"作为独立表 `company_admins`，但实际 schema 中该表已**合并到 `enterprises`**（`02_companies.sql` 头部注释、`03_company_admins.sql` 已废弃），所以本接口不单独区分"企业管理员"角色。

### 1.2 鉴权方式

- 采用 **JWT 双 Token**：
  - `access_token`：默认有效期 **120 分钟**（`ACCESS_TOKEN_EXPIRE_MINUTES`），用于受保护接口的 `Authorization: Bearer <access_token>`。
  - `refresh_token`：默认有效期 **7 天**（`REFRESH_TOKEN_EXPIRE_DAYS`），仅用于换发新的 `access_token`。
- 算法：HS256（`JWT_ALGORITHM`）。
- 密钥：环境变量 `JWT_SECRET`（生产环境必须替换为强随机字符串，建议 ≥ 32 字节）。

### 1.3 通用响应格式

成功响应（HTTP 200）：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 7200,
  "user": { ... }
}
```

失败响应（非 2xx）：

```json
{
  "detail": {
    "code": "INVALID_CREDENTIALS",
    "message": "账号或密码错误"
  }
}
```

### 1.4 通用错误码

| HTTP | `detail.code` | 含义 |
| --- | --- | --- |
| 400 | `INVALID_USER_TYPE` | `user_type` 字段不在 `{admin, enterprise, employee}` 中 |
| 401 | `INVALID_CREDENTIALS` | `login_id` 不存在，或密码错误（不区分两种情况以防账号枚举） |
| 401 | `TOKEN_MISSING` | 受保护接口未带 `Authorization: Bearer ...` |
| 401 | `TOKEN_INVALID` | token 签名错误、格式错误、类型错误 |
| 401 | `TOKEN_EXPIRED` | token 超过有效期 |
| 401 | `USER_NOT_FOUND` | token 合法但账号已被删除（`/refresh` 与 `/me/profile` 也可能抛） |
| 403 | `ACCOUNT_DISABLED` | 管理员 `is_active=false`、企业 `status='disabled'`、账号 `status='disabled'`（`/refresh` 也会校验，账号禁用后立即吊销 refresh 续命） |

> **注意**：登录失败时，接口会**累加**对应表的 `failed_login_count` 字段；登录成功会**清零** `failed_login_count` 并**递增** `login_count`、更新 `last_login_at` / `last_login_ip`。**当前策略不锁定账号**（已与产品确认）。

---

## 2. 接口列表

| 方法 | 路径 | 鉴权 | 用途 |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | 否 | 登录，返回 access/refresh token |
| POST | `/api/v1/auth/refresh` | 否 | 用 refresh_token 换发新的 access_token（**会查库校验账号状态**） |
| GET  | `/api/v1/auth/me` | 是 | 获取当前登录用户信息（从 token claims 解析，不查库） |
| GET  | `/api/v1/auth/me/profile` | 是 | 获取当前登录用户完整信息（按 `sub` + `user_type` 查库补齐 `enterprise_name` / `email` / `last_login_*`） |
| POST | `/api/v1/auth/logout` | 是 | 登出（当前为前端丢弃 token；预留服务端黑名单扩展） |

---

## 3. 接口详情

### 3.1 POST /api/v1/auth/login

**请求体**（`application/json`）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `login_id` | string (1-100) | ✅ | 登录标识（参见 1.1） |
| `password` | string (1-128) | ✅ | 明文密码 |
| `user_type` | enum | ✅ | `admin` / `enterprise` / `employee` |

**请求示例 —— 系统管理员**：

```bash
curl -X POST http://localhost:8003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login_id": "系统管理员",
    "password": "admin123",
    "user_type": "admin"
  }'
```

**请求示例 —— 企业**：

```bash
curl -X POST http://localhost:8003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login_id": "demo-company",
    "password": "demo123",
    "user_type": "enterprise"
  }'
```

**请求示例 —— 企业账号（用 account_id）**：

```bash
curl -X POST http://localhost:8003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login_id": "demo-company90010001",
    "password": "admin123",
    "user_type": "employee"
  }'
```

**请求示例 —— 企业账号（用 email）**：

```bash
curl -X POST http://localhost:8003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login_id": "admin@demo-company.com",
    "password": "admin123",
    "user_type": "employee"
  }'
```

**成功响应**（HTTP 200）：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 7200,
  "user": {
    "user_id": "demo-company90010001",
    "user_type": "employee",
    "name": "超级管理员",
    "enterprise_id": "demo-company",
    "enterprise_name": "示例科技有限公司",
    "permission_level": 9,
    "email": "admin@demo-company.com",
    "last_login_at": "2026-06-03T10:00:00Z",
    "last_login_ip": "127.0.0.1"
  }
}
```

**字段说明（响应中的 `user`）**：

| 字段 | 适用类型 | 说明 |
| --- | --- | --- |
| `user_id` | 全部 | 管理员=UUID；企业=`enterprise_id`；账号=`account_id` |
| `user_type` | 全部 | `admin` / `enterprise` / `employee` |
| `name` | 全部 | 展示名 |
| `enterprise_id` | 企业、账号 | 所属企业 |
| `enterprise_name` | 企业、账号 | 企业名称（账号类型经 JOIN 联表查询） |
| `permission_level` | 账号（0-9） | 权限等级；越大权限越高（仅 `employee` 返回） |
| `email` | 企业、账号 | 联系邮箱 |
| `last_login_at` | 全部 | 登录成功前的最后一次登录时间（ISO 8601） |
| `last_login_ip` | 全部 | 登录成功前的最后一次登录 IP |

**失败响应**：

| 场景 | HTTP | `detail.code` |
| --- | --- | --- |
| `login_id` 不存在 | 401 | `INVALID_CREDENTIALS` |
| 密码错误 | 401 | `INVALID_CREDENTIALS` |
| 管理员 `is_active=false` | 403 | `ACCOUNT_DISABLED` |
| 企业 `status='disabled'` | 403 | `ACCOUNT_DISABLED` |
| 账号 `status='disabled'` | 403 | `ACCOUNT_DISABLED` |
| `user_type` 不在枚举内 | 400 | `INVALID_USER_TYPE` |
| 请求体字段缺失 / 长度越界 | 422 | （FastAPI 自动生成） |

---

### 3.2 POST /api/v1/auth/refresh

**请求体**：

```json
{ "refresh_token": "eyJhbGciOiJIUzI1NiIs..." }
```

**示例**：

```bash
curl -X POST http://localhost:8003/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refresh_token": "eyJhbGciOiJIUzI1NiIs..." }'
```

**成功响应**（HTTP 200）：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...(new)...",
  "token_type": "bearer",
  "expires_in": 7200
}
```

**失败响应**：

| 场景 | HTTP | `detail.code` |
| --- | --- | --- |
| refresh_token 过期 | 401 | `TOKEN_EXPIRED` |
| refresh_token 签名错误 | 401 | `TOKEN_INVALID` |
| 误传 access_token（`typ` 不匹配） | 401 | `TOKEN_INVALID` |

---

### 3.3 GET /api/v1/auth/me

**Header**：

```
Authorization: Bearer <access_token>
```

**示例**：

```bash
curl http://localhost:8003/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**成功响应**（HTTP 200）：

```json
{
  "user_id": "demo-company90010001",
  "user_type": "employee",
  "name": "超级管理员",
  "enterprise_id": "demo-company",
  "enterprise_name": null,
  "permission_level": 9,
  "email": null,
  "last_login_at": null,
  "last_login_ip": null
}
```

> **注意**：`/me` 接口**不查库**，信息从 JWT claims 解析。`enterprise_name` / `email` / `last_login_*` 字段在 `/me` 中为 `null`，需要时改用 `UserInfo` 重新登录或在 `accounts` 表的 JOIN 查询中获取。

**失败响应**：

| 场景 | HTTP | `detail.code` |
| --- | --- | --- |
| 缺少 Authorization 头 | 401 | `TOKEN_MISSING` |
| token 过期 | 401 | `TOKEN_EXPIRED` |
| token 签名错误 | 401 | `TOKEN_INVALID` |

---

### 3.4 GET /api/v1/auth/me/profile

**Header**：

```
Authorization: Bearer <access_token>
```

**示例**：

```bash
curl http://localhost:8003/api/v1/auth/me/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**成功响应**（HTTP 200）—— 与登录响应 `TokenResponse.user` 字段完全一致：

```json
{
  "user_id": "demo-company90010001",
  "user_type": "employee",
  "name": "超级管理员",
  "enterprise_id": "demo-company",
  "enterprise_name": "示例科技有限公司",
  "permission_level": 9,
  "email": "admin@demo-company.com",
  "last_login_at": "2026-06-03T10:00:00Z",
  "last_login_ip": "127.0.0.1"
}
```

> 与 `/me` 的差异：`/me` 不查库，`enterprise_name` / `email` / `last_login_*` 字段为 `null`；`/me/profile` 走一次主键查询补齐。前端按需调用即可。

**失败响应**：

| 场景 | HTTP | `detail.code` |
| --- | --- | --- |
| 缺少 Authorization 头 | 401 | `TOKEN_MISSING` |
| token 过期 | 401 | `TOKEN_EXPIRED` |
| token 签名错误 | 401 | `TOKEN_INVALID` |
| token 合法但账号已被删除 | 401 | `USER_NOT_FOUND` |

---

### 3.5 POST /api/v1/auth/logout

**Header**：

```
Authorization: Bearer <access_token>
```

**示例**：

```bash
curl -X POST http://localhost:8003/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**成功响应**（HTTP 200）：

```json
{ "message": "Logged out" }
```

> 当前实现仅校验 token 有效性，不在服务端保留黑名单。**前端应自行丢弃本地 token**。未来如需服务端撤销，可在此接口接入 token 黑名单（Redis 或数据库表）。

---

## 4. JWT 字段说明

access_token claims：

```json
{
  "sub": "demo-company90010001",
  "user_type": "employee",
  "name": "超级管理员",
  "enterprise_id": "demo-company",
  "permission_level": 9,
  "iat": 1717400000,
  "exp": 1717407200,
  "typ": "access",
  "jti": "8f3c..."
}
```

refresh_token claims（仅保留身份信息，体积更小）：

```json
{
  "sub": "demo-company90010001",
  "user_type": "employee",
  "iat": 1717400000,
  "exp": 1718004800,
  "typ": "refresh",
  "jti": "b21a..."
}
```

---

## 5. 数据库准备

接口依赖以下三张表（schema 已设计完成，本接口**不创建**也不**修改**这些表）：

1. [`database/sql/schema/01_system_admins.sql`](../../database/sql/schema/01_system_admins.sql)
2. [`database/sql/schema/02_companies.sql`](../../database/sql/schema/02_companies.sql)
3. [`database/sql/schema/04_company_employees.sql`](../../database/sql/schema/04_company_employees.sql)

执行顺序：

```bash
# 1. 初始化数据库 + 扩展
psql -U postgres -d media_generation -f database/sql/init_database.sql

# 2. 按顺序执行三张用户表
psql -U postgres -d media_generation -f database/sql/schema/01_system_admins.sql
psql -U postgres -d media_generation -f database/sql/schema/02_companies.sql
psql -U postgres -d media_generation -f database/sql/schema/04_company_employees.sql
```

三张表里各自带了预置账号，可直接用于联调：

| user_type | login_id | password |
| --- | --- | --- |
| `admin` | `系统管理员` | `admin123` |
| `enterprise` | `demo-company` | `demo123` |
| `employee` | `demo-company90010001` | `admin123` |
| `employee` | `demo-company51010001` | `manager123` |
| `employee` | `demo-company11110001` | `employee123` |

> 所有预置账号使用同一个 bcrypt 哈希（`$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS.sC`），仅作为 schema 默认值展示，**实际使用前请务必修改**。

---

## 6. 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DB_HOST` | `localhost` | PostgreSQL 主机 |
| `DB_PORT` | `3307` | 端口 |
| `DB_NAME` | `media_generation` | 数据库名 |
| `DB_USER` | `postgres` | 用户名 |
| `DB_PASSWORD` | （空） | 密码 |
| `JWT_SECRET` | `please-change-me-in-prod-32bytes-minimum-secret` | JWT 签名密钥（**生产环境必须修改**；启动期会校验长度 ≥ 32 字节且非占位符） |
| `JWT_ALGORITHM` | `HS256` | 算法 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `120` | access_token 有效期（分钟） |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | refresh_token 有效期（天） |
| `TRUST_PROXY_HEADERS` | `False` | 是否解析 `X-Forwarded-For` / `X-Real-IP`；仅当后端部署在已知反代之后才置 `True` |

启动日志会打印：`[DB Pool] ✅ Connection pool initialized` —— 看到此行即数据库连接成功。

---

## 7. 端到端联调脚本

```bash
# 1. 启动服务
python run.py
# 或
uvicorn app.main:app --port 8003 --reload

# 2. 管理员登录
TOKEN=$(curl -s -X POST http://localhost:8003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login_id":"系统管理员","password":"admin123","user_type":"admin"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# 3. 调 /me
curl http://localhost:8003/api/v1/auth/me -H "Authorization: Bearer $TOKEN"

# 4. 调 /refresh
curl -X POST http://localhost:8003/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}"

# 5. 登出
curl -X POST http://localhost:8003/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

也可以直接打开 Swagger UI：`http://localhost:8003/docs`，在 "auth" 标签下能看到全部 4 个端点。

---

## 8. 已采纳的安全加固

- ✅ P0-#1：JWT 密钥启动期强校验（长度 ≥ 32 字节、拒绝占位符）。配置错误会**阻断启动**而非降级。
- ✅ P0-#5：`/refresh` 接口查库校验账号状态，被禁用的账号无法靠 refresh 续命。
- ✅ P1-#2：新增 `/me/profile` 接口（轻量查库补齐 `enterprise_name` / `email` / `last_login_*`），`/me` 保持不查库的轻量语义。
- ✅ P1-#4：`TRUST_PROXY_HEADERS` 开关；默认 `False`，避免 `X-Forwarded-For` 伪造污染 `last_login_ip`。

## 9. 范围之外（未实现）

- 注册 / 找回密码 / 修改密码 / 短信/邮箱验证
- 登录失败限流 / 账号自动锁定（P1-#6，依赖产品对锁定策略的最终决定）
- 角色权限强制（`accounts.permission_level` 仅在 token claims 中携带，未在中间件层校验）
- Token 黑名单 / 服务端撤销（P0-#12，`/logout` 当前仅返回 200）
- CORS 收紧（P1-#10，需要前端域名清单）
- 三张用户表的 CRUD 管理接口（账号增删改需后续单独设计）

如需扩展以上功能，请基于现有 `app/services/auth_service.py` 与 `app/api/auth.py` 进行迭代。
完整的安全审阅见 [LOGIN_SECURITY_REVIEW.md](./LOGIN_SECURITY_REVIEW.md)。
