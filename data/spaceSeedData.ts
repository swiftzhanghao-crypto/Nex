/**
 * 预置应用（Space）数据。
 * 1. SAB 客户洞察
 * 2. 线索中台
 */

import type { Space, SpaceRole } from '../types';

export const initialSpaces: Space[] = [
  // ======================== SAB 客户洞察 ========================
  {
    id: 'space_sab_insight',
    name: 'SAB 客户洞察',
    description: '面向销售的客户洞察应用：客户搜索、客户画像、分析报告。',
    icon: 'BarChart3',
    sortOrder: 0,
    permTree: [
      {
        id: 'sg_insight',
        label: '洞察功能',
        subgroups: [
          {
            id: 'ss_search',
            label: '智能查客户',
            permissions: [
              { id: 'sab_search', label: '使用智能搜索', desc: '通过自然语言、标签、行业等条件检索客户' },
              { id: 'sab_search_export', label: '导出搜索结果', desc: '将搜索结果导出为 Excel/CSV' },
            ],
          },
          {
            id: 'ss_list',
            label: '客户列表',
            permissions: [
              { id: 'sab_list_view', label: '查看客户列表' },
              { id: 'sab_list_filter', label: '高级筛选', desc: '使用多维度组合筛选' },
              { id: 'sab_list_assign', label: '分配客户到团队' },
            ],
          },
          {
            id: 'ss_detail',
            label: '客户详情',
            permissions: [
              { id: 'sab_detail_view', label: '查看客户详情' },
              { id: 'sab_detail_edit', label: '编辑客户标签' },
              { id: 'sab_detail_analysis', label: '查看分析报告' },
              { id: 'sab_detail_contact', label: '查看联系方式' },
            ],
          },
        ],
      },
      {
        id: 'sg_admin',
        label: '管理功能',
        subgroups: [
          {
            id: 'ss_data',
            label: '数据管理',
            permissions: [
              { id: 'sab_data_import', label: '导入客户数据' },
              { id: 'sab_data_sync', label: '同步外部数据源' },
              { id: 'sab_data_cleanup', label: '清理重复数据' },
            ],
          },
          {
            id: 'ss_config',
            label: '配置管理',
            permissions: [
              { id: 'sab_config_tags', label: '管理客户标签体系' },
              { id: 'sab_config_scoring', label: '配置客户评分规则' },
            ],
          },
        ],
      },
    ],
    resourceConfig: [
      {
        id: 'SabCustomer',
        label: 'SAB 客户',
        description: '应用内的客户数据对象',
        dimensions: [
          {
            id: 'departmentId',
            label: '部门',
            options: [
              { value: 'dept_marketing', label: '营销中心' },
              { value: 'dept_ops', label: '运营中心' },
              { value: 'dept_sales_north', label: '华北销售部' },
              { value: 'dept_sales_east', label: '华东销售部' },
              { value: 'dept_sales_south', label: '华南销售部' },
              { value: 'dept_sales_west', label: '西南销售部' },
              { value: 'dept_sales_central', label: '华中销售部' },
              { value: 'dept_channel', label: '渠道合作部' },
              { value: 'dept_key_account', label: '大客户部' },
            ],
          },
          {
            id: 'province',
            label: '省份',
            options: [
              { value: '北京', label: '北京' },
              { value: '上海', label: '上海' },
              { value: '广东', label: '广东' },
              { value: '浙江', label: '浙江' },
              { value: '江苏', label: '江苏' },
              { value: '四川', label: '四川' },
              { value: '湖北', label: '湖北' },
              { value: '山东', label: '山东' },
              { value: '福建', label: '福建' },
              { value: '河南', label: '河南' },
              { value: '湖南', label: '湖南' },
              { value: '重庆', label: '重庆' },
              { value: '天津', label: '天津' },
              { value: '陕西', label: '陕西' },
              { value: '辽宁', label: '辽宁' },
              { value: '安徽', label: '安徽' },
              { value: '河北', label: '河北' },
            ],
          },
          {
            id: 'industryLine',
            label: '行业线',
            options: [
              { value: 'gov', label: '政府与公共事业' },
              { value: 'edu', label: '教育' },
              { value: 'finance', label: '金融' },
              { value: 'manufacturing', label: '制造业' },
              { value: 'internet', label: '互联网/科技' },
              { value: 'retail', label: '零售/消费' },
              { value: 'healthcare', label: '医疗健康' },
              { value: 'energy', label: '能源/化工' },
              { value: 'logistics', label: '物流/交通' },
              { value: 'real_estate', label: '房地产/建筑' },
              { value: 'telecom', label: '通信/运营商' },
              { value: 'media', label: '媒体/文娱' },
            ],
          },
          {
            id: 'customerLevel',
            label: '客户等级',
            options: [
              { value: 'S', label: 'S 级 (战略客户)' },
              { value: 'A', label: 'A 级 (重点客户)' },
              { value: 'B', label: 'B 级 (一般客户)' },
              { value: 'C', label: 'C 级 (潜力客户)' },
              { value: 'D', label: 'D 级 (低优先级)' },
            ],
          },
          {
            id: 'owner',
            label: '客户负责人',
            options: [
              { value: 'zhangwei', label: '张伟' },
              { value: 'lina', label: '李娜' },
              { value: 'wangfang', label: '王芳' },
              { value: 'zhaoqiang', label: '赵强' },
              { value: 'liuyang', label: '刘洋' },
              { value: 'chenxi', label: '陈曦' },
              { value: 'sunli', label: '孙丽' },
              { value: 'zhoujie', label: '周杰' },
            ],
          },
        ],
      },
    ],
    columnConfig: [
      {
        id: 'SabCustomer',
        label: 'SAB 客户',
        columns: [
          { id: 'revenue', label: '营收数据' },
          { id: 'tags', label: '客户标签' },
          { id: 'analysisReport', label: '分析报告' },
          { id: 'contact', label: '联系方式' },
          { id: 'score', label: '客户评分' },
        ],
      },
    ],
  },

  // ======================== 线索中台 ========================
  {
    id: 'space_lead_hub',
    name: '线索中台',
    description: '统一管理市场线索的全生命周期：线索录入、清洗、评分、分配与转化跟踪。',
    icon: 'Crosshair',
    sortOrder: 1,
    permTree: [
      {
        id: 'lg_capture',
        label: '线索采集',
        subgroups: [
          {
            id: 'ls_import',
            label: '线索录入',
            permissions: [
              { id: 'lead_manual_create', label: '手动创建线索', desc: '通过表单手动录入单条线索' },
              { id: 'lead_batch_import', label: '批量导入', desc: '通过 Excel/CSV 批量导入线索' },
              { id: 'lead_api_sync', label: 'API 同步', desc: '配置第三方平台自动同步线索' },
            ],
          },
          {
            id: 'ls_channel',
            label: '渠道管理',
            permissions: [
              { id: 'lead_channel_view', label: '查看线索渠道' },
              { id: 'lead_channel_manage', label: '管理渠道配置', desc: '新增/编辑/停用线索来源渠道' },
            ],
          },
        ],
      },
      {
        id: 'lg_process',
        label: '线索处理',
        subgroups: [
          {
            id: 'ls_pool',
            label: '线索池',
            permissions: [
              { id: 'lead_pool_view', label: '查看线索池' },
              { id: 'lead_pool_claim', label: '认领线索', desc: '从公海池认领线索到个人名下' },
              { id: 'lead_pool_return', label: '退回线索', desc: '将线索退回到公海池' },
              { id: 'lead_pool_transfer', label: '转移线索', desc: '将线索转移给其他成员' },
            ],
          },
          {
            id: 'ls_qualify',
            label: '线索清洗与评分',
            permissions: [
              { id: 'lead_qualify_view', label: '查看线索评分' },
              { id: 'lead_qualify_edit', label: '手动评分/标注', desc: '手动调整线索评分和质量标注' },
              { id: 'lead_dedup', label: '去重合并', desc: '检测和合并重复线索' },
            ],
          },
          {
            id: 'ls_assign',
            label: '线索分配',
            permissions: [
              { id: 'lead_assign_auto', label: '自动分配规则', desc: '配置按区域/行业/轮询等自动分配规则' },
              { id: 'lead_assign_manual', label: '手动分配', desc: '手动将线索分配给指定销售' },
              { id: 'lead_assign_reassign', label: '重新分配', desc: '回收已分配线索并重新指派' },
            ],
          },
        ],
      },
      {
        id: 'lg_convert',
        label: '线索转化',
        subgroups: [
          {
            id: 'ls_follow',
            label: '跟进管理',
            permissions: [
              { id: 'lead_follow_view', label: '查看跟进记录' },
              { id: 'lead_follow_add', label: '新增跟进记录' },
              { id: 'lead_follow_plan', label: '制定跟进计划' },
            ],
          },
          {
            id: 'ls_convert',
            label: '线索转化',
            permissions: [
              { id: 'lead_convert_opp', label: '转为商机', desc: '将合格线索转化为商机' },
              { id: 'lead_convert_customer', label: '转为客户', desc: '将合格线索直接转化为客户' },
              { id: 'lead_convert_discard', label: '废弃线索', desc: '标记无效线索为废弃' },
            ],
          },
        ],
      },
      {
        id: 'lg_analytics',
        label: '统计分析',
        subgroups: [
          {
            id: 'ls_dashboard',
            label: '线索看板',
            permissions: [
              { id: 'lead_dashboard_view', label: '查看线索看板', desc: '查看线索总量、转化率、渠道分布等看板' },
              { id: 'lead_dashboard_export', label: '导出报表', desc: '导出线索统计报表' },
            ],
          },
          {
            id: 'ls_report',
            label: '分析报告',
            permissions: [
              { id: 'lead_report_funnel', label: '转化漏斗分析' },
              { id: 'lead_report_roi', label: '渠道 ROI 分析' },
              { id: 'lead_report_team', label: '团队绩效分析' },
            ],
          },
        ],
      },
      {
        id: 'lg_admin',
        label: '系统管理',
        subgroups: [
          {
            id: 'ls_settings',
            label: '配置中心',
            permissions: [
              { id: 'lead_setting_rule', label: '管理分配规则' },
              { id: 'lead_setting_scoring', label: '管理评分模型', desc: '配置线索自动评分的权重与规则' },
              { id: 'lead_setting_lifecycle', label: '管理生命周期', desc: '定义线索阶段与流转规则' },
              { id: 'lead_setting_field', label: '自定义字段', desc: '管理线索表单自定义字段' },
            ],
          },
        ],
      },
    ],
    resourceConfig: [
      {
        id: 'Lead',
        label: '线索',
        description: '线索中台的核心数据对象',
        dimensions: [
          {
            id: 'source',
            label: '线索来源',
            options: [
              { value: 'website', label: '官网表单' },
              { value: 'sem', label: 'SEM 投放' },
              { value: 'social', label: '社交媒体' },
              { value: 'referral', label: '客户转介绍' },
              { value: 'exhibition', label: '展会活动' },
              { value: 'coldcall', label: '电话外呼' },
              { value: 'partner', label: '合作伙伴' },
              { value: 'content', label: '内容营销' },
            ],
          },
          {
            id: 'region',
            label: '区域',
            options: [
              { value: 'north', label: '华北' },
              { value: 'east', label: '华东' },
              { value: 'south', label: '华南' },
              { value: 'west', label: '西南' },
              { value: 'central', label: '华中' },
              { value: 'northeast', label: '东北' },
              { value: 'northwest', label: '西北' },
            ],
          },
          {
            id: 'industry',
            label: '行业',
            options: [
              { value: 'gov', label: '政府与公共事业' },
              { value: 'edu', label: '教育' },
              { value: 'finance', label: '金融' },
              { value: 'manufacturing', label: '制造业' },
              { value: 'internet', label: '互联网/科技' },
              { value: 'retail', label: '零售/消费' },
              { value: 'healthcare', label: '医疗健康' },
            ],
          },
          {
            id: 'leadLevel',
            label: '线索等级',
            options: [
              { value: 'hot', label: '高意向' },
              { value: 'warm', label: '中意向' },
              { value: 'cold', label: '低意向' },
              { value: 'unqualified', label: '未评级' },
            ],
          },
          {
            id: 'ownerId',
            label: '线索负责人',
          },
        ],
      },
      {
        id: 'LeadActivity',
        label: '跟进记录',
        description: '线索跟进活动记录',
        dimensions: [
          {
            id: 'activityType',
            label: '活动类型',
            options: [
              { value: 'call', label: '电话' },
              { value: 'email', label: '邮件' },
              { value: 'meeting', label: '会议' },
              { value: 'demo', label: '演示' },
              { value: 'visit', label: '拜访' },
            ],
          },
          {
            id: 'ownerId',
            label: '跟进人',
          },
        ],
      },
    ],
    columnConfig: [
      {
        id: 'Lead',
        label: '线索',
        columns: [
          { id: 'companyName', label: '公司名称' },
          { id: 'contactName', label: '联系人' },
          { id: 'phone', label: '联系电话' },
          { id: 'email', label: '邮箱' },
          { id: 'source', label: '来源渠道' },
          { id: 'score', label: '线索评分' },
          { id: 'estimatedBudget', label: '预估预算' },
          { id: 'notes', label: '备注信息' },
        ],
      },
      {
        id: 'LeadActivity',
        label: '跟进记录',
        columns: [
          { id: 'content', label: '跟进内容' },
          { id: 'result', label: '跟进结果' },
          { id: 'nextStep', label: '下一步计划' },
          { id: 'attachment', label: '附件' },
        ],
      },
    ],
  },
];

