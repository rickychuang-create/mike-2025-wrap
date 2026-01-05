/**
 * Gemini API 封裝
 * 前端呼叫 recognize-account API 的封裝函數
 */

// API 回應類型定義
export interface RecognizeAccountResponse {
  status: 'ok' | 'error';
  account_prefix?: string;
  raw_account?: string;
  error_code?: 'INVALID_IMAGE' | 'IMAGE_UNREADABLE' | 'API_ERROR' | 'RATE_LIMIT_EXCEEDED';
  user_message_zh?: string;
  user_message_en?: string;
}

/**
 * 呼叫 recognize-account API 辨識圖片中的帳號
 * @param imageBase64 - base64 編碼的圖片（包含 data:image/... 前綴）
 * @returns API 回應
 */
export async function recognizeAccount(
  imageBase64: string
): Promise<RecognizeAccountResponse> {
  try {
    const response = await fetch('/api/recognize-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageBase64 }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result as RecognizeAccountResponse;
  } catch (error) {
    console.error('Recognize account API 錯誤:', error);
    return {
      status: 'error',
      error_code: 'API_ERROR',
      user_message_zh: '系統忙碌中，請稍後再試',
      user_message_en: 'System is busy, please try again later',
    };
  }
}

