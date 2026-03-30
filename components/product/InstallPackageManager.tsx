import React, { useState, useMemo } from 'react';
import { Search, Filter, X, ChevronDown, ChevronLeft, ChevronRight, Plus, Pencil, Save } from 'lucide-react';

interface PkgRow {
  id: string;
  deliveryItemId: string;
  deliveryItemName: string;
  productId: string;
  productLine: string;
  productType: string;
  productName: string;
  productSpec: string;
  platform: string;
  os: string;
  cpu: string;
  enabled: boolean;
  packageType: 'public' | 'private';
}

const CPU_LIST = [
  '龙芯mips', '龙芯aarch', '飞腾', '鲲鹏', '腾锐', '麒麟',
  '兆芯', '海光', '申威', '盘古', 'intel/AMD', 'Mac',
];
const OS_LIST = ['统信UOS', '麒麟', '中科方德', '深度', 'Windows', 'MacOS'];
const PLATFORM_LIST = ['Windows', 'Linux', 'Mac', 'iOS', 'Android'];

const PUBLIC_ROWS: PkgRow[] = [
  { id: 'AZ0006288', deliveryItemId: '-', deliveryItemName: 'WPS PDF for Linux专业版', productId: 'AB0001878', productLine: '信创端', productType: 'PDF（信创）', productName: 'WPS PDF for Linux专业版软件V12', productSpec: '专业版', platform: 'Linux', os: '统信UOS', cpu: '海光', enabled: true, packageType: 'public' },
  { id: 'AZ0006287', deliveryItemId: '-', deliveryItemName: '数科OFD套式办公套件-通用机', productId: 'AB0001804', productLine: '信创端', productType: '数科OFD用户端', productName: '数科OFD办公套件软件V5.0', productSpec: '2025通用机版', platform: 'Linux', os: '麒麟', cpu: '麒麟', enabled: true, packageType: 'public' },
  { id: 'AZ0006286', deliveryItemId: '-', deliveryItemName: 'JK开发工具包专用', productId: 'AB0000041', productLine: '信创端', productType: 'WPS for Linux开发工具包专用', productName: 'WPS Office开发工具包软件V11', productSpec: 'JK专用', platform: 'Linux', os: '统信UOS', cpu: '飞腾', enabled: true, packageType: 'public' },
  { id: 'AZ0000336', deliveryItemId: '-', deliveryItemName: 'WPS Office 2023 for Linux流版套装办公软件V12.8', productId: 'AB0000774', productLine: '信创端', productType: '流版套装2023（Linux）', productName: 'WPS Office 2023 for Linux流版套装办公软件V12.8', productSpec: '专业版（Lin版）', platform: 'Linux', os: '中科方德', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0000340', deliveryItemId: '-', deliveryItemName: 'WPS Office 2023 for Linux流版套装办公软件V12.8', productId: 'AB0000774', productLine: '信创端', productType: '流版套装2023（Linux）', productName: 'WPS Office 2023 for Linux流版套装办公软件V12.8', productSpec: '专业版（Lin版）', platform: 'Linux', os: '统信UOS', cpu: '海光', enabled: true, packageType: 'public' },
  { id: 'AZ0005369', deliveryItemId: '905875', deliveryItemName: '12.8.2.24730-2023流版套装（非金融）通用机x64+中科方德', productId: 'AB0000774', productLine: '信创端', productType: '流版套装2023（Linux）', productName: 'WPS Office 2023 for Linux流版套装办公软件V12.8', productSpec: '专业版（Lin版）', platform: 'Linux', os: '中科方德', cpu: '兆芯', enabled: true, packageType: 'public' },
  { id: 'AZ0005371', deliveryItemId: '-', deliveryItemName: 'xc23流版套装非金融', productId: 'AB0000774', productLine: '信创端', productType: '流版套装2023（Linux）', productName: 'WPS Office 2023 for Linux流版套装办公软件V12.8', productSpec: '专业版（Lin版）', platform: 'Linux', os: '统信UOS', cpu: 'intel/AMD', enabled: false, packageType: 'public' },
  { id: 'AZ0005210', deliveryItemId: '-', deliveryItemName: 'WPS 365 信创版-飞腾专用', productId: 'AB0001120', productLine: '信创端', productType: 'WPS365信创版', productName: 'WPS 365 for Linux信创版办公软件V13', productSpec: '标准版', platform: 'Linux', os: '麒麟', cpu: '飞腾', enabled: true, packageType: 'public' },
  { id: 'AZ0005211', deliveryItemId: '-', deliveryItemName: 'WPS 365 信创版-龙芯专用', productId: 'AB0001120', productLine: '信创端', productType: 'WPS365信创版', productName: 'WPS 365 for Linux信创版办公软件V13', productSpec: '标准版', platform: 'Linux', os: '统信UOS', cpu: '龙芯mips', enabled: true, packageType: 'public' },
  { id: 'AZ0005212', deliveryItemId: '906100', deliveryItemName: 'WPS 365 信创版-兆芯专用-金融行业', productId: 'AB0001120', productLine: '信创端', productType: 'WPS365信创版', productName: 'WPS 365 for Linux信创版办公软件V13', productSpec: '金融版', platform: 'Linux', os: '麒麟', cpu: '兆芯', enabled: true, packageType: 'public' },
  { id: 'AZ0004900', deliveryItemId: '-', deliveryItemName: 'WPS Office 2023 Win专业版', productId: 'AB0000210', productLine: 'Win端', productType: 'Win2023专业版', productName: 'WPS Office 2023专业版V12.8', productSpec: '专业版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0004901', deliveryItemId: '812300', deliveryItemName: 'WPS Office 2023 Win专业增强版', productId: 'AB0000211', productLine: 'Win端', productType: 'Win2023专业增强版', productName: 'WPS Office 2023专业增强版V12.8', productSpec: '专业增强版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0004902', deliveryItemId: '-', deliveryItemName: 'WPS Office 2023 Win标准版', productId: 'AB0000212', productLine: 'Win端', productType: 'Win2023标准版', productName: 'WPS Office 2023标准版V12.8', productSpec: '标准版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0004950', deliveryItemId: '-', deliveryItemName: 'WPS Office 2023 Mac版', productId: 'AB0000310', productLine: 'Mac端', productType: 'Mac2023', productName: 'WPS Office 2023 for Mac软件V13', productSpec: '标准版', platform: 'Mac', os: 'MacOS', cpu: 'Mac', enabled: true, packageType: 'public' },
  { id: 'AZ0004951', deliveryItemId: '889200', deliveryItemName: 'WPS Office 2023 Mac专业版', productId: 'AB0000311', productLine: 'Mac端', productType: 'Mac2023专业版', productName: 'WPS Office 2023 for Mac专业版V13', productSpec: '专业版', platform: 'Mac', os: 'MacOS', cpu: 'Mac', enabled: true, packageType: 'public' },
  { id: 'AZ0003800', deliveryItemId: '-', deliveryItemName: 'WPS 365 移动端Android', productId: 'AB0000510', productLine: '移动端', productType: 'Android版', productName: 'WPS 365移动版V11.5', productSpec: '标准版', platform: 'Android', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0003801', deliveryItemId: '-', deliveryItemName: 'WPS 365 移动端iOS', productId: 'AB0000511', productLine: '移动端', productType: 'iOS版', productName: 'WPS 365移动版iOS V11.5', productSpec: '标准版', platform: 'iOS', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0003900', deliveryItemId: '801500', deliveryItemName: 'WPS PDF Win版专业套装', productId: 'AB0000620', productLine: 'Win端', productType: 'PDF工具', productName: 'WPS PDF专业版V5.0', productSpec: '专业版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0003901', deliveryItemId: '-', deliveryItemName: 'WPS PDF Mac版专业套装', productId: 'AB0000621', productLine: 'Mac端', productType: 'PDF工具', productName: 'WPS PDF for Mac专业版V4.0', productSpec: '专业版', platform: 'Mac', os: 'MacOS', cpu: 'Mac', enabled: true, packageType: 'public' },
  { id: 'AZ0002100', deliveryItemId: '-', deliveryItemName: 'WPS365 Win桌面端V13', productId: 'AB0000001', productLine: 'Win端', productType: 'WPS365专业版', productName: 'WPS 365企业版V13', productSpec: '企业版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0002101', deliveryItemId: '778800', deliveryItemName: 'WPS365 Win桌面端V13-信创麒麟', productId: 'AB0000001', productLine: '信创端', productType: 'WPS365信创企业版', productName: 'WPS 365企业版V13（信创）', productSpec: '企业版', platform: 'Linux', os: '麒麟', cpu: '麒麟', enabled: true, packageType: 'public' },
  { id: 'AZ0002102', deliveryItemId: '-', deliveryItemName: 'WPS365 Win桌面端V13-信创海光', productId: 'AB0000001', productLine: '信创端', productType: 'WPS365信创企业版', productName: 'WPS 365企业版V13（信创）', productSpec: '企业版', platform: 'Linux', os: '统信UOS', cpu: '海光', enabled: false, packageType: 'public' },
  { id: 'AZ0001500', deliveryItemId: '-', deliveryItemName: 'WPS轻文档Windows版', productId: 'AB0000720', productLine: 'Win端', productType: '轻文档', productName: 'WPS轻文档V3.0', productSpec: '标准版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0001501', deliveryItemId: '-', deliveryItemName: 'WPS轻文档Mac版', productId: 'AB0000721', productLine: 'Mac端', productType: '轻文档', productName: 'WPS轻文档V3.0 for Mac', productSpec: '标准版', platform: 'Mac', os: 'MacOS', cpu: 'Mac', enabled: true, packageType: 'public' },
  { id: 'AZ0000900', deliveryItemId: '745600', deliveryItemName: '数科OFD Linux专业版V4', productId: 'AB0001805', productLine: '信创端', productType: '数科OFD用户端', productName: '数科OFD办公套件软件V4.0', productSpec: '专业版', platform: 'Linux', os: '麒麟', cpu: '飞腾', enabled: true, packageType: 'public' },
  { id: 'AZ0000901', deliveryItemId: '-', deliveryItemName: '数科OFD Linux标准版V4', productId: 'AB0001805', productLine: '信创端', productType: '数科OFD用户端', productName: '数科OFD办公套件软件V4.0', productSpec: '标准版', platform: 'Linux', os: '深度', cpu: '龙芯mips', enabled: true, packageType: 'public' },
  { id: 'AZ0000902', deliveryItemId: '-', deliveryItemName: '数科OFD Linux通用版V4', productId: 'AB0001805', productLine: '信创端', productType: '数科OFD用户端', productName: '数科OFD办公套件软件V4.0', productSpec: '通用版', platform: 'Linux', os: '中科方德', cpu: 'intel/AMD', enabled: false, packageType: 'public' },
  { id: 'AZ0006100', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版海光', productId: 'AB0001900', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '统信UOS', cpu: '海光', enabled: true, packageType: 'public' },
  { id: 'AZ0006101', deliveryItemId: '920100', deliveryItemName: 'WPS Office 2025 信创版麒麟', productId: 'AB0001900', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '麒麟', cpu: '麒麟', enabled: true, packageType: 'public' },
  { id: 'AZ0006102', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版兆芯', productId: 'AB0001900', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '中科方德', cpu: '兆芯', enabled: true, packageType: 'public' },
  { id: 'AZ0006103', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版飞腾', productId: 'AB0001900', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '统信UOS', cpu: '飞腾', enabled: true, packageType: 'public' },
  { id: 'AZ0006104', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版龙芯', productId: 'AB0001900', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '统信UOS', cpu: '龙芯aarch', enabled: false, packageType: 'public' },
  { id: 'AZ0006200', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版鲲鹏', productId: 'AB0001900', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '麒麟', cpu: '鲲鹏', enabled: true, packageType: 'public' },
  { id: 'AZ0006201', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版腾锐', productId: 'AB0001901', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '统信UOS', cpu: '腾锐', enabled: true, packageType: 'public' },
  { id: 'AZ0006202', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版申威', productId: 'AB0001901', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '深度', cpu: '申威', enabled: true, packageType: 'public' },
  { id: 'AZ0006203', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版盘古', productId: 'AB0001901', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '中科方德', cpu: '盘古', enabled: false, packageType: 'public' },
];

const PRIVATE_ROWS: PkgRow[] = [
  { id: 'AZ0010001', deliveryItemId: '-', deliveryItemName: 'WPS 365私有云部署包-标准版', productId: 'AB0000005', productLine: 'WPS365私有云', productType: 'WPS365高级版（私有云）', productName: 'WPS 365私有云企业版V7', productSpec: '标准版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010002', deliveryItemId: '913000', deliveryItemName: 'WPS 365私有云部署包-高可用版', productId: 'AB0000005', productLine: 'WPS365私有云', productType: 'WPS365高级版（私有云）', productName: 'WPS 365私有云企业版V7', productSpec: '高可用版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010003', deliveryItemId: '-', deliveryItemName: 'WPS 365私有云部署包-ARM版', productId: 'AB0000005', productLine: 'WPS365私有云', productType: 'WPS365高级版（私有云）', productName: 'WPS 365私有云企业版V7', productSpec: 'ARM版', platform: 'Linux', os: '-', cpu: '鲲鹏', enabled: true, packageType: 'private' },
  { id: 'AZ0010004', deliveryItemId: '-', deliveryItemName: 'WPS 365私有云基础版部署包', productId: 'AB0000006', productLine: 'WPS365私有云', productType: 'WPS365高级版（私有云）', productName: 'WPS 365私有云基础版V7', productSpec: '基础版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010005', deliveryItemId: '913100', deliveryItemName: 'WPS 365私有云基础版-信创飞腾', productId: 'AB0000006', productLine: 'WPS365私有云', productType: 'WPS365高级版（私有云）', productName: 'WPS 365私有云基础版V7', productSpec: '信创版', platform: 'Linux', os: '麒麟', cpu: '飞腾', enabled: true, packageType: 'private' },
  { id: 'AZ0010006', deliveryItemId: '-', deliveryItemName: 'WPS 365私有云基础版-信创麒麟', productId: 'AB0000006', productLine: 'WPS365私有云', productType: 'WPS365高级版（私有云）', productName: 'WPS 365私有云基础版V7', productSpec: '信创版', platform: 'Linux', os: '麒麟', cpu: '麒麟', enabled: false, packageType: 'private' },
  { id: 'AZ0010100', deliveryItemId: '-', deliveryItemName: '私有云文档协作平台V3', productId: 'AB0000401', productLine: 'WPS365私有云', productType: '文档协作私有云', productName: '私有云文档协作平台软件V3.0', productSpec: '企业版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010101', deliveryItemId: '915500', deliveryItemName: '私有云文档协作平台V3-ARM', productId: 'AB0000401', productLine: 'WPS365私有云', productType: '文档协作私有云', productName: '私有云文档协作平台软件V3.0', productSpec: '企业版ARM', platform: 'Linux', os: '-', cpu: '鲲鹏', enabled: true, packageType: 'private' },
  { id: 'AZ0010200', deliveryItemId: '-', deliveryItemName: '私有云IM服务部署包V2', productId: 'AB0000420', productLine: 'WPS365私有云', productType: '私有云IM', productName: 'WPS私有IM服务V2', productSpec: '标准版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010201', deliveryItemId: '-', deliveryItemName: '私有云会议系统部署包', productId: 'AB0000430', productLine: 'WPS365私有云', productType: '私有云会议', productName: '私有云企业会议系统V2', productSpec: '标准版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010300', deliveryItemId: '918800', deliveryItemName: '混合云连接器-标准版', productId: 'AB0000501', productLine: '混合云方案', productType: '混合云连接器', productName: '混合云连接器软件V1.5', productSpec: '标准版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010301', deliveryItemId: '-', deliveryItemName: '混合云连接器-高可用版', productId: 'AB0000501', productLine: '混合云方案', productType: '混合云连接器', productName: '混合云连接器软件V1.5', productSpec: '高可用版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: false, packageType: 'private' },
  { id: 'AZ0010400', deliveryItemId: '-', deliveryItemName: 'WebOffice私有化SDK-x86', productId: 'AB0000007', productLine: '私有云单品', productType: 'Web Office', productName: 'WebOffice SDK私有版V3.5', productSpec: '标准版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010401', deliveryItemId: '922000', deliveryItemName: 'WebOffice私有化SDK-ARM', productId: 'AB0000007', productLine: '私有云单品', productType: 'Web Office', productName: 'WebOffice SDK私有版V3.5', productSpec: 'ARM版', platform: 'Linux', os: '-', cpu: '鲲鹏', enabled: true, packageType: 'private' },
  { id: 'AZ0010500', deliveryItemId: '-', deliveryItemName: 'WPS 365私有云V8-全功能包', productId: 'AB0001200', productLine: 'WPS365私有云', productType: 'WPS365私有云V8', productName: 'WPS 365私有云企业版V8', productSpec: '全功能版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010501', deliveryItemId: '-', deliveryItemName: 'WPS 365私有云V8-基础包', productId: 'AB0001200', productLine: 'WPS365私有云', productType: 'WPS365私有云V8', productName: 'WPS 365私有云企业版V8', productSpec: '基础版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010502', deliveryItemId: '925600', deliveryItemName: 'WPS 365私有云V8-信创兆芯', productId: 'AB0001200', productLine: 'WPS365私有云', productType: 'WPS365私有云V8', productName: 'WPS 365私有云企业版V8', productSpec: '信创版', platform: 'Linux', os: '统信UOS', cpu: '兆芯', enabled: true, packageType: 'private' },
  { id: 'AZ0010600', deliveryItemId: '-', deliveryItemName: '文档中台私有化部署包', productId: 'AB0000600', productLine: '私有云单品', productType: '文档中台', productName: '文档中台私有化软件V2.0', productSpec: '标准版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010601', deliveryItemId: '-', deliveryItemName: '文档中台私有化部署包-ARM', productId: 'AB0000600', productLine: '私有云单品', productType: '文档中台', productName: '文档中台私有化软件V2.0', productSpec: 'ARM版', platform: 'Linux', os: '-', cpu: '鲲鹏', enabled: false, packageType: 'private' },
];

const ALL_ROWS = [...PUBLIC_ROWS, ...PRIVATE_ROWS];
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const EMPTY_FORM: Omit<PkgRow, 'packageType'> = {
  id: '', deliveryItemId: '', deliveryItemName: '', productId: '', productLine: '',
  productType: '', productName: '', productSpec: '', platform: '', os: '', cpu: '', enabled: true,
};

const PRODUCT_LINE_OPTIONS = ['信创端', 'Win端', 'Mac端', '移动端', 'WPS365私有云', '混合云方案', '私有云单品'];

/* ── Modal Portal ── */
const ModalPortal: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-3xl max-h-[85vh] mx-4 overflow-y-auto custom-scrollbar unified-card dark:bg-[#1C1C1E] shadow-2xl border-white/10 animate-modal-enter">
      {children}
    </div>
  </div>
);

/* ── Form Field ── */
const FormField: React.FC<{
  label: string; required?: boolean; children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)] transition placeholder:text-gray-400";
const selectCls = "w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)] transition appearance-none cursor-pointer";

/* ── Main Component ── */
const InstallPackageManager: React.FC = () => {
  const [tab, setTab] = useState<'public' | 'private'>('public');
  const [searchName, setSearchName] = useState('');
  const [filterCpu, setFilterCpu] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterOs, setFilterOs] = useState('');
  const [cpuDropOpen, setCpuDropOpen] = useState(false);
  const [platformDropOpen, setPlatformDropOpen] = useState(false);
  const [osDropOpen, setOsDropOpen] = useState(false);
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedCpu, setAppliedCpu] = useState('');
  const [appliedPlatform, setAppliedPlatform] = useState('');
  const [appliedOs, setAppliedOs] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [rows, setRows] = useState<PkgRow[]>(ALL_ROWS);

  const [editRow, setEditRow] = useState<PkgRow | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [formData, setFormData] = useState<Omit<PkgRow, 'packageType'>>(EMPTY_FORM);
  const [toast, setToast] = useState('');

  const closeAllDropdowns = () => { setCpuDropOpen(false); setPlatformDropOpen(false); setOsDropOpen(false); setPageSizeOpen(false); };

  const handleQuery = () => {
    setAppliedSearch(searchName);
    setAppliedCpu(filterCpu);
    setAppliedPlatform(filterPlatform);
    setAppliedOs(filterOs);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSearchName(''); setFilterCpu(''); setFilterPlatform(''); setFilterOs('');
    setAppliedSearch(''); setAppliedCpu(''); setAppliedPlatform(''); setAppliedOs('');
    setCurrentPage(1);
  };

  const baseRows = rows.filter(r => r.packageType === tab);
  const q = appliedSearch.toLowerCase();
  const filtered = useMemo(() => baseRows.filter(r => {
    const matchSearch = !q || r.deliveryItemName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.productName.toLowerCase().includes(q);
    const matchCpu = !appliedCpu || r.cpu === appliedCpu;
    const matchPlatform = !appliedPlatform || r.platform === appliedPlatform;
    const matchOs = !appliedOs || r.os === appliedOs;
    return matchSearch && matchCpu && matchPlatform && matchOs;
  }), [baseRows, q, appliedCpu, appliedPlatform, appliedOs]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRows = filtered.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const toggleEnabled = (id: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM });
    setAddMode(true);
    setEditRow(null);
  };

  const openEdit = (row: PkgRow) => {
    const { packageType: _, ...rest } = row;
    setFormData(rest);
    setEditRow(row);
    setAddMode(false);
  };

  const handleSave = () => {
    if (!formData.id || !formData.deliveryItemName || !formData.productName) {
      showToast('请填写必填字段');
      return;
    }
    if (addMode) {
      const existing = rows.find(r => r.id === formData.id);
      if (existing) { showToast('安装包编号已存在'); return; }
      const newRow: PkgRow = { ...formData, packageType: tab };
      setRows(prev => [newRow, ...prev]);
      showToast('安装包已新增');
    } else if (editRow) {
      setRows(prev => prev.map(r => r.id === editRow.id ? { ...r, ...formData } : r));
      showToast('安装包已更新');
    }
    setEditRow(null);
    setAddMode(false);
  };

  const closeModal = () => { setEditRow(null); setAddMode(false); };

  const updateField = (field: keyof Omit<PkgRow, 'packageType'>, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const visiblePages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('...');
      for (let i = Math.max(2, safeCurrentPage - 1); i <= Math.min(totalPages - 1, safeCurrentPage + 1); i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const TABLE_COLS = ['安装包编号', '交付物编号', '交付物名称', '产品编号', '产品条线', '产品类型', '产品名称', '产品规格', '发布平台', '操作系统', 'CPU', '操作'];
  const COL_COUNT = TABLE_COLS.length;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black/20 overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-5 py-2.5 rounded-xl bg-[#1C1C1E] dark:bg-white text-white dark:text-gray-900 text-sm font-medium shadow-xl animate-modal-enter">
          {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 pt-4 shrink-0 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] flex items-end gap-6">
        {([{ id: 'public', label: '响应安装包' }, { id: 'private', label: '私有云安装包' }] as const).map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setCurrentPage(1); }}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'border-[#0071E3] text-[#0071E3] dark:border-[#0A84FF] dark:text-[#0A84FF]'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 shrink-0 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/10 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex items-stretch h-8 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] w-[240px] focus-within:border-blue-400 focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.1)] transition">
          <div className="relative flex-1 flex items-center min-w-0">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text" value={searchName}
              onChange={e => setSearchName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleQuery()}
              placeholder="交付物名称 / 安装包编号"
              className="w-full h-full pl-8 pr-7 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
            />
            {searchName && (
              <button onClick={() => setSearchName('')} className="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* CPU filter */}
        <div className="relative">
          <button
            onClick={() => { setCpuDropOpen(v => !v); setPlatformDropOpen(false); setOsDropOpen(false); setPageSizeOpen(false); }}
            className="h-8 flex items-center gap-1.5 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition whitespace-nowrap"
          >
            <span className="text-gray-400 text-xs">CPU：</span>
            <span className={filterCpu ? 'text-[#0071E3] dark:text-[#0A84FF] font-medium' : ''}>{filterCpu || '全部'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {cpuDropOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 unified-card dark:bg-[#1C1C1E] shadow-xl min-w-[140px] py-1 max-h-[280px] overflow-y-auto custom-scrollbar">
              {['', ...CPU_LIST].map(c => (
                <button key={c} onClick={() => { setFilterCpu(c); setCpuDropOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition ${filterCpu === c ? 'text-[#0071E3] dark:text-[#0A84FF] font-medium' : 'text-gray-700 dark:text-gray-200'}`}>
                  {c || '全部'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* OS filter */}
        <div className="relative">
          <button
            onClick={() => { setOsDropOpen(v => !v); setCpuDropOpen(false); setPlatformDropOpen(false); setPageSizeOpen(false); }}
            className="h-8 flex items-center gap-1.5 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition whitespace-nowrap"
          >
            <span className="text-gray-400 text-xs">操作系统：</span>
            <span className={filterOs ? 'text-[#0071E3] dark:text-[#0A84FF] font-medium' : ''}>{filterOs || '全部'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {osDropOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 unified-card dark:bg-[#1C1C1E] shadow-xl min-w-[130px] py-1">
              {['', ...OS_LIST].map(o => (
                <button key={o} onClick={() => { setFilterOs(o); setOsDropOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition ${filterOs === o ? 'text-[#0071E3] dark:text-[#0A84FF] font-medium' : 'text-gray-700 dark:text-gray-200'}`}>
                  {o || '全部'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Platform filter */}
        <div className="relative">
          <button
            onClick={() => { setPlatformDropOpen(v => !v); setCpuDropOpen(false); setOsDropOpen(false); setPageSizeOpen(false); }}
            className="h-8 flex items-center gap-1.5 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition whitespace-nowrap"
          >
            <span className="text-gray-400 text-xs">平台：</span>
            <span className={filterPlatform ? 'text-[#0071E3] dark:text-[#0A84FF] font-medium' : ''}>{filterPlatform || '全部'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {platformDropOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 unified-card dark:bg-[#1C1C1E] shadow-xl min-w-[130px] py-1">
              {['', ...PLATFORM_LIST].map(p => (
                <button key={p} onClick={() => { setFilterPlatform(p); setPlatformDropOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition ${filterPlatform === p ? 'text-[#0071E3] dark:text-[#0A84FF] font-medium' : 'text-gray-700 dark:text-gray-200'}`}>
                  {p || '全部'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={openAdd} className="h-8 flex items-center gap-1.5 px-3.5 rounded-lg bg-green-600 dark:bg-green-500 text-white text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 transition">
            <Plus className="w-3.5 h-3.5" /> 新增
          </button>
          <button
            onClick={closeAllDropdowns}
            className="h-8 flex items-center gap-1.5 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition"
          >
            <Filter className="w-3.5 h-3.5" /> 筛选
          </button>
          <button onClick={handleQuery} className="h-8 px-4 rounded-lg bg-[#0071E3] dark:bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#0071E3]/90 transition">
            查询
          </button>
          <button onClick={handleClear} className="h-8 px-4 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition">
            清空
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col min-h-0 mx-4 my-3">
        <div className="unified-card flex-1 flex flex-col overflow-hidden dark:bg-[#1C1C1E]">
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-0 min-w-[1300px]">
              <thead className="sticky top-0 z-10">
                <tr className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {TABLE_COLS.map((col, i) => (
                    <th key={col} className={`py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E] ${i === 0 ? 'pl-5 pr-4' : i === COL_COUNT - 1 ? 'px-4 text-center' : 'px-4'}`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                {paginatedRows.length > 0 ? paginatedRows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="pl-5 pr-4 py-3 font-mono text-sm font-semibold text-[#0071E3] dark:text-[#0A84FF] whitespace-nowrap cursor-pointer hover:underline" onClick={() => openEdit(row)}>
                      {row.id}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap text-sm">
                      {row.deliveryItemId}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[200px]">
                      <div className="line-clamp-2 text-sm leading-snug">{row.deliveryItemName}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-300 whitespace-nowrap text-sm">
                      {row.productId}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-[#0A84FF] border border-blue-100 dark:border-blue-800/50">
                        {row.productLine}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[160px]">
                      <div className="line-clamp-2 text-sm">{row.productType}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[200px]">
                      <div className="line-clamp-2 text-sm">{row.productName}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap text-sm">
                      {row.productSpec}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap text-sm">
                      {row.platform}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap text-sm">
                      {row.os}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap text-sm">
                      {row.cpu}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(row)} className="text-sm text-[#0071E3] dark:text-[#0A84FF] cursor-pointer hover:underline flex items-center gap-1">
                          <Pencil className="w-3 h-3" /> 编辑
                        </button>
                        <button
                          onClick={() => toggleEnabled(row.id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${row.enabled ? 'bg-[#0071E3] dark:bg-[#0A84FF]' : 'bg-gray-200 dark:bg-white/20'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${row.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={COL_COUNT} className="py-16 text-center text-gray-400 dark:text-gray-500 text-sm">
                      暂无安装包数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/5 shrink-0">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              共 <span className="font-semibold text-[#0071E3] dark:text-[#0A84FF] font-mono">{filtered.length}</span> 条
            </span>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => { setPageSizeOpen(v => !v); setCpuDropOpen(false); setPlatformDropOpen(false); setOsDropOpen(false); }}
                  className="h-7 flex items-center gap-1 px-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                >
                  {pageSize}条/页 <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {pageSizeOpen && (
                  <div className="absolute bottom-full mb-1 left-0 z-50 unified-card dark:bg-[#1C1C1E] shadow-xl min-w-[100px] py-1">
                    {PAGE_SIZE_OPTIONS.map(s => (
                      <button key={s} onClick={() => { setPageSize(s); setPageSizeOpen(false); setCurrentPage(1); }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition ${pageSize === s ? 'text-[#0071E3] dark:text-[#0A84FF] font-semibold' : 'text-gray-700 dark:text-gray-200'}`}>
                        {s}条/页
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {visiblePages().map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="w-7 text-center text-xs text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={`h-7 min-w-[28px] px-1.5 rounded-lg text-xs font-medium transition border ${
                        safeCurrentPage === p
                          ? 'bg-[#0071E3] dark:bg-[#0A84FF] text-white border-[#0071E3] dark:border-[#0A84FF]'
                          : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-xs text-gray-400 dark:text-gray-500">第 {safeCurrentPage} / {totalPages} 页</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(addMode || editRow) && (
        <ModalPortal onClose={closeModal}>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {addMode ? '新增安装包' : '编辑安装包'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="安装包编号" required>
                <input className={inputCls} value={formData.id} onChange={e => updateField('id', e.target.value)} disabled={!!editRow} placeholder="如 AZ0006288" />
              </FormField>
              <FormField label="交付物编号">
                <input className={inputCls} value={formData.deliveryItemId} onChange={e => updateField('deliveryItemId', e.target.value)} placeholder="-" />
              </FormField>
              <div className="col-span-2">
                <FormField label="交付物名称" required>
                  <input className={inputCls} value={formData.deliveryItemName} onChange={e => updateField('deliveryItemName', e.target.value)} />
                </FormField>
              </div>
              <FormField label="产品编号">
                <input className={inputCls} value={formData.productId} onChange={e => updateField('productId', e.target.value)} placeholder="如 AB0001878" />
              </FormField>
              <FormField label="产品条线">
                <select className={selectCls} value={formData.productLine} onChange={e => updateField('productLine', e.target.value)}>
                  <option value="">请选择</option>
                  {PRODUCT_LINE_OPTIONS.map(pl => <option key={pl} value={pl}>{pl}</option>)}
                </select>
              </FormField>
              <FormField label="产品类型">
                <input className={inputCls} value={formData.productType} onChange={e => updateField('productType', e.target.value)} />
              </FormField>
              <FormField label="产品规格">
                <input className={inputCls} value={formData.productSpec} onChange={e => updateField('productSpec', e.target.value)} />
              </FormField>
              <div className="col-span-2">
                <FormField label="产品名称" required>
                  <input className={inputCls} value={formData.productName} onChange={e => updateField('productName', e.target.value)} />
                </FormField>
              </div>
              <FormField label="发布平台">
                <select className={selectCls} value={formData.platform} onChange={e => updateField('platform', e.target.value)}>
                  <option value="">请选择</option>
                  {PLATFORM_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </FormField>
              <FormField label="操作系统">
                <select className={selectCls} value={formData.os} onChange={e => updateField('os', e.target.value)}>
                  <option value="">请选择</option>
                  <option value="-">-（不适用）</option>
                  {OS_LIST.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </FormField>
              <FormField label="CPU">
                <select className={selectCls} value={formData.cpu} onChange={e => updateField('cpu', e.target.value)}>
                  <option value="">请选择</option>
                  {CPU_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="启用状态">
                <div className="flex items-center h-9 gap-2">
                  <button
                    onClick={() => updateField('enabled', !formData.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.enabled ? 'bg-[#0071E3] dark:bg-[#0A84FF]' : 'bg-gray-200 dark:bg-white/20'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${formData.enabled ? 'translate-x-5.5' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{formData.enabled ? '已启用' : '已禁用'}</span>
                </div>
              </FormField>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-white/10">
              <button onClick={closeModal} className="h-9 px-5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                取消
              </button>
              <button onClick={handleSave} className="h-9 px-5 rounded-lg bg-[#0071E3] dark:bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#0071E3]/90 transition flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" /> 保存
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default InstallPackageManager;
