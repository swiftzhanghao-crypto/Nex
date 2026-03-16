<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

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
