# 测试报告索引

本目录收录业务平台前台功能测试的所有报告与截图。

---

## 目录结构

```
测试报告/
├── README.md                   ← 本文件（索引）
├── 新建订单功能测试报告.md      ← 测试报告正文
└── 截图/
    ├── 第一轮/                 ← 第一轮测试截图（共 10 张）
    │   ├── 01-homepage.png
    │   ├── 02-order-list.png
    │   ├── 03-create-form-step1.png
    │   ├── 04-create-form-step2-before.png
    │   ├── 05-create-form-step2-customer-selected.png
    │   ├── 06-create-form-step3-before-add.png
    │   ├── 07-create-form-step3-after-add.png
    │   ├── 08-create-form-step4.png
    │   ├── 09-order-detail-success.png
    │   └── 10-order-list-with-new.png
    └── 第二轮/                 ← 第二轮测试截图（共 11 张）
        ├── step1-homepage.png
        ├── step2-order-list.png
        ├── step3-create-form-opened.png
        ├── step4-form-step1-filled.png
        ├── step5-form-step2-before.png
        ├── step6-form-step2-customer-selected.png
        ├── step7-form-step3-before.png
        ├── step8-form-step3-product-filled.png
        ├── step9-form-step3-after-add.png
        ├── step10-form-step4.png
        └── step11-final-order-detail.png
```

---

## 测试方案

| 文档 | 说明 | 更新日期 |
|------|------|---------|
| [整体测试用例方案.md](整体测试用例方案.md) | 覆盖全部 11 个模块、~120 条用例、权限矩阵、API 测试 | 2026-03-19 |

---

## 已完成测试

| 功能模块 | 测试报告 | 测试轮次 | 结论 |
|---------|---------|---------|------|
| 新建订单 | [新建订单功能测试报告.md](新建订单功能测试报告.md) | 2 轮 | ✅ 通过 |

---

## 待测试

| 功能模块 | 优先级 | 备注 |
|---------|-------|------|
| 订单审批 | 高 | 商务经理审批流程 |
| 订单支付确认 | 高 | 收款后确认操作 |
| 生产授权 | 中 | 技术支持生成授权码 |
| 发货管理 | 中 | 物流专员填写物流单号 |
| 客户管理 CRUD | 中 | 新增/编辑/停用客户 |
| 用户权限控制 | 高 | 不同角色可见菜单与操作 |
