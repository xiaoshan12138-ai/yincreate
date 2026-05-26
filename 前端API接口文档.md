# 前端 API 接口文档

本文档整理了当前平台使用的所有后端 API 接口，方便迁移到新平台时对接。

---

## 基础信息

| 项目 | 值 |
|------|-----|
| **Base URL** | `http://192.168.31.243:8003/api/v1` |
| **认证方式** | `Authorization: Bearer <token>`（可选，从 localStorage 读取） |
| **Content-Type** | `application/json` |
| **Token Switch Key** | `ErtveAQybj1XCVRsncebuiIYzTxUV0tganVf4bMijr5SKVzU` |

---

## 接口列表总览

| # | 方法 | 端点 | 用途 | 场景 |
|---|------|------|------|------|
| 1 | GET | `/models` | 获取模型列表 | 初始化/刷新模型 |
| 2 | POST | `/generate?sync=true` | 同步生成任务 | 图片/视频/数字人生成 |
| 3 | GET | `/generate/task/{taskId}` | 查询任务状态 | 异步轮询（已注释） |
| 4 | POST | `/tasks/{taskId}/cancel` | 取消任务 | 用户中止生成 |
| 5 | GET | TokenSwitch视频URL | 获取受保护视频 | vendor_b 视频播放 |

---

## 1. 获取模型列表

### 请求

```
GET /api/v1/models
Authorization: Bearer <token>（可选）
```

### 响应

```json
{
    "code": 200,
    "message": "获取成功",
    "data": {
        "summary": {
            "total_image_models": 11,
            "total_video_models": 21,
            "total_voices": 9,
            "vendors": ["vendor_a", "vendor_b"]
        },
        "image_models": [
            {
                "id": "kling_3_0",
                "name": "Kling 3.0",
                "description": "模型描述",
                "vendor": "vendor_a",
                "vendor_name": "腾讯云 VOD",
                "is_new": false,
                "is_vip": false
            },
            {
                "id": "gpt-image-2",
                "name": "GPT Image 2",
                "description": "text_to_image",
                "vendor": "vendor_b",
                "vendor_name": "Token Switch",
                "is_new": false,
                "is_vip": false
            }
        ],
        "video_models": [
            {
                "id": "seedance_2_0_fast",
                "name": "Seedance 2.0-fast",
                "description": "模型描述",
                "vendor": "vendor_a",
                "vendor_name": "腾讯云 VOD",
                "is_new": false,
                "is_vip": false
            },
            {
                "id": "happyhorse-1.0-video-edit-720p",
                "name": "HappyHorse 1.0 Video Edit 720p (Image)",
                "description": "image_edit",
                "vendor": "vendor_b",
                "vendor_name": "Token Switch",
                "is_new": false,
                "is_vip": false
            }
        ],
        "voices": [
            {
                "id": "voice_001",
                "name": "默认音色",
                "description": "标准女声"
            }
        ]
    }
}
```

### 前端调用代码

```javascript
async function fetchModels() {
    const response = await fetch(`${API_CONFIG.BASE_URL}/models`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
    });
    const data = await response.json();
    if (data.code !== 200) throw new Error(data.message);
    globalModels = data.data || { image_models: [], video_models: [], voices: [] };
    return globalModels;
}
```

---

## 2. 同步生成任务（核心接口）

### 请求

```
POST /api/v1/generate?sync=true
Content-Type: application/json
Authorization: Bearer <token>（可选）
```

### ⭐ model 字段取值规则（重要！）

| vendor | model 字段取值 | 示例 |
|--------|---------------|------|
| **vendor_a** (腾讯云 VOD) | 用 **`name`** | `"Kling 3.0"` |
| **vendor_b** (Token Switch) | 用 **`id`** | `"gpt-image-2"` |

```typescript
const submitModel = selectedModel.vendor === 'vendor_a'
    ? selectedModel.name   // vendor_a → name
    : selectedModel.id;    // vendor_b → id
```

---

### 2.1 图片生成请求体

#### 文生图（无文件上传）

```json
{
    "output_type": "image",
    "model": "Kling 3.0",
    "vendor": "vendor_a",
    "feature": "text_to_image",
    "parameters": {
        "resolution": "1080P",
        "ratio": "1:1",
        "count": 1
    },
    "prompt": "一只可爱的猫咪在草地上奔跑",
    "input_files": []
}
```

