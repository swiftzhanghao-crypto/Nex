
import { PermissionResource, PermissionDimension } from '../../types';

export const columnConfig = [
      {
          id: 'Order' as PermissionResource,
          label: '订单数据',
          columns: [
              { id: 'total', label: '订单金额' },
              { id: 'customerName', label: '客户名称' },
              { id: 'licensee', label: '被授权方' },
              { id: 'status', label: '订单状态' },
              { id: 'paymentRecord', label: '收款记录' },
              { id: 'approval', label: '审批记录' }
          ]
      },
      {
          id: 'Customer' as PermissionResource,
          label: '客户数据',
          columns: [
              { id: 'contacts', label: '联系人信息' },
              { id: 'billingInfo', label: '开票信息' },
              { id: 'level', label: '客户等级' }
          ]
      },
      {
          id: 'Product' as PermissionResource,
          label: '产品数据',
          columns: [
              { id: 'price', label: '产品价格' },
              { id: 'skus', label: '规格列表' },
              { id: 'composition', label: '组件构成' },
              { id: 'installPackages', label: '安装包信息' },
          ]
      }
  ];

export // ── 三级权限树结构：模块组 → 子模块 → 权限点 ────────────────
const permissionTree = [
      {
          id: 'g_dashboard', label: '数据看板',
          subgroups: [
              {
                  id: 's_dashboard', label: '看板功能',
                  permissions: [
                      { id: 'dashboard_view', label: '查看数据看板', desc: '访问系统首页的数据看板' },
                  ]
              },
          ]
      },
      {
          id: 'g_order', label: '订单中心',
          subgroups: [
              {
                  id: 's_order_list', label: '订单管理',
                  permissions: [
                      { id: 'order_list_view',    label: '访问订单列表',   desc: '拥有此权限可直接访问订单列表页，无需依赖下方Tab权限' },
                      { id: 'order_column_config', label: '列配置',       desc: '控制订单列表中"列配置"按钮的显示' },
                  ]
              },
              {
                  id: 's_order_view', label: '订单列表Tab',
                  permissions: [
                      { id: 'order_view_all',              label: '全部订单',     desc: '查看订单列表中的"全部订单"Tab' },
                      { id: 'order_view_pending_approval', label: '待审批',       desc: '查看订单列表中的"待审批"Tab' },
                      { id: 'order_view_pending_confirm',  label: '待确认',       desc: '查看订单列表中的"待确认"Tab' },
                      { id: 'order_view_auth_confirm',     label: '授权确认',     desc: '查看订单列表中的"授权确认"Tab' },
                      { id: 'order_view_stock_pkg',        label: '安装包核验',   desc: '查看订单列表中的"安装包核验"Tab' },
                      { id: 'order_view_stock_ship',       label: '快递单填写',   desc: '查看订单列表中的"快递单填写"Tab' },
                      { id: 'order_view_stock_cd',         label: '光盘刻录',     desc: '查看订单列表中的"光盘刻录"Tab' },
                      { id: 'order_view_payment',          label: '待支付',       desc: '查看订单列表中的"待支付"Tab' },
                      { id: 'order_view_shipped',          label: '已发货',       desc: '查看订单列表中的"已发货"Tab' },
                      { id: 'order_view_completed',        label: '已完成',       desc: '查看订单列表中的"已完成"Tab' },
                      { id: 'order_view_refund_pending',   label: '退款中',       desc: '查看订单列表中的"退款中"Tab' },
                      { id: 'order_view_refunded',         label: '已退款',       desc: '查看订单列表中的"已退款"Tab' },
                      { id: 'order_view_cancelled',        label: '已取消',       desc: '查看订单列表中的"已取消"Tab' },
                  ]
              },
              {
                  id: 's_order_workflow', label: '订单工作流',
                  permissions: [
                      { id: 'order_workflow_view',       label: '查看工作流',   desc: '控制订单详情中整体工作流步骤条的可见性' },
                      { id: 'order_workflow_payment',    label: '支付步骤',     desc: '查看工作流中的"支付"步骤' },
                      { id: 'order_workflow_approval',   label: '审批步骤',     desc: '查看工作流中的"审批"步骤' },
                      { id: 'order_workflow_confirm',    label: '确认步骤',     desc: '查看工作流中的"确认"步骤' },
                      { id: 'order_workflow_stock',      label: '备货步骤',     desc: '查看工作流中的"备货"步骤' },
                      { id: 'order_workflow_shipping',   label: '发货步骤',     desc: '查看工作流中的"发货"步骤' },
                      { id: 'order_workflow_acceptance', label: '验收步骤',     desc: '查看工作流中的"验收"步骤' },
                  ]
              },
              {
                  id: 's_order_detail', label: '订单详情模块',
                  permissions: [
                      { id: 'order_detail_product',     label: '查看订单产品明细', desc: '查看订单详情中的产品明细信息' },
                      { id: 'order_detail_customer',    label: '查看客户信息',     desc: '查看订单详情中的客户信息卡片' },
                      { id: 'order_detail_trader',      label: '查看交易方信息',   desc: '查看订单详情中的交易方（买卖方/渠道）信息' },
                      { id: 'order_detail_opportunity', label: '查看商机信息',     desc: '查看订单详情中关联的商机信息' },
                      { id: 'order_detail_contract',    label: '查看合同信息',     desc: '查看订单详情中的合同信息及合同预览' },
                      { id: 'order_detail_original',    label: '查看原订单编号',   desc: '查看订单详情中的SMS/SaaS原订单编号' },
                      { id: 'order_detail_invoice',     label: '查看开票明细',     desc: '查看订单详情中的发票开票信息' },
                      { id: 'order_detail_acceptance',  label: '查看验收信息',     desc: '查看订单详情中的验收条件与验收明细' },
                      { id: 'order_detail_delivery',    label: '查看交付信息',     desc: '查看订单交付Tab中的物流与收货信息' },
                      { id: 'order_delivery_auth_change', label: '授权信息变更',   desc: '在订单交付列表中执行授权信息变更操作' },
                      { id: 'order_delivery_redelivery',  label: '二次交付申请',   desc: '在订单交付列表中发起二次交付申请' },
                      { id: 'order_detail_shipping',    label: '查看发货信息',     desc: '查看发货信息Tab中的发货记录与邮件详情' },
                      { id: 'order_detail_snapshot',    label: '查看订单快照',     desc: '查看订单快照中的基础信息与客户快照' },
                      { id: 'order_detail_log',         label: '查看订单记录',     desc: '查看订单流转记录中的操作日志' },
                  ]
              },
              {
                  id: 's_order_op', label: '订单操作',
                  permissions: [
                      { id: 'order_create', label: '创建订单', desc: '新建订单并提交流程' },
                      { id: 'order_approve', label: '审批订单', desc: '对待审批订单执行通过或驳回' },
                      { id: 'order_refund',  label: '发起退单', desc: '对已付款订单发起退单申请' },
                  ]
              },
              {
                  id: 's_remittance', label: '汇款管理',
                  permissions: [
                      { id: 'remittance_view', label: '查看汇款明细', desc: '查看汇款流水记录' },
                  ]
              },
              {
                  id: 's_invoice', label: '发票管理',
                  permissions: [
                      { id: 'invoice_manage', label: '发票申请管理', desc: '查看和处理发票申请' },
                      { id: 'invoice_approve', label: '发票审批', desc: '对发票申请进行审批操作' },
                  ]
              },
              {
                  id: 's_payment', label: '收款管理',
                  permissions: [
                      { id: 'payment_manage', label: '财务收款管理', desc: '登记和查看收款记录' },
                  ]
              },
              {
                  id: 's_delivery_ops', label: '备货与发货',
                  permissions: [
                      { id: 'stock_prep',       label: '生产备货操作', desc: '执行备货及授权码确认流程' },
                      { id: 'license_gen',      label: '授权码生成',   desc: '生成并管理产品授权码' },
                      { id: 'shipping_manage',  label: '物流发货管理', desc: '填写快递信息，完成发货' },
                  ]
              },
          ]
      },
      {
          id: 'g_crm', label: 'CRM',
          subgroups: [
              {
                  id: 's_customer', label: '客户信息',
                  permissions: [
                      { id: 'customer_view', label: '查看客户档案', desc: '查看客户列表及详情' },
                      { id: 'customer_edit', label: '编辑客户档案', desc: '新增或修改客户信息' },
                  ]
              },
              {
                  id: 's_opportunity', label: '商机信息',
                  permissions: [
                      { id: 'opportunity_manage', label: '管理商机', desc: '查看、创建、跟进商机信息' },
                  ]
              },
          ]
      },
      {
          id: 'g_fulfillment', label: '履约信息',
          subgroups: [
              {
                  id: 's_contract', label: '合同信息',
                  permissions: [
                      { id: 'contract_view', label: '查看合同', desc: '查看合同信息列表' },
                      { id: 'contract_edit', label: '编辑合同', desc: '新增或修改合同信息' },
                  ]
              },
              {
                  id: 's_authorization', label: '授权信息',
                  permissions: [
                      { id: 'authorization_view', label: '查看授权列表', desc: '查看授权信息列表及详情' },
                  ]
              },
              {
                  id: 's_delivery_info', label: '交付信息',
                  permissions: [
                      { id: 'delivery_info_view', label: '查看交付列表', desc: '查看交付信息列表及详情' },
                  ]
              },
          ]
      },
      {
          id: 'g_channel', label: '渠道中心',
          subgroups: [
              {
                  id: 's_channel', label: '渠道管理',
                  permissions: [
                      { id: 'channel_view', label: '查看渠道', desc: '查看渠道列表及详情' },
                      { id: 'channel_edit', label: '编辑渠道', desc: '新增或修改渠道信息' },
                  ]
              },
          ]
      },
      {
          id: 'g_product', label: '产品中心',
          subgroups: [
              {
                  id: 's_product_display', label: '产品目录',
                  permissions: [
                      { id: 'product_display_view',    label: '查看产品目录', desc: '访问产品目录页面，浏览全部产品' },
                      { id: 'product_display_preview', label: '查看产品预览', desc: '查看单个产品的预览详情页' },
                  ]
              },
              {
                  id: 's_product_list', label: '产品列表',
                  permissions: [
                      { id: 'product_view',       label: '查看产品列表', desc: '访问产品列表管理页面' },
                      { id: 'product_edit',       label: '编辑产品',     desc: '新增或修改产品信息' },
                      { id: 'merchandise_view',   label: '查看销售商品', desc: '查看销售商品列表' },
                      { id: 'merchandise_edit',   label: '编辑销售商品', desc: '新增或修改销售商品' },
                  ]
              },
              {
                  id: 's_product_tabs', label: '产品列表Tab',
                  dependsOn: 'product_view',
                  permissions: [
                      { id: 'product_tab_spu',      label: '产品列表',   desc: '查看产品列表（SPU）Tab' },
                      { id: 'product_tab_sku',      label: '规格列表',   desc: '查看规格列表（SKU）Tab' },
                  ]
              },
              {
                  id: 's_product_manage_ext', label: '产品管理扩展',
                  permissions: [
                      { id: 'product_component_pool_view',    label: '查看组件池',   desc: '查看产品组件池列表' },
                      { id: 'product_package_view',           label: '查看安装包',   desc: '查看安装包管理列表' },
                      { id: 'product_license_template_view',  label: '查看产品授权模板', desc: '查看产品授权模板列表' },
                      { id: 'product_attr_config_view',       label: '查看属性配置',     desc: '查看产品属性配置项' },
                  ]
              },
              {
                  id: 's_product_pricing', label: '产品报价',
                  permissions: [
                      { id: 'product_msrp_view',          label: '查看建议销售价', desc: '查看产品建议零售价列表' },
                      { id: 'product_channel_price_view', label: '查看渠道价格',   desc: '查看渠道合作价格列表' },
                  ]
              },
          ]
      },
      {
          id: 'g_performance', label: '业绩中心',
          subgroups: [
              {
                  id: 's_performance', label: '业绩管理',
                  permissions: [
                      { id: 'performance_view', label: '查看业绩列表', desc: '查看业绩管理列表数据' },
                  ]
              },
          ]
      },
      {
          id: 'g_leads', label: '线索中心',
          subgroups: [
              {
                  id: 's_leads', label: '线索功能',
                  permissions: [
                      { id: 'leads_view',   label: '查看线索',   desc: '查看线索列表及详情' },
                      { id: 'leads_edit',   label: '管理线索',   desc: '新增或跟进线索状态' },
                  ]
              },
          ]
      },
      {
          id: 'g_ops', label: '运营中心',
          subgroups: [
              {
                  id: 's_ops', label: '运营功能',
                  permissions: [
                      { id: 'wps_ops_view', label: '查看运营中心', desc: '访问运营中心模块' },
                  ]
              },
          ]
      },
      {
          id: 'g_system', label: '系统配置',
          subgroups: [
              {
                  id: 's_org', label: '组织与用户',
                  permissions: [
                      { id: 'admin_view',  label: '管理员视图',   desc: '访问系统配置模块' },
                      { id: 'user_manage', label: '用户管理',     desc: '新增、编辑、停用用户' },
                      { id: 'role_manage', label: '角色管理',     desc: '配置角色及权限' },
                      { id: 'org_manage',  label: '组织架构管理', desc: '维护部门层级结构' },
                  ]
              },
              {
                  id: 's_biz_rules', label: '业务规则配置',
                  permissions: [
                      { id: 'license_type_view', label: '查看授权类型管理', desc: '查看授权类型管理列表及字段配置' },
                  ]
              },
          ]
      },
      {
          id: 'g_super', label: '超级权限',
          subgroups: [
              {
                  id: 's_super', label: '最高权限',
                  permissions: [
                      { id: 'all', label: '超级管理员 (All)', desc: '拥有系统全部功能权限，覆盖所有细分权限点' },
                  ]
              },
          ]
      },
  ];

