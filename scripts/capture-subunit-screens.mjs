import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

// 部分环境 Vite 仅绑定 ::1，用 localhost 更稳
const base = process.env.VITE_DEV_URL || 'http://localhost:5176';
const outDir = 'docs/images';

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function shot(name, full = true) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: full });
  console.log('written', name);
}

// 1) 订单列表
await page.goto(`${base}/#/orders`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(3500);
await shot('subunit-01-order-list', false);

// 2) 取列表中第一笔订单号（S + 数字，与生成器一致）
const firstRowText = await page.locator('tbody tr').first().innerText().catch(() => '');
const m = firstRowText.match(/S\d{10,20}/) || firstRowText.match(/S[0-9A-Za-z-]{8,}/);
const oid = m ? m[0] : null;
if (!oid) {
  console.error('No order id found in first row');
  await browser.close();
  process.exit(1);
}
await page.goto(`${base}/#/orders/${oid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await shot('subunit-02-order-detail', true);

// 3) 打开产品明细行抽屉 → 下级单位授权 Tab
const lineBtn = page.getByRole('button', { name: /^0\d{2}$/ }).first();
await lineBtn.click();
await page.waitForTimeout(1200);
const subTab = page.getByRole('button', { name: '下级单位授权' });
if (await subTab.isVisible().catch(() => false)) {
  await subTab.click();
  await page.waitForTimeout(600);
}
await shot('subunit-03-item-drawer-subunit', true);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

await browser.close();
console.log('ok', { orderId: oid, images: ['subunit-01-order-list', 'subunit-02-order-detail', 'subunit-03-item-drawer-subunit'] });
