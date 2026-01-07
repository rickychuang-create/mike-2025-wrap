/**
 * Google Sheets API 工具函數
 * 封裝 Google Sheets API 連接和讀取邏輯
 */

import { google } from 'googleapis';
import { sheets_v4 } from 'googleapis';

// 用戶資料類型定義（對應 Google Sheet 的 20 個欄位）
export interface UserData {
  account: string;
  days_with_mike: number;
  active_days: number;
  login_percentage: number;
  active_days_rank_pct: number;
  active_days_level: number;
  usertype: number;
  feature_1: string;
  feature_1_vip: number;
  feature_2: string;
  feature_2_vip: number;
  feature_3: string;
  feature_3_vip: number;
  feature_4: string;
  feature_4_vip: number;
  feature_5: string;
  feature_5_vip: number;
  mike_type: number;
  premium_user_type: number;
}

/**
 * 初始化 Google Sheets API 客戶端（唯讀）
 * @param serviceAccountKey - 服務帳號 JSON 字串或物件
 * @returns Google Sheets API 客戶端實例
 */
export function initGoogleSheets(serviceAccountKey: string | object): sheets_v4.Sheets {
  try {
    // 解析服務帳號金鑰
    const key = typeof serviceAccountKey === 'string' 
      ? JSON.parse(serviceAccountKey) 
      : serviceAccountKey;

    // 驗證必要的欄位
    if (!key.client_email || !key.private_key) {
      throw new Error('服務帳號 JSON 缺少必要欄位 (client_email 或 private_key)');
    }

    // 建立 JWT 客戶端
    const auth = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    // 初始化 Google Sheets API
    const sheets = google.sheets({ version: 'v4', auth });

    return sheets;
  } catch (error: any) {
    console.error('initGoogleSheets 錯誤:', error.message);
    throw new Error(`初始化 Google Sheets API 失敗: ${error.message}`);
  }
}

/**
 * 初始化具寫入權限的 Google Sheets API 客戶端
 * @param serviceAccountKey - 服務帳號 JSON 字串或物件
 * @returns Google Sheets API 客戶端實例（可讀寫）
 */
export function initGoogleSheetsWriter(serviceAccountKey: string | object): sheets_v4.Sheets {
  try {
    const key = typeof serviceAccountKey === 'string'
      ? JSON.parse(serviceAccountKey)
      : serviceAccountKey;

    if (!key.client_email || !key.private_key) {
      throw new Error('服務帳號 JSON 缺少必要欄位 (client_email 或 private_key)');
    }

    const auth = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error: any) {
    console.error('initGoogleSheetsWriter 錯誤:', error.message);
    throw new Error(`初始化具寫入權限的 Google Sheets API 失敗: ${error.message}`);
  }
}

/**
 * 追蹤用戶事件：將一筆事件寫入指定的 Google Sheet 工作表
 * @param sheets - Google Sheets API 客戶端實例（具寫入權限）
 * @param sheetId - Google Sheet ID
 * @param sheetName - 工作表名稱（例如「用戶行為追蹤」）
 * @param account - 用戶帳號
 * @param clicked_button - 事件名稱 / 按鈕代碼
 * @param eventtime - 事件時間（ISO 字串）
 * @param eventdate - 事件日期（字串）
 */
export async function appendUserEvent(
  sheets: sheets_v4.Sheets,
  sheetId: string,
  sheetName: string,
  account: string,
  clicked_button: string,
  eventtime: string,
  eventdate: string
): Promise<void> {
  try {
    const values = [[account, clicked_button, eventtime, eventdate]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:D`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });
  } catch (error: any) {
    console.error('appendUserEvent 錯誤:', error.message);
    throw new Error(`寫入用戶行為追蹤失敗: ${error.message}`);
  }
}

/**
 * 將字串轉換為數字
 * @param value - 要轉換的值
 * @param defaultValue - 預設值（如果轉換失敗）
 * @returns 數字值
 */
function parseNumber(value: any, defaultValue: number = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * 從 Google Sheet 讀取用戶資料
 * @param sheets - Google Sheets API 客戶端實例
 * @param sheetId - Google Sheet ID
 * @param sheetName - Sheet 名稱
 * @param account - 要搜尋的帳號（不含 @）
 * @returns 用戶資料物件，如果找不到則回傳 null
 */
export async function getUserData(
  sheets: sheets_v4.Sheets,
  sheetId: string,
  sheetName: string,
  account: string
): Promise<UserData | null> {
  try {
    // 讀取整個 Sheet（包含標題列）
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:Z`, // 讀取 A 到 Z 欄（足夠涵蓋 20 個欄位）
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return null;
    }

    // 第一行是欄位標題
    const headers = rows[0] as string[];
    
    // 找到 account 欄位的索引
    const accountIndex = headers.findIndex(
      (header) => header.toLowerCase() === 'account'
    );

    if (accountIndex === -1) {
      throw new Error('找不到 account 欄位');
    }

    // 搜尋匹配的資料列（不區分大小寫）
    const accountLower = account.toLowerCase().trim();
    let dataRow: any[] | null = null;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row && row[accountIndex]) {
        // 比較時移除 @ 符號和後續內容，只比較 @ 前的部分
        const rowAccount = String(row[accountIndex]).toLowerCase().trim();
        const rowAccountPrefix = rowAccount.includes('@') 
          ? rowAccount.split('@')[0] 
          : rowAccount;
        
        if (rowAccountPrefix === accountLower) {
          dataRow = row;
          break;
        }
      }
    }

    if (!dataRow) {
      return null;
    }

    // 建立欄位名稱到索引的映射
    const fieldMap: Record<string, number> = {};
    headers.forEach((header, index) => {
      fieldMap[header.toLowerCase()] = index;
    });

    // 提取資料並轉換類型
    const getField = (fieldName: string, defaultValue: any = ''): any => {
      const index = fieldMap[fieldName.toLowerCase()];
      return index !== undefined && dataRow![index] !== undefined 
        ? dataRow![index] 
        : defaultValue;
    };

    // 建立用戶資料物件
    const userData: UserData = {
      account: String(getField('account', account)),
      days_with_mike: parseNumber(getField('days_with_mike'), 0),
      active_days: parseNumber(getField('active_days'), 0),
      login_percentage: parseNumber(getField('login_percentage'), 0),
      active_days_rank_pct: parseNumber(getField('active_days_rank_pct'), 0),
      active_days_level: parseNumber(getField('active_days_level'), 0),
      usertype: parseNumber(getField('usertype'), 0),
      feature_1: String(getField('feature_1', '')),
      feature_1_vip: parseNumber(getField('feature_1_vip'), 0),
      feature_2: String(getField('feature_2', '')),
      feature_2_vip: parseNumber(getField('feature_2_vip'), 0),
      feature_3: String(getField('feature_3', '')),
      feature_3_vip: parseNumber(getField('feature_3_vip'), 0),
      feature_4: String(getField('feature_4', '')),
      feature_4_vip: parseNumber(getField('feature_4_vip'), 0),
      feature_5: String(getField('feature_5', '')),
      feature_5_vip: parseNumber(getField('feature_5_vip'), 0),
      mike_type: parseNumber(getField('mike_type'), 0),
      premium_user_type: parseNumber(getField('premium_user_type'), 0),
    };

    return userData;
  } catch (error) {
    console.error('Google Sheets API 錯誤:', error);
    throw error;
  }
}

