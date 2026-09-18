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

function parseOptionPriceTag(str) {
  if (!str || typeof str !== 'string') return null;

  // 檢查是否有加價 (+20 / +NT$ 20 / +20元)
  const deltaMatch = str.match(/\(\s*\+\s*(?:NT\$?|\$)?\s*(\d+)(?:\s*元)?\s*\)/i) ||
                     str.match(/\+\s*(?:NT\$?|\$)?\s*(\d+)(?:\s*元)?/i);
  if (deltaMatch) {
    return { type: 'DELTA', delta: Number(deltaMatch[1]) };
  }

  // 檢查是否有明確指定價格 (NT$ 420 / $420 / 420元)
  const exactMatch = str.match(/\(\s*(?:NT\$?|\$)\s*(\d+)(?:\s*元)?\s*\)/i) ||
                     str.match(/(?:NT\$?|\$)\s*(\d+)(?:\s*元)?/i);
  if (exactMatch) {
    return { type: 'EXACT', price: Number(exactMatch[1]) };
  }

  return null;
}

function hasTieredPricing(options) {
  if (!Array.isArray(options) || options.length === 0) return false;
  return options.some(opt => {
    const values = Array.isArray(opt.values) ? opt.values : [];
    return values.some(val => parseOptionPriceTag(val) !== null);
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

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
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
    INVALID_PRODUCT_NAME: '商品名稱不能為空',
    INVALID_PRICE: '商品價格格式錯誤',
    INVALID_TIME_RANGE: '截止時間必須晚於開始時間',
    TIMEOUT: '伺服器連線逾時，請檢查網路後重試',
    SERVER_ERROR: '伺服器忙碌中，請稍後再試'
  };

  return errorMessages[errorKey] || resultOrError.message || String(errorKey);
}

function getProductStageInfo(stage) {
  const s = String(stage || '').trim().toUpperCase();
  switch (s) {
    case 'OPEN':
      return {
        key: 'OPEN',
        label: '進行中',
        badgeClass: 'badge-success',
        icon: '🔥',
        desc: '顧客下單登記中'
      };
    case 'CLOSED_PENDING_ORDER':
      return {
        key: 'CLOSED_PENDING_ORDER',
        label: '待向廠商訂貨',
        badgeClass: 'badge-warning',
        icon: '📋',
        desc: '已截止，請統整數量向廠商叫貨'
      };
    case 'ORDERED':
      return {
        key: 'ORDERED',
        label: '廠商備貨中',
        badgeClass: 'badge-info',
        icon: '🚚',
        desc: '已向廠商下單，物流配送中'
      };
    case 'ARRIVED':
      return {
        key: 'ARRIVED',
        label: '商品已到店／取貨中',
        badgeClass: 'badge-primary',
        icon: '🏪',
        desc: '商品已到門市，可現場核銷取貨'
      };
    case 'FINISHED':
      return {
        key: 'FINISHED',
        label: '全數取貨完結',
        badgeClass: 'badge-secondary',
        icon: '🎉',
        desc: '此檔團購已全部取貨結案'
      };
    case 'ARCHIVED':
      return {
        key: 'ARCHIVED',
        label: '已封存',
        badgeClass: 'badge-dark',
        icon: '🗑️',
        desc: '團購已被封存或刪除'
      };
    default:
      return {
        key: 'UNKNOWN',
        label: stage || '進行中',
        badgeClass: 'badge-secondary',
        icon: '📦',
        desc: ''
      };
  }
}
