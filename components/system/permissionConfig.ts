
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

export // ── 四级权限树：一级(模块组) → 二级(菜单/子模块) → 三级(功能分类) → 四级(权限点) ──
// 对于权限点较少的子模块，可省略三级分类，直接使用 permissions 扁平列表
const permissionTree: PermGroup[] = [

    // ═══════════════════════════════════════════════
    //  一级：数据看板
    // ═══════════════════════════════════════════════
    {
        id: 'g_dashboard', label: '数据看板',
        subgroups: [
            {
                id: 's_dashboard', label: '看板功能',
                permissions: [
                    { id: 'dashboard_view', label: '查看数据看板', desc: '访问首页数据看板（KPI 卡片、销售趋势、订单状态分布、热门商品、业务动态）' },
                    { id: 'sab_insight_view', label: '查看SAB客户洞察', desc: '访问 SAB 客户洞察（智能查客户、客户列表、客户详情）' },
                ]
            },
        ]
    },

    // ═══════════════════════════════════════════════
    //  一级：订单中心
    // ═══════════════════════════════════════════════
    {
        id: 'g_order', label: '订单中心',
        subgroups: [
            // ── 二级：订单管理 (/orders) ──
            {
                id: 's_order_mgmt', label: '订单管理',
                categories: [
                    {
                        id: 'c_order_list_browse', label: '列表浏览',
                        permissions: [
                            { id: 'order_list_view',       label: '访问订单列表',   desc: '进入订单管理页面，查看订单列表' },
                            { id: 'order_column_config',   label: '列配置',         desc: '自定义订单列表的显示列' },
                            { id: 'order_advanced_filter', label: '高级筛选',       desc: '使用高级筛选条件查询订单' },
                            { id: 'order_copy_table',      label: '复制表格',       desc: '将订单列表内容复制到剪贴板' },
                        ]
                    },
                    {
                        id: 'c_order_list_batch', label: '批量操作',
                        permissions: [
                            { id: 'order_batch_confirm', label: '批量确认',   desc: '对待确认订单执行批量确认操作' },
                            { id: 'order_batch_ship',    label: '批量发货',   desc: '对备货完成的订单执行批量发货操作' },
                        ]
                    },
                    {
                        id: 'c_order_status_tabs', label: '状态Tab',
                        permissions: [
                            { id: 'order_view_all',              label: '全部订单',     desc: '查看"全部订单"Tab' },
                            { id: 'order_view_pending_approval', label: '待审批',       desc: '查看"待审批"Tab' },
                            { id: 'order_view_pending_confirm',  label: '待确认',       desc: '查看"待确认"Tab' },
                            { id: 'order_view_auth_confirm',     label: '授权确认',     desc: '查看"授权确认"Tab' },
                            { id: 'order_view_stock_pkg',        label: '安装包核验',   desc: '查看"安装包核验"Tab' },
                            { id: 'order_view_stock_ship',       label: '快递单填写',   desc: '查看"快递单填写"Tab' },
                            { id: 'order_view_stock_cd',         label: '光盘刻录',     desc: '查看"光盘刻录"Tab' },
                            { id: 'order_view_payment',          label: '待支付',       desc: '查看"待支付"Tab' },
                            { id: 'order_view_shipped',          label: '已发货',       desc: '查看"已发货"Tab' },
                            { id: 'order_view_completed',        label: '已完成',       desc: '查看"已完成"Tab' },
                            { id: 'order_view_refund_pending',   label: '退款中',       desc: '查看"退款中"Tab' },
                            { id: 'order_view_refunded',         label: '已退款',       desc: '查看"已退款"Tab' },
                            { id: 'order_view_cancelled',        label: '已取消',       desc: '查看"已取消"Tab' },
                        ]
                    },
                    {
                        id: 'c_order_create', label: '订单创建与编辑',
                        permissions: [
                            { id: 'order_create',       label: '创建订单',   desc: '新建订单（进入创建向导）' },
                            { id: 'order_edit_draft',   label: '编辑草稿',   desc: '继续编辑已保存的订单草稿' },
                            { id: 'order_delete_draft', label: '删除草稿',   desc: '删除已保存的订单草稿' },
                        ]
                    },
                    {
                        id: 'c_order_flow', label: '审批与流转',
                        permissions: [
                            { id: 'order_approve', label: '审批订单',   desc: '对待审批订单执行通过或驳回' },
                            { id: 'order_confirm', label: '确认订单',   desc: '对待确认订单执行确认操作' },
                            { id: 'order_payment', label: '支付操作',   desc: '执行订单支付确认' },
                            { id: 'order_refund',  label: '发起退单',   desc: '对订单发起退单/退款申请' },
                        ]
                    },
                ]
            },
            // ── 二级：订单详情 (/orders/:id) ──
            {
                id: 's_order_detail', label: '订单详情',
                dependsOn: 'order_list_view',
                categories: [
                    {
                        id: 'c_order_detail_info', label: '信息模块',
                        permissions: [
                            { id: 'order_detail_product',     label: '查看产品明细',     desc: '查看订单中的产品明细列表及行详情' },
                            { id: 'order_detail_customer',    label: '查看客户信息',     desc: '查看订单关联的客户信息卡片' },
                            { id: 'order_detail_trader',      label: '查看交易方信息',   desc: '查看买方/卖方/渠道信息' },
                            { id: 'order_detail_opportunity', label: '查看商机信息',     desc: '查看订单关联的商机信息' },
                            { id: 'order_detail_remark',      label: '查看订单备注',     desc: '查看订单备注内容' },
                            { id: 'order_detail_contract',    label: '查看合同信息',     desc: '查看订单关联的合同信息及合同预览' },
                            { id: 'order_detail_original',    label: '查看原订单编号',   desc: '查看 SMS/SaaS 原订单编号' },
                            { id: 'order_detail_settlement',  label: '查看结算方式',     desc: '查看订单的结算方式及分期计划' },
                            { id: 'order_detail_acceptance',  label: '查看验收信息',     desc: '查看验收条件与验收明细' },
                            { id: 'order_detail_snapshot',    label: '查看订单快照',     desc: '查看订单历史快照（基础信息 + 客户快照）' },
                            { id: 'order_detail_log',         label: '查看订单记录',     desc: '查看订单流转的操作日志' },
                        ]
                    },
                    {
                        id: 'c_order_detail_tabs', label: '详情Tab页签',
                        permissions: [
                            { id: 'order_detail_delivery', label: '查看交付信息', desc: '访问订单详情中的"订单交付"Tab' },
                            { id: 'order_detail_shipping', label: '查看发货信息', desc: '访问订单详情中的"发货记录"Tab' },
                        ]
                    },
                    {
                        id: 'c_order_workflow', label: '工作流步骤',
                        permissions: [
                            { id: 'order_workflow_view',       label: '查看工作流',   desc: '显示订单详情中的工作流步骤条' },
                            { id: 'order_workflow_payment',    label: '支付步骤',     desc: '查看"支付"步骤' },
                            { id: 'order_workflow_approval',   label: '审批步骤',     desc: '查看"审批"步骤' },
                            { id: 'order_workflow_confirm',    label: '确认步骤',     desc: '查看"确认"步骤' },
                            { id: 'order_workflow_stock',      label: '备货步骤',     desc: '查看"备货"步骤' },
                            { id: 'order_workflow_shipping',   label: '发货步骤',     desc: '查看"发货"步骤' },
                            { id: 'order_workflow_acceptance', label: '验收步骤',     desc: '查看"验收"步骤' },
                        ]
                    },
                ]
            },
            // ── 二级：备货与发货 ──
            {
                id: 's_delivery_ops', label: '备货与发货',
                categories: [
                    {
                        id: 'c_stock_prep', label: '备货管理',
                        permissions: [
                            { id: 'stock_prep',  label: '生产备货操作', desc: '执行备货及授权码确认流程' },
                            { id: 'license_gen', label: '授权码生成',   desc: '生成并管理产品授权码' },
                        ]
                    },
                    {
                        id: 'c_shipping', label: '发货与交付',
                        permissions: [
                            { id: 'shipping_manage',            label: '物流发货管理',   desc: '填写快递信息，完成发货' },
                            { id: 'order_delivery_auth_change', label: '授权信息变更',   desc: '在交付列表中执行授权信息变更' },
                            { id: 'order_delivery_redelivery',  label: '二次交付申请',   desc: '在交付列表中发起二次交付' },
                            { id: 'order_delivery_save',        label: '保存交付内容',   desc: '编辑并保存订单交付内容' },
                        ]
                    },
                ]
            },
            // ── 二级：验收管理 (/acceptances) ──
            {
                id: 's_acceptance', label: '验收管理',
                permissions: [
                    { id: 'acceptance_view', label: '查看验收列表', desc: '访问验收管理页面，查看验收记录' },
                ]
            },
            // ── 二级：汇款管理 (/remittances) ──
            {
                id: 's_remittance', label: '汇款管理',
                permissions: [
                    { id: 'remittance_view', label: '查看汇款明细', desc: '访问汇款管理页面，查看汇款流水' },
                ]
            },
            // ── 二级：发票管理 (/invoices) ──
            {
                id: 's_invoice', label: '发票管理',
                permissions: [
                    { id: 'invoice_manage',  label: '查看发票列表', desc: '访问发票管理页面，查看发票申请列表' },
                    { id: 'invoice_approve', label: '发票审批',     desc: '对发票申请执行审批操作' },
                ]
            },
            // ── 二级：授权信息 (/authorizations) ──
            {
                id: 's_authorization', label: '授权信息',
                permissions: [
                    { id: 'authorization_view', label: '查看授权列表', desc: '访问授权信息页面，查看授权记录' },
                ]
            },
            // ── 二级：交付信息 (/delivery-info) ──
            {
                id: 's_delivery_info', label: '交付信息',
                permissions: [
                    { id: 'delivery_info_view', label: '查看交付列表', desc: '访问交付信息页面，查看交付记录' },
                ]
            },
            // ── 二级：客户信息 (/customers) ──
            {
                id: 's_customer', label: '客户信息',
                categories: [
                    {
                        id: 'c_customer_browse', label: '客户查看',
                        permissions: [
                            { id: 'customer_view',   label: '查看客户列表', desc: '访问客户信息页面，查看客户列表' },
                            { id: 'customer_detail', label: '查看客户详情', desc: '进入客户详情页，查看完整客户档案' },
                        ]
                    },
                    {
                        id: 'c_customer_manage', label: '客户管理',
                        permissions: [
                            { id: 'customer_edit',            label: '编辑客户信息', desc: '在客户详情中编辑联系人/地址/开票/银行信息' },
                            { id: 'customer_link_enterprise', label: '关联企业',     desc: '关联/创建企业信息到客户档案' },
                        ]
                    },
                ]
            },
            // ── 二级：商机信息 (/opportunities) ──
            {
                id: 's_opportunity', label: '商机信息',
                permissions: [
                    { id: 'opportunity_manage', label: '查看商机列表', desc: '访问商机信息页面，查看商机列表' },
                ]
            },
            // ── 二级：合同管理 (/contracts) ──
            {
                id: 's_contract', label: '合同管理',
                permissions: [
                    { id: 'contract_view', label: '查看合同列表', desc: '访问合同信息页面，查看合同列表' },
                    { id: 'contract_edit', label: '编辑合同',     desc: '新增或修改合同信息' },
                ]
            },
        ]
    },

    // ═══════════════════════════════════════════════
    //  一级：产品中心
    // ═══════════════════════════════════════════════
    {
        id: 'g_product', label: '产品中心',
        subgroups: [
            // ── 二级：产品目录 (/product-center) ──
            {
                id: 's_product_display', label: '产品目录',
                permissions: [
                    { id: 'product_display_view',    label: '查看产品目录', desc: '访问产品目录页面，按分类浏览产品（在架/下架/全部）' },
                    { id: 'product_display_preview', label: '查看产品预览', desc: '进入单个产品的宣传预览页面' },
                ]
            },
            // ── 二级：产品政策 (/product-policy) ──
            {
                id: 's_product_policy', label: '产品政策',
                permissions: [
                    { id: 'product_policy_view', label: '查看产品政策', desc: '访问产品政策页面，查看政策列表' },
                    { id: 'product_policy_edit', label: '管理产品政策', desc: '上传/编辑/删除产品政策' },
                ]
            },
            // ── 二级：产品列表 (/products) ──
            {
                id: 's_product_list', label: '产品列表',
                categories: [
                    {
                        id: 'c_product_browse', label: '产品查看',
                        permissions: [
                            { id: 'product_view',    label: '查看产品列表',     desc: '访问产品列表管理页面' },
                            { id: 'product_tab_spu', label: '产品列表(SPU)',   desc: '查看产品列表（SPU）Tab' },
                            { id: 'product_tab_sku', label: '规格列表(SKU)',   desc: '查看规格列表（SKU）Tab' },
                        ]
                    },
                    {
                        id: 'c_product_manage', label: '产品管理',
                        permissions: [
                            { id: 'product_create', label: '新增产品',   desc: '在产品列表中创建新产品（含 AI 生成）' },
                            { id: 'product_edit',   label: '编辑产品',   desc: '修改产品信息、SKU、安装包、授权方案等' },
                            { id: 'product_shelf',  label: '上下架产品', desc: '切换产品的上架/下架状态' },
                            { id: 'product_delete', label: '删除产品',   desc: '从产品列表中删除产品' },
                        ]
                    },
                ]
            },
            // ── 二级：组件池 (/product-manage/component-pool) ──
            {
                id: 's_product_component_pool', label: '组件池',
                permissions: [
                    { id: 'product_component_pool_view', label: '查看组件池', desc: '访问产品组件池页面，浏览组件列表' },
                    { id: 'product_component_pool_edit', label: '管理组件',   desc: '新增/编辑/复制/启停组件' },
                ]
            },
            // ── 二级：安装包管理 (/product-manage/packages) ──
            {
                id: 's_product_package', label: '安装包管理',
                permissions: [
                    { id: 'product_package_view', label: '查看安装包', desc: '访问安装包管理页面，浏览公共/私有安装包' },
                    { id: 'product_package_edit', label: '管理安装包', desc: '新增/编辑安装包，切换启用状态' },
                ]
            },
            // ── 二级：产品报价 ──
            {
                id: 's_product_pricing', label: '产品报价',
                permissions: [
                    { id: 'product_msrp_view',          label: '查看建议销售价', desc: '访问建议销售价页面' },
                    { id: 'product_channel_price_view', label: '查看渠道价格',   desc: '访问渠道价格页面' },
                ]
            },
        ]
    },

    // ═══════════════════════════════════════════════
    //  一级：渠道中心
    // ═══════════════════════════════════════════════
    {
        id: 'g_channel', label: '渠道中心',
        subgroups: [
            {
                id: 's_channel', label: '渠道管理',
                categories: [
                    {
                        id: 'c_channel_browse', label: '渠道查看',
                        permissions: [
                            { id: 'channel_view',   label: '查看渠道列表', desc: '访问渠道管理页面，查看渠道列表' },
                            { id: 'channel_detail', label: '查看渠道详情', desc: '进入渠道详情页查看基本/银行/发票等信息' },
                        ]
                    },
                    {
                        id: 'c_channel_manage', label: '渠道管理操作',
                        permissions: [
                            { id: 'channel_edit', label: '编辑渠道', desc: '编辑渠道的基本信息' },
                        ]
                    },
                ]
            },
        ]
    },

    // ═══════════════════════════════════════════════
    //  一级：业绩中心
    // ═══════════════════════════════════════════════
    {
        id: 'g_performance', label: '业绩中心',
        subgroups: [
            {
                id: 's_performance', label: '业绩管理',
                permissions: [
                    { id: 'performance_view', label: '查看业绩列表', desc: '访问业绩管理页面，查看业绩宽表数据' },
                ]
            },
        ]
    },

    // ═══════════════════════════════════════════════
    //  一级：线索中心
    // ═══════════════════════════════════════════════
    {
        id: 'g_leads', label: '线索中心',
        subgroups: [
            {
                id: 's_leads', label: '线索管理',
                permissions: [
                    { id: 'leads_view', label: '查看线索列表', desc: '访问线索中心页面，查看线索列表及统计' },
                ]
            },
        ]
    },

    // ═══════════════════════════════════════════════
    //  一级：运营中心
    // ═══════════════════════════════════════════════
    {
        id: 'g_ops', label: '运营中心',
        subgroups: [
            // ── 二级：备货管理 (/wps-ops) ──
            {
                id: 's_ops_fulfillment', label: '备货管理',
                permissions: [
                    { id: 'wps_ops_view',       label: '访问运营中心', desc: '进入运营中心备货管理页面' },
                    { id: 'ops_fulfill_action', label: '确认完成操作', desc: '执行授权确认/安装包核验/快递/光盘刻录等确认操作' },
                ]
            },
            // ── 二级：指标看板 (/ops/dashboard) ──
            {
                id: 's_ops_dashboard', label: '指标看板',
                permissions: [
                    { id: 'ops_dashboard_view', label: '查看指标看板', desc: '访问运营指标看板页面' },
                    { id: 'ops_dashboard_edit', label: '管理指标卡片', desc: '新增/删除指标卡片' },
                ]
            },
            // ── 二级：企业管理 (/ops/enterprise) ──
            {
                id: 's_ops_enterprise', label: '企业管理',
                permissions: [
                    { id: 'ops_enterprise_view', label: '查看企业列表', desc: '访问运营企业管理页面，查看企业列表' },
                ]
            },
        ]
    },

    // ═══════════════════════════════════════════════
    //  一级：系统配置
    // ═══════════════════════════════════════════════
    {
        id: 'g_system', label: '系统配置',
        subgroups: [
            // ── 二级：组织架构 (/organization) ──
            {
                id: 's_org', label: '组织架构',
                permissions: [
                    { id: 'admin_view', label: '访问系统配置', desc: '进入系统配置模块' },
                    { id: 'org_view',   label: '查看组织架构', desc: '查看部门树及部门详情' },
                    { id: 'org_manage', label: '管理组织架构', desc: '新增/编辑/删除部门' },
                ]
            },
            // ── 二级：用户管理 (/users) ──
            {
                id: 's_user', label: '用户管理',
                permissions: [
                    { id: 'user_view',   label: '查看用户列表', desc: '查看系统用户列表' },
                    { id: 'user_manage', label: '管理用户',     desc: '新增/编辑用户信息' },
                ]
            },
            // ── 二级：角色管理 (/roles) ──
            {
                id: 's_role', label: '角色管理',
                categories: [
                    {
                        id: 'c_role_mgmt', label: '角色管理操作',
                        permissions: [
                            { id: 'role_view',          label: '查看角色列表', desc: '查看系统角色列表' },
                            { id: 'role_manage',        label: '管理角色',     desc: '创建/编辑/复制/删除角色' },
                            { id: 'role_member_manage', label: '管理角色成员', desc: '为角色添加/移除成员' },
                        ]
                    },
                    {
                        id: 'c_role_perm', label: '权限配置',
                        permissions: [
                            { id: 'role_perm_functional', label: '配置功能权限', desc: '配置角色的功能权限树' },
                            { id: 'role_perm_row',        label: '配置行权限',   desc: '配置角色的行级数据权限规则' },
                            { id: 'role_perm_column',     label: '配置列权限',   desc: '配置角色的列级数据权限规则' },
                        ]
                    },
                ]
            },
            // ── 二级：授权类型管理 (/system/license-types) ──
            {
                id: 's_license_type', label: '授权类型管理',
                permissions: [
                    { id: 'license_type_view',   label: '查看授权类型', desc: '访问授权类型管理页面，查看列表' },
                    { id: 'license_type_edit',   label: '管理授权类型', desc: '新增/复制/编辑授权类型及字段配置' },
                    { id: 'license_type_export', label: '导出配置',     desc: '导出授权类型配置数据' },
                ]
            },
            // ── 二级：产品发货方式配置 (/system/delivery-methods) ──
            {
                id: 's_delivery_method', label: '产品发货方式配置',
                permissions: [
                    { id: 'delivery_method_view', label: '查看发货方式', desc: '访问产品发货方式配置页面' },
                    { id: 'delivery_method_edit', label: '管理发货方式', desc: '新增/编辑/删除发货方式规则' },
                ]
            },
            // ── 二级：销售组织配置 (/system/sales-org) ──
            {
                id: 's_sales_org', label: '销售组织配置',
                permissions: [
                    { id: 'sales_org_view', label: '查看销售组织', desc: '访问销售组织配置页面' },
                    { id: 'sales_org_edit', label: '管理销售组织', desc: '编辑销售组织信息' },
                ]
            },
        ]
    },

    // ═══════════════════════════════════════════════
    //  超级权限
    // ═══════════════════════════════════════════════
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

export type PermItem     = { id: string; label: string; desc: string };
export type PermCategory = { id: string; label: string; permissions: PermItem[] };
export type PermSubgroup = {
    id: string; label: string; dependsOn?: string;
    categories?: PermCategory[];
    permissions?: PermItem[];
};
export type PermGroup = { id: string; label: string; subgroups: PermSubgroup[] };

export function getSubgroupPermItems(sg: PermSubgroup): PermItem[] {
    if (sg.categories && sg.categories.length > 0)
        return sg.categories.flatMap(c => c.permissions);
    return sg.permissions || [];
}

export function getSubgroupPermIds(sg: PermSubgroup): string[] {
    return getSubgroupPermItems(sg).map(p => p.id);
}

export const resourceFunctionalPermMap: Record<string, { groupIds: string[]; hint: string }> = {
    Order: {
        groupIds: ['g_order'],
        hint: '请先在功能权限中开启「订单中心」相关权限',
    },
    Customer: {
        groupIds: ['g_order'],
        hint: '请先在功能权限中开启「订单中心 → 客户信息」相关权限',
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
        .flatMap(g => g.subgroups.flatMap(sg => getSubgroupPermItems(sg).map(p => p.id)));
}

export const permissionModules = permissionTree.map(g => ({
      id: g.id,
      label: g.label,
      permissions: g.subgroups.flatMap(sg => getSubgroupPermItems(sg).map(p => ({ id: p.id, label: p.label }))),
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