// ========================================================================
// 预置角色
// ========================================================================

const ALL_SAB_PERMS = [
  'sab_search', 'sab_search_export',
  'sab_list_view', 'sab_list_filter', 'sab_list_assign',
  'sab_detail_view', 'sab_detail_edit', 'sab_detail_analysis', 'sab_detail_contact',
  'sab_data_import', 'sab_data_sync', 'sab_data_cleanup',
  'sab_config_tags', 'sab_config_scoring',
];

const ALL_LEAD_PERMS = [
  'lead_manual_create', 'lead_batch_import', 'lead_api_sync',
  'lead_channel_view', 'lead_channel_manage',
  'lead_pool_view', 'lead_pool_claim', 'lead_pool_return', 'lead_pool_transfer',
  'lead_qualify_view', 'lead_qualify_edit', 'lead_dedup',
  'lead_assign_auto', 'lead_assign_manual', 'lead_assign_reassign',
  'lead_follow_view', 'lead_follow_add', 'lead_follow_plan',
  'lead_convert_opp', 'lead_convert_customer', 'lead_convert_discard',
  'lead_dashboard_view', 'lead_dashboard_export',
  'lead_report_funnel', 'lead_report_roi', 'lead_report_team',
  'lead_setting_rule', 'lead_setting_scoring', 'lead_setting_lifecycle', 'lead_setting_field',
];

