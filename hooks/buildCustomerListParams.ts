export interface CustomerListFilters {
  search: string;
  type: string;
  level: string;
  region: string;
  industry: string;
}

interface AppliedFilter {
  fieldId: string;
  mode: '单选' | '多选';
  value: string[];
}

/** 将 UI 筛选条件映射为 customerApi.list 查询参数（仅单选字段映射到后端） */
export function buildCustomerListFilters(
  applied: AppliedFilter[],
  searchTerm: string,
  searchField: 'crmId' | 'companyName' | 'enterpriseId',
): CustomerListFilters {
  const filters: CustomerListFilters = {
    search: '',
    type: '',
    level: '',
    region: '',
    industry: '',
  };

  if (searchTerm.trim()) {
    if (searchField === 'crmId' || searchField === 'companyName') {
      filters.search = searchTerm.trim();
    }
  }

  for (const f of applied) {
    if (f.value.length === 0) continue;
    const first = f.value[0];
    if (f.mode !== '单选' || !first) continue;
    switch (f.fieldId) {
      case 'customerType':
        filters.type = first;
        break;
      case 'customerGrade':
        filters.level = first;
        break;
      case 'province':
        filters.region = first;
        break;
      case 'industryLine':
        filters.industry = first;
        break;
      default:
        break;
    }
  }

  return filters;
}
