# Token Switch 视频访问前端说明

本文档用于说明前端在测试阶段如何访问 Token Switch 返回的视频地址。

## 1. 适用场景

当前适用于：

- 服务商：`vendor_b`
- 视频模型：HappyHorse 系列
- 后端返回的视频地址为 Token Switch 的受保护内容地址

例如：

```text
https://neolink.com/api/v1/videos/{task_id}/content
```

或：

```text
https://neolink.com/api/v1/videos/content?video_id={task_id}
```

## 2. 当前返回给前端的数据形态

当视频生成完成后，后端会返回：

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
        "url": "https://neolink.com/api/v1/videos/{task_id}/content",
        "thumbnail": "",
        "duration": null
      }
    }
  }
}
```

其中：

- `result.video.url` 就是当前测试阶段需要访问的视频地址

## 3. 重要说明

这个地址不是公网可直接访问的匿名视频地址。

访问时必须携带 Token Switch API Key：

```http
Authorization: Bearer <TOKEN_SWITCH_API_KEY>
```

如果不带这个请求头，访问时会返回：

```json
{
  "error": {
    "message": "未提供令牌"
  }
}
```

## 4. 测试阶段前端访问方式

测试阶段允许前端直接使用 Token Switch API Key 去访问这个视频地址。

前端访问规则：

- URL：使用后端返回的 `result.video.url`
- Header：加上 `Authorization: Bearer <TOKEN_SWITCH_API_KEY>`

## 5. 前端请求示例

## 5.1 fetch 示例

```ts
async function fetchProtectedVideo(videoUrl: string, apiKey: string) {
  const response = await fetch(videoUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  })

  if (!response.ok) {
    throw new Error(`Video request failed: ${response.status}`)
  }

  const blob = await response.blob()
  return URL.createObjectURL(blob)
}
```

使用方式：

```ts
const objectUrl = await fetchProtectedVideo(videoUrl, tokenSwitchApiKey)
videoElement.src = objectUrl
```

## 5.2 axios 示例

```ts
import axios from 'axios'

async function fetchProtectedVideo(videoUrl: string, apiKey: string) {
  const response = await axios.get(videoUrl, {
    responseType: 'blob',
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  })

  return URL.createObjectURL(response.data)
}
```

## 6. 不要直接这样使用

不要把这个 URL 直接赋给：

```ts
video.src = videoUrl
```

也不要直接写：

```html
<video src="https://neolink.com/api/v1/videos/xxx/content"></video>
```

原因是浏览器直接加载 `<video src="...">` 时，无法自动带上自定义 `Authorization` 请求头。

所以测试阶段必须使用：

- `fetch`
- 或 `axios`

先把视频内容拉下来，再转成 `blob URL` 给 `<video>` 播放。

## 7. 推荐前端处理流程

测试阶段推荐流程：

1. 调用后端生成接口
2. 拿到 `result.video.url`
3. 使用 `fetch` 或 `axios`，携带 Token Switch API Key 请求该 URL
4. 将返回的视频二进制转成 `blob URL`
5. 把 `blob URL` 赋给 `<video>` 播放

## 8. 生产环境说明

当前方案仅用于测试阶段。

生产环境不允许前端直接持有 Token Switch API Key。

生产阶段将改为：

1. 后端访问 Token Switch 视频内容地址
2. 后端将视频保存到对象存储
3. 前端只访问后端返回的对象存储 URL

## 9. 当前结论

前端现在请按下面规则处理 HappyHorse 视频：

- 后端返回的 `result.video.url` 是有效视频访问地址
- 访问时必须携带：

```http
Authorization: Bearer <TOKEN_SWITCH_API_KEY>
```

- 不要直接把该 URL 塞给 `<video src>`
- 请先请求为 `blob`，再转为本地 `blob URL` 播放