#### 图生图（有文件上传，单张）

```json
{
    "output_type": "image",
    "model": "Kling 3.0",
    "vendor": "vendor_a",
    "feature": "image_reference",
    "parameters": {
        "resolution": "1080P",
        "ratio": "16:9",
        "count": 1
    },
    "prompt": "将图片风格转换为油画效果",
    "input_files": [
        {
            "type": "image",
            "url": "data:image/jpeg;base64,/9j/4AAQ...",
            "purpose": "reference",
            "object_id": "image_1"
        }
    ]
}
```

#### feature 可选值（图片）

| feature | 说明 | 是否需要 input_files |
|---------|------|---------------------|
| `text_to_image` | 文生图 | 否 |
| `image_reference` | 图生图/参考图 | 是 |
| `image_edit` | 图片编辑 | 是 |
| `image_inpainting` | 图片局部重绘 | 是 |
| `image_upscale` | 图片超分辨率 | 是 |
| `image_style_transfer` | 风格迁移 | 否/可选 |
| `image_remove_bg` | 抠图 | 是 |
| `image_extend` | 图片扩展 | 是 |

#### parameters 参数说明（图片）

| 参数 | 类型 | 可选值 | 默认值 | 说明 |
|------|------|--------|--------|------|
| resolution | string | `480P`, `720P`, `1080P`, `2K`, `4K` | `1080P` | 分辨率 |
| ratio | string | `1:1`, `4:3`, `3:4`, `16:9`, `9:16` | `1:1` | 宽高比 |
| count | number | `1`~`4` | `1` | 生成数量 |

---

### 2.2 视频生成请求体

#### 文生视频（无文件上传）

```json
{
    "output_type": "video",
    "model": "Kling 3.0",
    "vendor": "vendor_a",
    "feature": "text_to_video",
    "parameters": {
        "resolution": "1080P",
        "duration": 5,
        "ratio": "16:9"
    },
    "prompt": "让画面动起来，一只猫在追蝴蝶",
    "input_files": []
}
```

#### 单图参考生视频

```json
{
    "output_type": "video",
    "model": "kling_3_0_omni",
    "vendor": "vendor_a",
    "feature": "global_reference",
    "parameters": {
        "resolution": "1080P",
        "duration": 8,
        "ratio": "16:9"
    },
    "prompt": "让 <<<image_1>>> 动起来",
    "input_files": [
        {
            "type": "image",
            "url": "data:image/jpeg;base64,/9j/4AAQ...",
            "purpose": "reference",
            "object_id": "image_1"
        }
    ]
}
```

#### 多图参考生视频

```json
{
    "output_type": "video",
    "model": "kling_3_0_omni",
    "vendor": "vendor_a",
    "feature": "multi_reference",
    "parameters": {
        "resolution": "1080P",
        "duration": 8,
        "ratio": "16:9"
    },
    "prompt": "让 <<<image_1>>> 和 <<<image_2>>> 一起跳舞",
    "input_files": [
        {
            "type": "image",
            "url": "data:image/jpeg;base64,/9j/4AAQ...",
            "purpose": "reference",
            "object_id": "image_1"
        },
        {
            "type": "image",
            "url": "data:image/jpeg;base64,iVBORw0KGgo...",
            "purpose": "reference",
            "object_id": "image_2"
        },
        {
            "type": "image",
            "url": "data:image/jpeg;base64,R0lGODlh...",
            "purpose": "reference",
            "object_id": "image_3"
        }
    ]
}
```

#### 视频上传生视频（首帧参考）

```json
{
    "output_type": "video",
    "model": "gv_3_1",
    "vendor": "vendor_a",
    "feature": "global_reference",
    "parameters": {
        "resolution": "1080P",
        "duration": 5,
        "ratio": "16:9"
    },
    "prompt": "让画面动起来",
    "input_files": [
        {
            "type": "video",
            "url": "data:video/mp4;base64,AAAAIGZ0eXB...（超长Base64）",
            "purpose": "reference",
            "object_id": "video_1"
        }
    ]
}
```

#### feature 可选值（视频）

| feature | 说明 | 是否需要 input_files |
|---------|------|---------------------|
| `text_to_video` | 文生视频 | 否 |
| `global_reference` | 全局参考（单图/单视频） | 是（1个） |
| `multi_reference` | 多图参考 | 是（≥2个） |
| `lip_sync` | 口型同步 | 是（音频+图片/视频） |
| `motion_control` | 运动控制 | 是 |
| `template_effect` | 模板特效 | 否/可选 |
| `style_replace` | 风格替换 | 是 |
| `object_repair` | 物品修复 | 是 |
| `object_replace` | 人物/物品替换 | 是 |

