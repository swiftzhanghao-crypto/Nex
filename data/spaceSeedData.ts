/**
 * 预置应用（Space）数据。目前仅 SAB 客户洞察一个应用。
 * 结构与 types.ts 中的 Space 类型一致。
 */

import type { Space, SpaceRole } from '../types';

export const initialSpaces: Space[] = [
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
];

/**
 * 每个应用的预置角色。应用管理员（space_admin）默认拥有全部权限。
 */
export const initialSpaceRoles: SpaceRole[] = [
  {
    id: 'sr_sab_admin',
    spaceId: 'space_sab_insight',
    name: '应用管理员',
    description: '拥有 SAB 应用内所有权限，可管理角色、成员与配置',
    sortOrder: 0,
    permissions: [
      'sab_search', 'sab_search_export',
      'sab_list_view', 'sab_list_filter', 'sab_list_assign',
      'sab_detail_view', 'sab_detail_edit', 'sab_detail_analysis', 'sab_detail_contact',
      'sab_data_import', 'sab_data_sync', 'sab_data_cleanup',
      'sab_config_tags', 'sab_config_scoring',
    ],
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
];
