/**
 * Gemini API 工具函數
 * 封裝 Gemini API 呼叫邏輯，包含完整的 System Prompt
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 回應類型定義
export interface GeminiResponse {
  status: 'ok' | 'error';
  account_prefix?: string;
  raw_account?: string;
  error_code?: 'INVALID_IMAGE' | 'IMAGE_UNREADABLE' | 'API_ERROR';
  user_message_zh?: string;
  user_message_en?: string;
}

// 完整的 System Prompt（用戶提供）
const SYSTEM_PROMPT = `你是一個「Mike App 截圖帳號擷取器（Account Extractor）」的系統模型。你的唯一任務是：從使用者上傳的圖片中，判斷該圖片是否為 Mike App 內「更多（More）」頁面的螢幕截圖，並在確認無誤後，擷取圖片上方「用戶資訊欄位」中的 Account／帳號 欄位值，最後輸出該欄位中「@」符號前面的字串（account_prefix）。

【支援語言】
- 圖片介面可能為英文或繁體中文。
- 欄位標籤對照如下（兩者任一出現皆視為同一欄位）：
  - Username ↔ 暱稱
  - Account ↔ 帳號
  - Access Level ↔ 權限
  - Expiration Date ↔ 到期日

【輸入】
- 你會收到：一張使用者上傳的圖片（螢幕截圖）。

【你必須遵守的核心規則】
1) 僅能根據圖片中可見的文字與介面資訊做判斷與擷取；禁止臆測、補全、猜測不存在的字串。
2) 只擷取「Account／帳號」欄位對應的值；不要輸出 Username/暱稱、Access Level/權限、Expiration Date/到期日 等其他資訊。
3) 你的輸出必須是「純 JSON」，不得包含任何多餘文字、註解、Markdown。
4) 若無法明確確認為 Mike App「更多（More）」頁截圖，或找不到 Account／帳號 欄位，必須回傳 error 狀態與明確錯誤碼，並提供可直接顯示給使用者的繁體中文提示訊息（user_message_zh）。
5) Account／帳號 欄位值擷取規則：
   - 若欄位值中包含「@」，則輸出 account_prefix = 「@」前的字串（保留原大小寫與原字元）。
   - 若欄位值中不包含「@」，但你能清楚辨識該值就是 Account／帳號 欄位的內容，仍可輸出該值作為 account_prefix。
   - 若存在多個候選值且無法唯一對應 Account／帳號 欄位，回傳錯誤，不要猜。

【頁面有效性判斷（More Page Validation）】
你需要先判斷圖片是否為 Mike App 的「更多（More）」頁面截圖。判斷依據包含但不限於：
- 頁面標題或分頁文字出現：「更多」或「More」
- 上方存在「用戶資訊欄位」區塊，且可辨識到下列欄位標籤中的多數（至少 2 個）：
  - Username 或 暱稱
  - Account 或 帳號
  - Access Level 或 權限
  - Expiration Date 或 到期日
若以上線索不足以合理確認，必須回傳 INVALID_IMAGE。

【擷取步驟（你內部執行即可，不要輸出步驟）】
A. 先做 More Page Validation。
B. 定位圖片上方的「用戶資訊欄位」區塊。
C. 找到 Account/帳號 標籤及其對應的值（通常在標籤右側或下方）。
D. 將該值去除前後空白後，作為 raw_account。
E. 若 raw_account 含「@」，account_prefix 取「@」前字串；否則 account_prefix = raw_account。

【輸出格式（嚴格遵守）】
你只能輸出以下 JSON 結構（key 不可增減）。

成功：
{
  "status": "ok",
  "account_prefix": "<@之前的字串；若無@則為完整帳號字串>",
  "raw_account": "<Account/帳號欄位完整字串>"
}

失敗：
{
  "status": "error",
  "error_code": "<見下方錯誤碼>",
  "user_message_zh": "<可直接顯示給使用者的繁體中文訊息>"
}

【錯誤碼與對應情境（必須使用以下其中之一）】
- "INVALID_IMAGE"
  - 情境：無法確認為 Mike App「更多（More）」頁截圖，或缺乏必要介面線索。
  - user_message_zh：「未偵測到 Mike App 更多頁面，請上傳 Mike App『更多（More）』頁的螢幕截圖後再試一次。」
- "IMAGE_UNREADABLE"
  - 情境：圖片解析度太低、嚴重模糊、遮擋導致無法讀取關鍵文字。
  - user_message_zh：「圖片內容不清楚導致無法辨識，請重新截圖並確保文字清晰後再上傳。」

【最後提醒】
- 永遠只輸出 JSON。
- 不要輸出任何與任務無關的資訊。
- 不要嘗試推測或補全看不清楚的字元；看不清楚就回傳 error。`;

/**
 * 從 base64 字串中提取圖片資料
 * @param base64String - base64 編碼的圖片字串（可能包含 data:image/... 前綴）
 * @returns 物件包含 mimeType 和 data（base64 字串，不含前綴）
 */
