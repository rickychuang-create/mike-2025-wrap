/**
 * Recognize Account Netlify Function
 * 接收前端上傳的截圖，使用 Gemini API 辨識帳號
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { recognizeAccount } from './utils/gemini';
import { checkRateLimit, getClientIP } from './utils/rate-limit';

// 回應類型定義
interface RecognizeResponse {
  status: 'ok' | 'error';
  account_prefix?: string;
  raw_account?: string;
  error_code?: 'INVALID_IMAGE' | 'IMAGE_UNREADABLE' | 'API_ERROR' | 'RATE_LIMIT_EXCEEDED';
  user_message_zh?: string;
  user_message_en?: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * 驗證圖片格式和大小
 * @param base64String - base64 編碼的圖片
 * @returns 驗證結果物件
 */
function validateImage(base64String: string): { valid: boolean; error?: string } {
  // 檢查是否為有效的 base64 圖片
  if (!base64String) {
    return { valid: false, error: '圖片資料為空' };
  }

  // 提取實際的 base64 資料（移除 data:image/...;base64, 前綴）
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;

  // 檢查 base64 格式
  if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
    return { valid: false, error: '無效的 base64 格式' };
  }

  // 計算圖片大小（base64 編碼後的大小約為原圖的 4/3）
  const sizeInBytes = (base64Data.length * 3) / 4;
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (sizeInBytes > maxSize) {
    return { valid: false, error: '圖片大小超過 5MB' };
  }

  // 檢查圖片格式
  const supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
  let isValidFormat = false;

  if (base64String.startsWith('data:image/')) {
    const match = base64String.match(/data:image\/([^;]+)/);
    if (match) {
      const mimeType = `image/${match[1]}`;
      isValidFormat = supportedFormats.includes(mimeType);
    }
  } else {
    // 如果沒有前綴，假設是 JPEG（最常見）
    isValidFormat = true;
  }

  if (!isValidFormat) {
    return { valid: false, error: '不支援的圖片格式，請上傳 JPEG、PNG 或 WebP 格式' };
  }

  return { valid: true };
}

/**
 * 處理 OPTIONS 請求（CORS preflight）
 */
function handleOptions(): { statusCode: number; headers: Record<string, string>; body: string } {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: '',
  };
}

/**
 * 主要處理函數
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> => {
  // 處理 CORS preflight 請求
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // 只接受 POST 請求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'error',
        error_code: 'API_ERROR',
        user_message_zh: '不支援的請求方法',
        user_message_en: 'Method not allowed',
      }),
    };
  }

  try {
    // 1. Rate Limiting 檢查
    const clientIP = getClientIP(event);
    if (checkRateLimit(clientIP)) {
      return {
        statusCode: 200, // 使用 200 因為這是業務邏輯錯誤
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'error',
          error_code: 'RATE_LIMIT_EXCEEDED',
          user_message_zh: '請求過於頻繁，請稍後再試',
          user_message_en: 'Too many requests, please try again later',
        } as RecognizeResponse),
      };
    }

    // 2. 解析請求體
    let body: { image?: string };
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'error',
          error_code: 'API_ERROR',
          user_message_zh: '無效的請求格式',
          user_message_en: 'Invalid request format',
        } as RecognizeResponse),
      };
    }

    // 3. 驗證圖片
    if (!body.image) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'error',
          error_code: 'API_ERROR',
          user_message_zh: '缺少圖片資料',
          user_message_en: 'Missing image data',
        } as RecognizeResponse),
      };
    }

    const validation = validateImage(body.image);
    if (!validation.valid) {
      return {
        statusCode: 200, // 使用 200 因為這是業務邏輯錯誤
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'error',
          error_code: 'API_ERROR',
          user_message_zh: validation.error || '圖片驗證失敗',
          user_message_en: validation.error || 'Image validation failed',
        } as RecognizeResponse),
      };
    }

    // 4. 取得 Gemini API Key
    // 使用 MIKE_GEMINI_API_KEY 避免與 Netlify 內部環境變數衝突
    const apiKey = process.env.MIKE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('MIKE_GEMINI_API_KEY 環境變數未設定');
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'error',
          error_code: 'API_ERROR',
          user_message_zh: '系統設定錯誤，請聯繫管理員',
          user_message_en: 'System configuration error, please contact administrator',
        } as RecognizeResponse),
      };
    }

    // 5. 呼叫 Gemini API
    const result = await recognizeAccount(body.image, apiKey);

    // 6. 回傳結果
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    // 處理未預期的錯誤
    console.log('Recognize account 錯誤:', error);
    console.error('Recognize account 錯誤:', error);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'error',
        error_code: 'API_ERROR',
        user_message_zh: '系統忙碌中，請稍後再試',
        user_message_en: 'System is busy, please try again later',
      } as RecognizeResponse),
    };
  }
};

