import {
    SalesMerchandise, Product, User, Channel, Department, AtomicCapability,
    AuthTypeData, RoleDefinition, Enterprise, ConversionOrder
} from '../types';

export interface InstallPackageRow {
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

// --- Atomic Capabilities ---
export const initialAtomicCapabilities: AtomicCapability[] = [
    { id: 'AC001', name: 'WPS Office 基础编辑', type: 'Component', description: '包含文字、表格、演示核心组件', componentNo: 901, version: 'V12', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC002', name: 'PDF 组件', type: 'Component', description: 'PDF 查看与编辑能力', componentNo: 902, version: 'V12', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC003', name: 'OFD 组件', type: 'Component', description: '版式文件处理能力', componentNo: 903, version: 'V5.0', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC004', name: 'WPS 会议权益包', type: 'Feature', description: '云会议并发权益', componentNo: 904, version: 'V7', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC005', name: '私有云文档中心', type: 'Feature', description: '企业级云存储与协作服务', componentNo: 905, version: 'V7', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC006', name: 'WPS AI 写作', type: 'Feature', description: '大模型辅助创作', componentNo: 906, version: 'V3.0', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC007', name: '实施部署服务', type: 'Service', description: '私有化环境部署与调试', componentNo: 907, version: 'SA', nature: '第三方采购', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC008', name: '企业通讯录同步', type: 'Feature', description: 'LDAP/AD 域集成', componentNo: 908, version: 'V7', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC009', name: '数字水印', type: 'Feature', description: '防泄密溯源水印', componentNo: 909, version: 'V2.0', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC010', name: '内容合规审查', type: 'Service', description: 'AI驱动的敏感词检测', componentNo: 910, version: 'V1.0', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC011', name: 'WPS 365数字政务高级版（Win版）', type: 'Component', description: 'WPS 365数字政务高级版Windows端', componentNo: 973, version: 'SA', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC012', name: 'WPS 365数字政务旗舰版', type: 'Component', description: 'WPS 365数字政务旗舰版', componentNo: 974, version: 'SA', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC013', name: 'WPS OFD', type: 'Component', description: 'OFD版式文档处理组件', componentNo: 975, version: '-', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC014', name: '黑马校对私有化服务器版级10亿字', type: 'Component', description: '黑马校对私有化部署服务器版', componentNo: 976, version: '-', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC015', name: '金山麒麟WPS办公软件', type: 'Component', description: '麒麟平台WPS办公软件', componentNo: 977, version: 'V11', nature: '第三方授权', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC016', name: '统一身份集成服务', type: 'Service', description: '统一身份认证集成', componentNo: 978, version: 'SA', nature: '第三方采购', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC017', name: '零信任集成服务', type: 'Service', description: '零信任安全架构集成', componentNo: 979, version: '-', nature: '第三方采购', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC018', name: '智能表格', type: 'Component', description: '多维数据智能表格', componentNo: 980, version: '标准版', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC019', name: '存量应用系统迁移开发服务', type: 'Service', description: '存量系统迁移至新平台', componentNo: 981, version: 'SA', nature: '第三方采购', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC020', name: 'WPS Office for 鸿蒙移动专业版', type: 'Component', description: 'WPS鸿蒙移动端专业版', componentNo: 982, version: 'V1', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC021', name: 'WPS会议私有化音视频60并发', type: 'Component', description: '私有化音视频会议60方并发', componentNo: 983, version: 'V7', nature: '第三方采购', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC022', name: 'WPS会议私有化音视频200并发', type: 'Component', description: '私有化音视频会议200方并发', componentNo: 984, version: 'V7', nature: '第三方采购', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC023', name: 'WPS协作办公系统', type: 'Component', description: '协作办公核心组件', componentNo: 950, version: 'V7.1', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC024', name: 'Web Office在线编辑', type: 'Component', description: '浏览器端在线文档编辑', componentNo: 951, version: 'V3.5', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC025', name: 'Web Office在线预览', type: 'Component', description: '浏览器端在线文档预览', componentNo: 952, version: 'V3.5', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC026', name: '文档中台系统', type: 'Component', description: '企业文档中台核心引擎', componentNo: 953, version: 'V7', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC027', name: '文档中心系统', type: 'Component', description: '企业文档中心管理系统', componentNo: 954, version: 'V7', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC028', name: '电子公文资源库系统', type: 'Component', description: 'OFD电子公文管理', componentNo: 955, version: 'V1.0', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC029', name: '数科电子签章系统', type: 'Component', description: '电子签章与验章', componentNo: 956, version: 'V1.0', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC030', name: 'WPS政务AI平台', type: 'Component', description: '政务AI平台核心引擎', componentNo: 957, version: 'V3.0', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC031', name: 'WPS AI', type: 'Feature', description: 'WPS AI智能助手', componentNo: 958, version: 'V1.0', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC032', name: '多维表格', type: 'Component', description: '多维数据分析表格', componentNo: 959, version: 'V1.0', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC033', name: 'WPS黑马云校对服务', type: 'Service', description: '公有云校对服务API', componentNo: 960, version: 'V31', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC034', name: '金山文件格式转换迁移系统', type: 'Component', description: '文件格式批量转换', componentNo: 961, version: 'V1.0', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC035', name: '数科在线预览软件（极速版）', type: 'Component', description: '轻量极速文档预览', componentNo: 962, version: 'V1.0', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC036', name: 'WPS统一平台管理系统', type: 'Component', description: '统一平台管理控制台', componentNo: 963, version: 'V6.0', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC037', name: 'WPS黑马校对软件（客户端）', type: 'Component', description: '客户端黑马校对', componentNo: 964, version: 'V31', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC038', name: 'WPS PDF专业版', type: 'Component', description: 'PDF专业版编辑器', componentNo: 965, version: 'V12', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC039', name: '数科OFD版式软件', type: 'Component', description: 'OFD版式软件客户端', componentNo: 966, version: 'V3.0', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC040', name: 'WPS Office 2023 for Linux专业版', type: 'Component', description: 'Linux信创版办公软件', componentNo: 967, version: 'V12.8', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC041', name: 'WPS Office 2023专业版（Win）', type: 'Component', description: 'Windows端办公软件2023版', componentNo: 968, version: 'V12.8', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC042', name: 'WPS 365私有云部署包', type: 'Component', description: 'WPS 365私有云核心部署', componentNo: 969, version: 'V7', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC043', name: 'WPS 365旗舰版（私有云）', type: 'Component', description: '私有云旗舰版组件', componentNo: 970, version: 'V7', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC044', name: 'WPS 365高级版（私有云）', type: 'Component', description: '私有云高级版组件', componentNo: 971, version: 'V7', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC045', name: '金山云分布式对象存储软件', type: 'Component', description: '分布式存储', componentNo: 972, version: 'V6.0', nature: '第三方采购', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC046', name: '数科OFD移动端阅读器', type: 'Component', description: 'OFD移动端阅读', componentNo: 985, version: 'V3.0', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC047', name: 'PDF文档转换服务', type: 'Service', description: '云端PDF格式转换', componentNo: 986, version: 'V1.0', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC048', name: 'WPS智慧教育平台', type: 'Feature', description: '教育行业专属平台', componentNo: 987, version: 'V1.0', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC049', name: 'WPS 365协作办公旗舰平台', type: 'Component', description: '公有云旗舰版核心平台', componentNo: 988, version: 'V12', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC050', name: 'WPS 365协作办公高级平台', type: 'Component', description: '公有云高级版核心平台', componentNo: 989, version: 'V12', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC051', name: 'WPS软件原厂维保服务', type: 'Service', description: '原厂技术支持维保', componentNo: 990, version: 'SA', nature: '自有', generateSerial: false, referencedByProduct: false, enabled: true },
    { id: 'AC052', name: '委托技术开发服务', type: 'Service', description: '定制化开发服务', componentNo: 991, version: '-', nature: '第三方采购', generateSerial: false, referencedByProduct: false, enabled: true },
    { id: 'AC053', name: 'WPS Office2019 教育版', type: 'Component', description: 'Win端教育版2019', componentNo: 920, version: 'V11.8', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC054', name: 'WPS+办公云平台', type: 'Component', description: '办公云平台', componentNo: 921, version: 'V11.8', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC055', name: 'WPS Office2019 for linux专业版', type: 'Component', description: '信创2019版Linux办公', componentNo: 922, version: 'V11', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC056', name: '金山志远WPS办公软件', type: 'Component', description: '金山志远品牌信创办公', componentNo: 923, version: 'V11', nature: '第三方授权', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC057', name: '金山麒麟WPS办公软件', type: 'Component', description: '麒麟平台WPS办公', componentNo: 924, version: 'V11', nature: '第三方授权', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC058', name: 'WPS PDF for Linux专业版', type: 'Component', description: 'Linux端PDF专业版', componentNo: 925, version: 'V12', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
    { id: 'AC059', name: 'WPS 会议一线版', type: 'Component', description: '轻量级会议组件', componentNo: 926, version: 'V1.0', nature: '自有', generateSerial: false, referencedByProduct: true, enabled: true },
    { id: 'AC060', name: '数科扫描识别软件', type: 'Component', description: 'OCR扫描识别', componentNo: 927, version: 'V3.0', nature: '自有', generateSerial: true, referencedByProduct: true, enabled: true },
];

// --- Auth Type Data (from system config 授权类型管理) ---
export const initialAuthTypes: AuthTypeData[] = [
  {id:"user_sub",name:"用户订阅许可",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"3pl",name:"3+L授权",period:"周期性",nccBiz:"永久性授权",nccIncome:"授权-数量授权"},
  {id:"concurrent_year",name:"并发年授权",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"server_year",name:"服务器年授权",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"app_year_ext",name:"附加应用年授权",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"customer_sub",name:"客户订阅许可",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"site_year",name:"年场地授权",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-场地授权"},
  {id:"freq_year",name:"年次数授权",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"year",name:"年授权",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"year_1p2",name:"年授权（1+2）",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"year_1pl",name:"年授权（1+L）",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"char_year",name:"年字数授权",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"sw_support",name:"软件保障",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"app_year",name:"应用年授权",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"user_sub_site",name:"用户订阅许可（含端年场地）",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"user_year",name:"用户年授权",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"ops_support",name:"运维保障",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-数量授权"},
  {id:"operator",name:"运营商授权",period:"周期性",nccBiz:"可持续授权",nccIncome:"授权-场地授权"},
  {id:"traffic_year",name:"流量年授权",period:"周期性",nccBiz:"",nccIncome:""},
  {id:"quota_year",name:"额度年授权",period:"周期性",nccBiz:"",nccIncome:""},
  {id:"qty",name:"数量授权",period:"非周期性",nccBiz:"永久性授权",nccIncome:"授权-数量授权"},
  {id:"concurrent",name:"并发授权",period:"非周期性",nccBiz:"永久性授权",nccIncome:"授权-数量授权"},
  {id:"site",name:"场地授权",period:"非周期性",nccBiz:"永久性授权",nccIncome:"授权-场地授权"},
  {id:"server",name:"服务器授权",period:"非周期性",nccBiz:"永久性授权",nccIncome:"授权-数量授权"},
  {id:"app_ext",name:"附加应用授权",period:"非周期性",nccBiz:"永久性授权",nccIncome:"授权-数量授权"},
  {id:"count_svc",name:"计次服务",period:"非周期性",nccBiz:"",nccIncome:""},
  {id:"piece_svc",name:"计件服务",period:"非周期性",nccBiz:"",nccIncome:""},
  {id:"manday_svc",name:"计人天服务",period:"非周期性",nccBiz:"",nccIncome:""},
  {id:"manmonth_svc",name:"计人月服务",period:"非周期性",nccBiz:"",nccIncome:""},
  {id:"retail",name:"零售包",period:"非周期性",nccBiz:"",nccIncome:""},
  {id:"key_media",name:"密钥介质",period:"非周期性",nccBiz:"",nccIncome:""},
  {id:"upgrade",name:"升级授权",period:"非周期性",nccBiz:"永久性授权",nccIncome:"授权-数量授权"},
  {id:"random_qty",name:"随机数量授权",period:"非周期性",nccBiz:"永久性授权",nccIncome:"授权-数量授权"},
  {id:"user",name:"用户授权",period:"非周期性",nccBiz:"永久性授权",nccIncome:"授权-数量授权"},
  {id:"char",name:"字数授权",period:"非周期性",nccBiz:"永久性授权",nccIncome:"授权-数量授权"},
];

// --- Products ---
export const initialProducts: Product[] = [
  {
    id: 'AB0002807', name: 'WPS协作办公系统V7.1', category: '私有云单品', subCategory: 'WPS协作', status: 'OnShelf', tags: ['生态'], productType: 'WPS协作', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'WPS协作/协作中台', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS协作', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false, salesOrgName: '珠海金山办公有限公司', businessDeliveryName: '协作办公助手软件', taxRefundType: '非退税',
    linkedServices: [
      { productId: 'AB0002635', productName: 'WPS文档中心系统技术服务', skuId: 'SKU0018029', skuName: '文档中心系统A包', required: false, remark: '推荐配套技术服务' },
    ],
    skus: [
      { id: 'SKU0018306', code: 'SKU0018306', name: '定制版（寒武纪）', price: 100000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018306', title:'用户年授权', price:100000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}]
  },
  {
    id: 'AB0002800', name: '电子公文资源库系统运维保障服务', category: '私有云单品', subCategory: '数科OFD服务端（运维保障）', status: 'OnShelf', tags: ['生态'], productType: '数科OFD服务端（运维保障）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'WPS 政务AI平台', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: '实施服务及其他', productSeriesFinance: '政务AI平台', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: true, salesOrgName: '北京金山办公有限公司', businessDeliveryName: '电子公文资源库系统运维服务', taxRefundType: '非退税',
    skus: [
      { id: 'SKU0018298', code: 'SKU0018298', name: 'A包', price: 5000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018298', title:'运维保障', price:5000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC007',name:'实施部署服务',type:'Service'}, {id:'AC028',name:'电子公文资源库系统',type:'Component'}]
  },
  {
    id: 'AB0002790', name: 'WPS政务AI平台V3.0', category: 'WPS365私有云', subCategory: '电子公文库系统', status: 'OnShelf', tags: ['AI'], productType: '电子公文库系统', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'WPS 政务AI平台', productCategory: '云服务产品', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: '政务AI平台', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false, salesOrgName: '珠海金山办公有限公司', businessDeliveryName: '政务AI平台软件', taxRefundType: '即征即退',
    linkedServices: [
      { productId: 'AB0002800', productName: '电子公文资源库系统运维保障服务', skuId: 'SKU0018298', skuName: 'A包', required: true, remark: '必选运维保障服务' },
    ],
    skus: [
      { id: 'SKU0018284', code: 'SKU0018284', name: '标准版', price: 15000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018284', title:'用户授权', price:15000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC030',name:'WPS政务AI平台',type:'Component'}, {id:'AC031',name:'WPS AI',type:'Feature'}]
  },
  {
    id: 'AB0002762', name: '智能表格', category: 'WPS365公有云', subCategory: 'WPS365-增值权益包（私有云）', status: 'OnShelf', tags: ['AI'], productType: 'WPS365-增值权益包（私有云）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '黑马（私有云）及其他', productCategory: '云服务产品', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018250', code: 'SKU0018250', name: '标准版', price: 100000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018250', title:'用户年授权', price:100000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC018',name:'智能表格',type:'Component'}]
  },
  {
    id: 'AB0002746', name: 'WPS 365政务版办公平台V7', category: 'WPS365公有云', subCategory: 'WPS365协作版（私有云）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365协作版（私有云）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '黑马（私有云）及其他', productCategory: '云服务产品', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018231', code: 'SKU0018231', name: '标准版', price: 30000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018231', title:'用户年授权', price:30000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}]
  },
  {
    id: 'AB0001832', name: '电子公文资源库系统V1.0', category: '私有云单品', subCategory: '数科OFD服务端', status: 'OnShelf', tags: ['生态'], productType: '数科OFD服务端', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'OFD服务端产品', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018109', code: 'SKU0018109', name: '电子公文资源库', price: 8000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018109', title:'用户授权', price:8000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC028',name:'电子公文资源库系统',type:'Component'}]
  },
  {
    id: 'AB0002659', name: '金山OFD服务端运维保障服务', category: '私有云单品', subCategory: '金山OFD服务端（运维保障）', status: 'OnShelf', tags: ['生态'], productType: '金山OFD服务端（运维保障）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'OFD服务端产品', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: '实施服务及其他', productSeriesFinance: '实施服务及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: true,
    skus: [
      { id: 'SKU0018093', code: 'SKU0018093', name: '金山OFD私有云A包', price: 8000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018093', title:'运维保障', price:8000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC007',name:'实施部署服务',type:'Service'}]
  },
  {
    id: 'AB0001880', name: 'WPS文档中台系统V7', category: '私有云单品', subCategory: '文档中台V7', status: 'OnShelf', tags: ['生态'], productType: '文档中台V7', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '文档中台', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false, salesOrgName: '武汉金山办公有限公司', businessDeliveryName: '文档中台系统软件', taxRefundType: '即征即退',
    linkedServices: [
      { productId: 'AB0002635', productName: 'WPS文档中心系统技术服务', skuId: 'SKU0018029', skuName: '文档中心系统A包', required: true, remark: '必选技术服务包' },
    ],
    skus: [
      { id: 'SKU0018038', code: 'SKU0018038', name: '协作版（附加应用）', price: 20000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018038', title:'附加应用授权', price:20000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 User'}}] },
      { id: 'SKU0017613', code: 'SKU0017613', name: '协作版（附加应用）', price: 100000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017613', title:'附加应用年授权', price:100000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC026',name:'文档中台系统',type:'Component'}]
  },
  {
    id: 'AB0002635', name: 'WPS文档中心系统技术服务', category: '私有云单品', subCategory: '私有云单品必选服务包', status: 'OnShelf', tags: ['生态'], productType: '私有云单品必选服务包', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '文档中心', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018029', code: 'SKU0018029', name: '文档中心系统A包', price: 5000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018029', title:'运维保障', price:5000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC027',name:'文档中心系统',type:'Component'}, {id:'AC007',name:'实施部署服务',type:'Service'}]
  },
  {
    id: 'AB0000655', name: 'WPS统一平台管理系统V6.0', category: '组件示例', subCategory: 'WPS统一平台', status: 'OnShelf', tags: ['生态'], productType: 'WPS统一平台', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '黑马（私有云）及其他', productCategory: '组件示例', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018023', code: 'SKU0018023', name: '软件管理系统', price: 100000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018023', title:'数量授权', price:100000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] },
      { id: 'SKU0012395', code: 'SKU0012395', name: '软件管理系统', price: 100000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0012395', title:'年授权', price:100000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC036',name:'WPS统一平台管理系统',type:'Component'}]
  },
  {
    id: 'AB0002630', name: 'WPS智能文档库', category: '私有云单品', subCategory: '文档中心V7', status: 'OnShelf', tags: ['AI'], productType: '文档中心V7', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '文档中心', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018021', code: 'SKU0018021', name: '标准版', price: 80000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018021', title:'用户年授权', price:80000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC027',name:'文档中心系统',type:'Component'}]
  },
  {
    id: 'AB0001675', name: 'WPS黑马校对软件V31', category: 'Win端', subCategory: '黑马校对（私有云）', status: 'OnShelf', tags: ['生态'], productType: '黑马校对（私有云）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '黑马（私有云）及其他', productCategory: '编辑软件', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017058', code: 'SKU0017058', name: '私有化服务器版1亿字字数包', price: 15000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017058', title:'字数授权', price:15000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC014',name:'黑马校对私有化服务器版级10亿字',type:'Component'}]
  },
  {
    id: 'AB0000709', name: '金山文件格式转换迁移系统V1.0', category: '私有云单品', subCategory: '金山OFD服务端', status: 'OnShelf', tags: ['生态'], productType: '金山OFD服务端', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'OFD服务端产品', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017725', code: 'SKU0017725', name: '标准版', price: 20000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017725', title:'年场地授权', price:20000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] },
      { id: 'SKU0013263', code: 'SKU0013263', name: '标准版', price: 15000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013263', title:'年授权', price:15000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC034',name:'金山文件格式转换迁移系统',type:'Component'}, {id:'AC019',name:'存量应用系统迁移开发服务',type:'Service'}]
  },
  {
    id: 'AB0001887', name: 'WPS协作办公系统二次开发服务', category: '私有云单品', subCategory: '私有云单品增值服务包', status: 'OnShelf', tags: ['生态'], productType: '私有云单品增值服务包', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'WPS协作/协作中台', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS协作', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017622', code: 'SKU0017622', name: '二次开发服务', price: 5000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017622', title:'计人天服务', price:5000, license:{type:'FlatRate', period:1, periodUnit:'Forever', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}, {id:'AC007',name:'实施部署服务',type:'Service'}]
  },
  {
    id: 'AB0001841', name: 'WPS在线预览系统V1', category: 'Win端', subCategory: 'Web Office', status: 'OnShelf', tags: ['生态'], productType: 'Web Office', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '文档中台', productCategory: '编辑软件', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017542', code: 'SKU0017542', name: '在线预览（API生态基础版）', price: 15000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017542', title:'并发年授权', price:15000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] },
      { id: 'SKU0017541', code: 'SKU0017541', name: '在线预览（API生态基础版）', price: 15000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017541', title:'并发授权', price:15000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC025',name:'Web Office在线预览',type:'Component'}]
  },
  {
    id: 'AB0002806', name: 'WPS协作办公系统V7.1', category: '私有云单品', subCategory: 'WPS协作', status: 'OnShelf', tags: ['生态'], productType: 'WPS协作', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'WPS协作/协作中台', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS协作', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018305', code: 'SKU0018305', name: '定制版（长江存储2026）', price: 20000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018305', title:'用户年授权', price:20000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}]
  },
  {
    id: 'AB0001991', name: '数科OFD电子档案支撑平台V2.0软件保障服务', category: '私有云单品', subCategory: '数科OFD服务端（运维保障）', status: 'OnShelf', tags: ['生态'], productType: '数科OFD服务端（运维保障）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'OFD服务端产品', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: true,
    skus: [
      { id: 'SKU0017802', code: 'SKU0017802', name: '生态版', price: 8000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017802', title:'软件保障', price:8000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC007',name:'实施部署服务',type:'Service'}]
  },
  {
    id: 'AB0002763', name: 'WPS政务AI平台V3.0', category: 'WPS365私有云', subCategory: '电子公文库系统', status: 'OnShelf', tags: ['AI'], productType: '电子公文库系统', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'WPS 政务AI平台', productCategory: '云服务产品', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: '政务AI平台', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018251', code: 'SKU0018251', name: '定制版（江西省政务信息中心）', price: 80000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018251', title:'用户年授权', price:80000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC030',name:'WPS政务AI平台',type:'Component'}, {id:'AC031',name:'WPS AI',type:'Feature'}]
  },
  {
    id: 'AB0002010', name: '多维表格', category: 'WPS365公有云', subCategory: 'WPS365-增值权益包（私有云）', status: 'OnShelf', tags: ['生态'], productType: 'WPS365-增值权益包（私有云）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '黑马（私有云）及其他', productCategory: '云服务产品', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018247', code: 'SKU0018247', name: '标准版', price: 80000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018247', title:'用户年授权', price:80000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] },
      { id: 'SKU0017931', code: 'SKU0017931', name: '标准版', price: 15000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017931', title:'年场地授权', price:15000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] },
      { id: 'SKU0017830', code: 'SKU0017830', name: '标准版', price: 80000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017830', title:'年授权', price:80000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC032',name:'多维表格',type:'Component'}]
  },
  {
    id: 'AB0002598', name: '数科电子签章系统V1.0', category: '私有云单品', subCategory: '数科OFD服务端', status: 'OnShelf', tags: ['生态'], productType: '数科OFD服务端', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'OFD服务端产品', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017970', code: 'SKU0017970', name: '生态版', price: 8000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017970', title:'服务器授权', price:8000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC029',name:'数科电子签章系统',type:'Component'}]
  },
  {
    id: 'AB0002613', name: 'WPS文档中台系统V7', category: '私有云单品', subCategory: '文档中台V7', status: 'OnShelf', tags: ['生态'], productType: '文档中台V7', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '文档中台', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017989', code: 'SKU0017989', name: '专享版（200并发）', price: 100000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017989', title:'并发年授权', price:100000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC026',name:'文档中台系统',type:'Component'}]
  },
  {
    id: 'AB0002625', name: 'WPS政务AI平台运维保障服务', category: '私有云单品', subCategory: '私有云单品必选服务包', status: 'OnShelf', tags: ['AI'], productType: '私有云单品必选服务包', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'WPS 政务AI平台', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: '实施服务及其他', productSeriesFinance: '政务AI平台', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: true,
    skus: [
      { id: 'SKU0018016', code: 'SKU0018016', name: 'WPS政务AI平台A包', price: 30000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018016', title:'运维保障', price:30000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC007',name:'实施部署服务',type:'Service'}, {id:'AC030',name:'WPS政务AI平台',type:'Component'}, {id:'AC031',name:'WPS AI',type:'Feature'}]
  },
  {
    id: 'AB0002622', name: 'WPS AI', category: 'WPS365公有云', subCategory: '文档中心V7', status: 'OnShelf', tags: ['AI'], productType: '文档中心V7', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '文档中心', productCategory: '云服务产品', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false, salesOrgName: '珠海金山办公有限公司', businessDeliveryName: 'WPS AI智能办公软件', taxRefundType: '退税',
    skus: [
      { id: 'SKU0018010', code: 'SKU0018010', name: '定制版（西部钻探）', price: 100000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018010', title:'用户年授权', price:100000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC031',name:'WPS AI',type:'Feature'}]
  },
  {
    id: 'AB0002008', name: 'WPS黑马校对软件V31', category: 'Mac端', subCategory: '黑马校对（私有云）', status: 'OnShelf', tags: ['生态'], productType: '黑马校对（私有云）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '黑马（私有云）及其他', productCategory: '编辑软件', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017824', code: 'SKU0017824', name: '私有云服务器5亿校对字数包（API接口）', price: 80000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017824', title:'字数授权', price:80000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC014',name:'黑马校对私有化服务器版级10亿字',type:'Component'}]
  },
  {
    id: 'AB0000587', name: 'WPS文档中心系统增值服务', category: '私有云单品', subCategory: '私有云单品增值服务包', status: 'OnShelf', tags: ['生态'], productType: '私有云单品增值服务包', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '文档中心', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0013380', code: 'SKU0013380', name: '二次开发', price: 15000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013380', title:'计人月服务', price:15000, license:{type:'FlatRate', period:1, periodUnit:'Forever', scope:'Platform'}}] },
      { id: 'SKU0011669', code: 'SKU0011669', name: '二次开发', price: 8000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0011669', title:'计人天服务', price:8000, license:{type:'FlatRate', period:1, periodUnit:'Forever', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC007',name:'实施部署服务',type:'Service'}, {id:'AC027',name:'文档中心系统',type:'Component'}]
  },
  {
    id: 'AB0001695', name: 'WPS在线编辑办公软件V1', category: 'Win端', subCategory: 'Web Office', status: 'OnShelf', tags: ['生态'], productType: 'Web Office', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '文档中台', productCategory: '编辑软件', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017216', code: 'SKU0017216', name: '在线编辑（API生态基础版）', price: 50000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017216', title:'并发年授权', price:50000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC024',name:'Web Office在线编辑',type:'Component'}]
  },
  {
    id: 'AB0002801', name: 'WPS协作办公系统V7.1', category: '私有云单品', subCategory: 'WPS协作', status: 'OnShelf', tags: ['生态'], productType: 'WPS协作', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'WPS协作/协作中台', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS协作', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018300', code: 'SKU0018300', name: '定制版（渤海钻探）', price: 80000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018300', title:'用户年授权', price:80000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}]
  },
  {
    id: 'AB0001987', name: '数科OCR文字识别系统V1.0软件保障服务', category: '私有云单品', subCategory: '数科OFD服务端（运维保障）', status: 'OnShelf', tags: ['生态'], productType: '数科OFD服务端（运维保障）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'OFD服务端产品', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: true,
    skus: [
      { id: 'SKU0017797', code: 'SKU0017797', name: '生态版', price: 10000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017797', title:'软件保障', price:10000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC007',name:'实施部署服务',type:'Service'}]
  },
  {
    id: 'AB0002689', name: 'WPS政务AI平台V3.0', category: '私有云单品', subCategory: '电子公文库系统', status: 'OnShelf', tags: ['AI'], productType: '电子公文库系统', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'WPS 政务AI平台', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: '政务AI平台', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018138', code: 'SKU0018138', name: '定制版（空8所）', price: 150000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018138', title:'用户年授权', price:150000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC030',name:'WPS政务AI平台',type:'Component'}, {id:'AC031',name:'WPS AI',type:'Feature'}]
  },
  {
    id: 'AB0002644', name: 'WPS AI软件授权', category: '私有云单品', subCategory: 'WPS365-增值权益包（私有云）', status: 'OnShelf', tags: ['AI'], productType: 'WPS365-增值权益包（私有云）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '黑马（私有云）及其他', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018039', code: 'SKU0018039', name: '标准版', price: 150000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018039', title:'用户年授权', price:150000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC031',name:'WPS AI',type:'Feature'}]
  },
  {
    id: 'AB0002000', name: '数科在线预览软件（极速版）V1.0', category: '私有云单品', subCategory: '数科OFD服务端', status: 'OnShelf', tags: ['生态'], productType: '数科OFD服务端', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'OFD服务端产品', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017814', code: 'SKU0017814', name: '生态版', price: 5000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017814', title:'服务器年授权', price:5000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] },
      { id: 'SKU0017813', code: 'SKU0017813', name: '生态版', price: 50000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017813', title:'服务器授权', price:50000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC025',name:'Web Office在线预览',type:'Component'}, {id:'AC035',name:'数科在线预览软件（极速版）',type:'Component'}]
  },
  {
    id: 'AB0002612', name: 'WPS文档中台系统V7', category: '私有云单品', subCategory: '文档中台V7', status: 'OnShelf', tags: ['生态'], productType: '文档中台V7', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '文档中台', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017988', code: 'SKU0017988', name: '专享版（150并发）', price: 150000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017988', title:'并发年授权', price:150000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC026',name:'文档中台系统',type:'Component'}]
  },
  {
    id: 'AB0000349', name: 'WPS文档中台运维保障服务', category: '私有云单品', subCategory: '私有云单品必选服务包', status: 'OnShelf', tags: ['生态'], productType: '私有云单品必选服务包', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '文档中台', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: '实施服务及其他', productSeriesFinance: '实施服务及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: true,
    skus: [
      { id: 'SKU0012276', code: 'SKU0012276', name: '文档中台A包', price: 8000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0012276', title:'运维保障', price:8000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC007',name:'实施部署服务',type:'Service'}, {id:'AC026',name:'文档中台系统',type:'Component'}]
  },
  {
    id: 'AB0002020', name: 'WPS文档中心系统V7', category: '私有云单品', subCategory: '文档中心V7', status: 'OnShelf', tags: ['生态'], productType: '文档中心V7', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '文档中心', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017847', code: 'SKU0017847', name: '定制版（宝洁）', price: 100000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017847', title:'用户年授权', price:100000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC027',name:'文档中心系统',type:'Component'}]
  },
  {
    id: 'AB0000245', name: '黑马校对软件V21.0', category: '私有云单品', subCategory: '黑马校对（私有云）', status: 'OnShelf', tags: ['生态'], productType: '黑马校对（私有云）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '非端', productSeries: '黑马（私有云）及其他', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017810', code: 'SKU0017810', name: '服务器版1亿字', price: 50000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017810', title:'字数授权', price:50000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC014',name:'黑马校对私有化服务器版级10亿字',type:'Component'}]
  },
  {
    id: 'AB0002821', name: 'Web Office服务', category: 'WPS365公有云', subCategory: 'WPS365-增值权益包（公有云）', status: 'OnShelf', tags: ['生态'], productType: 'WPS365-增值权益包（公有云）', onlineDelivery: '无', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018338', code: 'SKU0018338', name: '2000并发，300M文档大小', price: 499, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018338', title:'客户订阅许可', price:499, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC024',name:'Web Office在线编辑',type:'Component'}]
  },
  {
    id: 'AB0002816', name: 'WPS黑马云校对服务', category: 'WPS365公有云', subCategory: '黑马校对（公有云）', status: 'OnShelf', tags: ['生态'], productType: '黑马校对（公有云）', onlineDelivery: '无', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018315', code: 'SKU0018315', name: '公有云3年5亿字校对字数包服务', price: 499, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018315', title:'年字数授权', price:499, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC033',name:'WPS黑马云校对服务',type:'Service'}]
  },
  {
    id: 'AB0002745', name: 'WPS 365数字政务旗舰版', category: 'WPS365公有云', subCategory: 'WPS365旗舰版（政府）（服务）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365旗舰版（政府）（服务）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018230', code: 'SKU0018230', name: '旗舰版', price: 8000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018230', title:'用户订阅许可', price:8000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC049',name:'WPS 365协作办公旗舰平台',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC006',name:'WPS AI 写作',type:'Feature'}, {id:'AC012',name:'WPS 365数字政务旗舰版',type:'Component'}]
  },
  {
    id: 'AB0002744', name: 'WPS 365数字政务高级版', category: 'WPS365公有云', subCategory: 'WPS365高级版（政府）（服务）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365高级版（政府）（服务）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018229', code: 'SKU0018229', name: '高级版（Linux版）', price: 8000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018229', title:'用户订阅许可', price:8000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC050',name:'WPS 365协作办公高级平台',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC006',name:'WPS AI 写作',type:'Feature'}, {id:'AC011',name:'WPS 365数字政务高级版（Win版）',type:'Component'}]
  },
  {
    id: 'AB0002742', name: 'WPS 365数字政务标准版', category: 'WPS365公有云', subCategory: 'WPS365标准版（政府）（服务）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365标准版（政府）（服务）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018227', code: 'SKU0018227', name: '标准版', price: 50000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018227', title:'用户订阅许可', price:50000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC001',name:'WPS Office 基础编辑',type:'Component'}]
  },
  {
    id: 'AB0002741', name: 'WPS 365政务版平台V12', category: 'WPS365公有云', subCategory: 'WPS365旗舰版（政府）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365旗舰版（政府）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018226', code: 'SKU0018226', name: '旗舰版', price: 499, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018226', title:'用户订阅许可', price:499, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC012',name:'WPS 365数字政务旗舰版',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}]
  },
  {
    id: 'AB0002740', name: 'WPS 365政务版平台V12', category: 'WPS365公有云', subCategory: 'WPS365高级版（政府）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365高级版（政府）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018225', code: 'SKU0018225', name: '高级版（Win版）', price: 199, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018225', title:'用户订阅许可', price:199, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC011',name:'WPS 365数字政务高级版（Win版）',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}]
  },
  {
    id: 'AB0002739', name: 'WPS 365政务版平台V12', category: 'WPS365公有云', subCategory: 'WPS365标准版（政府）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365标准版（政府）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018224', code: 'SKU0018224', name: '标准版', price: 199, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018224', title:'用户订阅许可', price:199, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC001',name:'WPS Office 基础编辑',type:'Component'}]
  },
  {
    id: 'AB0000841', name: 'WPS 365协作办公旗舰平台V12', category: 'WPS365公有云', subCategory: 'WPS365旗舰版', status: 'OnShelf', tags: ['IM', '生态'], productType: 'WPS365旗舰版', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018216', code: 'SKU0018216', name: '旗舰版', price: 799, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018216', title:'年场地授权', price:799, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] },
      { id: 'SKU0013844', code: 'SKU0013844', name: '旗舰版', price: 199, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013844', title:'用户订阅许可（含端年场地）', price:199, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] },
      { id: 'SKU0013541', code: 'SKU0013541', name: '旗舰版', price: 499, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013541', title:'用户订阅许可', price:499, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}, {id:'AC049',name:'WPS 365协作办公旗舰平台',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC006',name:'WPS AI 写作',type:'Feature'}]
  },
  {
    id: 'AB0002619', name: 'WPS 365 企业高级版', category: 'WPS365公有云', subCategory: 'WPS365高级版（企业）（服务）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365高级版（企业）（服务）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017997', code: 'SKU0017997', name: '高级版（Win版）', price: 50000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017997', title:'用户订阅许可', price:50000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC050',name:'WPS 365协作办公高级平台',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC006',name:'WPS AI 写作',type:'Feature'}]
  },
  {
    id: 'AB0002618', name: 'WPS 365 企业旗舰版', category: 'WPS365公有云', subCategory: 'WPS365旗舰版（企业）（服务）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365旗舰版（企业）（服务）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017996', code: 'SKU0017996', name: '旗舰版', price: 10000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017996', title:'用户订阅许可', price:10000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC049',name:'WPS 365协作办公旗舰平台',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC006',name:'WPS AI 写作',type:'Feature'}]
  },
  {
    id: 'AB0002606', name: 'PDF文档转换服务', category: 'WPS365公有云', subCategory: '增值服务包（公有云）', status: 'OnShelf', tags: ['生态'], productType: '增值服务包（公有云）', onlineDelivery: '无', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017982', code: 'SKU0017982', name: '定制版（百度网盘）', price: 20000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017982', title:'计次服务', price:20000, license:{type:'FlatRate', period:1, periodUnit:'Forever', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC047',name:'PDF文档转换服务',type:'Service'}]
  },
  {
    id: 'AB0002575', name: 'WPS 会议一线版', category: 'WPS365公有云', subCategory: 'WPS+公有云（服务）', status: 'OnShelf', tags: ['生态'], productType: 'WPS+公有云（服务）', onlineDelivery: '无', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017929', code: 'SKU0017929', name: '一线版', price: 10000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017929', title:'用户订阅许可', price:10000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC059',name:'WPS 会议一线版',type:'Component'}]
  },
  {
    id: 'AB0001977', name: 'WPS智慧教育平台', category: 'WPS365公有云', subCategory: 'WPS365旗舰版（教育）（服务）', status: 'OnShelf', tags: ['生态'], productType: 'WPS365旗舰版（教育）（服务）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017778', code: 'SKU0017778', name: '标准版', price: 50000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017778', title:'用户订阅许可', price:50000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC048',name:'WPS智慧教育平台',type:'Feature'}]
  },
  {
    id: 'AB0001724', name: 'WPS 365协作办公教育版考试平台V12', category: 'WPS365公有云', subCategory: 'WPS365标准版（教育）', status: 'OnShelf', tags: ['IM', '生态'], productType: 'WPS365标准版（教育）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017294', code: 'SKU0017294', name: '标准版（Win版）', price: 199, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017294', title:'用户订阅许可', price:199, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC048',name:'WPS智慧教育平台',type:'Feature'}]
  },
  {
    id: 'AB0000801', name: 'WPS 365 教育高级版', category: 'WPS365公有云', subCategory: 'WPS365高级版（教育）（服务）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365高级版（教育）（服务）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0013501', code: 'SKU0013501', name: '高级版（Win版）', price: 30000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013501', title:'用户订阅许可', price:30000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC050',name:'WPS 365协作办公高级平台',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC006',name:'WPS AI 写作',type:'Feature'}, {id:'AC048',name:'WPS智慧教育平台',type:'Feature'}]
  },
  {
    id: 'AB0000799', name: 'WPS 365 教育标准版', category: 'WPS365公有云', subCategory: 'WPS365 标准版（教育）（服务）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365 标准版（教育）（服务）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0013499', code: 'SKU0013499', name: '标准版（Win版）', price: 15000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013499', title:'用户订阅许可', price:15000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC048',name:'WPS智慧教育平台',type:'Feature'}]
  },
  {
    id: 'AB0000771', name: 'WPS 365 商业旗舰版', category: 'WPS365公有云', subCategory: 'WPS365旗舰版（服务）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365旗舰版（服务）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0013406', code: 'SKU0013406', name: '旗舰版', price: 20000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013406', title:'用户订阅许可', price:20000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC049',name:'WPS 365协作办公旗舰平台',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC006',name:'WPS AI 写作',type:'Feature'}]
  },
  {
    id: 'AB0000612', name: 'WPS 365协作办公医疗版应用平台V12', category: 'WPS365公有云', subCategory: 'WPS365应用版（医疗）', status: 'OnShelf', tags: ['IM', '生态'], productType: 'WPS365应用版（医疗）', onlineDelivery: '无', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0016870', code: 'SKU0016870', name: '应用版（Win版）', price: 199, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0016870', title:'用户订阅许可（含端年场地）', price:199, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] },
      { id: 'SKU0012153', code: 'SKU0012153', name: '应用版（Win版）', price: 799, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0012153', title:'用户订阅许可', price:799, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}]
  },
  {
    id: 'AB0000822', name: 'WPS 365协作办公教育版旗舰平台V12', category: 'WPS365公有云', subCategory: 'WPS365旗舰版（教育）', status: 'OnShelf', tags: ['IM', '生态'], productType: 'WPS365旗舰版（教育）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0013842', code: 'SKU0013842', name: '旗舰版', price: 199, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013842', title:'用户订阅许可（含端年场地）', price:199, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] },
      { id: 'SKU0013522', code: 'SKU0013522', name: '旗舰版', price: 999, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013522', title:'用户订阅许可', price:999, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}, {id:'AC049',name:'WPS 365协作办公旗舰平台',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC006',name:'WPS AI 写作',type:'Feature'}, {id:'AC048',name:'WPS智慧教育平台',type:'Feature'}]
  },
  {
    id: 'AB0000821', name: 'WPS 365协作办公教育版高级平台V12', category: 'WPS365公有云', subCategory: 'WPS365高级版（教育）', status: 'OnShelf', tags: ['IM', '生态'], productType: 'WPS365高级版（教育）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0013841', code: 'SKU0013841', name: '高级版（Win版）', price: 499, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013841', title:'用户订阅许可（含端年场地）', price:499, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] },
      { id: 'SKU0013521', code: 'SKU0013521', name: '高级版（Win版）', price: 1999, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013521', title:'用户订阅许可', price:1999, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}, {id:'AC050',name:'WPS 365协作办公高级平台',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC006',name:'WPS AI 写作',type:'Feature'}, {id:'AC048',name:'WPS智慧教育平台',type:'Feature'}]
  },
  {
    id: 'AB0000840', name: 'WPS 365协作办公高级平台V12', category: 'WPS365公有云', subCategory: 'WPS365高级版', status: 'OnShelf', tags: ['IM', '生态'], productType: 'WPS365高级版', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0013838', code: 'SKU0013838', name: '高级版（Win版）', price: 1299, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013838', title:'用户订阅许可（含端年场地）', price:1299, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] },
      { id: 'SKU0013540', code: 'SKU0013540', name: '高级版（Win版）', price: 999, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013540', title:'用户订阅许可', price:999, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}, {id:'AC050',name:'WPS 365协作办公高级平台',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC006',name:'WPS AI 写作',type:'Feature'}]
  },
  {
    id: 'AB0001008', name: 'WPS 365 商业高级版', category: 'WPS365公有云', subCategory: 'WPS365高级版（服务）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365高级版（服务）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0013806', code: 'SKU0013806', name: '高级版（Linux版）', price: 50000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013806', title:'用户订阅许可', price:50000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC050',name:'WPS 365协作办公高级平台',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC006',name:'WPS AI 写作',type:'Feature'}]
  },
  {
    id: 'AB0000803', name: 'WPS 365教育应用版', category: 'WPS365公有云', subCategory: 'WPS365应用版（教育）（服务）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365应用版（教育）（服务）', onlineDelivery: '无', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0013503', code: 'SKU0013503', name: '应用版（Linux版）', price: 10000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013503', title:'用户订阅许可', price:10000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC048',name:'WPS智慧教育平台',type:'Feature'}]
  },
  {
    id: 'AB0000769', name: 'WPS 365 商业协作版', category: 'WPS365公有云', subCategory: 'WPS365协作版（服务）', status: 'OnShelf', tags: ['IM', '生态'], productType: 'WPS365协作版（服务）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0013404', code: 'SKU0013404', name: '协作版', price: 20000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013404', title:'用户订阅许可', price:20000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}]
  },
  {
    id: 'AB0000636', name: 'WPS 365 教育协作版', category: 'WPS365公有云', subCategory: 'WPS365协作版（教育）（服务）', status: 'OnShelf', tags: ['IM', '生态'], productType: 'WPS365协作版（教育）（服务）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0012402', code: 'SKU0012402', name: '协作版', price: 8000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0012402', title:'用户订阅许可', price:8000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC048',name:'WPS智慧教育平台',type:'Feature'}]
  },
  {
    id: 'AB0002820', name: 'Web Office服务', category: 'WPS365公有云', subCategory: 'WPS365-增值权益包（公有云）', status: 'OnShelf', tags: ['生态'], productType: 'WPS365-增值权益包（公有云）', onlineDelivery: '无', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018337', code: 'SKU0018337', name: '20000并发，300M文档大小', price: 1299, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018337', title:'客户订阅许可', price:1299, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC024',name:'Web Office在线编辑',type:'Component'}]
  },
  {
    id: 'AB0002009', name: 'WPS黑马云校对服务', category: 'WPS365公有云', subCategory: '黑马校对（公有云）', status: 'OnShelf', tags: ['生态'], productType: '黑马校对（公有云）', onlineDelivery: '无', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017825', code: 'SKU0017825', name: '公有云客户端50万字（API接口）', price: 199, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017825', title:'年字数授权', price:199, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC033',name:'WPS黑马云校对服务',type:'Service'}]
  },
  {
    id: 'AB0001927', name: 'WPS 365协作办公政府版标准平台V12', category: '信创端', subCategory: 'linux版云混合Lic（X+L）（政府）', status: 'OnShelf', tags: ['IM', '信创', '生态'], productType: 'linux版云混合Lic（X+L）（政府）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'WPS for Lin', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018099', code: 'SKU0018099', name: '标准版（Linux版）', price: 0, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018099', title:'年授权（2+L）', price:0, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] },
      { id: 'SKU0017698', code: 'SKU0017698', name: '标准版（Linux版）', price: 298, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017698', title:'年授权（1+L）', price:298, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}]
  },
  {
    id: 'AB0002646', name: '金山志远OFD版式软件V3.0', category: '信创端', subCategory: '数科OFD用户端（代理）', status: 'OnShelf', tags: ['信创'], productType: '数科OFD用户端（代理）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'PDF for Lin', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018041', code: 'SKU0018041', name: '专业版（通用机）', price: 498, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018041', title:'数量授权', price:498, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC056',name:'金山志远WPS办公软件',type:'Component'}]
  },
  {
    id: 'AB0000772', name: 'WPS Office 2023 for Linux专业版办公软件V12.8', category: '信创端', subCategory: '信创2023', status: 'OnShelf', tags: ['信创'], productType: '信创2023', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'WPS for Lin', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018026', code: 'SKU0018026', name: '专业版', price: 0, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018026', title:'场地授权', price:0, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}}] },
      { id: 'SKU0013859', code: 'SKU0013859', name: '专业版', price: 298, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013859', title:'随机数量授权', price:298, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] },
      { id: 'SKU0013409', code: 'SKU0013409', name: '专业版', price: 0, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013409', title:'年场地授权', price:0, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC040',name:'WPS Office 2023 for Linux专业版',type:'Component'}]
  },
  {
    id: 'AB0002012', name: 'WPS 365协作办公政府版高级平台V12', category: '信创端', subCategory: 'linux版云混合Lic（X+Y）（政府）', status: 'OnShelf', tags: ['IM', '信创', '生态'], productType: 'linux版云混合Lic（X+Y）（政府）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'WPS for Lin', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017950', code: 'SKU0017950', name: '高级版（Linux版）', price: 698, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017950', title:'年授权（3+3）', price:698, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] },
      { id: 'SKU0017949', code: 'SKU0017949', name: '高级版（Linux版）', price: 498, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017949', title:'年授权（3+2）', price:498, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}]
  },
  {
    id: 'AB0002582', name: 'WPS Office 2023 for linux教育版软件保障服务', category: '信创端', subCategory: '软件保障（信创端）', status: 'OnShelf', tags: ['信创'], productType: '软件保障（信创端）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'WPS for Lin', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: true,
    skus: [
      { id: 'SKU0017940', code: 'SKU0017940', name: '专业版', price: 15000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017940', title:'软件保障', price:15000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC007',name:'实施部署服务',type:'Service'}, {id:'AC048',name:'WPS智慧教育平台',type:'Feature'}]
  },
  {
    id: 'AB0000285', name: '数科OFD版式软件V3.0', category: '信创端', subCategory: '数科OFD用户端', status: 'OnShelf', tags: ['信创'], productType: '数科OFD用户端', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'OFD for Lin', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017936', code: 'SKU0017936', name: '专业版（专用机）', price: 498, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017936', title:'随机数量授权', price:498, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] },
      { id: 'SKU0005824', code: 'SKU0005824', name: '专业版（专用机）', price: 298, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0005824', title:'年授权', price:298, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] },
      { id: 'SKU0005823', code: 'SKU0005823', name: '专业版（专用机）', price: 498, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0005823', title:'年场地授权', price:498, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC039',name:'数科OFD版式软件',type:'Component'}]
  },
  {
    id: 'AB0002011', name: 'WPS 365协作办公教育版标准平台V12', category: '信创端', subCategory: 'linux版云混合Lic（X+Y）（教育）', status: 'OnShelf', tags: ['IM', '信创', '生态'], productType: 'linux版云混合Lic（X+Y）（教育）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'WPS for Lin', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017831', code: 'SKU0017831', name: '标准版（Linux版）', price: 498, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017831', title:'年授权（3+3）', price:498, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC048',name:'WPS智慧教育平台',type:'Feature'}]
  },
  {
    id: 'AB0001992', name: '数科扫描识别软件V3.0软件保障服务', category: '信创端', subCategory: '数科OFD用户端（软件保障）', status: 'OnShelf', tags: ['信创'], productType: '数科OFD用户端（软件保障）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'OFD for Lin', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: true,
    skus: [
      { id: 'SKU0017803', code: 'SKU0017803', name: '生态版', price: 8000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017803', title:'软件保障', price:8000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC060',name:'数科扫描识别软件',type:'Component'}]
  },
  {
    id: 'AB0001878', name: 'WPS PDF for Linux专业版软件V12', category: '信创端', subCategory: 'PDF（信创）', status: 'OnShelf', tags: ['信创'], productType: 'PDF（信创）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'PDF for Lin', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017738', code: 'SKU0017738', name: '专业版', price: 498, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017738', title:'年场地授权', price:498, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] },
      { id: 'SKU0017610', code: 'SKU0017610', name: '专业版', price: 0, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017610', title:'年授权', price:0, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] },
      { id: 'SKU0017609', code: 'SKU0017609', name: '专业版', price: 998, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017609', title:'数量授权', price:998, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC058',name:'WPS PDF for Linux专业版',type:'Component'}]
  },
  {
    id: 'AB0001926', name: 'WPS 365协作办公教育版标准平台V12', category: '信创端', subCategory: 'linux版云混合Lic（X+L）（教育）', status: 'OnShelf', tags: ['IM', '信创', '生态'], productType: 'linux版云混合Lic（X+L）（教育）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'WPS for Lin', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017694', code: 'SKU0017694', name: '标准版（Linux版）', price: 298, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017694', title:'年授权（3+L）', price:298, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}, {id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC048',name:'WPS智慧教育平台',type:'Feature'}]
  },
  {
    id: 'AB0001010', name: '金山志远WPS办公软件V11', category: '信创端', subCategory: '金山志远2019', status: 'OnShelf', tags: ['信创'], productType: '金山志远2019', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'WPS for Lin', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0016942', code: 'SKU0016942', name: '专业版', price: 998, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0016942', title:'年场地授权', price:998, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] },
      { id: 'SKU0013810', code: 'SKU0013810', name: '专业版', price: 298, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013810', title:'年授权', price:298, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] },
      { id: 'SKU0013809', code: 'SKU0013809', name: '专业版', price: 298, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013809', title:'随机数量授权', price:298, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC056',name:'金山志远WPS办公软件',type:'Component'}]
  },
  {
    id: 'AB0000021', name: 'WPS Office2019 for linux专业版办公软件V11', category: '信创端', subCategory: '信创2019', status: 'OnShelf', tags: ['信创'], productType: '信创2019', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'WPS for Lin', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0011387', code: 'SKU0011387', name: '专业版', price: 698, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0011387', title:'年场地授权', price:698, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] },
      { id: 'SKU0011385', code: 'SKU0011385', name: '专业版', price: 698, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0011385', title:'年授权', price:698, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] },
      { id: 'SKU0011384', code: 'SKU0011384', name: '专业版', price: 498, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0011384', title:'随机数量授权', price:498, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC055',name:'WPS Office2019 for linux专业版',type:'Component'}]
  },
  {
    id: 'AB0001012', name: '金山麒麟WPS办公软件V11', category: '信创端', subCategory: '麒麟2019（Linux）', status: 'OnShelf', tags: ['信创'], productType: '麒麟2019（Linux）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'WPS for Lin', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0013818', code: 'SKU0013818', name: '专业版', price: 998, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013818', title:'随机数量授权', price:998, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] },
      { id: 'SKU0013817', code: 'SKU0013817', name: '专业版', price: 298, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013817', title:'年授权', price:298, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] },
      { id: 'SKU0013816', code: 'SKU0013816', name: '专业版', price: 498, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013816', title:'年场地授权', price:498, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC057',name:'金山麒麟WPS办公软件',type:'Component'}]
  },
  {
    id: 'AB0002824', name: '私有云（驻场）运维保障服务', category: 'WPS365私有云', subCategory: 'WPS365私有云增值服务包', status: 'OnShelf', tags: ['生态'], productType: 'WPS365私有云增值服务包', onlineDelivery: '无', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365私有云', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: '实施服务及其他', productSeriesFinance: '实施服务及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: true,
    skus: [
      { id: 'SKU0018341', code: 'SKU0018341', name: '私有云（驻场）运维保障服务', price: 50000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018341', title:'计人天服务', price:50000, license:{type:'FlatRate', period:1, periodUnit:'Forever', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC007',name:'实施部署服务',type:'Service'}]
  },
  {
    id: 'AB0002815', name: 'WPS 365专业办公高级平台V7', category: 'WPS365私有云', subCategory: 'WPS365高级版（私有云）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365高级版（私有云）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365私有云', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018314', code: 'SKU0018314', name: '定制版（保险保障基金）', price: 150000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018314', title:'用户年授权', price:150000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC044',name:'WPS 365高级版（私有云）',type:'Component'}, {id:'AC042',name:'WPS 365私有云部署包',type:'Component'}, {id:'AC005',name:'私有云文档中心',type:'Feature'}]
  },
  {
    id: 'AB0002796', name: 'WPS 365专业办公旗舰平台V7', category: 'WPS365私有云', subCategory: 'WPS365旗舰版（私有云）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365旗舰版（私有云）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365私有云', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018293', code: 'SKU0018293', name: '定制版（HA）', price: 150000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018293', title:'用户年授权', price:150000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC043',name:'WPS 365旗舰版（私有云）',type:'Component'}, {id:'AC042',name:'WPS 365私有云部署包',type:'Component'}, {id:'AC005',name:'私有云文档中心',type:'Feature'}, {id:'AC008',name:'企业通讯录同步',type:'Feature'}]
  },
  {
    id: 'AB0001973', name: 'WPS 365私有云运维保障服务', category: 'WPS365私有云', subCategory: 'WPS365私有云必选服务包', status: 'OnShelf', tags: ['IM', '生态'], productType: 'WPS365私有云必选服务包', onlineDelivery: '无', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365私有云', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: '实施服务及其他', productSeriesFinance: '实施服务及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: true,
    skus: [
      { id: 'SKU0017773', code: 'SKU0017773', name: 'WPS 365 D包', price: 5000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017773', title:'运维保障', price:5000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC007',name:'实施部署服务',type:'Service'}]
  },
  {
    id: 'AB0002663', name: 'WPS 365专业办公高级平台系统增值服务', category: 'WPS365私有云', subCategory: 'WPS365私有云增值服务包', status: 'OnShelf', tags: ['IM'], productType: 'WPS365私有云增值服务包', onlineDelivery: '无', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365私有云', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018100', code: 'SKU0018100', name: '私有云账号对接', price: 8000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018100', title:'计次服务', price:8000, license:{type:'FlatRate', period:1, periodUnit:'Forever', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC044',name:'WPS 365高级版（私有云）',type:'Component'}, {id:'AC042',name:'WPS 365私有云部署包',type:'Component'}, {id:'AC005',name:'私有云文档中心',type:'Feature'}, {id:'AC007',name:'实施部署服务',type:'Service'}]
  },
  {
    id: 'AB0002814', name: 'WPS 365专业办公高级平台V7', category: 'WPS365私有云', subCategory: 'WPS365高级版（私有云）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365高级版（私有云）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365私有云', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018313', code: 'SKU0018313', name: '定制版（兆芯）', price: 150000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018313', title:'用户年授权', price:150000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC044',name:'WPS 365高级版（私有云）',type:'Component'}, {id:'AC042',name:'WPS 365私有云部署包',type:'Component'}, {id:'AC005',name:'私有云文档中心',type:'Feature'}]
  },
  {
    id: 'AB0002783', name: 'WPS 365专业办公旗舰平台V7', category: 'WPS365私有云', subCategory: 'WPS365旗舰版（私有云）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365旗舰版（私有云）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365私有云', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018277', code: 'SKU0018277', name: '旗舰版（浙商证券定制）', price: 15000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018277', title:'年场地授权', price:15000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC043',name:'WPS 365旗舰版（私有云）',type:'Component'}, {id:'AC042',name:'WPS 365私有云部署包',type:'Component'}, {id:'AC005',name:'私有云文档中心',type:'Feature'}, {id:'AC008',name:'企业通讯录同步',type:'Feature'}]
  },
  {
    id: 'AB0001972', name: 'WPS 365私有云运维保障服务', category: 'WPS365私有云', subCategory: 'WPS365私有云必选服务包', status: 'OnShelf', tags: ['IM', '生态'], productType: 'WPS365私有云必选服务包', onlineDelivery: '无', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365私有云', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: '实施服务及其他', productSeriesFinance: '实施服务及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: true,
    skus: [
      { id: 'SKU0017772', code: 'SKU0017772', name: 'WPS 365 C包', price: 50000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017772', title:'运维保障', price:50000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC007',name:'实施部署服务',type:'Service'}]
  },
  {
    id: 'AB0002656', name: 'WPS 365专业办公旗舰平台增值服务', category: 'WPS365私有云', subCategory: 'WPS365私有云增值服务包', status: 'OnShelf', tags: ['IM'], productType: 'WPS365私有云增值服务包', onlineDelivery: '无', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365私有云', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018087', code: 'SKU0018087', name: '私有云账号对接', price: 10000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018087', title:'计次服务', price:10000, license:{type:'FlatRate', period:1, periodUnit:'Forever', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC043',name:'WPS 365旗舰版（私有云）',type:'Component'}, {id:'AC042',name:'WPS 365私有云部署包',type:'Component'}, {id:'AC005',name:'私有云文档中心',type:'Feature'}, {id:'AC008',name:'企业通讯录同步',type:'Feature'}, {id:'AC007',name:'实施部署服务',type:'Service'}]
  },
  {
    id: 'AB0002764', name: 'WPS 365专业办公高级平台V7', category: 'WPS365私有云', subCategory: 'WPS365高级版（私有云）', status: 'OnShelf', tags: ['IM'], productType: 'WPS365高级版（私有云）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365私有云', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018252', code: 'SKU0018252', name: '定制版（广东省交通集团）', price: 50000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018252', title:'用户年授权', price:50000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC044',name:'WPS 365高级版（私有云）',type:'Component'}, {id:'AC042',name:'WPS 365私有云部署包',type:'Component'}, {id:'AC005',name:'私有云文档中心',type:'Feature'}]
  },
  {
    id: 'AB0001964', name: 'WPS 365专业办公央企版高级平台V7', category: 'Win端', subCategory: 'Win2019', status: 'OnShelf', tags: ['IM'], productType: 'Win2019', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'WPS for Win', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017757', code: 'SKU0017757', name: '定制版（中航）', price: 498, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017757', title:'年场地授权', price:498, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC004',name:'WPS 会议权益包',type:'Feature'}]
  },
  {
    id: 'AB0001879', name: 'WPS PDF专业版软件V12', category: 'Win端', subCategory: 'PDF（Win）', status: 'OnShelf', tags: ['生态'], productType: 'PDF（Win）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'PDF for Win', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017661', code: 'SKU0017661', name: '专业版', price: 298, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017661', title:'年场地授权', price:298, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] },
      { id: 'SKU0017612', code: 'SKU0017612', name: '专业版', price: 398, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017612', title:'年授权', price:398, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] },
      { id: 'SKU0017611', code: 'SKU0017611', name: '专业版', price: 498, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017611', title:'数量授权', price:498, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC038',name:'WPS PDF专业版',type:'Component'}, {id:'AC002',name:'PDF 组件',type:'Component'}]
  },
  {
    id: 'AB0000015', name: 'WPS Office2019 教育版办公软件V11.8', category: 'Win端', subCategory: 'Win2019教育', status: 'OnShelf', tags: ['生态'], productType: 'Win2019教育', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'WPS for Win', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0012718', code: 'SKU0012718', name: '专业版', price: 398, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0012718', title:'年场地授权', price:398, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC048',name:'WPS智慧教育平台',type:'Feature'}]
  },
  {
    id: 'AB0001707', name: 'WPS for Win软件保障服务', category: 'Win端', subCategory: '软件保障（Win）', status: 'OnShelf', tags: ['生态'], productType: '软件保障（Win）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'WPS for Win', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: true,
    skus: [
      { id: 'SKU0017250', code: 'SKU0017250', name: '2023增强版', price: 30000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017250', title:'软件保障', price:30000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC007',name:'实施部署服务',type:'Service'}]
  },
  {
    id: 'AB0000047', name: 'WPS+办公云平台V11.8', category: 'Win端', subCategory: 'WPS+办公云平台', status: 'OnShelf', tags: ['生态'], productType: 'WPS+办公云平台', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'WPS+办公云平台', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0012128', code: 'SKU0012128', name: '标准版', price: 698, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0012128', title:'年场地授权', price:698, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC054',name:'WPS+办公云平台',type:'Component'}]
  },
  {
    id: 'AB0000765', name: 'WPS Office 2023专业版办公软件V12.8', category: 'Win端', subCategory: 'Win2023', status: 'OnShelf', tags: ['生态'], productType: 'Win2023', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'WPS for Win', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0013394', code: 'SKU0013394', name: '专业版', price: 698, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013394', title:'年场地授权', price:698, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] },
      { id: 'SKU0013393', code: 'SKU0013393', name: '专业版', price: 698, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013393', title:'年授权', price:698, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] },
      { id: 'SKU0013392', code: 'SKU0013392', name: '专业版', price: 398, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013392', title:'数量授权', price:398, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC041',name:'WPS Office 2023专业版（Win）',type:'Component'}]
  },
  {
    id: 'AB0000790', name: 'WPS Office 2023教育版办公软件V12', category: 'Win端', subCategory: 'Win2023教育', status: 'OnShelf', tags: ['生态'], productType: 'Win2023教育', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'WPS for Win', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0013579', code: 'SKU0013579', name: '专业版', price: 498, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013579', title:'年场地授权', price:498, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] },
      { id: 'SKU0013479', code: 'SKU0013479', name: '专业版', price: 398, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013479', title:'数量授权', price:398, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC041',name:'WPS Office 2023专业版（Win）',type:'Component'}, {id:'AC048',name:'WPS智慧教育平台',type:'Feature'}]
  },
  {
    id: 'AB0000768', name: 'WPS Office 2023流版套装办公软件V12.8', category: 'Win端', subCategory: '流版套装2023（Win）', status: 'OnShelf', tags: ['生态'], productType: '流版套装2023（Win）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '端', productSeries: '流版套 for Win', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0013403', code: 'SKU0013403', name: '增强版（金融Win版）', price: 398, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013403', title:'年场地授权', price:398, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] },
      { id: 'SKU0013402', code: 'SKU0013402', name: '增强版（金融Win版）', price: 498, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013402', title:'年授权', price:498, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] },
      { id: 'SKU0013401', code: 'SKU0013401', name: '增强版（金融Win版）', price: 698, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0013401', title:'数量授权', price:698, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC003',name:'OFD 组件',type:'Component'}]
  },
  {
    id: 'AB0002797', name: 'WPS Office for 鸿蒙移动专业版办公软件V1', category: '其他软件', subCategory: 'WPS for 鸿蒙', status: 'OnShelf', tags: ['信创'], productType: 'WPS for 鸿蒙', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '', productSeries: '黑马（客户端）、移动端等', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018294', code: 'SKU0018294', name: '专业版', price: 4999, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018294', title:'年授权', price:4999, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC020',name:'WPS Office for 鸿蒙移动专业版',type:'Component'}]
  },
  {
    id: 'AB0002726', name: '委托技术开发服务', category: '其他软件', subCategory: '第三方实施服务及其他', status: 'OnShelf', tags: ['生态'], productType: '第三方实施服务及其他', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '', productSeries: '黑马（客户端）、移动端等', productCategory: '单品授权', productLine: '黑马（客户端）、移动端等', productClassFinance: 'WPS365', productLineFinance: '其他', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018200', code: 'SKU0018200', name: '委托技术开发服务', price: 15000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018200', title:'计人天服务', price:15000, license:{type:'FlatRate', period:1, periodUnit:'Forever', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC007',name:'实施部署服务',type:'Service'}]
  },
  {
    id: 'AB0002672', name: '金山云分布式对象存储软件V6.0', category: '其他软件', subCategory: '第三方软件', status: 'OnShelf', tags: ['生态'], productType: '第三方软件', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '', productSeries: '黑马（客户端）、移动端等', productCategory: '单品授权', productLine: '黑马（客户端）、移动端等', productClassFinance: 'WPS365', productLineFinance: '其他', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018110', code: 'SKU0018110', name: '信创版通用型', price: 998, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018110', title:'服务器授权', price:998, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC045',name:'金山云分布式对象存储软件',type:'Component'}]
  },
  {
    id: 'AB0002623', name: 'WPS软件原厂维保服务', category: '其他软件', subCategory: '增值服务包（其他）', status: 'OnShelf', tags: ['生态'], productType: '增值服务包（其他）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '', productSeries: '黑马（客户端）、移动端等', productCategory: '单品授权', productLine: '黑马（客户端）、移动端等', productClassFinance: 'WPS365', productLineFinance: '其他', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018011', code: 'SKU0018011', name: '定制版（农业银行）', price: 8000, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0018011', title:'软件保障', price:8000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC007',name:'实施部署服务',type:'Service'}]
  },
  {
    id: 'AB0002003', name: '数科OFD移动端阅读器软件V3.0', category: '其他软件', subCategory: '数科OFD移动端', status: 'OnShelf', tags: ['生态'], productType: '数科OFD移动端', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '', productSeries: '黑马（客户端）、移动端等', productCategory: '单品授权', productLine: '黑马（客户端）、移动端等', productClassFinance: 'WPS365', productLineFinance: '其他', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017818', code: 'SKU0017818', name: '生态版', price: 498, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017818', title:'数量授权', price:498, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC046',name:'数科OFD移动端阅读器',type:'Component'}]
  },
  {
    id: 'AB0001721', name: 'WPS黑马校对软件V31', category: '其他软件', subCategory: '黑马校对（客户端）', status: 'OnShelf', tags: ['生态'], productType: '黑马校对（客户端）', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '', productSeries: '黑马（客户端）、移动端等', productCategory: '单品授权', productLine: '黑马（客户端）、移动端等', productClassFinance: 'WPS365', productLineFinance: '其他', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0017663', code: 'SKU0017663', name: '单机版', price: 4999, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017663', title:'年授权', price:4999, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] },
      { id: 'SKU0017495', code: 'SKU0017495', name: '单机版', price: 1999, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017495', title:'升级授权', price:1999, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] },
      { id: 'SKU0017285', code: 'SKU0017285', name: '单机版', price: 299, stock: 999, status: 'Active', pricingOptions: [{id:'po-SKU0017285', title:'数量授权', price:299, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC037',name:'WPS黑马校对软件（客户端）',type:'Component'}]
  },
  {
    id: 'AB0002792', name: 'WPS协作办公系统V7.1', category: '私有云单品', subCategory: 'WPS协作', status: 'OffShelf', tags: ['生态'], productType: 'WPS协作', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS软件业务', productClassification: '非端', productSeries: 'WPS协作/协作中台', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS协作', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018287', code: 'SKU0018287', name: '定制版（贵阳银行）', price: 150000, stock: 0, status: 'Inactive', pricingOptions: [{id:'po-SKU0018287', title:'场地授权', price:150000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC023',name:'WPS协作办公系统',type:'Component'}]
  },
  {
    id: 'AB0002771', name: '企业大会员', category: 'WPS365公有云', subCategory: 'WPS365-增值权益包（公有云）', status: 'OffShelf', tags: ['生态'], productType: 'WPS365-增值权益包（公有云）', onlineDelivery: '无', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365公有云', productCategory: '单品授权', productLine: 'WPS365公有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365', productSeriesFinance: 'WPS365', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018264', code: 'SKU0018264', name: '企业大会员', price: 199, stock: 0, status: 'Inactive', pricingOptions: [{id:'po-SKU0018264', title:'用户订阅许可', price:199, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC001',name:'WPS Office 基础编辑',type:'Component'}, {id:'AC006',name:'WPS AI 写作',type:'Feature'}]
  },
  {
    id: 'AB0002760', name: '零信任集成服务', category: '其他软件', subCategory: '第三方实施服务及其他', status: 'OffShelf', tags: ['生态'], productType: '第三方实施服务及其他', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '', productSeries: '黑马（客户端）、移动端等', productCategory: '单品授权', productLine: '黑马（客户端）、移动端等', productClassFinance: 'WPS365', productLineFinance: '其他', productSeriesFinance: '黑马及其他', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018245', code: 'SKU0018245', name: '标准版', price: 50000, stock: 0, status: 'Inactive', pricingOptions: [{id:'po-SKU0018245', title:'计人天服务', price:50000, license:{type:'FlatRate', period:1, periodUnit:'Forever', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC017',name:'零信任集成服务',type:'Service'}]
  },
  {
    id: 'AB0002756', name: 'WPS 365专业办公旗舰平台V7', category: 'WPS365私有云', subCategory: 'WPS365旗舰版（私有云）', status: 'OffShelf', tags: ['IM'], productType: 'WPS365旗舰版（私有云）', onlineDelivery: 'WPS+第三方产品', productClass: 'WPS365', productClassification: '非端', productSeries: 'WPS365私有云', productCategory: '单品授权', productLine: 'WPS365私有云', productClassFinance: 'WPS365', productLineFinance: 'WPS365私有云', productSeriesFinance: 'WPS365私有云', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018241', code: 'SKU0018241', name: '定制版（国家能源集团）', price: 15000, stock: 0, status: 'Inactive', pricingOptions: [{id:'po-SKU0018241', title:'年场地授权', price:15000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC043',name:'WPS 365旗舰版（私有云）',type:'Component'}, {id:'AC042',name:'WPS 365私有云部署包',type:'Component'}, {id:'AC005',name:'私有云文档中心',type:'Feature'}, {id:'AC008',name:'企业通讯录同步',type:'Feature'}]
  },
  {
    id: 'AB0002683', name: '数科OFD版式软件V5.0', category: '信创端', subCategory: '数科OFD用户端', status: 'OffShelf', tags: ['信创'], productType: '数科OFD用户端', onlineDelivery: '无', productClass: 'WPS软件业务', productClassification: '端', productSeries: 'OFD for Lin', productCategory: '单品授权', productLine: 'WPS Office', productClassFinance: 'WPS365', productLineFinance: 'WPS Office', productSeriesFinance: 'WPS Office', maintenanceContent: '/', maintenanceStandard: '/', hasUpgradeWarranty: false, hasAfterSalesService: false,
    skus: [
      { id: 'SKU0018131', code: 'SKU0018131', name: '2025通用机', price: 298, stock: 0, status: 'Inactive', pricingOptions: [{id:'po-SKU0018131', title:'数量授权', price:298, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }
    ],
    installPackages: [],
    composition: [{id:'AC039',name:'数科OFD版式软件',type:'Component'}]
  }
];

// --- Sales Merchandises ---
export const initialMerchandises: SalesMerchandise[] = [
    { id: 'M001', name: 'WPS 365 数字政务标准版', salesType: ['Direct', 'Channel'], pricingPolicy: 'Fixed', price: 199.0, status: 'Active', items: [{ productId: 'AB0002742', productName: 'WPS 365数字政务标准版', skuId: 'SKU0018227', skuName: '标准版', quantity: 1 }] },
    { id: 'M002', name: 'WPS 365 协作办公旗舰平台', salesType: ['Direct', 'Channel'], pricingPolicy: 'Fixed', price: 499.0, status: 'Active', items: [{ productId: 'AB0000841', productName: 'WPS 365协作办公旗舰平台V12', skuId: 'SKU0013541', skuName: '旗舰版', quantity: 1 }] },
    { id: 'M003', name: 'WPS 365 高级版 (私有云)', salesType: ['Channel', 'Direct'], pricingPolicy: 'Negotiable', price: 150000.0, status: 'Active', items: [{ productId: 'AB0002815', productName: 'WPS 365专业办公高级平台V7', skuId: 'SKU0018314', skuName: '定制版（保险保障基金）', quantity: 1 }] },
    { id: 'M004', name: 'WPS Office 2023 专业版 (Win)', salesType: ['Direct', 'Channel'], pricingPolicy: 'Fixed', price: 698.0, status: 'Active', items: [{ productId: 'AB0000765', productName: 'WPS Office 2023专业版办公软件V12.8', skuId: 'SKU0013394', skuName: '专业版', quantity: 1 }] },
    { id: 'M005', name: 'WPS黑马校对软件 (客户端)', salesType: ['Direct'], pricingPolicy: 'Negotiable', price: 4999.0, status: 'Active', items: [{ productId: 'AB0001721', productName: 'WPS黑马校对软件V31', skuId: 'SKU0017285', skuName: '单机版', quantity: 1 }] },
];

// --- Departments ---
export const initialDepartments: Department[] = [
    { id: 'root', name: 'NexOrder 总部', description: '公司最高管理机构' },
    { id: 'c2', name: '营销中心', description: '负责市场推广与销售', parentId: 'root' },
    { id: 'c3', name: '运营中心', description: '负责交付与服务', parentId: 'root' },
    { id: 'c2-d1', name: '国内销售部', description: '大陆地区业务', parentId: 'c2' },
    { id: 'c2-d1-r1', name: '华北区', description: '京津冀', parentId: 'c2-d1' },
    { id: 'c2-d1-r1-t1', name: '北京销售组', description: '北京客户', parentId: 'c2-d1-r1' },
    { id: 'c3-d1', name: '商务部', description: '合同与流程', parentId: 'c3' },
    { id: 'c3-d2', name: '物流部', description: '发货与库存', parentId: 'c3' },
];

// --- Roles ---
export const initialRoles: RoleDefinition[] = [
    { id: 'Admin', name: '管理员', description: '拥有系统所有权限', isSystem: true, permissions: ['all'] },
    { id: 'Sales', name: '销售经理', description: '负责客户跟进与订单录入', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_create', 'order_view_payment', 'order_view_shipped', 'order_view_completed', 'order_view_refund_pending', 'order_view_refunded', 'order_view_cancelled', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_shipping', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_opportunity', 'order_detail_shipping', 'order_detail_log', 'customer_view', 'opportunity_manage', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'leads_view', 'performance_view'] },
    { id: 'Business', name: '商务经理', description: '负责合同审批与收款确认', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_approve', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_contract', 'order_detail_settlement', 'order_detail_remark', 'order_detail_acceptance', 'order_detail_delivery', 'order_delivery_auth_change', 'order_delivery_redelivery', 'order_detail_log', 'payment_manage', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'order_view_refund_pending', 'order_view_refunded', 'order_view_cancelled'] },
    { id: 'Technical', name: '技术支持', description: '负责生产授权与安装包', isSystem: false, permissions: ['dashboard_view', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_view_stock_cd', 'order_workflow_view', 'order_workflow_stock', 'order_workflow_shipping', 'stock_prep', 'license_gen', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'wps_ops_view', 'authorization_view', 'delivery_info_view'] },
    { id: 'Executive', name: '高管', description: '公司高层管理人员，拥有全局数据查看权限', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_view_stock_cd', 'order_view_payment', 'order_view_shipped', 'order_view_completed', 'order_view_refund_pending', 'order_view_refunded', 'order_view_cancelled', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_stock', 'order_workflow_shipping', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_opportunity', 'order_detail_contract', 'order_detail_original', 'order_detail_settlement', 'order_detail_remark', 'order_detail_acceptance', 'order_detail_delivery', 'order_delivery_auth_change', 'order_delivery_redelivery', 'order_detail_shipping', 'order_detail_snapshot', 'order_detail_log', 'customer_view', 'opportunity_manage', 'channel_view', 'contract_view', 'payment_manage', 'invoice_manage', 'remittance_view', 'authorization_view', 'delivery_info_view', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'merchandise_view', 'leads_view', 'wps_ops_view', 'performance_view'] },
    { id: 'Commerce', name: '商务', description: '负责商务谈判、合同管理与发票对接', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_approve', 'order_view_shipped', 'order_view_completed', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_shipping', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_contract', 'order_detail_settlement', 'order_detail_remark', 'order_detail_acceptance', 'order_detail_log', 'customer_view', 'opportunity_manage', 'channel_view', 'contract_view', 'contract_edit', 'payment_manage', 'invoice_manage', 'invoice_approve', 'remittance_view', 'authorization_view', 'delivery_info_view', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'performance_view'] },
    { id: 'Month03', name: '3月', description: '3月份固定角色', isSystem: false, permissions: ['order_list_view', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_original', 'order_detail_log', 'product_display_view', 'product_view'] },
    { id: 'Month04', name: '4月', description: '4月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_view_all', 'order_view_pending_approval', 'order_workflow_view', 'order_workflow_payment', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_log', 'customer_view', 'product_display_view', 'product_view', 'product_tab_spu'] },
    { id: 'Month05', name: '5月', description: '5月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_opportunity', 'order_detail_log', 'customer_view', 'opportunity_manage', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku'] },
    { id: 'Month06', name: '6月', description: '6月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_contract', 'order_detail_settlement', 'order_detail_remark', 'order_detail_log', 'customer_view', 'contract_view', 'invoice_manage', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku'] },
    { id: 'Month07', name: '7月', description: '7月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_stock', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_contract', 'order_detail_acceptance', 'order_detail_delivery', 'order_detail_log', 'customer_view', 'contract_view', 'payment_manage', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'authorization_view'] },
    { id: 'Month08', name: '8月', description: '8月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_stock', 'order_workflow_shipping', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_contract', 'order_detail_settlement', 'order_detail_remark', 'order_detail_acceptance', 'order_detail_delivery', 'order_delivery_auth_change', 'order_detail_shipping', 'order_detail_log', 'customer_view', 'contract_view', 'payment_manage', 'invoice_manage', 'remittance_view', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'authorization_view', 'delivery_info_view'] },
    { id: 'Month09', name: '9月', description: '9月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_view_stock_cd', 'order_view_shipped', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_stock', 'order_workflow_shipping', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_opportunity', 'order_detail_contract', 'order_detail_settlement', 'order_detail_remark', 'order_detail_acceptance', 'order_detail_delivery', 'order_delivery_auth_change', 'order_delivery_redelivery', 'order_detail_shipping', 'order_detail_log', 'customer_view', 'opportunity_manage', 'contract_view', 'payment_manage', 'invoice_manage', 'remittance_view', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'authorization_view', 'delivery_info_view', 'performance_view'] },
    { id: 'Month10', name: '10月', description: '10月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_view_stock_cd', 'order_view_payment', 'order_view_shipped', 'order_view_completed', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_stock', 'order_workflow_shipping', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_opportunity', 'order_detail_contract', 'order_detail_original', 'order_detail_settlement', 'order_detail_remark', 'order_detail_acceptance', 'order_detail_delivery', 'order_delivery_auth_change', 'order_delivery_redelivery', 'order_detail_shipping', 'order_detail_snapshot', 'order_detail_log', 'customer_view', 'opportunity_manage', 'channel_view', 'contract_view', 'payment_manage', 'invoice_manage', 'remittance_view', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'merchandise_view', 'authorization_view', 'delivery_info_view', 'performance_view'] },
    { id: 'Month11', name: '11月', description: '11月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_view_stock_cd', 'order_view_payment', 'order_view_shipped', 'order_view_completed', 'order_view_refund_pending', 'order_view_refunded', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_stock', 'order_workflow_shipping', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_opportunity', 'order_detail_contract', 'order_detail_original', 'order_detail_settlement', 'order_detail_remark', 'order_detail_acceptance', 'order_detail_delivery', 'order_delivery_auth_change', 'order_delivery_redelivery', 'order_detail_shipping', 'order_detail_snapshot', 'order_detail_log', 'customer_view', 'opportunity_manage', 'channel_view', 'contract_view', 'payment_manage', 'invoice_manage', 'remittance_view', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'merchandise_view', 'leads_view', 'authorization_view', 'delivery_info_view', 'performance_view', 'wps_ops_view'] },
    { id: 'Month12', name: '12月', description: '12月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_view_stock_cd', 'order_view_payment', 'order_view_shipped', 'order_view_completed', 'order_view_refund_pending', 'order_view_refunded', 'order_view_cancelled', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_stock', 'order_workflow_shipping', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_opportunity', 'order_detail_contract', 'order_detail_original', 'order_detail_settlement', 'order_detail_remark', 'order_detail_acceptance', 'order_detail_delivery', 'order_delivery_auth_change', 'order_delivery_redelivery', 'order_detail_shipping', 'order_detail_snapshot', 'order_detail_log', 'customer_view', 'opportunity_manage', 'channel_view', 'contract_view', 'payment_manage', 'invoice_manage', 'invoice_approve', 'remittance_view', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'product_edit', 'merchandise_view', 'merchandise_edit', 'leads_view', 'authorization_view', 'delivery_info_view', 'performance_view', 'wps_ops_view'] },
];

// --- Users ---
export const initialUsers: User[] = [
    { id: 'u1', accountId: '10000001', name: '张伟', email: 'zhangwei@wps.cn', phone: '13800000001', role: 'Admin', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ZhangWei', departmentId: 'root' },
    { id: 'u2', accountId: '10000002', name: '李娜', email: 'lina@wps.cn', phone: '13800000002', role: 'Sales', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=LiNa', departmentId: 'c2-d1-r1-t1' },
    { id: 'u3', accountId: '10000003', name: '王强', email: 'wangqiang@wps.cn', phone: '13800000003', role: 'Business', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=WangQiang', departmentId: 'c3-d1' },
    { id: 'u4', accountId: '10000004', name: '赵敏', email: 'zhaomin@wps.cn', phone: '13800000004', role: 'Technical', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ZhaoMin', departmentId: 'root' },
    { id: 'u5', accountId: '10000005', name: '孙涛', email: 'suntao@wps.cn', phone: '13800000005', role: 'Technical', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=SunTao', departmentId: 'c3-d2' },
    { id: 'u6', accountId: '10000006', name: '周杰', email: 'zhoujie@wps.cn', phone: '13800000006', role: 'Sales', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix', departmentId: 'c2-d1' },
    { id: 'u7', accountId: '10000007', name: '吴刚', email: 'wugang@wps.cn', phone: '13800000007', role: 'Sales', userType: 'Internal', status: 'Inactive', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka', departmentId: 'c2-d1' },
    { id: 'u8', accountId: '10000008', name: '郑华', email: 'zhenghua@wps.cn', phone: '13800000008', role: 'Business', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ZhengHua', departmentId: 'c3-d1' },
    { id: 'u9', accountId: '20000001', name: '陈总', email: 'chen@wps.cn', phone: '13800000009', role: 'Sales', userType: 'External', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ChenPartner', departmentId: '' },
    { id: 'u10', accountId: '10000010', name: '苏雪松', email: 'suxuesong@wps.cn', phone: '17610166961', role: 'Business', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=SuXueSong', departmentId: 'c2-d1' },
    { id: 'u11', accountId: '10000011', name: '林通', email: 'lintong@wps.cn', phone: '13800000011', role: 'Executive', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=梅花', departmentId: 'root', monthBadge: '正月' },
    { id: 'u12', accountId: '10000012', name: '陆游', email: 'luyou@wps.cn', phone: '13800000012', role: 'Sales', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=杏花', departmentId: 'c2-d1', monthBadge: '二月' },
    { id: 'u13', accountId: '10000013', name: '息夫人', email: 'xifuren@wps.cn', phone: '13800000013', role: 'Month03', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=桃花', departmentId: 'c2-d1', monthBadge: '三月' },
    { id: 'u14', accountId: '10000014', name: '杨玉环', email: 'yangyuhuan@wps.cn', phone: '13800000014', role: 'Month04', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=芍药', departmentId: 'c3-d1', monthBadge: '四月' },
    { id: 'u15', accountId: '10000015', name: '张骞', email: 'zhangqian@wps.cn', phone: '13800000015', role: 'Month05', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=石榴花', departmentId: 'c2-d1-r1', monthBadge: '五月' },
    { id: 'u16', accountId: '10000016', name: '周敦颐', email: 'zhoudunyi@wps.cn', phone: '13800000016', role: 'Month06', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=荷花', departmentId: 'root', monthBadge: '六月' },
    { id: 'u17', accountId: '10000017', name: '徐渭', email: 'xuwei@wps.cn', phone: '13800000017', role: 'Month07', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=蜀葵', departmentId: 'root', monthBadge: '七月' },
    { id: 'u18', accountId: '10000018', name: '李清照', email: 'liqingzhao@wps.cn', phone: '13800000018', role: 'Month08', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=桂花', departmentId: 'c3-d1', monthBadge: '八月' },
    { id: 'u19', accountId: '10000019', name: '陶渊明', email: 'taoyuanming@wps.cn', phone: '13800000019', role: 'Month09', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=菊花', departmentId: 'c3-d1', monthBadge: '九月' },
    { id: 'u20', accountId: '10000020', name: '王昭君', email: 'wangzhaojun@wps.cn', phone: '13800000020', role: 'Month10', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=芙蓉', departmentId: 'c2-d1-r1-t1', monthBadge: '十月' },
    { id: 'u21', accountId: '10000021', name: '白居易', email: 'baijuyi@wps.cn', phone: '13800000021', role: 'Month11', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=山茶', departmentId: 'root', monthBadge: '冬月' },
];

// --- Channels ---
export const initialChannels: Channel[] = [
    { id: 'CH50004729', crmId: 'CH50004729', name: '上海万企明道软件有限公司', type: 'Reseller', level: 'Tier2', contactName: '沈磊', contactPhone: '13812345678', email: 'shen@mingdao.sh.cn', region: '华东', province: '上海市', city: '上海市', district: '浦东新区', country: '中国', companyAddress: '浦东新区张江高科技园区碧波路888号', companyPhone: '021-58765432', companyEmail: 'info@mingdao.sh.cn', companyZipCode: '201203', relatedParty: '非关联方', rebate: '有', parentChannel: '-', firstLevelChannel: '上海万企明道软件有限公司', bChannelManager: '沈磊', gChannelManager: '王芳', status: 'Active', contractStatus: '未签约', erpSyncStatus: '未同步', agreementDate: '2024-03-10' },
    { id: 'CH50004728', crmId: 'CH50004728', name: '武汉思行科技发展有限公司', type: 'Reseller', level: 'Tier2', contactName: '黄磊', contactPhone: '13922345678', email: 'huang@sixing.wh.cn', region: '华中', province: '湖北省', city: '武汉市', district: '洪山区', country: '中国', companyAddress: '洪山区光谷大道77号金融港B11栋', companyPhone: '027-87654321', companyEmail: 'hr@sixing.wh.cn', companyZipCode: '430074', relatedParty: '非关联方', rebate: '无', parentChannel: '上海万企明道软件有限公司', firstLevelChannel: '上海万企明道软件有限公司', bChannelManager: '黄磊', gChannelManager: '-', status: 'Active', contractStatus: '已签约', erpSyncStatus: '未同步', agreementDate: '2024-02-28' },
    { id: 'CH50004727', crmId: 'CH50004727', name: '大连联达科技有限公司', type: 'Distributor', level: 'Tier1', contactName: '陈强', contactPhone: '13611345678', email: 'chen@lianda.dl.cn', region: '东北', province: '辽宁省', city: '大连市', district: '高新园区', country: '中国', companyAddress: '高新园区黄浦路507号', companyPhone: '0411-84567890', companyEmail: 'office@lianda.dl.cn', companyZipCode: '116023', relatedParty: '非关联方', rebate: '有', parentChannel: '-', firstLevelChannel: '大连联达科技有限公司', bChannelManager: '陈强', gChannelManager: '李悦', status: 'Active', contractStatus: '已签约', erpSyncStatus: '未同步', agreementDate: '2024-01-15' },
    { id: 'CH50004726', crmId: 'CH50004726', name: '河南帆尊教育科技有限公司', type: 'Reseller', level: 'Tier2', contactName: '张丽', contactPhone: '13733345678', email: 'zhang@fanzun.hn.cn', region: '华中', province: '河南省', city: '郑州市', district: '金水区', country: '中国', companyAddress: '金水区经三路68号金城国际广场6楼', companyPhone: '0371-65432109', companyEmail: 'service@fanzun.hn.cn', companyZipCode: '450008', relatedParty: '非关联方', rebate: '无', parentChannel: '大连联达科技有限公司', firstLevelChannel: '大连联达科技有限公司', bChannelManager: '张丽', gChannelManager: '赵明', status: 'Active', contractStatus: '已签约', erpSyncStatus: '未同步', agreementDate: '2023-12-20' },
    { id: 'CH50004725', crmId: 'CH50004725', name: '甘肃金诺安电子科技有限公司', type: 'Reseller', level: 'Tier3', contactName: '王建国', contactPhone: '13544345678', email: 'wang@jinnuoan.gs.cn', region: '西北', province: '甘肃省', city: '兰州市', district: '城关区', country: '中国', companyAddress: '城关区天水北路222号万达广场15层', companyPhone: '0931-8765432', companyEmail: 'admin@jinnuoan.gs.cn', companyZipCode: '730030', relatedParty: '非关联方', rebate: '无', parentChannel: '西安奥吉通信技术有限公司', firstLevelChannel: '西安奥吉通信技术有限公司', bChannelManager: '王建国', gChannelManager: '-', status: 'Active', contractStatus: '已签约', erpSyncStatus: '已同步', agreementDate: '2023-11-10' },
    { id: 'CH50004724', crmId: 'CH50004724', name: '深圳市鑫云安开发科技有限公司', type: 'SI', level: 'Tier2', contactName: '刘洋', contactPhone: '13455345678', email: 'liu@xinyunan.sz.cn', region: '华南', province: '广东省', city: '深圳市', district: '南山区', country: '中国', companyAddress: '南山区科技园科技南一路28号', companyPhone: '0755-86543210', companyEmail: 'biz@xinyunan.sz.cn', companyZipCode: '518057', relatedParty: '关联方', rebate: '有', parentChannel: '-', firstLevelChannel: '深圳市鑫云安开发科技有限公司', bChannelManager: '刘洋', gChannelManager: '周涛', status: 'Active', contractStatus: '未签约', erpSyncStatus: '未同步', agreementDate: '2023-10-05' },
    { id: 'CH50004723', crmId: 'CH50004723', name: '上海爱数智得科技有限公司', type: 'ISV', level: 'Tier2', contactName: '孙磊', contactPhone: '13366345678', email: 'sun@aishu.sh.cn', region: '华东', province: '上海市', city: '上海市', district: '徐汇区', country: '中国', companyAddress: '徐汇区宜山路889号齐来大厦17楼', companyPhone: '021-64321098', companyEmail: 'contact@aishu.sh.cn', companyZipCode: '200233', relatedParty: '非关联方', rebate: '无', parentChannel: '上海万企明道软件有限公司', firstLevelChannel: '上海万企明道软件有限公司', bChannelManager: '孙磊', gChannelManager: '吴婷', status: 'Active', contractStatus: '未签约', erpSyncStatus: '已同步', agreementDate: '2023-09-18' },
    { id: 'CH50004722', crmId: 'CH50004722', name: '卫宁健康科技集团股份有限公司', type: 'Distributor', level: 'Tier1', contactName: '陈卫宁', contactPhone: '13277345678', email: 'chen@winning.sh.cn', region: '华东', province: '上海市', city: '上海市', district: '闵行区', country: '中国', companyAddress: '闵行区万源路2158号合川大厦8楼', companyPhone: '021-54876543', companyEmail: 'hr@winning.sh.cn', companyZipCode: '201100', relatedParty: '非关联方', rebate: '有', parentChannel: '-', firstLevelChannel: '卫宁健康科技集团股份有限公司', bChannelManager: '陈卫宁', gChannelManager: '郑伟', status: 'Active', contractStatus: '未签约', erpSyncStatus: '未同步', agreementDate: '2023-08-25' },
    { id: 'CH50004721', crmId: 'CH50004721', name: '北京龙安天下科技有限公司', type: 'SI', level: 'Tier2', contactName: '赵龙', contactPhone: '13188345678', email: 'zhao@longan.bj.cn', region: '华北', province: '北京市', city: '北京市', district: '海淀区', country: '中国', companyAddress: '海淀区中关村南大街甲6号铸诚大厦A座12层', companyPhone: '010-82654321', companyEmail: 'info@longan.bj.cn', companyZipCode: '100086', relatedParty: '非关联方', rebate: '无', parentChannel: '-', firstLevelChannel: '北京龙安天下科技有限公司', bChannelManager: '赵龙', gChannelManager: '孙丽', status: 'Active', contractStatus: '已签约', erpSyncStatus: '已同步', agreementDate: '2023-07-14' },
    { id: 'CH50004720', crmId: 'CH50004720', name: '成都恒汇软件技术有限公司', type: 'Reseller', level: 'Tier2', contactName: '李恒', contactPhone: '13099345678', email: 'li@henghui.cd.cn', region: '西南', province: '四川省', city: '成都市', district: '高新区', country: '中国', companyAddress: '高新区天府软件园E5栋3层', companyPhone: '028-85432100', companyEmail: 'admin@henghui.cd.cn', companyZipCode: '610041', relatedParty: '非关联方', rebate: '有', parentChannel: '深圳市鑫云安开发科技有限公司', firstLevelChannel: '深圳市鑫云安开发科技有限公司', bChannelManager: '李恒', gChannelManager: '-', status: 'Active', contractStatus: '已签约', erpSyncStatus: '未同步', agreementDate: '2023-06-30' },
    { id: 'CH50004719', crmId: 'CH50004719', name: '南京博远信息科技有限公司', type: 'Reseller', level: 'Tier3', contactName: '吴博', contactPhone: '18911345678', email: 'wu@boyuan.nj.cn', region: '华东', province: '江苏省', city: '南京市', district: '雨花台区', country: '中国', companyAddress: '雨花台区软件大道101号华为云谷B座7楼', companyPhone: '025-86543210', companyEmail: 'service@boyuan.nj.cn', companyZipCode: '210012', relatedParty: '非关联方', rebate: '无', parentChannel: '卫宁健康科技集团股份有限公司', firstLevelChannel: '卫宁健康科技集团股份有限公司', bChannelManager: '吴博', gChannelManager: '钱进', status: 'Active', contractStatus: '已签约', erpSyncStatus: '已同步', agreementDate: '2023-05-22' },
    { id: 'CH50004718', crmId: 'CH50004718', name: '西安奥吉通信技术有限公司', type: 'Distributor', level: 'Tier1', contactName: '杨明', contactPhone: '18822345678', email: 'yang@aoji.xa.cn', region: '西北', province: '陕西省', city: '西安市', district: '雁塔区', country: '中国', companyAddress: '雁塔区科技路38号林凯国际大厦18层', companyPhone: '029-87654321', companyEmail: 'office@aoji.xa.cn', companyZipCode: '710065', relatedParty: '非关联方', rebate: '有', parentChannel: '-', firstLevelChannel: '西安奥吉通信技术有限公司', bChannelManager: '杨明', gChannelManager: '冯静', status: 'Inactive', contractStatus: '已签约', erpSyncStatus: '未同步', agreementDate: '2023-04-10' },
    { id: 'CH50004717', crmId: 'CH50004717', name: '杭州数梦工场科技有限公司', type: 'ISV', level: 'Tier2', contactName: '钱海涛', contactPhone: '18733345678', email: 'qian@shumeng.hz.cn', region: '华东', province: '浙江省', city: '杭州市', district: '余杭区', country: '中国', companyAddress: '余杭区文一西路998号海创科技中心', companyPhone: '0571-88765432', companyEmail: 'biz@shumeng.hz.cn', companyZipCode: '311121', relatedParty: '关联方', rebate: '无', parentChannel: '上海爱数智得科技有限公司', firstLevelChannel: '上海万企明道软件有限公司', bChannelManager: '钱海涛', gChannelManager: '褚亮', status: 'Active', contractStatus: '已签约', erpSyncStatus: '已同步', agreementDate: '2023-03-05' },
    { id: 'CH50004716', crmId: 'CH50004716', name: '广州中鹏天成软件有限公司', type: 'Reseller', level: 'Tier2', contactName: '郑鹏', contactPhone: '18644345678', email: 'zheng@zptech.gz.cn', region: '华南', province: '广东省', city: '广州市', district: '天河区', country: '中国', companyAddress: '天河区天河北路233号中信广场45层', companyPhone: '020-87654321', companyEmail: 'support@zptech.gz.cn', companyZipCode: '510610', relatedParty: '非关联方', rebate: '有', parentChannel: '深圳市鑫云安开发科技有限公司', firstLevelChannel: '深圳市鑫云安开发科技有限公司', bChannelManager: '郑鹏', gChannelManager: '蒋芳', status: 'Active', contractStatus: '未签约', erpSyncStatus: '未同步', agreementDate: '2023-02-18' },
    { id: 'CH50004715', crmId: 'CH50004715', name: '天津飞天云动科技有限公司', type: 'SI', level: 'Tier3', contactName: '冯飞', contactPhone: '18555345678', email: 'feng@ftyd.tj.cn', region: '华北', province: '天津市', city: '天津市', district: '滨海新区', country: '中国', companyAddress: '滨海新区信息安全产业园区A5栋', companyPhone: '022-65432109', companyEmail: 'admin@ftyd.tj.cn', companyZipCode: '300457', relatedParty: '非关联方', rebate: '无', parentChannel: '北京龙安天下科技有限公司', firstLevelChannel: '北京龙安天下科技有限公司', bChannelManager: '冯飞', gChannelManager: '-', status: 'Active', contractStatus: '已签约', erpSyncStatus: '已同步', agreementDate: '2023-01-28' },
];

// --- Conversion Orders (折算单，由退单订单折算产生) ---
export const initialConversionOrders: ConversionOrder[] = [
    { id: 'ZS20260326142401000002', amount: 0.2, enterpriseName: '365套餐', sourceOrderId: 'RF20260326001', createdAt: '2026-03-26T14:24:01Z', status: 'Available' },
    { id: 'ZS20260324114815000002', amount: 10, enterpriseName: '测试2', sourceOrderId: 'RF20260324001', createdAt: '2026-03-24T11:48:15Z', status: 'Available' },
    { id: 'ZS20260324113911000004', amount: 41, enterpriseName: '测试进入缓冲期第二公司', sourceOrderId: 'RF20260324002', createdAt: '2026-03-24T11:39:11Z', status: 'Available' },
    { id: 'ZS20260324113911000003', amount: 149, enterpriseName: '测试进入缓冲期第二公司', sourceOrderId: 'RF20260324003', createdAt: '2026-03-24T11:39:11Z', status: 'Available' },
    { id: 'ZS20260324112519000003', amount: 33, enterpriseName: '0324lv2免费成长计划', sourceOrderId: 'RF20260324004', createdAt: '2026-03-24T11:25:19Z', status: 'Available' },
    { id: 'ZS20260320091245000001', amount: 520, enterpriseName: '量子云算科技有限公司', sourceOrderId: 'RF20260320001', createdAt: '2026-03-20T09:12:45Z', status: 'Available' },
    { id: 'ZS20260318155032000002', amount: 1200, enterpriseName: '星海数字信息技术有限公司', sourceOrderId: 'RF20260318001', createdAt: '2026-03-18T15:50:32Z', status: 'Available' },
    { id: 'ZS20260315103622000001', amount: 88.5, enterpriseName: '鼎鑫智能制造有限公司', sourceOrderId: 'RF20260315001', createdAt: '2026-03-15T10:36:22Z', status: 'Available' },
    { id: 'ZS20260312142201000003', amount: 2500, enterpriseName: '极光网络安全科技有限公司', sourceOrderId: 'RF20260312001', createdAt: '2026-03-12T14:22:01Z', status: 'Used' },
    { id: 'ZS20260310081530000001', amount: 450, enterpriseName: '万象大数据服务有限公司', sourceOrderId: 'RF20260310001', createdAt: '2026-03-10T08:15:30Z', status: 'Available' },
];

// --- Standalone Enterprises ---
export const initialStandaloneEnterprises: Enterprise[] = [
    { id: '99000001', name: '量子云算科技有限公司' },
    { id: '99000002', name: '星海数字信息技术有限公司' },
    { id: '99000003', name: '鼎鑫智能制造有限公司' },
    { id: '99000004', name: '未来芯片研究院有限公司' },
    { id: '99000005', name: '极光网络安全科技有限公司' },
    { id: '99000006', name: '万象大数据服务有限公司' },
    { id: '99000007', name: '碳链区块链技术有限公司' },
    { id: '99000008', name: '浩瀚卫星通信科技有限公司' },
    { id: '99000009', name: '凌峰人工智能有限公司' },
    { id: '99000010', name: '聚能新能源软件有限公司' },
];

// --- Install Package Rows (shared between InstallPackageManager and OrderCreateWizard) ---
export const INSTALL_PKG_PUBLIC_ROWS: InstallPackageRow[] = [
  { id: 'AZ0006288', deliveryItemId: '-', deliveryItemName: 'WPS PDF for Linux专业版', productId: 'AB0001878', productLine: '信创端', productType: 'PDF（信创）', productName: 'WPS PDF for Linux专业版软件V12', productSpec: '专业版', platform: 'Linux', os: '统信UOS', cpu: '海光', enabled: true, packageType: 'public' },
  { id: 'AZ0006287', deliveryItemId: '-', deliveryItemName: '数科OFD套式办公套件-通用机', productId: 'AB0002683', productLine: '信创端', productType: '数科OFD用户端', productName: '数科OFD办公套件软件V5.0', productSpec: '2025通用机版', platform: 'Linux', os: '麒麟', cpu: '麒麟', enabled: true, packageType: 'public' },
  { id: 'AZ0006286', deliveryItemId: '-', deliveryItemName: 'JK开发工具包专用', productId: 'AB0001010', productLine: '信创端', productType: 'WPS for Linux开发工具包专用', productName: 'WPS Office开发工具包软件V11', productSpec: 'JK专用', platform: 'Linux', os: '统信UOS', cpu: '飞腾', enabled: true, packageType: 'public' },
  { id: 'AZ0000336', deliveryItemId: '-', deliveryItemName: 'WPS Office 2023 for Linux流版套装办公软件V12.8', productId: 'AB0000772', productLine: '信创端', productType: '流版套装2023（Linux）', productName: 'WPS Office 2023 for Linux流版套装办公软件V12.8', productSpec: '专业版（Lin版）', platform: 'Linux', os: '中科方德', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0000340', deliveryItemId: '-', deliveryItemName: 'WPS Office 2023 for Linux流版套装办公软件V12.8', productId: 'AB0000772', productLine: '信创端', productType: '流版套装2023（Linux）', productName: 'WPS Office 2023 for Linux流版套装办公软件V12.8', productSpec: '专业版（Lin版）', platform: 'Linux', os: '统信UOS', cpu: '海光', enabled: true, packageType: 'public' },
  { id: 'AZ0005369', deliveryItemId: '905875', deliveryItemName: '12.8.2.24730-2023流版套装（非金融）通用机x64+中科方德', productId: 'AB0000772', productLine: '信创端', productType: '流版套装2023（Linux）', productName: 'WPS Office 2023 for Linux流版套装办公软件V12.8', productSpec: '专业版（Lin版）', platform: 'Linux', os: '中科方德', cpu: '兆芯', enabled: true, packageType: 'public' },
  { id: 'AZ0005371', deliveryItemId: '-', deliveryItemName: 'xc23流版套装非金融', productId: 'AB0000772', productLine: '信创端', productType: '流版套装2023（Linux）', productName: 'WPS Office 2023 for Linux流版套装办公软件V12.8', productSpec: '专业版（Lin版）', platform: 'Linux', os: '统信UOS', cpu: 'intel/AMD', enabled: false, packageType: 'public' },
  { id: 'AZ0005210', deliveryItemId: '-', deliveryItemName: 'WPS 365 信创版-飞腾专用', productId: 'AB0001927', productLine: '信创端', productType: 'WPS365信创版', productName: 'WPS 365 for Linux信创版办公软件V13', productSpec: '标准版', platform: 'Linux', os: '麒麟', cpu: '飞腾', enabled: true, packageType: 'public' },
  { id: 'AZ0005211', deliveryItemId: '-', deliveryItemName: 'WPS 365 信创版-龙芯专用', productId: 'AB0001927', productLine: '信创端', productType: 'WPS365信创版', productName: 'WPS 365 for Linux信创版办公软件V13', productSpec: '标准版', platform: 'Linux', os: '统信UOS', cpu: '龙芯mips', enabled: true, packageType: 'public' },
  { id: 'AZ0005212', deliveryItemId: '906100', deliveryItemName: 'WPS 365 信创版-兆芯专用-金融行业', productId: 'AB0001927', productLine: '信创端', productType: 'WPS365信创版', productName: 'WPS 365 for Linux信创版办公软件V13', productSpec: '金融版', platform: 'Linux', os: '麒麟', cpu: '兆芯', enabled: true, packageType: 'public' },
  { id: 'AZ0004900', deliveryItemId: '-', deliveryItemName: 'WPS Office 2023 Win专业版', productId: 'AB0000765', productLine: 'Win端', productType: 'Win2023专业版', productName: 'WPS Office 2023专业版V12.8', productSpec: '专业版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0004901', deliveryItemId: '812300', deliveryItemName: 'WPS Office 2023 Win专业增强版', productId: 'AB0000768', productLine: 'Win端', productType: 'Win2023专业增强版', productName: 'WPS Office 2023专业增强版V12.8', productSpec: '专业增强版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0004902', deliveryItemId: '-', deliveryItemName: 'WPS Office 2023 Win标准版', productId: 'AB0000790', productLine: 'Win端', productType: 'Win2023标准版', productName: 'WPS Office 2023标准版V12.8', productSpec: '标准版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0004950', deliveryItemId: '-', deliveryItemName: 'WPS Office 2023 Mac版', productId: 'AB0000841', productLine: 'Mac端', productType: 'Mac2023', productName: 'WPS Office 2023 for Mac软件V13', productSpec: '标准版', platform: 'Mac', os: 'MacOS', cpu: 'Mac', enabled: true, packageType: 'public' },
  { id: 'AZ0004951', deliveryItemId: '889200', deliveryItemName: 'WPS Office 2023 Mac专业版', productId: 'AB0000840', productLine: 'Mac端', productType: 'Mac2023专业版', productName: 'WPS Office 2023 for Mac专业版V13', productSpec: '专业版', platform: 'Mac', os: 'MacOS', cpu: 'Mac', enabled: true, packageType: 'public' },
  { id: 'AZ0003800', deliveryItemId: '-', deliveryItemName: 'WPS 365 移动端Android', productId: 'AB0002797', productLine: '移动端', productType: 'Android版', productName: 'WPS 365移动版V11.5', productSpec: '标准版', platform: 'Android', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0003801', deliveryItemId: '-', deliveryItemName: 'WPS 365 移动端iOS', productId: 'AB0002646', productLine: '移动端', productType: 'iOS版', productName: 'WPS 365移动版iOS V11.5', productSpec: '标准版', platform: 'iOS', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0003900', deliveryItemId: '801500', deliveryItemName: 'WPS PDF Win版专业套装', productId: 'AB0001879', productLine: 'Win端', productType: 'PDF工具', productName: 'WPS PDF专业版V5.0', productSpec: '专业版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0003901', deliveryItemId: '-', deliveryItemName: 'WPS PDF Mac版专业套装', productId: 'AB0000015', productLine: 'Mac端', productType: 'PDF工具', productName: 'WPS PDF for Mac专业版V4.0', productSpec: '专业版', platform: 'Mac', os: 'MacOS', cpu: 'Mac', enabled: true, packageType: 'public' },
  { id: 'AZ0002100', deliveryItemId: '-', deliveryItemName: 'WPS365 Win桌面端V13', productId: 'AB0001964', productLine: 'Win端', productType: 'WPS365专业版', productName: 'WPS 365企业版V13', productSpec: '企业版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0002101', deliveryItemId: '778800', deliveryItemName: 'WPS365 Win桌面端V13-信创麒麟', productId: 'AB0001964', productLine: '信创端', productType: 'WPS365信创企业版', productName: 'WPS 365企业版V13（信创）', productSpec: '企业版', platform: 'Linux', os: '麒麟', cpu: '麒麟', enabled: true, packageType: 'public' },
  { id: 'AZ0002102', deliveryItemId: '-', deliveryItemName: 'WPS365 Win桌面端V13-信创海光', productId: 'AB0001964', productLine: '信创端', productType: 'WPS365信创企业版', productName: 'WPS 365企业版V13（信创）', productSpec: '企业版', platform: 'Linux', os: '统信UOS', cpu: '海光', enabled: false, packageType: 'public' },
  { id: 'AZ0001500', deliveryItemId: '-', deliveryItemName: 'WPS轻文档Windows版', productId: 'AB0000047', productLine: 'Win端', productType: '轻文档', productName: 'WPS轻文档V3.0', productSpec: '标准版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0001501', deliveryItemId: '-', deliveryItemName: 'WPS轻文档Mac版', productId: 'AB0001707', productLine: 'Mac端', productType: '轻文档', productName: 'WPS轻文档V3.0 for Mac', productSpec: '标准版', platform: 'Mac', os: 'MacOS', cpu: 'Mac', enabled: true, packageType: 'public' },
  { id: 'AZ0000900', deliveryItemId: '745600', deliveryItemName: '数科OFD Linux专业版V4', productId: 'AB0000285', productLine: '信创端', productType: '数科OFD用户端', productName: '数科OFD办公套件软件V4.0', productSpec: '专业版', platform: 'Linux', os: '麒麟', cpu: '飞腾', enabled: true, packageType: 'public' },
  { id: 'AZ0000901', deliveryItemId: '-', deliveryItemName: '数科OFD Linux标准版V4', productId: 'AB0000285', productLine: '信创端', productType: '数科OFD用户端', productName: '数科OFD办公套件软件V4.0', productSpec: '标准版', platform: 'Linux', os: '深度', cpu: '龙芯mips', enabled: true, packageType: 'public' },
  { id: 'AZ0000902', deliveryItemId: '-', deliveryItemName: '数科OFD Linux通用版V4', productId: 'AB0000285', productLine: '信创端', productType: '数科OFD用户端', productName: '数科OFD办公套件软件V4.0', productSpec: '通用版', platform: 'Linux', os: '中科方德', cpu: 'intel/AMD', enabled: false, packageType: 'public' },
  { id: 'AZ0006100', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版海光', productId: 'AB0002012', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '统信UOS', cpu: '海光', enabled: true, packageType: 'public' },
  { id: 'AZ0006101', deliveryItemId: '920100', deliveryItemName: 'WPS Office 2025 信创版麒麟', productId: 'AB0002012', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '麒麟', cpu: '麒麟', enabled: true, packageType: 'public' },
  { id: 'AZ0006102', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版兆芯', productId: 'AB0002012', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '中科方德', cpu: '兆芯', enabled: true, packageType: 'public' },
  { id: 'AZ0006103', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版飞腾', productId: 'AB0002012', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '统信UOS', cpu: '飞腾', enabled: true, packageType: 'public' },
  { id: 'AZ0006104', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版龙芯', productId: 'AB0002012', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '统信UOS', cpu: '龙芯aarch', enabled: false, packageType: 'public' },
  { id: 'AZ0006200', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版鲲鹏', productId: 'AB0002012', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '麒麟', cpu: '鲲鹏', enabled: true, packageType: 'public' },
  { id: 'AZ0006201', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版腾锐', productId: 'AB0000021', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '统信UOS', cpu: '腾锐', enabled: true, packageType: 'public' },
  { id: 'AZ0006202', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版申威', productId: 'AB0000021', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '深度', cpu: '申威', enabled: true, packageType: 'public' },
  { id: 'AZ0006203', deliveryItemId: '-', deliveryItemName: 'WPS Office 2025 信创版盘古', productId: 'AB0000021', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '专业版', platform: 'Linux', os: '中科方德', cpu: '盘古', enabled: false, packageType: 'public' },
  { id: 'AZ0020050', deliveryItemId: '-', deliveryItemName: 'WPS365高级平台-客户端通用包(Win)', productId: 'AB0002815', productLine: 'Win端', productType: 'WPS365高级版', productName: 'WPS 365专业办公高级平台V7', productSpec: '标准版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0020051', deliveryItemId: '-', deliveryItemName: 'WPS365高级平台-客户端通用包(Linux麒麟)', productId: 'AB0002815', productLine: '信创端', productType: 'WPS365高级版', productName: 'WPS 365专业办公高级平台V7', productSpec: '信创版', platform: 'Linux', os: '麒麟', cpu: '飞腾', enabled: true, packageType: 'public' },
  { id: 'AZ0020052', deliveryItemId: '-', deliveryItemName: 'WPS365高级平台-客户端通用包(Linux统信)', productId: 'AB0002815', productLine: '信创端', productType: 'WPS365高级版', productName: 'WPS 365专业办公高级平台V7', productSpec: '信创版', platform: 'Linux', os: '统信UOS', cpu: '海光', enabled: true, packageType: 'public' },
  { id: 'AZ0020060', deliveryItemId: '-', deliveryItemName: 'WPS365旗舰平台-客户端通用包(Win)', productId: 'AB0002796', productLine: 'Win端', productType: 'WPS365旗舰版', productName: 'WPS 365专业办公旗舰平台V7', productSpec: '标准版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0020061', deliveryItemId: '-', deliveryItemName: 'WPS365旗舰平台-客户端通用包(Linux)', productId: 'AB0002796', productLine: '信创端', productType: 'WPS365旗舰版', productName: 'WPS 365专业办公旗舰平台V7', productSpec: '信创版', platform: 'Linux', os: '统信UOS', cpu: '海光', enabled: true, packageType: 'public' },
  { id: 'AZ0020070', deliveryItemId: '-', deliveryItemName: 'WPS365高级平台V7-客户端通用包(Win)', productId: 'AB0002814', productLine: 'Win端', productType: 'WPS365高级版', productName: 'WPS 365专业办公高级平台V7', productSpec: '标准版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'public' },
  { id: 'AZ0020071', deliveryItemId: '-', deliveryItemName: 'WPS365高级平台V7-客户端通用包(Linux)', productId: 'AB0002814', productLine: '信创端', productType: 'WPS365高级版', productName: 'WPS 365专业办公高级平台V7', productSpec: '信创版', platform: 'Linux', os: '麒麟', cpu: '鲲鹏', enabled: true, packageType: 'public' },
];

export const INSTALL_PKG_PRIVATE_ROWS: InstallPackageRow[] = [
  { id: 'AZ0010001', deliveryItemId: '-', deliveryItemName: 'WPS 365私有云部署包-标准版', productId: 'AB0002815', productLine: 'WPS365私有云', productType: 'WPS365高级版（私有云）', productName: 'WPS 365私有云企业版V7', productSpec: '标准版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010002', deliveryItemId: '913000', deliveryItemName: 'WPS 365私有云部署包-高可用版', productId: 'AB0002815', productLine: 'WPS365私有云', productType: 'WPS365高级版（私有云）', productName: 'WPS 365私有云企业版V7', productSpec: '高可用版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010003', deliveryItemId: '-', deliveryItemName: 'WPS 365私有云部署包-ARM版', productId: 'AB0002815', productLine: 'WPS365私有云', productType: 'WPS365高级版（私有云）', productName: 'WPS 365私有云企业版V7', productSpec: 'ARM版', platform: 'Linux', os: '-', cpu: '鲲鹏', enabled: true, packageType: 'private' },
  { id: 'AZ0010004', deliveryItemId: '-', deliveryItemName: 'WPS 365私有云基础版部署包', productId: 'AB0002814', productLine: 'WPS365私有云', productType: 'WPS365高级版（私有云）', productName: 'WPS 365私有云基础版V7', productSpec: '基础版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010005', deliveryItemId: '913100', deliveryItemName: 'WPS 365私有云基础版-信创飞腾', productId: 'AB0002814', productLine: 'WPS365私有云', productType: 'WPS365高级版（私有云）', productName: 'WPS 365私有云基础版V7', productSpec: '信创版', platform: 'Linux', os: '麒麟', cpu: '飞腾', enabled: true, packageType: 'private' },
  { id: 'AZ0010006', deliveryItemId: '-', deliveryItemName: 'WPS 365私有云基础版-信创麒麟', productId: 'AB0002814', productLine: 'WPS365私有云', productType: 'WPS365高级版（私有云）', productName: 'WPS 365私有云基础版V7', productSpec: '信创版', platform: 'Linux', os: '麒麟', cpu: '麒麟', enabled: false, packageType: 'private' },
  { id: 'AZ0010100', deliveryItemId: '-', deliveryItemName: '私有云文档协作平台V3', productId: 'AB0002807', productLine: 'WPS365私有云', productType: '文档协作私有云', productName: '私有云文档协作平台软件V3.0', productSpec: '企业版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010101', deliveryItemId: '915500', deliveryItemName: '私有云文档协作平台V3-ARM', productId: 'AB0002807', productLine: 'WPS365私有云', productType: '文档协作私有云', productName: '私有云文档协作平台软件V3.0', productSpec: '企业版ARM', platform: 'Linux', os: '-', cpu: '鲲鹏', enabled: true, packageType: 'private' },
  { id: 'AZ0010200', deliveryItemId: '-', deliveryItemName: '私有云IM服务部署包V2', productId: 'AB0002746', productLine: 'WPS365私有云', productType: '私有云IM', productName: 'WPS私有IM服务V2', productSpec: '标准版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010201', deliveryItemId: '-', deliveryItemName: '私有云会议系统部署包', productId: 'AB0002796', productLine: 'WPS365私有云', productType: '私有云会议', productName: '私有云企业会议系统V2', productSpec: '标准版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010300', deliveryItemId: '918800', deliveryItemName: '混合云连接器-标准版', productId: 'AB0001880', productLine: '混合云方案', productType: '混合云连接器', productName: '混合云连接器软件V1.5', productSpec: '标准版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010301', deliveryItemId: '-', deliveryItemName: '混合云连接器-高可用版', productId: 'AB0001880', productLine: '混合云方案', productType: '混合云连接器', productName: '混合云连接器软件V1.5', productSpec: '高可用版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: false, packageType: 'private' },
  { id: 'AZ0010400', deliveryItemId: '-', deliveryItemName: 'WebOffice私有化SDK-x86', productId: 'AB0001841', productLine: '私有云单品', productType: 'Web Office', productName: 'WebOffice SDK私有版V3.5', productSpec: '标准版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010401', deliveryItemId: '922000', deliveryItemName: 'WebOffice私有化SDK-ARM', productId: 'AB0001841', productLine: '私有云单品', productType: 'Web Office', productName: 'WebOffice SDK私有版V3.5', productSpec: 'ARM版', platform: 'Linux', os: '-', cpu: '鲲鹏', enabled: true, packageType: 'private' },
  { id: 'AZ0010500', deliveryItemId: '-', deliveryItemName: 'WPS 365私有云V8-全功能包', productId: 'AB0002764', productLine: 'WPS365私有云', productType: 'WPS365私有云V8', productName: 'WPS 365私有云企业版V8', productSpec: '全功能版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010501', deliveryItemId: '-', deliveryItemName: 'WPS 365私有云V8-基础包', productId: 'AB0002764', productLine: 'WPS365私有云', productType: 'WPS365私有云V8', productName: 'WPS 365私有云企业版V8', productSpec: '基础版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010502', deliveryItemId: '925600', deliveryItemName: 'WPS 365私有云V8-信创兆芯', productId: 'AB0002764', productLine: 'WPS365私有云', productType: 'WPS365私有云V8', productName: 'WPS 365私有云企业版V8', productSpec: '信创版', platform: 'Linux', os: '统信UOS', cpu: '兆芯', enabled: true, packageType: 'private' },
  { id: 'AZ0010600', deliveryItemId: '-', deliveryItemName: '文档中台私有化部署包', productId: 'AB0002613', productLine: '私有云单品', productType: '文档中台', productName: '文档中台私有化软件V2.0', productSpec: '标准版', platform: 'Linux', os: '-', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0010601', deliveryItemId: '-', deliveryItemName: '文档中台私有化部署包-ARM', productId: 'AB0002613', productLine: '私有云单品', productType: '文档中台', productName: '文档中台私有化软件V2.0', productSpec: 'ARM版', platform: 'Linux', os: '-', cpu: '鲲鹏', enabled: false, packageType: 'private' },
  { id: 'AZ0020001', deliveryItemId: '-', deliveryItemName: 'WPS 2023 Win专业版-企业定制部署包', productId: 'AB0000765', productLine: 'Win端', productType: 'Win2023专业版', productName: 'WPS Office 2023专业版V12.8', productSpec: '企业定制版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0020002', deliveryItemId: '-', deliveryItemName: 'WPS 2023 Win专业版-金融定制包', productId: 'AB0000765', productLine: 'Win端', productType: 'Win2023专业版', productName: 'WPS Office 2023专业版V12.8', productSpec: '金融定制版', platform: 'Windows', os: 'Windows Server', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0020010', deliveryItemId: '-', deliveryItemName: 'WPS 2023 Linux专业版-定制部署包(麒麟)', productId: 'AB0000772', productLine: '信创端', productType: '信创2023', productName: 'WPS Office 2023 for Linux专业版V12.8', productSpec: '定制版', platform: 'Linux', os: '麒麟', cpu: '飞腾', enabled: true, packageType: 'private' },
  { id: 'AZ0020011', deliveryItemId: '-', deliveryItemName: 'WPS 2023 Linux专业版-定制部署包(统信)', productId: 'AB0000772', productLine: '信创端', productType: '信创2023', productName: 'WPS Office 2023 for Linux专业版V12.8', productSpec: '定制版', platform: 'Linux', os: '统信UOS', cpu: '海光', enabled: true, packageType: 'private' },
  { id: 'AZ0020012', deliveryItemId: '-', deliveryItemName: 'WPS 2023 Linux专业版-金融定制包', productId: 'AB0000772', productLine: '信创端', productType: '信创2023', productName: 'WPS Office 2023 for Linux专业版V12.8', productSpec: '金融定制版', platform: 'Linux', os: '麒麟', cpu: '鲲鹏', enabled: true, packageType: 'private' },
  { id: 'AZ0020020', deliveryItemId: '-', deliveryItemName: 'WPS 2025信创版-政府定制部署包', productId: 'AB0002012', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '政府定制版', platform: 'Linux', os: '麒麟', cpu: '飞腾', enabled: true, packageType: 'private' },
  { id: 'AZ0020021', deliveryItemId: '-', deliveryItemName: 'WPS 2025信创版-央企定制部署包', productId: 'AB0002012', productLine: '信创端', productType: 'WPS2025信创版', productName: 'WPS Office 2025信创版V14', productSpec: '央企定制版', platform: 'Linux', os: '统信UOS', cpu: '海光', enabled: true, packageType: 'private' },
  { id: 'AZ0020030', deliveryItemId: '-', deliveryItemName: 'WPS365 央企版-定制部署包(Win)', productId: 'AB0001964', productLine: 'Win端', productType: 'WPS365企业版', productName: 'WPS 365企业版V13', productSpec: '央企定制版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0020031', deliveryItemId: '-', deliveryItemName: 'WPS365 央企版-信创定制包(麒麟)', productId: 'AB0001964', productLine: '信创端', productType: 'WPS365企业版', productName: 'WPS 365企业版V13', productSpec: '信创定制版', platform: 'Linux', os: '麒麟', cpu: '麒麟', enabled: true, packageType: 'private' },
  { id: 'AZ0020040', deliveryItemId: '-', deliveryItemName: 'WPS365信创版-政务定制包(飞腾)', productId: 'AB0001927', productLine: '信创端', productType: 'WPS365信创版', productName: 'WPS 365 for Linux信创版V13', productSpec: '政务定制版', platform: 'Linux', os: '麒麟', cpu: '飞腾', enabled: true, packageType: 'private' },
  { id: 'AZ0020041', deliveryItemId: '-', deliveryItemName: 'WPS365信创版-政务定制包(龙芯)', productId: 'AB0001927', productLine: '信创端', productType: 'WPS365信创版', productName: 'WPS 365 for Linux信创版V13', productSpec: '政务定制版', platform: 'Linux', os: '统信UOS', cpu: '龙芯mips', enabled: true, packageType: 'private' },
  { id: 'AZ0020080', deliveryItemId: '-', deliveryItemName: 'WPS PDF Win专业版-企业定制包', productId: 'AB0001879', productLine: 'Win端', productType: 'PDF工具', productName: 'WPS PDF专业版V5.0', productSpec: '企业定制版', platform: 'Windows', os: 'Windows', cpu: 'intel/AMD', enabled: true, packageType: 'private' },
  { id: 'AZ0020081', deliveryItemId: '-', deliveryItemName: 'WPS PDF Linux专业版-定制包', productId: 'AB0001878', productLine: '信创端', productType: 'PDF（信创）', productName: 'WPS PDF for Linux专业版软件V12', productSpec: '定制版', platform: 'Linux', os: '麒麟', cpu: '飞腾', enabled: true, packageType: 'private' },
  { id: 'AZ0020090', deliveryItemId: '-', deliveryItemName: '数科OFD V5.0-政务定制包', productId: 'AB0002683', productLine: '信创端', productType: '数科OFD用户端', productName: '数科OFD版式软件V5.0', productSpec: '政务定制版', platform: 'Linux', os: '麒麟', cpu: '飞腾', enabled: true, packageType: 'private' },
  { id: 'AZ0020091', deliveryItemId: '-', deliveryItemName: '数科OFD V3.0-定制部署包', productId: 'AB0000285', productLine: '信创端', productType: '数科OFD用户端', productName: '数科OFD版式软件V3.0', productSpec: '定制版', platform: 'Linux', os: '统信UOS', cpu: '海光', enabled: true, packageType: 'private' },
];

export const ALL_INSTALL_PKG_ROWS: InstallPackageRow[] = [...INSTALL_PKG_PUBLIC_ROWS, ...INSTALL_PKG_PRIVATE_ROWS];