export type PermSubgroup = { id: string; label: string; dependsOn?: string; permissions: { id: string; label: string; desc: string }[] };
export type PermGroup = { id: string; label: string; subgroups: PermSubgroup[] };

export const resourceFunctionalPermMap: Record<string, { groupIds: string[]; hint: string }> = {
    Order: {
        groupIds: ['g_order'],
        hint: '请先在功能权限中开启「订单中心」相关权限',
    },
    Customer: {
        groupIds: ['g_crm'],
        hint: '请先在功能权限中开启「CRM」相关权限',
    },
    Product: {
        groupIds: ['g_product'],
        hint: '请先在功能权限中开启「产品中心」相关权限',
    },
};

export function getRequiredPermIdsForResource(resourceId: string): string[] {
    const mapping = resourceFunctionalPermMap[resourceId];
    if (!mapping) return [];
    return permissionTree
        .filter(g => mapping.groupIds.includes(g.id))
        .flatMap(g => g.subgroups.flatMap(sg => sg.permissions.map(p => p.id)));
}

export const permissionModules = permissionTree.map(g => ({
      id: g.id,
      label: g.label,
      permissions: g.subgroups.flatMap(sg => sg.permissions.map(p => ({ id: p.id, label: p.label }))),
}));

export const resourceConfig = [
      {
          id: 'Order' as PermissionResource,
          label: '订单数据',
          description: '包含订单列表、订单详情、订单明细列表与订单明细详情',
          dimensions: [
              { id: 'salesRep' as PermissionDimension, label: '销售' },
              { id: 'businessManager' as PermissionDimension, label: '商务' },
              { id: 'creator' as PermissionDimension, label: '制单人' },
              { id: 'departmentId' as PermissionDimension, label: '部门' },
              { id: 'industryLine' as PermissionDimension, label: '行业推广类' },
              { id: 'directChannelId' as PermissionDimension, label: '直接下级渠道' },
              { id: 'province' as PermissionDimension, label: '省份' },
              { id: 'orderType' as PermissionDimension, label: '订单类型' },
              { id: 'orderSource' as PermissionDimension, label: '订单来源' },
              { id: 'orderStatus' as PermissionDimension, label: '订单状态' },
          ]
      },
      {
          id: 'Customer' as PermissionResource,
          label: '客户数据',
          dimensions: [
              { id: 'departmentId' as PermissionDimension, label: '部门' },
              { id: 'industryLine' as PermissionDimension, label: '行业推广类' },
              { id: 'directChannelId' as PermissionDimension, label: '直接下级渠道' },
              { id: 'province' as PermissionDimension, label: '省份' },
          ]
      },
      {
          id: 'Product' as PermissionResource,
          label: '产品数据',
          dimensions: [
              { id: 'departmentId' as PermissionDimension, label: '部门' },
              { id: 'industryLine' as PermissionDimension, label: '行业推广类' },
              { id: 'directChannelId' as PermissionDimension, label: '直接下级渠道' },
              { id: 'province' as PermissionDimension, label: '省份' },
          ]
      }
  ];
