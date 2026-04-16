# AI 业务助手 — 技术文档

## 1. 功能概述

AI 业务助手是集成在 WPS 365 业务平台中的智能问答系统，基于 Google Gemini 大模型，提供针对当前页面上下文的业务数据分析能力。

### 核心能力

| 技能 | skill_id | 功能 | 典型问法 |
|------|----------|------|----------|
| 风险管控 | `order_risk` | 订单异常、价格异常、回款风险、合同一致性 | 订单有没有风险？价格是否异常？回款是否有风险？ |
| 续费分析 | `renew_analysis` | 续费/续期/增购/升级判断 | 这个订单是新购还是续费？续费关系是什么？ |
| 客户360 | `customer_query` | 客户全貌画像、历史订单、客户生命周期 | 这个客户整体情况？历史订单多少？ |
| 业务总结 | `business_summary` | 业绩汇总、趋势分析、业务简报 | 总结本月业绩；帮我做个业务简报 |
| 通用兜底 | `fallback` | 非业务问题拒绝回答，不查询数据库 | — |

### 运行模式

- **Gemini 模式**：配置 API Key 后，使用 Gemini AI 进行智能意图分类和深度分析
- **本地模式**：未配置 API Key 时，使用关键词匹配路由 + 数据摘要展示

---

## 2. 架构设计

### 2.1 整体架构

```
用户提问
  │
  ▼
┌─────────────────┐
│   技能路由器      │  ← Gemini 意图分类 / 本地关键词匹配
│  (skillRouter)   │
└────────┬────────┘
         │ { skillId, confidence }
         │
    confidence < 0.6?
    ┌────┴────┐
   YES       NO
    │         │
  反问确认    ▼
         ┌──────────────┐
         │  数据提供层    │  ← 按技能白名单 + 页面上下文过滤
         │ (dataProvider) │
         └──────┬───────┘
                │ 过滤后数据
                ▼
         ┌──────────────┐
         │   技能模块     │  ← 独立提示词 + buildContext
         │  (skills/*)   │
         └──────┬───────┘
                │ systemPrompt + dataContext
                ▼
         ┌──────────────┐
         │  Gemini API   │  ← 生成回答
         └──────┬───────┘
                │
                ▼
            AI 回答
```

### 2.2 文件结构

```
nex/
├── services/aiAssistant/          # 服务层（核心逻辑）
│   ├── index.ts                   # 统一导出
│   ├── types.ts                   # 类型定义
│   ├── skillRouter.ts             # 技能路由器（Gemini + 本地双模式）
│   ├── dataProvider.ts            # 数据提供层（权限隔离 + 页面上下文）
│   └── skills/                    # 技能模块
│       ├── orderRisk.ts           # 风险管控
│       ├── renewAnalysis.ts       # 续费分析
│       ├── customerQuery.ts       # 客户360
│       ├── businessSummary.ts     # 业务总结
│       └── fallback.ts            # 通用兜底
│
├── components/ai/                 # UI 组件
│   ├── AIAssistantButton.tsx      # 浮动入口按钮
│   ├── AIAssistantDialog.tsx      # 对话框主体
│   └── AIMessageBubble.tsx        # 消息气泡
│
└── components/layout/Layout.tsx   # 仅增加 2 行引用（零侵入）
```

### 2.3 对现有代码的修改

仅修改 `Layout.tsx` 一个文件，增加 2 行代码：

```typescript
// import 行
import AIAssistantButton from '../ai/AIAssistantButton';

// JSX 中（Feedback FAB 上方）
<AIAssistantButton />
```

其余所有新增代码均在独立目录中，与原有业务逻辑完全隔离。

---

## 3. 核心模块详解

### 3.1 技能路由器 (`skillRouter.ts`)

#### 功能
接收用户消息，判断应由哪个技能处理。

#### 双模式路由

**Gemini 模式**（有 API Key）：
- 调用 Gemini 2.5 Flash，传入分类提示词
- 使用 JSON Schema 强制返回 `{ skillId, confidence, reasoning }` 结构
- confidence < 0.6 时生成反问以澄清意图