#### parameters 参数说明（视频）

| 参数 | 类型 | 可选值 | 默认值 | 说明 |
|------|------|--------|--------|------|
| resolution | string | `480P`, `720P`, `1080P`, `2K`, `4K` | `1080P` | 分辨率 |
| duration | number | `2`~`120` | `5` | 时长(秒) |
| ratio | string | `16:9`, `9:16`, `1:1` | `16:9` | 宽高比 |
| face_id | number | `0` | `0` | 人脸ID（lip_sync用） |
| audio_start_time | number | `0`~ | `0` | 音频起始时间(s) |
| audio_volume | number | `0.0`~`2.0` | `1.0` | 音频音量 |
| original_audio_volume | number | `0.0`~`1.0` | `0.0` | 原始音频音量 |
| keep_original_sound | string | `yes`, `no` | `no` | 保留原声 |
| template | string | `morphlab` 等 | - | 模板名称 |

---

### 2.3 数字人生成请求体

```json
{
    "output_type": "digital_human",
    "model": "kling_2.6",
    "vendor": "vendor_a",
    "feature": "digital_human",
    "parameters": {
        "voice_id": "voice_001",
        "action_description": "挥手打招呼"
    },
    "prompt": "你好，欢迎来到我们的平台",
    "input_files": []
}
```

---

### 2.4 通用响应格式

#### 成功响应（图片）

```json
{
    "code": 200,
    "message": "生成成功",
    "data": {
        "task_id": "task_2026051519065640_2746448628704",
        "type": "image",
        "status": "completed",
        "progress": 100,
        "result": {
            "images": [
                {
                    "id": "img_001",
                    "url": "https://cdn.example.com/generated/image.png"
                }
            ]
        }
    }
}
```

#### 成功响应（视频 - vendor_a）

```json
{
    "code": 200,
    "message": "查询成功",
    "data": {
        "task_id": "task_xxx",
        "type": "video",
        "status": "completed",
        "progress": 100,
        "result": {
            "video": {
                "id": "video_001",
                "url": "https://vod.example.com/output/video.mp4",
                "thumbnail": "",
                "duration": null
            }
        }
    }
}
```

#### 成功响应（视频 - vendor_b / Gemini 图片返回 base64）

```json
{
    "code": 200,
    "message": "成功",
    "data": {
        "task_id": "task_2026051519065640_2746448628704",
        "type": "image",
        "status": "completed",
        "progress": 100,
        "result": {
            "images": [{
                "id": "img_001",
                "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABWAAAAAMACAIATAAAA..."
            }]
        }
    }
}
```

#### 成功响应（视频 - vendor_b 受保护URL）

```json
{
    "code": 200,
    "message": "查询成功",
    "data": {
        "task_id": "task_xxx",
        "type": "video",
        "status": "completed",
        "progress": 100,
        "result": {
            "video_url": "https://neolink.com/api/v1/videos/{task_id}/content"
        }
    }
}
```

#### 错误响应

```json
{
    "code": 400,
    "message": "参数错误：model 不能为空",
    "data": null
}
```

或

```json
{
    "code": 500,
    "message": "后台任务执行失败",
    "data": null
}
```

---

## 3. 查询任务状态（异步轮询）

> 当前已注释掉轮询功能，使用同步模式。保留此接口文档以备后续启用。

### 请求

```
GET /api/v1/generate/task/{taskId}
Authorization: Bearer <token>（可选）
```

### 响应

```json
{
    "code": 200,
    "message": "查询成功",
    "data": {
        "task_id": "task_xxx",
        "status": "processing",     // processing | completed | failed
        "progress": 65,             // 0-100
        "result": null              // 完成时有值
    }
}
```

### 前端轮询代码（已注释）

