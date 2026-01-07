/**
 * Rate Limiting 工具函數
 * 使用記憶體 Map 實作簡單的 rate limiting
 */

// IP 請求記錄介面
interface IPRecord {
  requests: number[]; // 時間戳記陣列
  lastCleanup: number; // 上次清理時間
}

// 記憶體儲存（在 serverless 環境中，每個實例獨立）
const ipRecords = new Map<string, IPRecord>();

// 限制規則
const RATE_LIMIT_PER_MINUTE = 5; // 每分鐘最多 5 次
const RATE_LIMIT_PER_HOUR = 20; // 每小時最多 20 次
const CLEANUP_INTERVAL = 60 * 1000; // 每分鐘清理一次過期記錄

/**
 * 清理過期的請求記錄
 * @param record - IP 記錄
 * @param now - 當前時間戳記
 */
function cleanupOldRequests(record: IPRecord, now: number): void {
  // 移除超過 1 小時的記錄
  const oneHourAgo = now - 60 * 60 * 1000;
  record.requests = record.requests.filter((timestamp) => timestamp > oneHourAgo);
}

/**
 * 檢查 IP 是否超過 rate limit
 * @param ip - 客戶端 IP 地址
 * @returns 如果超過限制回傳 true，否則回傳 false
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  
  // 取得或建立 IP 記錄
  let record = ipRecords.get(ip);
  if (!record) {
    record = {
      requests: [],
      lastCleanup: now,
    };
    ipRecords.set(ip, record);
  }

  // 定期清理過期記錄
  if (now - record.lastCleanup > CLEANUP_INTERVAL) {
    cleanupOldRequests(record, now);
    record.lastCleanup = now;
  }

  // 計算最近 1 分鐘和 1 小時的請求數
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  const requestsLastMinute = record.requests.filter(
    (timestamp) => timestamp > oneMinuteAgo
  ).length;

  const requestsLastHour = record.requests.filter(
    (timestamp) => timestamp > oneHourAgo
  ).length;

  // 檢查是否超過限制
  if (requestsLastMinute >= RATE_LIMIT_PER_MINUTE) {
    return true; // 超過每分鐘限制
  }

  if (requestsLastHour >= RATE_LIMIT_PER_HOUR) {
    return true; // 超過每小時限制
  }

  // 記錄此次請求
  record.requests.push(now);

  return false; // 未超過限制
}

/**
 * 從請求中提取 IP 地址
 * @param event - Netlify Function 事件物件
 * @returns IP 地址字串
 */
export function getClientIP(event: any): string {
  // 優先使用 X-Forwarded-For header（Netlify 會設定）
  const forwardedFor = event.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For 可能包含多個 IP，取第一個
    return forwardedFor.split(',')[0].trim();
  }

  // 備用：使用 client-ip header
  const clientIP = event.headers['client-ip'];
  if (clientIP) {
    return clientIP;
  }

  // 最後備用：使用請求的 IP
  return event.headers['x-real-ip'] || event.clientIP || 'unknown';
}