**本地模式**（无 API Key）：
- 基于关键词规则匹配
- 每个技能定义一组关键词
- 匹配 ≥2 个关键词 → 直接路由（confidence ≥ 0.7）
- 匹配 1 个关键词 → 反问确认（confidence = 0.5）
- 无匹配 → fallback

#### 关键词规则表

| 技能 | 关键词 |
|------|--------|
| order_risk | 风险、异常、回款、逾期、价格异常、合同一致、不一致、风控、预警 |
| renew_analysis | 续费、续期、增购、升级、新购、续约、到期、购买性质 |
| customer_query | 客户、画像、档案、客户情况、客户信息、历史订单、客户详情、生命周期、联系人 |
| business_summary | 总结、简报、业绩、统计、汇总、趋势、分析、本月、本季、全年、报告、数据看板 |

#### API

```typescript
// 路由分类
routeSkill(userMessage: string): Promise<SkillRouteResult>

// 执行技能
executeSkill(userMessage: string, systemPrompt: string, dataContext: string): Promise<string>

// 检查 API Key 是否配置
isAIConfigured(): boolean
```

### 3.2 数据提供层 (`dataProvider.ts`)

#### 功能
根据技能权限白名单 + 当前页面上下文，从 AppContext 中提取最小必要数据。

#### 权限隔离矩阵

| 技能 | orders | customers | opportunities | contracts | products | performances |
|------|:------:|:---------:|:------------:|:---------:|:--------:|:------------:|
| order_risk | ✅ | ✅ | ✅ | ✅ | - | - |
| renew_analysis | ✅ | ✅ | - | - | ✅ | - |
| customer_query | ✅ | ✅ | ✅ | ✅ | - | - |
| business_summary | ✅ | ✅ | ✅ | - | - | ✅ |
| fallback | - | - | - | - | - | - |

#### 页面上下文感知

| 页面 | 数据提取策略 |
|------|-------------|
| 订单详情 `/orders/:id` | 当前订单 + 关联客户 + 关联合同/商机 + 同客户历史订单 |
| 客户详情 `/customers/:id` | 当前客户 + 该客户所有订单/商机/合同/业绩 |
| 订单列表 `/orders` | 前 20 条订单摘要 |
| 客户列表 `/customers` | 前 20 条客户摘要 |
| 商机列表 `/opportunities` | 前 20 条商机摘要 |
| 合同列表 `/contracts` | 前 20 条合同摘要 |
| 数据看板 `/` | 各数据域前 10 条做统计概览 |
| 其他页面 | 各数据域前 10 条 |

#### API

```typescript
// 获取过滤后的数据
getFilteredData(skillId: SkillId, fullData: AppDataSnapshot, pageCtx?: PageContext): Record<string, unknown>

// 构建 prompt 上下文（含页面信息头）
buildSkillContext(skillId: SkillId, filteredData: Record<string, unknown>, pageCtx?: PageContext): string

// 解析 URL 为页面上下文
parsePageContext(pathname: string): PageContext
```

### 3.3 技能模块 (`skills/*.ts`)

每个技能模块导出一个 `SkillModule` 对象，包含：

- **`definition`**：技能 ID、名称、描述、系统提示词、数据白名单
- **`buildContext(data)`**：将过滤后的业务数据格式化为 prompt 上下文字符串

#### 提示词设计原则

1. 明确角色定义（如"订单风控分析师"）
2. 列出具体职责范围
3. 严格禁止编造数据
4. 数据不足时主动说明并建议补充
5. 输出结构化结果
6. 统一使用简体中文

---

## 4. UI 组件

### 4.1 AIAssistantButton

- 固定定位在页面右下角（反馈按钮上方）
- 紫粉渐变色，hover 时从右侧滑出显示"AI 助手"文字
- 点击后打开对话框

### 4.2 AIAssistantDialog

- 通过 `#modal-root` Portal 渲染，z-index: 71
- 头部：AI 助手图标 + 当前页面位置 + 当前技能标签
- 消息列表：支持滚动，自动滚动到底部
- 快捷提问：根据当前页面动态生成
- 输入区：支持 Enter 发送、Shift+Enter 换行、自动扩高
- 加载态：三点弹跳动画
- 清空对话按钮

### 4.3 AIMessageBubble

- 用户消息：蓝色，右对齐
- AI 回复：灰色，左对齐，显示技能标签
- 系统消息：居中小标签
- 每条消息显示时间戳

