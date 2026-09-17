/*************************************************
 * LINE 團購系統 - 常用工具函式 (js/utils.js)
 *************************************************/

function log(...args) {
  if (typeof DEBUG !== 'undefined' && DEBUG) {
    console.log(...args);
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJs(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function formatPrice(price) {
  const number = Number(price || 0);
  return number.toLocaleString('zh-TW', {
    maximumFractionDigits: 2
  });
}

function getOrderStatusLabel(status) {
  const labels = {
    PENDING: '待處理',
    CONFIRMED: '已確認',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  };

  const key = String(status || '').trim().toUpperCase();
  return labels[key] || status || '-';
}

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

function handleApiErrorMessage(resultOrError) {
  if (!resultOrError) return '系統未回傳資料';

  const errorKey = typeof resultOrError === 'string'
    ? resultOrError
    : (resultOrError.error || resultOrError.message || '');

  const errorMessages = {
    NOT_ADMIN: '您沒有管理員權限',
    MISSING_ID_TOKEN: '缺少 LINE 身分憑證，請重新整理登入',
    PRODUCT_NOT_FOUND: '找不到此團購商品',
    PRODUCT_CLOSED: '此團購已截止',
    PRODUCT_NOT_OPEN: '此團購尚未開始',
    INSUFFICIENT_STOCK: '此商品庫存不足',
    ORDER_NOT_FOUND: '找不到該筆訂單',
    ALREADY_CLOSED: '此團購已經關閉',
    INVALID_OPTIONS: '選擇的商品規格不正確',
    TIMEOUT: '伺服器連線逾時，請檢查網路後重試',
    SERVER_ERROR: '伺服器忙碌中，請稍後再試'
  };

  return errorMessages[errorKey] || resultOrError.message || String(errorKey);
}
