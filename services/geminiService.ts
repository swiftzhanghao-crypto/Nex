import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a creative product description based on name and category.
 */
export const generateProductDescription = async (name: string, category: string, keywords: string): Promise<string> => {
  if (!apiKey) return "API Key 缺失，无法生成描述。";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `请为名为 "${name}" 的产品（类别："${category}"）撰写一段引人入胜的简短营销描述（最多2句话）。必须包含关键词：${keywords}。请使用简体中文回答。`,
    });
    return response.text || "未生成描述。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "生成描述时出错，请重试。";
  }
};

/**
 * Generates a business insight report based on current dashboard statistics.
 */
export const generateBusinessInsight = async (
  totalRevenue: number, 
  totalOrders: number, 
  topProduct: string
): Promise<string> => {
  if (!apiKey) return "API Key 缺失，无法生成洞察。";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `扮演一位资深商业分析师。分析以下数据：总收入：¥${totalRevenue}，总订单数：${totalOrders}，最畅销产品类别：${topProduct}。请提供一份简短的、包含3个要点的执行摘要，并给出一个可行的建议。请使用纯文本格式，并用简体中文回答。`,
    });
    return response.text || "未生成洞察。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "生成洞察时出错。";
  }
};

/**
 * Suggests a product category based on a product name using JSON schema.
 */
export const suggestCategory = async (productName: string): Promise<string> => {
    if (!apiKey) return "通用";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `为产品 "${productName}" 建议一个单一的类别名称。请使用简体中文回答。`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING }
                    }
                }
            }
        });
        
        const text = response.text;
        if (text) {
            const json = JSON.parse(text);
            return json.category || "通用";
        }
        return "通用";
    } catch (error) {
        console.error("Gemini Category Error", error);
        return "通用";
    }
}