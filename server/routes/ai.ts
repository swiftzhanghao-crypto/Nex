import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { authMiddleware } from '../auth.ts';

const router = Router();

let _ai: GoogleGenAI | null = null;
let _missing = false;

function getAI(): GoogleGenAI | null {
  if (_missing) return null;
  if (_ai) return _ai;
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    _missing = true;
    console.warn('[ai] GEMINI_API_KEY 未配置，AI 接口将返回 503');
    return null;
  }
  _ai = new GoogleGenAI({ apiKey: key });
  return _ai;
}

// /status 不走鉴权——前端登录前的探测调用即可返回，避免产生误导性的 401 控制台错误
router.get('/status', (_req, res) => {
  res.json({ configured: !!process.env.GEMINI_API_KEY });
});

// 其他 AI 接口需要登录态
router.use(authMiddleware);

router.post('/generate', async (req, res) => {
  const ai = getAI();
  if (!ai) {
    res.status(503).json({ error: 'AI 服务未配置 (GEMINI_API_KEY)' });
    return;
  }
  const { prompt, model = 'gemini-2.5-flash' } = req.body || {};
  if (typeof prompt !== 'string' || prompt.length === 0) {
    res.status(400).json({ error: 'prompt 必填' });
    return;
  }
  if (prompt.length > 20000) {
    res.status(413).json({ error: 'prompt 过长' });
    return;
  }
  try {
    const response = await ai.models.generateContent({ model, contents: prompt });
    res.json({ text: response.text || '' });
  } catch (err: any) {
    console.error('[ai] generate error:', err?.message);
    res.status(502).json({ error: 'AI 调用失败' });
  }
});

router.post('/generate-json', async (req, res) => {
  const ai = getAI();
  if (!ai) {
    res.status(503).json({ error: 'AI 服务未配置' });
    return;
  }
  const { prompt, schema, model = 'gemini-2.5-flash' } = req.body || {};
  if (typeof prompt !== 'string' || !prompt) {
    res.status(400).json({ error: 'prompt 必填' });
    return;
  }
  if (!schema || typeof schema !== 'object') {
    res.status(400).json({ error: 'schema 必填' });
    return;
  }
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });
    const text = response.text || '';
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* ignore */ }
    res.json({ text, json });
  } catch (err: any) {
    console.error('[ai] generate-json error:', err?.message);
    res.status(502).json({ error: 'AI 调用失败' });
  }
});

router.post('/category-suggest', async (req, res) => {
  const ai = getAI();
  if (!ai) {
    res.status(503).json({ error: 'AI 服务未配置' });
    return;
  }
  const { productName } = req.body || {};
  if (typeof productName !== 'string' || !productName.trim()) {
    res.status(400).json({ error: 'productName 必填' });
    return;
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `为产品 "${productName}" 建议一个单一的类别名称。请使用简体中文回答。`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: { category: { type: Type.STRING } },
        },
      },
    });
    const text = response.text || '';
    let category = '通用';
    try {
      const json = JSON.parse(text);
      if (json && typeof json.category === 'string') category = json.category;
    } catch { /* fallback to default */ }
    res.json({ category });
  } catch (err: any) {
    console.error('[ai] category-suggest error:', err?.message);
    res.status(502).json({ error: 'AI 调用失败' });
  }
});

export default router;