export const initialSpaceRoles: SpaceRole[] = [
  // ==================== SAB 客户洞察 角色 ====================
  {
    id: 'sr_sab_admin',
    spaceId: 'space_sab_insight',
    name: '应用管理员',
    description: '拥有 SAB 应用内所有权限，可管理角色、成员与配置',
    sortOrder: 0,
    permissions: ALL_SAB_PERMS,
    rowPermissions: [],
    columnPermissions: [],
  },
  {
    id: 'sr_sab_analyst',
    spaceId: 'space_sab_insight',
    name: '洞察分析师',
    description: '可搜索、查看、分析客户，但不能管理配置',
    sortOrder: 1,
    permissions: [
      'sab_search', 'sab_search_export',
      'sab_list_view', 'sab_list_filter',
      'sab_detail_view', 'sab_detail_analysis', 'sab_detail_contact',
    ],
    rowPermissions: [],
    columnPermissions: [],
  },
  {
    id: 'sr_sab_viewer',
    spaceId: 'space_sab_insight',
    name: '只读用户',
    description: '仅查看客户列表与基础信息',
    sortOrder: 2,
    permissions: [
      'sab_list_view',
      'sab_detail_view',
    ],
    rowPermissions: [],
    columnPermissions: [],
  },
  {
    id: 'sr_sab_sales',
    spaceId: 'space_sab_insight',
    name: '销售人员',
    description: '日常使用搜索与客户详情，可编辑标签和分配客户',
    sortOrder: 3,
    permissions: [
      'sab_search',
      'sab_list_view', 'sab_list_filter', 'sab_list_assign',
      'sab_detail_view', 'sab_detail_edit', 'sab_detail_contact',
    ],
    rowPermissions: [
      { id: 'srp_sab_sales_dept', resource: 'SabCustomer', dimension: 'departmentId', operator: 'equals' as const, values: ['dept_sales_east', 'dept_sales_north'] },
    ],
    columnPermissions: [
      { id: 'scp_sab_sales', resource: 'SabCustomer', allowedColumns: ['tags', 'contact', 'score'] },
    ],
  },
  {
    id: 'sr_sab_data_ops',
    spaceId: 'space_sab_insight',
    name: '数据运营',
    description: '负责客户数据的导入、同步和清洗',
    sortOrder: 4,
    permissions: [
      'sab_list_view', 'sab_list_filter',
      'sab_detail_view',
      'sab_data_import', 'sab_data_sync', 'sab_data_cleanup',
    ],
    rowPermissions: [],
    columnPermissions: [],
  },

  // ==================== 线索中台 角色 ====================
  {
    id: 'sr_lead_admin',
    spaceId: 'space_lead_hub',
    name: '应用管理员',
    description: '拥有线索中台全部权限，管理系统配置、分配规则和成员',
    sortOrder: 0,
    permissions: ALL_LEAD_PERMS,
    rowPermissions: [],
    columnPermissions: [],
  },
  {
    id: 'sr_lead_ops',
    spaceId: 'space_lead_hub',
    name: '线索运营',
    description: '负责线索录入、清洗、评分与分配',
    sortOrder: 1,
    permissions: [
      'lead_manual_create', 'lead_batch_import',
      'lead_channel_view',
      'lead_pool_view', 'lead_pool_claim', 'lead_pool_return', 'lead_pool_transfer',
      'lead_qualify_view', 'lead_qualify_edit', 'lead_dedup',
      'lead_assign_manual', 'lead_assign_reassign',
      'lead_dashboard_view',
    ],
    rowPermissions: [],
    columnPermissions: [],
  },
  {
    id: 'sr_lead_sales',
    spaceId: 'space_lead_hub',
    name: 'SDR / 销售',
    description: '从线索池认领线索，跟进并推动转化',
    sortOrder: 2,
    permissions: [
      'lead_pool_view', 'lead_pool_claim', 'lead_pool_return',
      'lead_follow_view', 'lead_follow_add', 'lead_follow_plan',
      'lead_convert_opp', 'lead_convert_customer', 'lead_convert_discard',
      'lead_dashboard_view',
    ],
    rowPermissions: [
      { id: 'srp_lead_sales_region', resource: 'Lead', dimension: 'region', operator: 'equals' as const, values: ['east', 'north'] },
    ],
    columnPermissions: [
      { id: 'scp_lead_sales', resource: 'Lead', allowedColumns: ['companyName', 'contactName', 'phone', 'email', 'source', 'score'] },
    ],
  },
  {
    id: 'sr_lead_marketing',
    spaceId: 'space_lead_hub',
    name: '市场营销',
    description: '查看线索看板与分析报告，评估渠道 ROI',
    sortOrder: 3,
    permissions: [
      'lead_channel_view',
      'lead_pool_view',
      'lead_qualify_view',
      'lead_dashboard_view', 'lead_dashboard_export',
      'lead_report_funnel', 'lead_report_roi', 'lead_report_team',
    ],
    rowPermissions: [],
    columnPermissions: [],
  },
  {
    id: 'sr_lead_viewer',
    spaceId: 'space_lead_hub',
    name: '只读用户',
    description: '仅查看线索池和看板，不可操作',
    sortOrder: 4,
    permissions: [
      'lead_pool_view',
      'lead_follow_view',
      'lead_dashboard_view',
    ],
    rowPermissions: [],
    columnPermissions: [],
  },
];