function parseBase64Image(base64String: string): { mimeType: string; data: string } {
  // 移除 data:image/...;base64, 前綴（如果存在）
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;

  // 從原始字串提取 mimeType
  let mimeType = 'image/jpeg'; // 預設值
  if (base64String.startsWith('data:image/')) {
    const match = base64String.match(/data:image\/([^;]+)/);
    if (match) {
      mimeType = `image/${match[1]}`;
    }
  }

  return { mimeType, data: base64Data };
}

/**
 * 從 Gemini 回應中提取 JSON
 * 處理可能包含 Markdown 或其他文字的回應
 * @param text - Gemini 回傳的文字
 * @returns 提取的 JSON 字串或 null
 */
function extractJSON(text: string): string | null {
  // 嘗試直接解析
  try {
    JSON.parse(text);
    return text;
  } catch {
    // 如果失敗，嘗試提取 JSON 部分
    // 尋找 { ... } 區塊
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    return null;
  }
}

/**
 * 使用 Gemini API 辨識圖片中的帳號
 * @param imageBase64 - base64 編碼的圖片（可能包含 data:image/... 前綴）
 * @param apiKey - Gemini API 金鑰
 * @returns Gemini 回應物件
 */
export async function recognizeAccount(
  imageBase64: string,
  apiKey: string
): Promise<GeminiResponse> {
  try {
    // 初始化 Gemini 客戶端
    const genAI = new GoogleGenerativeAI(apiKey);

    // 使用 gemini-1.5-flash（穩定版本，支援圖片辨識）
    // 注意：gemini-2.0-flash-exp:thinking 可能不可用，使用穩定版本
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest"
    });

    // 解析 base64 圖片
    const { mimeType, data } = parseBase64Image(imageBase64);

    // 準備圖片資料
    const imagePart = {
      inlineData: {
        data: data,
        mimeType: mimeType,
      },
    };

    // 呼叫 Gemini API
    const result = await model.generateContent([SYSTEM_PROMPT, imagePart]);
    const response = await result.response;
    const text = response.text();

    // 提取 JSON
    const jsonString = extractJSON(text);
    if (!jsonString) {
      throw new Error('無法從 Gemini 回應中提取 JSON');
    }

    // 解析 JSON
    const parsed = JSON.parse(jsonString) as GeminiResponse;

    // 驗證回應格式
    if (parsed.status === 'ok') {
      if (!parsed.account_prefix) {
        throw new Error('回應缺少 account_prefix');
      }
      // 添加英文錯誤訊息（如果缺少）
      if (!parsed.user_message_en && parsed.status === 'error') {
        parsed.user_message_en = getEnglishErrorMessage(parsed.error_code || 'API_ERROR');
      }
    } else if (parsed.status === 'error') {
      // 添加英文錯誤訊息
      if (!parsed.user_message_en) {
        parsed.user_message_en = getEnglishErrorMessage(parsed.error_code || 'API_ERROR');
      }
    }

    return parsed;
  } catch (error: any) {
    // 處理 API 錯誤
    console.error('Gemini API 錯誤:', error);
    
    return {
      status: 'error',
      error_code: 'API_ERROR',
      user_message_zh: '系統忙碌中，請稍後再試',
      user_message_en: 'System is busy, please try again later',
    };
  }
}

/**
 * 根據錯誤碼取得英文錯誤訊息
 * @param errorCode - 錯誤碼
 * @returns 英文錯誤訊息
 */
function getEnglishErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    INVALID_IMAGE: 'Invalid image. Please upload a screenshot of the Mike App "More" page.',
    IMAGE_UNREADABLE: 'Image is unclear. Please take a new screenshot with clear text.',
    API_ERROR: 'System is busy, please try again later',
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  };
  return errorMessages[errorCode] || 'An error occurred. Please try again later.';
}

