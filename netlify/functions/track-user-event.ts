/**
 * Track User Event Netlify Function
 * 接收前端事件並寫入 Google Sheet「用戶行為追蹤」工作表
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { initGoogleSheetsWriter, appendUserEvent } from './utils/google-sheets';

interface TrackUserEventRequestBody {
  account?: string;
  clicked_button?: string;
}

interface TrackUserEventResponse {
  status: 'ok' | 'error';
  message?: string;
}

// CORS headers（沿用 get-user-data.ts 格式）
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
        message: 'Method not allowed',
      } as TrackUserEventResponse),
    };
  }

  try {
    // 1. 解析請求體
    let body: TrackUserEventRequestBody;
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
          message: 'Invalid request format',
        } as TrackUserEventResponse),
      };
    }

    const clicked_button = body.clicked_button?.trim();
    const account = (body.account ?? '').trim();

    // 2. 驗證欄位
    if (!clicked_button) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'error',
          message: 'clicked_button is required',
        } as TrackUserEventResponse),
      };
    }

    // 3. 讀取環境變數
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.GOOGLE_USER_EVENT_SHEET_NAME;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!sheetId || !serviceAccountKey) {
      console.error('[track-user-event] 缺少必要的環境變數', {
        hasSheetId: !!sheetId,
        hasServiceAccountKey: !!serviceAccountKey,
      });
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'error',
          message: 'Server configuration error',
        } as TrackUserEventResponse),
      };
    }

    // 4. 初始化具寫入權限的 Google Sheets API
    let sheets;
    try {
      let parsedKey;
      try {
        parsedKey =
          typeof serviceAccountKey === 'string'
            ? JSON.parse(serviceAccountKey)
            : serviceAccountKey;
      } catch (parseError: any) {
        console.error('[track-user-event] 解析服務帳號 JSON 失敗:', parseError.message);
        console.error(
          '[track-user-event] JSON 字串前 100 字元:',
          serviceAccountKey?.substring(0, 100)
        );
        throw new Error(`服務帳號 JSON 格式錯誤: ${parseError.message}`);
      }

      sheets = initGoogleSheetsWriter(parsedKey);
    } catch (error: any) {
      console.error('[track-user-event] 初始化 Google Sheets API 失敗:', error);
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'error',
          message: 'Failed to initialize Google Sheets',
        } as TrackUserEventResponse),
      };
    }

    // 5. 準備時間欄位（使用伺服器時間）
    const now = new Date();

    // 轉成台北時區的時間元件
    const taipeiFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    // 取出各個部分
    const parts = taipeiFormatter.formatToParts(now).reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});
    
    // YYYY-MM-DD（台北當地日期）
    const eventdate = `${parts.year}-${parts.month}-${parts.day}`;
    
    // 當地時間的 ISO-like 字串：YYYY-MM-DDTHH:mm:ss+08:00
    const eventtime = `${eventdate}T${parts.hour}:${parts.minute}:${parts.second}+08:00`;

    // 6. 寫入事件
    try {
      await appendUserEvent(
        sheets,
        sheetId,
        sheetName,
        account,
        clicked_button,
        eventtime,
        eventdate
      );
    } catch (error: any) {
      console.error('[track-user-event] appendUserEvent 失敗:', error);
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'error',
          message: 'Failed to append user event',
        } as TrackUserEventResponse),
      };
    }

    // 7. 成功回應
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'ok',
      } as TrackUserEventResponse),
    };
  } catch (error: any) {
    console.error('[track-user-event] 未預期錯誤:', error);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'error',
        message: 'Unexpected server error',
      } as TrackUserEventResponse),
    };
  }
};


