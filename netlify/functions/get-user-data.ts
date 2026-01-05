/**
 * Get User Data Netlify Function
 * 根據帳號從 Google Sheet 讀取用戶的完整年度回顧資料
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { initGoogleSheets, getUserData, UserData } from './utils/google-sheets';

// 回應類型定義
interface GetUserDataResponse {
  status: 'ok' | 'error';
  data?: UserData;
  error_code?: 'USER_NOT_FOUND' | 'API_ERROR';
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
    // 1. 解析請求體
    let body: { account?: string };
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
        } as GetUserDataResponse),
      };
    }

    // 2. 驗證 account
    if (!body.account || !body.account.trim()) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'error',
          error_code: 'API_ERROR',
          user_message_zh: '缺少帳號參數',
          user_message_en: 'Missing account parameter',
        } as GetUserDataResponse),
      };
    }

    // 3. 取得環境變數
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.GOOGLE_SHEET_NAME || '用戶數據庫';
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!sheetId || !serviceAccountKey) {
      console.error('缺少必要的環境變數');
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
        } as GetUserDataResponse),
      };
    }

    // 4. 初始化 Google Sheets API
    let sheets;
    try {
      // 嘗試解析服務帳號 JSON
      let parsedKey;
      try {
        parsedKey = typeof serviceAccountKey === 'string' 
          ? JSON.parse(serviceAccountKey) 
          : serviceAccountKey;
      } catch (parseError: any) {
        console.error('解析服務帳號 JSON 失敗:', parseError.message);
        console.error('JSON 字串前 100 字元:', serviceAccountKey?.substring(0, 100));
        throw new Error(`服務帳號 JSON 格式錯誤: ${parseError.message}`);
      }
      
      sheets = initGoogleSheets(parsedKey);
    } catch (error: any) {
      console.error('初始化 Google Sheets API 失敗:', error);
      console.error('錯誤詳情:', error.message);
      console.error('錯誤堆疊:', error.stack);
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
        } as GetUserDataResponse),
      };
    }

    // 5. 讀取用戶資料
    // 清理 account（移除 @ 及後續內容，只保留 @ 前的部分）
    const account = body.account.trim();
    const accountPrefix = account.includes('@') 
      ? account.split('@')[0].trim() 
      : account;

    console.log('嘗試讀取用戶資料:', { accountPrefix, sheetId, sheetName });
    
    let userData;
    try {
      userData = await getUserData(sheets, sheetId, sheetName, accountPrefix);
    } catch (error: any) {
      console.error('讀取 Google Sheets 資料失敗:', error);
      console.error('錯誤訊息:', error.message);
      console.error('錯誤堆疊:', error.stack);
      throw error; // 重新拋出錯誤，讓外層 catch 處理
    }

    // 6. 處理結果
    if (!userData) {
      return {
        statusCode: 200, // 使用 200 因為這是業務邏輯錯誤
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'error',
          error_code: 'USER_NOT_FOUND',
          user_message_zh: '找不到此帳號的資料，請確認帳號是否正確',
          user_message_en: 'Account not found, please verify your account',
        } as GetUserDataResponse),
      };
    }

    // 7. 回傳成功結果
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'ok',
        data: userData,
      } as GetUserDataResponse),
    };
  } catch (error: any) {
    // 處理未預期的錯誤
    console.error('Get user data 錯誤:', error);
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
      } as GetUserDataResponse),
    };
  }
};

