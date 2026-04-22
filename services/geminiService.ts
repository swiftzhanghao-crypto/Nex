/**
 * 前端不再直接持有 Gemini API Key——所有调用通过后端 /api/ai/* 代理。
 * 若后端未配置 GEMINI_API_KEY，则相关函数会捕获错误并返回降级文案。
 */
const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

async function aiPost<T>(path: string, body: any): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `AI 请求失败 (${res.status})`);
  }
  return res.json();
}

export const generateProductDescription = async (
  name: string,
  category: string,
  keywords: string,
): Promise<string> => {
  try {
    const prompt = `请为名为 "${name}" 的产品（类别："${category}"）撰写一段引人入胜的简短营销描述（最多2句话）。必须包含关键词：${keywords}。请使用简体中文回答。`;
    const data = await aiPost<{ text: string }>('/ai/generate', { prompt });
    return data.text || '未生成描述。';
  } catch (error) {
    console.error('AI generateProductDescription error:', error);
    return '生成描述时出错，请重试。';
  }
};

export const generateBusinessInsight = async (
  totalRevenue: number,
  totalOrders: number,
  topProduct: string,
): Promise<string> => {
  try {
    const prompt = `扮演一位资深商业分析师。分析以下数据：总收入：¥${totalRevenue}，总订单数：${totalOrders}，最畅销产品类别：${topProduct}。请提供一份简短的、包含3个要点的执行摘要，并给出一个可行的建议。请使用纯文本格式，并用简体中文回答。`;
    const data = await aiPost<{ text: string }>('/ai/generate', { prompt });
    return data.text || '未生成洞察。';
  } catch (error) {
    console.error('AI generateBusinessInsight error:', error);
    return '生成洞察时出错。';
  }
};

export const suggestCategory = async (productName: string): Promise<string> => {
  try {
    const data = await aiPost<{ category: string }>('/ai/category-suggest', { productName });
    return data.category || '通用';
  } catch (error) {
    console.error('AI suggestCategory error:', error);
    return '通用';
  }
};
