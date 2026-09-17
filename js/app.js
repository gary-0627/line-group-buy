/*************************************************
 * LINE 團購系統 - 主程式與生命週期 (js/app.js)
 *************************************************/

/* =================================================
 * Loading 遮罩控制
 * ================================================= */
function setLoading(message = '載入中...') {
  const loading = document.getElementById('loading');
  const loadingText = document.getElementById('loadingText');

  if (loadingText) {
    loadingText.textContent = message;
  }
  if (loading) {
    loading.style.display = 'flex';
  }
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'none';
  }
}

/* =================================================
 * 錯誤訊息畫面
 * ================================================= */
function showError(message) {
  console.error('[ERROR]', message);
  hideLoading();

  const app = document.getElementById('app');
  const errorScreen = document.getElementById('errorScreen');
  const errorMessage = document.getElementById('errorMessage');

  if (app) {
    app.style.display = 'none';
  }
  if (errorMessage) {
    errorMessage.textContent = message;
  }
  if (errorScreen) {
    errorScreen.style.display = 'block';
  }
}

function renderProductError(message) {
  hideLoading();
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="container">
      <div class="card">
        <div style="text-align:center;padding:20px 0;">
          <div style="font-size:42px;margin-bottom:12px;">⚠️</div>
          <div style="font-size:20px;font-weight:700;margin-bottom:10px;">無法載入團購</div>
          <div style="color:#777;line-height:1.6;margin-bottom:20px;">
            ${escapeHtml(message || '找不到此團購')}
          </div>
          <button class="button button-secondary" onclick="showMyOrdersPage()">
            查看我的訂單
          </button>
        </div>
      </div>
    </div>
  `;
}

/* =================================================
 * LINE 身分驗證 (顧客端)
 * ================================================= */
async function verifyIdentity(idToken) {
  setLoading('正在確認 LINE 身分...');
  log('[IDENTITY] 開始驗證');

  const result = await apiRequest({
    action: 'verifyIdentity',
    idToken: idToken
  });

  log('[IDENTITY] 驗證結果:', result);

  if (!result.success) {
    throw new Error(handleApiErrorMessage(result));
  }

  currentUser = result.user;
}

/* =================================================
 * 管理員身分驗證 (管理端)
 * ================================================= */
async function verifyAdmin(idToken) {
  setLoading('正在確認管理員權限...');

  try {
    if (!idToken) {
      throw new Error('無法取得 LINE ID Token');
    }

    const result = await apiRequest({
      action: 'verifyAdmin',
      idToken: idToken
    });

    if (!result || !result.success) {
      hideLoading();
      showNonAdminPage();
      return;
    }

    currentUser = result.user;
    // 後端 handleVerifyAdmin 已確認身分，success:true 代表是管理員
    // 後端回傳 result.user.role（不會回傳 result.admin），直接建構 admin 物件
    currentAdmin = { isAdmin: true, role: result.user.role || 'ADMIN' };

    if (!currentAdmin || !currentAdmin.isAdmin) {
      hideLoading();
      showNonAdminPage();
      return;
    }

    renderAdminHome();

  } catch (error) {
    console.error('[ADMIN] 發生錯誤:', error);
    showError('管理員驗證失敗：\n' + handleApiErrorMessage(error));
  }
}

/* =================================================
 * LIFF 初始化與路由分流
 * ================================================= */
async function initLIFF() {
  setLoading('LIFF 初始化中...');

  try {
    log('[LIFF] 開始初始化');

    await liff.init({
      liffId: LIFF_ID
    });

    log('LIFF 初始化成功');

    if (!liff.isLoggedIn()) {
      log('[LIFF] 尚未登入，導向登入');
      setLoading('正在登入 LINE...');
      liff.login();
      return;
    }

    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('無法取得 LINE ID Token');
    }

    /*
     * 路由判斷：
     * ?p=P202609160001 → 客戶商品頁
     * 沒有 p            → 管理員後台入口
     */
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('p');

    if (productId) {
      log('[ROUTER] 商品頁:', productId);
      await verifyIdentity(idToken);
      await loadProduct(productId);
    } else {
      log('[ROUTER] 管理員入口');
      await verifyAdmin(idToken);
    }

  } catch (error) {
    console.error('[LIFF] 初始化失敗:', error);
    showError('LINE 登入失敗：\n' + handleApiErrorMessage(error));
  }
}

/* =================================================
 * 應用程式啟動點
 * ================================================= */
document.addEventListener('DOMContentLoaded', function() {
  log('====================================');
  log('LINE 團購系統 Frontend Start');
  log('LIFF ID:', LIFF_ID);
  log('API URL:', API_URL);
  log('====================================');

  initLIFF();
});
