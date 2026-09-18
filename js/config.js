/*************************************************
 * LINE 團購系統 - 設定與全域狀態 (js/config.js)
 *************************************************/

// LINE LIFF ID
const LIFF_ID = '2011633639-yuSTNpAR';

// Google Apps Script Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycbxpNY5FuKMsL8GClN9oH_uznXM_o7HLkPPQcZSvVBbGCLvIdXOVB9ptgf1VGsrj66GE8A/exec';

// 除錯模式：上線正式環境設為 false，避免在 Console 洩漏 ID Token 與個人資料
const DEBUG = false;

// 訂單狀態常數
const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

// 實體門市商品生命週期階段
const PRODUCT_STAGE = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  CLOSED_PENDING_ORDER: 'CLOSED_PENDING_ORDER',
  ORDERED: 'ORDERED',
  ARRIVED: 'ARRIVED',
  FINISHED: 'FINISHED',
  ARCHIVED: 'ARCHIVED'
};

// 全域執行時期狀態
let currentUser = null;
let currentAdmin = null;
let currentProduct = null;
let orderQuantity = 1;
window.currentProductId = null;
