# file-object-storage 前端集成

本文件说明 **`web/`**（Vue 3 + Vite）如何与 `server/` 的文件服务配合。契约以 [implementation-spec.md](./implementation-spec.md) 为准；前端基础规范以 `.cursor/skills/itab-client/SKILL.md` 为准。

## 1. 端点前缀与鉴权

- 所有 `/files/*` 走 `/ai-base-demo/api` 前缀，与其他业务接口一致。
- 请求必须带登录态（Cookie 或 `Authorization` Header）；**不在** `ignoreAuthPaths`。
- Vite 开发阶段代理到后端 8080，建议只代理已注册的业务前缀（如整段 `/ai-base-demo/api`），不要把 `/files` 裸代理到后端。

## 2. 小文件：一次性 multipart 上传

适用场景：客户附件、日常图片等小于 `storage.default.maxUploadBytes`（建议 20 MB）的文件。

```ts
// web/src/api/file.ts
export async function uploadFile(file: File, bizScope: string) {
  const form = new FormData()
  form.append('file', file)
  form.append('biz_scope', bizScope)
  const { data } = await http.post('/ai-base-demo/api/files', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  // data.data: { file_id, original_name, size_bytes, content_type, sha256 }
  return data.data
}
```

业务页面（如客户详情）只拿到 `file_id` 后**再**调业务装配接口：

```ts
await http.post(`/ai-base-demo/api/customers/${customerId}/files`, {
  file_id, category: 'attachment', remark: '合同扫描件',
})
```

## 3. 大文件：预签直传（presign → PUT → commit）

适用场景：视频、批量导入包、单文件 > 20 MB。**不经过** `server/` 中转带宽。

```ts
export async function uploadLarge(file: File, bizScope: string) {
  const { data: r1 } = await http.post('/ai-base-demo/api/files/presign-upload', {
    biz_scope: bizScope,
    original_name: file.name,
    content_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
  })
  const { file_id, upload_url, method, headers } = r1.data

  await fetch(upload_url, {
    method,
    headers,
    body: file,
  })

  const { data: r2 } = await http.post(`/ai-base-demo/api/files/${file_id}/commit`)
  return r2.data
}
```

注意：

- 预签 URL 只在后端签发的 TTL 内有效（默认 15 分钟），前端不要缓存。
- `PUT` 直连对象层（dev = bbolt-store-s3，prod = MinIO）；**不要经过 axios 拦截器**（会误改 header）。
- `commit` 失败应给用户明确反馈并提示重试；超时未 commit 的文件后端会清理。

## 4. 下载：后端 302 到预签 GET

```html
<!-- 直接把 href 指向后端路由，由后端完成鉴权 + 签 URL + 302 -->
<a :href="`/ai-base-demo/api/files/${fileId}?disposition=attachment`"
   :download="originalName">{{ originalName }}</a>
```

若是图片预览，`<img :src="`/ai-base-demo/api/files/${fileId}?disposition=inline`" />` 即可；浏览器会自动完成 302 跳转与预签 GET。

**不要**在前端缓存/分享最终的预签 URL（到期即失效，且被截屏/转发会外泄短期权限）。

## 5. 列表回显

业务关联列表（例如 `GET /customers/:id/files?category=photo`）约定返回：

```json
{
  "code": 0,
  "data": [
    {
      "rel_id": 101,
      "file_id": 55,
      "original_name": "合同-20260101.pdf",
      "content_type": "application/pdf",
      "size_bytes": 182344,
      "download_url": "/ai-base-demo/api/files/55"
    }
  ]
}
```

**`download_url` 用相对路径**，由前端拼前缀或直接 `href`，避免跨环境（dev / test / prod）写死域名。

## 6. 组件建议

- Vue 兼容的 UI 库里都有上传组件（Element Plus `el-upload`、Ant Design Vue `a-upload`、Naive UI `n-upload`），选**与项目一致**的那一个即可；无需额外引入 Uppy。
- 复杂场景（断点续传、进度条、并发分片）再考虑 `tus-js-client` 或 Uppy + 自定义 endpoint；此时后端需要扩展成 S3 Multipart Upload 协议，属于进阶路径，本规范不覆盖。

## 7. 错误码与提示

| HTTP | 典型业务文案 |
|------|--------------|
| 400 | `biz_scope 不被支持` / `文件类型不允许` / `文件超过上限` |
| 401 | 触发重新登录流程（复用 SSO 现有拦截） |
| 403 | `无权访问该文件` |
| 404 | `文件不存在或已被删除` |
| 5xx | 通用失败，提示用户稍后重试并上报 |

建议复用 `web/` 现有 axios 拦截器的错误提示规则，**不**为文件接口另写一套。