### 4.4 快捷提问（根据页面动态切换）

| 页面 | 快捷提问 |
|------|----------|
| 订单详情 | 这个订单有风险吗？/ 这是新购还是续费？/ 关联客户情况 / 订单信息总结 |
| 订单列表 | 哪些订单有风险？/ 订单数据总结 / 回款情况分析 / 续费订单有哪些？ |
| 客户详情 | 这个客户整体情况？/ 历史订单总结 / 客户有续费吗？/ 客户风险分析 |
| 客户列表 | 客户整体情况 / 高价值客户分析 / 客户数据总结 / 有风险的客户？ |
| 数据看板 | 本月业绩总结 / 订单风险概览 / 客户整体情况 / 业务简报 |

---

## 5. 数据流

```
用户输入问题
     │
     ▼
AIAssistantDialog.handleSend()
     │
     ├─ 1. routeSkill(text)        →  Gemini/本地 意图分类
     │      返回 { skillId, confidence }
     │
     ├─ confidence < 0.6 ?
     │      YES → 显示反问，等待用户补充
     │
     ├─ 2. parsePageContext(url)    →  解析当前页面上下文
     │
     ├─ 3. getFilteredData(         →  按权限 + 页面上下文提取数据
     │        skillId, appData, pageCtx)
     │
     ├─ 4. buildSkillContext(       →  格式化为 prompt 上下文
     │        skillId, data, pageCtx)
     │
     ├─ 5. executeSkill(            →  调用 Gemini 生成回答
     │        text, systemPrompt, context)
     │
     └─ 6. 显示 AI 回答
```

---

## 6. 配置说明

### 6.1 环境变量

在 `nex/.env` 文件中配置：

```env
# Gemini API Key（必须配置才能使用 AI 深度分析）
VITE_GEMINI_API_KEY=你的API密钥
```

### 6.2 获取 API Key

1. 访问 [Google AI Studio](https://aistudio.google.com/apikey)
2. 登录 Google 账号
3. 点击"Create API Key"
4. 复制生成的密钥，填入 `.env` 文件
5. 重启开发服务器（`npm run dev`）

### 6.3 使用的模型

- 模型：`gemini-2.5-flash`
- 用途：意图分类（JSON Schema 输出）、反问生成、技能执行

---

## 7. 扩展指南

### 7.1 新增技能

1. 在 `services/aiAssistant/skills/` 下创建新文件，如 `newSkill.ts`：

```typescript
import type { SkillModule } from '../types';

const systemPrompt = `你的角色和规则...`;

function buildContext(data: Record<string, unknown>): string {
  // 将数据格式化为 prompt 上下文
}

export const newSkillModule: SkillModule = {
  definition: {
    id: 'new_skill',       // 需要先在 types.ts 中注册
    name: '新技能',
    description: '...',
    systemPrompt,
    allowedDataScopes: ['orders', 'customers'],
  },
  buildContext,
};
```

2. 在 `types.ts` 中的 `SkillId` 类型和 `SKILL_LABELS` 中注册新 ID
3. 在 `dataProvider.ts` 的 `SKILL_REGISTRY` 中注册新模块
4. 在 `skillRouter.ts` 中：
   - Gemini 路由提示词中添加新技能描述
   - 本地关键词规则中添加新规则
   - JSON Schema 的 enum 中添加新 ID

### 7.2 调整数据提取策略

修改 `dataProvider.ts` 中的 `getFilteredData` 函数，按需调整不同页面类型的数据提取逻辑。

### 7.3 新增页面上下文

在 `dataProvider.ts` 的 `parsePageContext` 函数中添加新的 URL 匹配规则。

---

## 8. 安全注意事项

1. **API Key 保护**：`.env` 文件已在 `.gitignore` 中，不会提交到 Git 仓库
2. **数据权限隔离**：每个技能只能访问白名单内的数据域，fallback 技能无任何数据访问权限
3. **页面级数据范围**：详情页只传当前实体数据，避免泄露无关业务信息
4. **数据不编造**：所有技能提示词中明确要求"不编造数据"、"数据不足时主动说明"
5. **非业务问题拒绝**：fallback 技能拒绝回答与平台无关的问题
