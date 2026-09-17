/*************************************************
 * LINE 團購系統 - API 呼叫與 Request 工具 (js/api.js)
 *************************************************/

async function apiRequest(data, timeoutMs = 35000) {
  const isReadAction = data && (data.action === 'getProduct' || data.action === 'getMyProducts' || data.action === 'getMyOrders');

  try {
    return await rawApiRequest(data, timeoutMs);
  } catch (err) {
    // 若為讀取操作且發生逾時或網路中斷，自動重試一次（伺服器被喚醒後第二次秒開）
    if (isReadAction && (err.code === 'TIMEOUT' || (err.message && err.message.includes('Failed to fetch')))) {
      console.warn(`[API] ${data.action} 連線異常，正在進行第二次自動重試...`);
      return await rawApiRequest(data, timeoutMs);
    }
    throw err;
  }
}

async function rawApiRequest(data, timeoutMs = 35000) {
  log('====================================');
  log('API Request Action:', data ? data.action : 'unknown');

  if (!API_URL || API_URL === '你的 GAS Web App URL') {
    throw new Error('尚未設定 GAS Web App URL');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    /*
     * 使用 text/plain 避免瀏覽器在 GAS Web App 發生 CORS preflight (OPTIONS)。
     */
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });

    clearTimeout(timer);

    log('API HTTP Status:', response.status);

    const text = await response.text();
    if (!text) {
      throw new Error('GAS 回傳空白資料');
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('GAS 回傳的資料不是有效 JSON：\n' + text.substring(0, 300));
    }

    log('API Response Success:', result ? result.success : false);
    log('====================================');

    return result;

  } catch (error) {
    clearTimeout(timer);

    if (error.name === 'AbortError') {
      const timeoutError = new Error('伺服器連線逾時，Google 伺服器正在啟動中，請重新整理重試');
      timeoutError.code = 'TIMEOUT';
      console.error('[API Timeout]', timeoutError);
      throw timeoutError;
    }

    console.error('API Request Error:', error);
    throw error;
  }
}

function generateRequestId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return (
    'REQ-' +
    Date.now() +
    '-' +
    Math.floor(Math.random() * 1000000)
  );
}

async function getIdToken() {
  if (!liff.isLoggedIn()) {
    liff.login();
    return null;
  }

  const token = liff.getIDToken();
  if (!token) {
    throw new Error('無法取得 LINE ID Token，請重新登入');
  }

  return token;
}
