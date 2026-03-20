
# WPS 业务平台

面向 WPS 内部销售与商务团队的综合管理系统，覆盖线索获取、商机跟进、订单创建与审批、备货交付到客户档案管理的全业务链路。

技术栈：React 18 + TypeScript + Tailwind CSS + Vite + React Router DOM

## 本地运行

**前置依赖：** Node.js

1. 安装依赖：
   `npm install`
2. 配置 Gemini API Key（在 `.env.local` 中设置 `GEMINI_API_KEY`）
3. 启动开发服务：
   `npm run dev`

## 文档目录

```
docs/
├── 产品说明文档.md          # 功能模块、数据模型、权限体系完整说明
├── 设计规范.md              # UI 组件与视觉设计规范
├── 更新日志/                # 每日更新记录
│   ├── 2026-03-01.md
│   ├── 2026-03-02.md
│   └── ...（按日期递增）
└── 测试报告/                # 功能测试报告与截图
    └── 新建订单功能测试报告.md
```

## 项目结构

```
业务平台/
├── App.tsx              # 根组件，路由配置，全局 mock 数据
├── types.ts             # TypeScript 类型定义
├── index.tsx            # 应用入口
├── components/          # 页面与功能组件
├── services/            # AI 服务（Gemini）
├── tests/               # 自动化测试
└── docs/                # 项目文档
```


基于 React + TypeScript + Vite 构建的 WPS365 业务管理平台，涵盖产品、订单、客户、渠道、项目等核心业务域。

---

## 快速启动

```bash
npm install
npm run dev
```

访问 `http://localhost:5173`

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产包 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | TypeScript 类型检查 |

---

## 项目结构

```
Nex/
├── components/          # 业务功能模块
│   ├── Dashboard.tsx        # 数据看板
│   ├── ProductManager.tsx   # 产品管理（SPU/SKU）
│   ├── ProductCatalog.tsx   # 产品目录
│   ├── OrderManager.tsx     # 订单管理
│   ├── CustomerManager.tsx  # 客户管理
│   ├── LeadsManager.tsx     # 线索管理
│   ├── OpportunityManager.tsx # 商机管理
│   ├── ChannelManager.tsx   # 渠道管理
│   ├── ProjectManager.tsx   # 项目管理
│   ├── OrganizationManager.tsx # 组织管理
│   ├── UserManager.tsx      # 用户与权限
│   └── OperationsManager.tsx # 运营管理
├── services/            # 服务层
│   ├── geminiService.ts     # 服务入口（shim，re-export mock）
│   └── mock/
│       └── productMock.ts   # 产品相关本地 AI 功能实现
├── App.tsx              # 根组件，含全局 mock 数据
├── types.ts             # 全局类型定义
└── .cursor/rules/
    └── mock-service-convention.mdc  # AI 编码规范
```

---

## Mock 数据说明

项目使用**本地 mock 数据**，无需任何外部 API 或数据库。

- **静态数据**：产品、客户、渠道、商机等初始数据写在 `App.tsx` 的 `useState` 中
- **程序化数据**：订单数据由 `generateMockOrders()` 从现有数据自动生成 100 条
- **本地 AI 功能**：产品描述生成、分类推荐等由 `services/mock/productMock.ts` 本地实现，无需联网

---

## 新增功能模块规范

新增业务模块时，若涉及 AI/智能功能，按以下三步走：

**第一步：创建本地 mock 实现**

```typescript
// services/mock/xxxMock.ts
export const generateXxxSuggestion = async (input: string): Promise<string> => {
  await new Promise(r => setTimeout(r, 200)); // 模拟延迟
  // 基于规则或模板的本地逻辑
  return `...`;
};
```

**第二步：创建服务 shim**

```typescript
// services/xxxService.ts
export { generateXxxSuggestion } from './mock/xxxMock';
```

**第三步：组件中导入**

```typescript
// components/XxxManager.tsx
import { generateXxxSuggestion } from '../services/xxxService';
```

> 组件始终从 `services/xxxService` 导入，不直接引用 `mock/` 目录，便于未来切换真实服务。

---

## 技术栈

| 技术 | 版本 | 用途 |
|---|---|---|
| React | ^19 | UI 框架 |
| TypeScript | ~5.8 | 类型安全 |
| Vite | ^7 | 构建工具 |
| React Router | ^7 | 路由 |
| Recharts | ^3 | 图表 |
| Lucide React | ^0.554 | 图标库 |
