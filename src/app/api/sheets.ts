/**
 * Google Sheets API 封裝
 * 前端呼叫 get-user-data API 的封裝函數
 */

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

// API 回應類型定義
export interface GetUserDataResponse {
  status: 'ok' | 'error';
  data?: UserData;
  error_code?: 'USER_NOT_FOUND' | 'API_ERROR';
  user_message_zh?: string;
  user_message_en?: string;
}

/**
 * 呼叫 get-user-data API 取得用戶資料
 * @param account - 帳號（不含 @）
 * @returns 用戶資料，如果找不到則回傳 null
 */
export async function getUserData(account: string): Promise<UserData | null> {
  try {
    const response = await fetch('/api/get-user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ account: account.trim() }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as GetUserDataResponse;

    if (result.status === 'ok' && result.data) {
      return result.data;
    }

    // 如果是 USER_NOT_FOUND，回傳 null
    if (result.error_code === 'USER_NOT_FOUND') {
      return null;
    }

    // 其他錯誤，拋出異常
    throw new Error(result.user_message_zh || result.user_message_en || 'Unknown error');
  } catch (error) {
    console.error('Get user data API 錯誤:', error);
    throw error;
  }
}

// ---------------- 用戶行為追蹤 ----------------

export interface TrackUserEventPayload {
  account: string;
  clicked_button: string;
}

/**
 * 呼叫 track-user-event API 記錄用戶行為
 * 追蹤失敗不會中斷主流程，只在 console 中記錄錯誤
 */
export async function trackUserEvent(payload: TrackUserEventPayload): Promise<void> {
  try {
    await fetch('/api/track-user-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Track user event API 錯誤:', error);
    // 不拋出錯誤，避免影響主流程
  }
}