```javascript
async function pollTaskStatus(taskId, maxAttempts = 30, signal = null) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/generate/task/${taskId}`, {
            method: 'GET', headers: {}, signal
        });
        const data = await response.json();
        if (data.data?.status === 'completed' || data.data?.status === 'failed') {
            return data.data;
        }
        await new Promise(r => setTimeout(r, 5000));  // 每5秒查一次
    }
    throw new Error('轮询超时');
}
```

---

## 4. 取消任务

### 请求

```
POST /api/v1/tasks/{taskId}/cancel
Content-Type: application/json
Authorization: Bearer <token>（可选）
```

### 响应

```json
{
    "code": 200,
    "message": "任务已取消",
    "data": null
}
```

---

## 5. Token Switch 受保护视频访问

> 仅用于 vendor_b (Token Switch) 的视频播放。生产环境应由后端代理。

### 访问方式

```
GET {result.video.url}  （即 https://neolink.com/api/v1/videos/{task_id}/content）
Authorization: Bearer ErtveAQybj1XCVRsncebuiIYzTxUV0tganVf4bMijr5SKVzU
```

### ⚠️ 重要限制

- **不能直接** `<video src="url">` 使用（浏览器无法带自定义 Header）
- 必须 **fetch → blob → ObjectURL** 再赋给 `<video>`

### 前端实现

```javascript
async function fetchProtectedVideo(videoUrl) {
    const response = await fetch(videoUrl, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${VENDOR_B_API_KEY}`
        }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);  // 返回 blob URL 给 <video>
}

// 使用
const blobUrl = await fetchProtectedVideo(videoUrl);
videoElement.src = blobUrl;  // ✅ 可以正常播放
```

---

## 特殊处理规则汇总

### 1. Base64 图片处理（Gemini 等 vendor_b 模型）

部分模型返回的图片 URL 是 base64 data URI 格式：
```
data:image/png;base64,iVBORw0KGgoAAAA...
```

前端需自动转换为 blob URL 以优化性能：

```javascript
function convertBase64ToBlobUrl(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(parts[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return URL.createObjectURL(new Blob([u8arr], { type: mime }));
}
```

### 2. 大文件上传动态超时

| 请求体大小 | 超时时间 |
|-----------|---------|
| < 1 MB | 120 秒 |
| 1 ~ 10 MB | 300 秒（5分钟） |
| > 10 MB | 600 秒（10分钟） |

### 3. 文件上传格式

所有上传文件统一转为 **Base64 Data URL**：

```javascript
// 本地文件读取
reader.readAsDataURL(file);  // 结果: "data:image/png;base64,..."

// input_files 结构
{
    type: "image" | "video" | "audio",
    url: "data:...;base64,...",      // Base64 Data URL 或 blob URL
    purpose: "reference",             // 固定值
    object_id: "image_1" | "video_1"  // 用于 prompt 引用
}
```

### 4. 多文件自动 feature 切换

| 上传文件数 | 自动切换 feature | prompt 处理 |
|-----------|-----------------|-------------|
| 0 个 | 用户手动选择 refMode | 原样发送 |
| 1 个 | `global_reference` | 原样发送 |
| ≥ 2 个 | `multi_reference` | 追加 `<<<image_1>>> 和 <<<image_2>>>` |

---

## 厂商对照表

| vendor | 名称 | model 提交值 | 视频 URL 处理 | 图片返回格式 |
|--------|------|-------------|--------------|------------|
| **vendor_a** | 腾讯云 VOD | `name` | 直接使用 | 普通 URL |
| **vendor_b** | Token Switch | `id` | fetch + Bearer → blob | 可能是 Base64 |

---

## 接口调用流程图

```
┌─────────────┐
│  页面加载    │
└──────┬──────┘
       ▼
┌──────────────────────────┐
│ GET /models              │ ← 获取模型列表（含厂商信息）
│ → 缓存到 globalModels    │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ 用户操作：               │
│ 1. 选择场景（图/视频/数人）│
│ 2. 选择模型              │
│ 3. 输入 prompt           │
│ 4. 上传文件（可选）       │
└────────────┬─────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 点击发送按钮                              │
│ → buildGenerateRequest() 构建请求体       │
│   • 按 vendor 选择 model 字段值          │
│   • 自动判断 feature                     │
│   • 构建 input_files 数组                │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ POST /generate?sync=true                 │
│ → postJson() 发送请求（带动态超时）       │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 接收响应                                  │
│ → extractResultFromData() 提取结果        │
│ → renderTaskResult() 渲染结果             │
│   • 图片: 自动转换 base64 → blob         │
│   • 视频(vendor_b): fetch + Bearer → blob│
│   • 视频(vendor_a): 直接渲染             │
└──────────────────────────────────────────┘
```
