/*************************************************
 * LINE 團購系統 - 管理端頁面與邏輯 (js/admin.js)
 *************************************************/

/* =================================================
 * 管理首頁
 * ================================================= */
function renderAdminHome() {
  log('[ADMIN] renderAdminHome 開始');
  hideLoading();

  const app = document.getElementById('app');
  if (!app) {
    throw new Error('找不到 #app');
  }

  app.style.display = 'block';
  const role = currentAdmin ? currentAdmin.role : 'ADMIN';

  app.innerHTML = `
    <div class="container">
      ${renderUserCard()}

      <div class="header">
        <h1 class="header-title">團購管理</h1>
        <div class="header-subtitle">管理員後台</div>
      </div>

      <!-- 📊 即時營運儀表板 -->
      <div id="dashboardPanel" class="card" style="margin-bottom:16px;">
        <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">
          <span>📊 門市營運概況</span>
          <span id="dashboardLoading" style="font-size:12px;color:#9ca3af;">載入中...</span>
        </div>
        <div id="dashboardContent" class="stat-grid" style="grid-template-columns:repeat(2, 1fr);gap:10px;">
          <div class="stat-card" style="text-align:center;padding:12px 8px;"><div class="stat-value" style="color:#ccc;">—</div><div class="stat-label">進行中團購</div></div>
          <div class="stat-card" style="text-align:center;padding:12px 8px;"><div class="stat-value" style="color:#ccc;">—</div><div class="stat-label">待取貨訂單</div></div>
          <div class="stat-card" style="text-align:center;padding:12px 8px;"><div class="stat-value" style="color:#ccc;">—</div><div class="stat-label">本月營業額</div></div>
          <div class="stat-card" style="text-align:center;padding:12px 8px;"><div class="stat-value" style="color:#ccc;">—</div><div class="stat-label">本月訂單筆數</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">管理功能</div>
        <div class="admin-menu">
          <button class="admin-menu-button" onclick="showCreateProductPage()">
            <div class="admin-menu-icon">➕</div>
            <div class="admin-menu-title">新增團購</div>
            <div class="admin-menu-description">建立新的商品與團購活動</div>
          </button>

          <button class="admin-menu-button" onclick="showMyProductsPage()">
            <div class="admin-menu-icon">📦</div>
            <div class="admin-menu-title">團購清單</div>
            <div class="admin-menu-description">查看與共管所有團購商品</div>
          </button>

          <button class="admin-menu-button" style="border-left:4px solid #f59e0b;" onclick="openVendorOrderingHub()">
            <div class="admin-menu-icon">📋</div>
            <div class="admin-menu-title" style="color:#b45309;">廠商叫貨專區</div>
            <div class="admin-menu-description">集中查看待向廠商訂貨商品與叫貨單</div>
          </button>

          <button class="admin-menu-button" onclick="showAllOrdersPage()">
            <div class="admin-menu-icon">🧾</div>
            <div class="admin-menu-title">所有訂單</div>
            <div class="admin-menu-description">跨商品整批核銷與客戶全域搜尋</div>
          </button>

          <button class="admin-menu-button" style="border-left:4px solid #2563eb;" onclick="generateBatchPickupReminder()">
            <div class="admin-menu-icon">📢</div>
            <div class="admin-menu-title" style="color:#1d4ed8;">批量催取提醒</div>
            <div class="admin-menu-description">跨商品一鍵生成未取貨催單文案</div>
          </button>

          ${
            role === 'OWNER'
              ? `
                <button class="admin-menu-button" onclick="showSystemPage()">
                  <div class="admin-menu-icon">⚙️</div>
                  <div class="admin-menu-title">系統管理</div>
                  <div class="admin-menu-description">管理員與系統設定</div>
                </button>
              `
              : ''
          }
        </div>
      </div>

      <div class="card">
        <div class="card-title">帳號資訊</div>
        <div class="product-info-row">
          <span class="product-info-label">LINE 名稱</span>
          <span class="product-info-value">${escapeHtml(currentUser?.displayName || '-')}</span>
        </div>
        <div class="product-info-row">
          <span class="product-info-label">管理角色</span>
          <span class="product-info-value">${escapeHtml(role)}</span>
        </div>
      </div>
    </div>
  `;

  // 非阻塞載入儀表板數據
  loadDashboardStats();

  log('[ADMIN] renderAdminHome 完成');
}

/**
 * 非同步載入儀表板統計數據
 */
async function loadDashboardStats() {
  try {
    const idToken = liff.getIDToken();
    if (!idToken) return;

    const result = await apiRequest({
      action: 'getDashboardStats',
      idToken: idToken
    });

    if (!result.success) return;

    const s = result.stats || {};
    const panel = document.getElementById('dashboardContent');
    const loadingEl = document.getElementById('dashboardLoading');
    if (loadingEl) loadingEl.textContent = '';
    if (!panel) return;

    panel.innerHTML = `
      <div class="stat-card" style="text-align:center;padding:12px 8px;">
        <div class="stat-value" style="font-size:22px;color:#059669;">${s.activeProducts || 0}</div>
        <div class="stat-label" style="font-size:12px;">進行中團購</div>
      </div>
      <div class="stat-card" style="text-align:center;padding:12px 8px;">
        <div class="stat-value" style="font-size:22px;color:#f59e0b;">${s.pendingPickupOrders || 0}</div>
        <div class="stat-label" style="font-size:12px;">待取貨訂單</div>
      </div>
      <div class="stat-card" style="text-align:center;padding:12px 8px;">
        <div class="stat-value" style="font-size:22px;color:#e11d48;">NT$ ${formatPrice(s.monthlyRevenue || 0)}</div>
        <div class="stat-label" style="font-size:12px;">本月營業額</div>
      </div>
      <div class="stat-card" style="text-align:center;padding:12px 8px;">
        <div class="stat-value" style="font-size:22px;color:#2563eb;">${s.monthlyOrderCount || 0}</div>
        <div class="stat-label" style="font-size:12px;">本月訂單筆數</div>
      </div>
    `;
  } catch (err) {
    console.warn('[DASHBOARD]', err);
    const loadingEl = document.getElementById('dashboardLoading');
    if (loadingEl) loadingEl.textContent = '';
  }
}

/**
 * 批量催取提醒 — 跨商品一鍵生成所有到店商品的未取貨催單文案
 */
async function generateBatchPickupReminder() {
  setLoading('正在載入待取貨資訊...');
  try {
    const idToken = liff.getIDToken();
    if (!idToken) throw new Error('無法取得 LINE ID Token');

    const result = await apiRequest({
      action: 'getAllOrders',
      idToken: idToken
    });

    if (!result.success) throw new Error(handleApiErrorMessage(result));

    const orders = result.orders || [];

    // 篩出非已完成、非取消的訂單（只看所屬商品已到店 ARRIVED 的）
    const pendingOrders = orders.filter(o =>
      o.status !== ORDER_STATUS.COMPLETED &&
      o.status !== ORDER_STATUS.CANCELLED &&
      o.productStatus === 'ARRIVED'
    );

    if (pendingOrders.length === 0) {
      hideLoading();
      alert('🎉 太棒了！目前所有到店商品的訂單都已完成取貨，無須催單！');
      return;
    }

    // 依顧客分組
    const customerMap = {};
    pendingOrders.forEach(o => {
      const name = o.displayName || 'LINE 顧客';
      if (!customerMap[name]) customerMap[name] = [];
      customerMap[name].push(o);
    });

    const lines = [
      '【天增團購 - 批量取貨提醒】',
      `📅 日期：${new Date().toLocaleDateString('zh-TW')}`,
      `📊 共 ${Object.keys(customerMap).length} 位顧客、${pendingOrders.length} 筆訂單尚未取貨`,
      '=========================',
      ''
    ];

    Object.entries(customerMap).forEach(([name, customerOrders]) => {
      const total = customerOrders.reduce((sum, o) => sum + (o.totalPrice || (o.unitPrice * o.quantity) || 0), 0);
      lines.push(`👤 ${name}（${customerOrders.length} 件，共 NT$ ${formatPrice(total)}）`);
      customerOrders.forEach(o => {
        const optStr = formatOrderOptionsText(o.options);
        lines.push(`   📦 ${o.productName} × ${o.quantity}${optStr !== '基本款' ? ` (${optStr})` : ''}`);
      });
      lines.push('');
    });

    lines.push('=========================');
    lines.push('💡 溫馨提醒：以上商品已到店，請記得來門市取貨喔！');

    const text = lines.join('\n');

    try {
      await navigator.clipboard.writeText(text);
      hideLoading();
      alert(`✅ 批量催單文案已複製到剪貼簿！\n\n共 ${Object.keys(customerMap).length} 位顧客、${pendingOrders.length} 筆待取訂單。\n\n可直接貼到 LINE 群組或逐一私訊。`);
    } catch (e) {
      hideLoading();
      prompt('複製失敗，請手動複製下方文字：', text);
    }
  } catch (err) {
    console.error('[BATCH REMINDER]', err);
    alert('載入失敗：' + handleApiErrorMessage(err));
  } finally {
    hideLoading();
  }
}

function renderUserCard() {
  const name = currentUser?.displayName || 'LINE 使用者';
  const role = currentAdmin?.role || 'LINE 使用者';
  const avatar = name.charAt(0);

  return `
    <div class="user-card">
      <div class="user-avatar">${escapeHtml(avatar)}</div>
      <div class="user-info">
        <div class="user-name">${escapeHtml(name)}</div>
        <div class="user-role">${escapeHtml(role)}</div>
      </div>
    </div>
  `;
}

/* =================================================
 * 新增團購頁面與送出 (含防重複送出)
 * ================================================= */
function showCreateProductPage() {
  hideLoading();
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="container">
      <button class="back-button" onclick="renderAdminHome()">
        ← 返回管理首頁
      </button>

      <div class="header">
        <h1 class="header-title">新增團購</h1>
        <div class="header-subtitle">建立新的團購商品</div>
      </div>

      <div class="card">
        <div class="form-group">
          <label class="field-label">商品名稱 *</label>
          <input
            id="productName"
            class="form-input"
            type="text"
            placeholder="例如：日本麝香葡萄"
            maxlength="100"
          >
        </div>

        <div class="form-group">
          <label class="field-label">商品價格 *</label>
          <input
            id="productPrice"
            class="form-input"
            type="number"
            min="0"
            step="1"
            placeholder="例如：899"
          >
        </div>

        <div class="form-group">
          <label class="field-label">最大訂購數量</label>
          <input
            id="productMaxQty"
            class="form-input"
            type="number"
            min="0"
            step="1"
            value="0"
            placeholder="0 = 不限量"
          >
          <div class="form-help">0 代表不限量。</div>
        </div>

        <div class="form-group">
          <label class="field-label">開始時間 *</label>
          <input
            id="productStartAt"
            class="form-input"
            type="datetime-local"
          >
        </div>

        <div class="form-group">
          <label class="field-label">截止時間（選填，留空代表常態團購、無截止時間）</label>
          <input
            id="productEndAt"
            class="form-input"
            type="datetime-local"
          >
        </div>

        <div class="form-group">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label class="field-label" style="margin-bottom:0;">商品規格項目（顏色、尺寸、差價、加購等）</label>
            <button
              type="button"
              class="button button-secondary"
              style="width:auto;padding:4px 12px;font-size:12px;"
              onclick="addOptionRowUI('createOptionsContainer')"
            >
              ＋ 新增規格組
            </button>
          </div>

          <div id="createOptionsContainer" style="display:flex;flex-direction:column;gap:12px;margin-bottom:8px;">
            ${renderVisualOptionsEditor([], 'createOptionsContainer')}
          </div>

          <div class="form-help" style="color:#374151;font-size:12px;line-height:1.6;background:#f0fdf4;padding:12px;border-radius:8px;border:1px solid #86efac;margin-top:8px;">
            <div style="font-weight:700;color:#166534;margin-bottom:4px;">💰 如何設定不同規格不同價格？</div>
            <div>• <strong>指定各規格價格（覆蓋底價）</strong>：用 <code>($價格)</code>，例如：<code>3層30cm ($390), 3層40cm ($420)</code></div>
            <div>• <strong>加價購（在底價上加額）</strong>：用 <code>(+加價)</code>，例如：<code>一般包裝, 禮盒包裝 (+$20)</code></div>
            <div>• <strong>一般同價規格</strong>：直接填寫，例如：<code>黑, 米白, 卡其</code></div>
            <div style="margin-top:6px;font-size:11px;color:#6b7280;">提示：可選值用逗號（,）或頓號（、）分開。若此商品無規格，留空即可。</div>
          </div>
        </div>

        <div class="form-group">
          <label class="field-label">商品說明</label>
          <textarea
            id="productDescription"
            class="form-textarea"
            placeholder="輸入商品詳細介紹、規格或取貨方式..."
          ></textarea>
        </div>

        <button
          id="createProductBtn"
          class="button button-primary"
          onclick="createProduct()"
        >
          建立團購
        </button>
      </div>
    </div>
  `;
}

async function createProduct() {
  const button = document.getElementById('createProductBtn');
  const productName = document.getElementById('productName').value.trim();
  const price = document.getElementById('productPrice').value.trim();
  const maxQty = document.getElementById('productMaxQty').value.trim();
  const startAt = document.getElementById('productStartAt').value;
  const endAt = document.getElementById('productEndAt').value;
  const description = document.getElementById('productDescription').value.trim();

  const maxQtyValue = Number(maxQty);
  if (
    maxQty !== '' &&
    (!Number.isInteger(maxQtyValue) || maxQtyValue < 0)
  ) {
    alert('最大訂購數量必須是 0 或正整數');
    return;
  }

  if (!productName) {
    alert('請輸入商品名稱');
    return;
  }

  const priceNumber = Number(price);
  if (price === '' || !Number.isFinite(priceNumber) || priceNumber < 0) {
    alert('請輸入正確商品價格');
    return;
  }

  if (!startAt) {
    alert('請設定開始時間');
    return;
  }

  if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
    alert('截止時間必須晚於開始時間');
    return;
  }

  // 從視覺化規格卡片中收集規格項目
  const optionsResult = collectOptionsFromContainer('createOptionsContainer');
  if (!optionsResult.valid) return;
  const parsedOptions = optionsResult.options;

  try {
    if (button) {
      button.disabled = true;
      button.textContent = '建立中...';
    }

    setLoading('正在建立團購...');

    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('無法取得 LINE ID Token');
    }

    const result = await apiRequest({
      action: 'createProduct',
      idToken: idToken,
      product: {
        productName: productName,
        price: Number(price),
        maxQty: maxQty === '' ? 0 : maxQtyValue,
        startAt: startAt,
        endAt: endAt,
        description: description,
        options: parsedOptions
      }
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    log('[PRODUCT] 建立成功:', result.product);
    currentProduct = result.product;
    renderCreateProductSuccess(result.product);

  } catch (error) {
    console.error('[PRODUCT] 建立失敗:', error);
    hideLoading();
    alert('建立失敗：\n' + handleApiErrorMessage(error));

    if (button) {
      button.disabled = false;
      button.textContent = '建立團購';
    }
  }
}

function renderCreateProductSuccess(product) {
  hideLoading();
  const productLink = 'https://liff.line.me/' + LIFF_ID + '/?p=' + encodeURIComponent(product.productId);
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="container">
      ${renderUserCard()}

      <div class="card">
        <div class="success-box">
          <div class="success-title">✓ 團購建立成功</div>
          <div>${escapeHtml(product.productName)}</div>
        </div>

        <div style="margin-top:20px;font-weight:700;">商品連結</div>
        <div id="productLink" class="link-box">${escapeHtml(productLink)}</div>

        <button class="button button-primary" onclick="copyProductLink()">
          複製連結
        </button>
        <button class="button button-secondary" onclick="shareProductLink()">
          分享到 LINE
        </button>
        <button class="button button-secondary" onclick="openProductLink()">
          開啟商品頁
        </button>
        <button class="button button-secondary" onclick="renderAdminHome()">
          返回管理首頁
        </button>
      </div>
    </div>
  `;
}

function getProductLinkFromPage() {
  const element = document.getElementById('productLink');
  return element ? element.textContent.trim() : '';
}

async function copyProductLink() {
  const link = getProductLinkFromPage();
  if (!link) {
    alert('找不到商品連結');
    return;
  }

  try {
    await navigator.clipboard.writeText(link);
    alert('商品連結已複製');
  } catch (error) {
    console.error(error);
    alert('複製失敗，請手動複製');
  }
}

async function shareProductLink() {
  const link = getProductLinkFromPage();
  if (!link) {
    alert('找不到商品連結');
    return;
  }

  try {
    if (liff.isApiAvailable && liff.isApiAvailable('shareTargetPicker')) {
      await liff.shareTargetPicker([
        {
          type: 'text',
          text: '團購商品：\n' + link
        }
      ]);
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: '團購商品',
        text: '團購商品連結',
        url: link
      });
      return;
    }

    await navigator.clipboard.writeText(link);
    alert('目前無法直接分享，商品連結已複製');
  } catch (error) {
    console.error('[SHARE]', error);
  }
}

function openProductLink() {
  const link = getProductLinkFromPage();
  if (link) {
    window.location.href = link;
  }
}

/* =================================================
 * 團購清單列表 (實體門市生命週期管線 Pipeline)
 * ================================================= */
window.adminProductsCache = [];
window.currentAdminStageFilter = 'ALL';

async function showMyProductsPage() {
  setLoading('正在載入團購清單...');

  try {
    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('無法取得 LINE ID Token');
    }

    const result = await apiRequest({
      action: 'getMyProducts',
      idToken: idToken
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    window.adminProductsCache = result.products || [];
    renderMyProductsPage(window.adminProductsCache);

  } catch (error) {
    console.error('[MY PRODUCTS]', error);
    alert('取得團購失敗：' + handleApiErrorMessage(error));
  } finally {
    hideLoading();
  }
}

function switchProductStageFilter(stage) {
  window.currentAdminStageFilter = stage;
  renderMyProductsPage(window.adminProductsCache);
}

let adminProductSearchTimer = null;
function handleAdminProductSearch(val) {
  window.adminProductSearchQuery = val;
  if (adminProductSearchTimer) clearTimeout(adminProductSearchTimer);
  adminProductSearchTimer = setTimeout(() => {
    renderMyProductsPage(window.adminProductsCache);
    const input = document.getElementById('adminProductSearchInput');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, 120);
}

function renderMyProductsPage(products) {
  const app = document.getElementById('app');

  // 計算各階段數量
  const counts = {
    ALL: products.length,
    OPEN: 0,
    CLOSED_PENDING_ORDER: 0,
    ORDERED: 0,
    ARRIVED: 0,
    FINISHED: 0
  };

  products.forEach(p => {
    const s = String(p.status || '').toUpperCase();
    if (counts[s] !== undefined) {
      counts[s]++;
    }
  });

  const curFilter = window.currentAdminStageFilter || 'ALL';
  const searchQuery = (window.adminProductSearchQuery || '').trim().toLowerCase();

  let filteredProducts = curFilter === 'ALL'
    ? products
    : products.filter(p => String(p.status || '').toUpperCase() === curFilter);

  // 關鍵字搜尋
  if (searchQuery) {
    filteredProducts = filteredProducts.filter(p =>
      String(p.productName || '').toLowerCase().includes(searchQuery) ||
      String(p.productId || '').toLowerCase().includes(searchQuery)
    );
  }

  let html = `
    <div class="container">
      ${renderUserCard()}

      <button class="back-button" onclick="renderAdminHome()">
        ← 返回管理首頁
      </button>

      <div class="header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div>
          <h1 class="header-title" style="margin:0;">團購管線清單</h1>
          <div class="header-subtitle">門市生命週期五大階段掌控</div>
        </div>
        <button class="button button-primary" style="width:auto;padding:8px 16px;font-size:14px;" onclick="showCreateProductPage()">
          ➕ 新增團購
        </button>
      </div>

      <!-- 生命週期管線 Tab 標籤列 -->
      <div class="pipeline-tabs">
        <div class="pipeline-tab ${curFilter === 'ALL' ? 'active' : ''}" onclick="switchProductStageFilter('ALL')">
          全部 (${counts.ALL})
        </div>
        <div class="pipeline-tab ${curFilter === 'OPEN' ? 'active' : ''}" onclick="switchProductStageFilter('OPEN')">
          🔥 進行中 (${counts.OPEN})
        </div>
        <div class="pipeline-tab ${curFilter === 'CLOSED_PENDING_ORDER' ? 'active' : ''}" onclick="switchProductStageFilter('CLOSED_PENDING_ORDER')">
          📋 待向廠商訂貨 (${counts.CLOSED_PENDING_ORDER})
        </div>
        <div class="pipeline-tab ${curFilter === 'ORDERED' ? 'active' : ''}" onclick="switchProductStageFilter('ORDERED')">
          🚚 廠商備貨中 (${counts.ORDERED})
        </div>
        <div class="pipeline-tab ${curFilter === 'ARRIVED' ? 'active' : ''}" onclick="switchProductStageFilter('ARRIVED')">
          🏪 門市取貨中 (${counts.ARRIVED})
        </div>
        <div class="pipeline-tab ${curFilter === 'FINISHED' ? 'active' : ''}" onclick="switchProductStageFilter('FINISHED')">
          🎉 全數完結 (${counts.FINISHED})
        </div>
      </div>

      <!-- 商品搜尋框 -->
      <div style="margin-bottom:12px;">
        <input
          type="text"
          id="adminProductSearchInput"
          class="form-input"
          placeholder="🔍 搜尋商品名稱或編號..."
          value="${escapeHtml(window.adminProductSearchQuery || '')}"
          oninput="handleAdminProductSearch(this.value)"
          style="font-size:14px;padding:10px 14px;"
        >
      </div>

      <!-- 待叫貨集中提醒橫幅 -->
      ${
        counts.CLOSED_PENDING_ORDER > 0 && curFilter !== 'CLOSED_PENDING_ORDER'
          ? `
            <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:12px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <div style="color:#b45309;font-weight:700;font-size:14px;">
                📢 目前有 ${counts.CLOSED_PENDING_ORDER} 檔團購已截止，等待向廠商叫貨！
              </div>
              <button class="quick-action-btn btn-amber" onclick="switchProductStageFilter('CLOSED_PENDING_ORDER')">
                查看叫貨專區 →
              </button>
            </div>
          `
          : ''
      }
  `;

  if (!filteredProducts.length) {
    html += `
      <div class="card">
        <div style="text-align:center;color:#777;padding:40px 10px;">
          <div style="font-size:36px;margin-bottom:8px;">📦</div>
          此分類目前沒有團購商品
        </div>
      </div>
    `;
  } else {
    filteredProducts.forEach(function(product) {
      const stageInfo = getProductStageInfo(product.status);
      const limitText = product.maxQty > 0
        ? `${product.totalQuantity || 0} / ${product.maxQty}`
        : `${product.totalQuantity || 0}`;

      const uncollected = product.uncollectedCount !== undefined ? product.uncollectedCount : (product.orderCount || 0);
      const completed = product.completedCount !== undefined ? product.completedCount : 0;
      const isPendingOrder = product.status === 'CLOSED_PENDING_ORDER';

      html += `
        <div class="card" id="product-card-${escapeHtml(product.productId)}" style="border-left: 4px solid ${isPendingOrder ? '#f59e0b' : '#06c755'}; margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div class="stage-badge ${stageInfo.badgeClass}">
              <span>${stageInfo.icon}</span>
              <span>${escapeHtml(stageInfo.label)}</span>
            </div>
            <div style="font-size:12px;color:#888;">
              ${escapeHtml(stageInfo.desc)}
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;">
            <div style="font-size:19px;font-weight:700;line-height:1.3;">
              ${escapeHtml(product.productName)}
            </div>
            <div style="color:#e11d48;font-size:18px;font-weight:700;white-space:nowrap;">
              NT$ ${formatPrice(product.price)}
            </div>
          </div>

          <!-- 門市統計面板 -->
          <div class="counter-stat-grid">
            <div class="counter-stat-box">
              <div class="counter-stat-label">訂單數 / 訂購總量</div>
              <div class="counter-stat-num">${product.orderCount || 0} 筆 / ${limitText} 件</div>
            </div>
            <div class="counter-stat-box" style="background:#f0fdf4;border-color:#bbf7d0;">
              <div class="counter-stat-label" style="color:#166534;">門市現場取貨進度</div>
              <div class="counter-stat-num" style="color:#15803d;">
                <span style="color:#d97706;">待取 ${uncollected}</span> / <span style="color:#15803d;">已取 ${completed}</span>
              </div>
            </div>
          </div>

          <div class="product-info-row">
            <span class="product-info-label">截止時間</span>
            <span class="product-info-value">${product.endAt ? formatDateTime(product.endAt) : '<span style="color:#06c755;font-weight:600;">常態團購（無截止日）</span>'}</span>
          </div>

          <!-- 📋 集中叫貨明細卡（當處於待向廠商叫貨階段時，直接列出各規格件數） -->
          ${
            isPendingOrder
              ? `
                <div style="background:#fffbeb;border:1px solid #fed7aa;border-radius:10px;padding:12px;margin:12px 0;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="font-weight:700;color:#b45309;font-size:14px;">📋 待叫貨明細 (${product.totalQuantity || 0} 件)</span>
                    <span style="font-size:12px;color:#d97706;font-weight:600;">有效訂單 ${product.orderCount || 0} 筆</span>
                  </div>
                  <div style="background:#fff;border-radius:6px;padding:8px 10px;border:1px solid #fde68a;font-size:13px;max-height:160px;overflow-y:auto;">
                    ${
                      product.optionTally && Object.keys(product.optionTally).length > 0
                        ? Object.entries(product.optionTally).map(([opt, qty]) => `
                          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #fde68a;">
                            <span style="color:#334155;font-weight:600;">• ${escapeHtml(opt)}</span>
                            <span style="font-weight:700;color:#d97706;">${qty} 件</span>
                          </div>
                        `).join('')
                        : `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#334155;font-weight:600;">• 基本款</span><span style="font-weight:700;color:#d97706;">${product.totalQuantity || 0} 件</span></div>`
                    }
                  </div>
                  <!-- 一鍵快速叫貨與複製按鈕 -->
                  <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
                    <button
                      class="quick-action-btn btn-blue"
                      style="flex:2;padding:10px;font-weight:700;justify-content:center;"
                      onclick="advanceProductStageDirect('${escapeJs(product.productId)}', 'ORDERED', '${escapeJs(product.productName)}')"
                    >
                      🚚 點擊直接改為：已叫貨
                    </button>
                    <button
                      class="quick-action-btn btn-amber"
                      style="flex:1;padding:10px;font-weight:700;justify-content:center;"
                      onclick="copyProductTallyDirect('${escapeJs(product.productId)}')"
                    >
                      📋 複製叫貨單
                    </button>
                  </div>
                </div>
              `
              : ''
          }

          <!-- 快捷操作按鈕 -->
          <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
            <button
              class="button button-primary"
              style="flex:2;min-width:130px;padding:10px;"
              onclick="showProductOrders('${escapeJs(product.productId)}')"
            >
              📦 訂單管理 & 門市作業
            </button>

            <button
              class="button button-secondary"
              style="flex:1;min-width:75px;padding:10px;"
              onclick="showEditProductPage('${escapeJs(product.productId)}')"
            >
              ✏️ 編輯
            </button>

            <button
              class="button button-secondary"
              style="min-width:50px;padding:10px;color:#dc2626;"
              onclick="archiveProduct('${escapeJs(product.productId)}', '${escapeJs(product.productName)}')"
              title="封存/刪除團購"
            >
              🗑️
            </button>
          </div>
        </div>
      `;
    });
  }

  html += `</div>`;
  app.innerHTML = html;
}

function openVendorOrderingHub() {
  window.currentAdminStageFilter = 'CLOSED_PENDING_ORDER';
  showMyProductsPage();
}

/**
 * 在清單卡片上一鍵將商品標記為已叫貨
 */
async function advanceProductStageDirect(productId, nextStage, productName) {
  const stageInfo = getProductStageInfo(nextStage);
  if (!confirm(`確定已向廠商下單「${productName}」了嗎？\n\n點擊確認後將直接推進為「${stageInfo.label}」！`)) {
    return;
  }

  setLoading('正在更新叫貨狀態...');

  try {
    const idToken = liff.getIDToken();
    if (!idToken) throw new Error('無法取得 LINE ID Token');

    const result = await apiRequest({
      action: 'updateProductStage',
      idToken: idToken,
      productId: productId,
      stage: nextStage
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    // 本地同步更新快取，無須重新請求全部清單
    if (Array.isArray(window.adminProductsCache)) {
      const p = window.adminProductsCache.find(x => x.productId === productId);
      if (p) p.status = nextStage;
    }

    alert(`✅ 已將「${productName}」推進為「${stageInfo.label}」！`);
    renderMyProductsPage(window.adminProductsCache);

  } catch (error) {
    console.error('[ADVANCE STAGE DIRECT]', error);
    alert('更新失敗：' + handleApiErrorMessage(error));
  } finally {
    hideLoading();
  }
}

/**
 * 在清單卡片上一鍵複製廠商叫貨單
 */
async function copyProductTallyDirect(productId) {
  const product = (window.adminProductsCache || []).find(p => p.productId === productId);
  if (!product) {
    alert('找不到商品資訊');
    return;
  }

  const tally = product.optionTally || {};
  const lines = [
    `【天增團購 - 廠商叫貨單】`,
    `📦 商品：${product.productName}`,
    `💰 團購售價：NT$ ${formatPrice(product.price)}`,
    `📊 有效訂單：${product.orderCount || 0} 筆`,
    `📦 叫貨總件數：${product.totalQuantity || 0} 件`,
    `=========================`,
    `規格叫貨明細：`
  ];

  if (Object.keys(tally).length > 0) {
    Object.entries(tally).forEach(([opt, qty]) => {
      lines.push(`• ${opt}：${qty} 件`);
    });
  } else {
    lines.push(`• 基本規格：${product.totalQuantity || 0} 件`);
  }

  lines.push(`=========================`);
  lines.push(`叫貨統整時間：${formatDateTime(new Date())}`);

  const text = lines.join('\n');

  try {
    await navigator.clipboard.writeText(text);
    alert('✅ 廠商叫貨單已成功複製到剪貼簿！\n可直接開啟 LINE 貼給廠商叫貨。');
  } catch (e) {
    prompt('複製失敗，請手動複製下方文字：', text);
  }
}

/* =================================================
 * 團購訂單明細與門市取貨核銷作業 (包含生命週期推進)
 * ================================================= */
window.currentProductData = null;
window.currentProductOrders = [];
window.currentOrderFilterStatus = 'ALL';

async function showProductOrders(productId) {
  if (!productId) {
    alert('缺少商品編號');
    return;
  }

  window.currentProductId = productId;
  setLoading('正在載入團購訂單與進度...');

  try {
    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('無法取得 LINE ID Token');
    }

    const result = await apiRequest({
      action: 'getProductOrders',
      idToken: idToken,
      productId: productId
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    renderProductOrders(result);

  } catch (error) {
    console.error('[PRODUCT ORDERS]', error);
    alert('取得團購訂單失敗：\n' + handleApiErrorMessage(error));
  } finally {
    hideLoading();
  }
}

function renderProductOrders(result) {
  hideLoading();
  const app = document.getElementById('app');
  const product = result.product || {};
  const orders = result.orders || [];
  const stats = result.stats || {};

  window.currentProductData = product;
  window.currentProductOrders = orders;

  const stageInfo = getProductStageInfo(product.status);
  const curStage = stageInfo.key;

  // 門市取貨統計 (非取消訂單中：COMPLETED 為已取貨，其餘為待取貨)
  const validOrders = orders.filter(o => o.status !== ORDER_STATUS.CANCELLED);
  const completedOrders = validOrders.filter(o => o.status === ORDER_STATUS.COMPLETED);
  const uncollectedOrders = validOrders.filter(o => o.status !== ORDER_STATUS.COMPLETED);

  // 計算廠商叫貨彙總 (按規格 option 統計件數)
  const optionTallyMap = {};
  let totalValidQuantity = 0;
  validOrders.forEach(order => {
    const qty = Number(order.quantity) || 1;
    totalValidQuantity += qty;
    let optStr = '基本款';
    if (Array.isArray(order.options) && order.options.length > 0) {
      optStr = order.options.map(o => `${o.name}: ${o.value}`).join(' / ');
    } else if (typeof order.options === 'string' && order.options.trim()) {
      optStr = order.options;
    }
    optionTallyMap[optStr] = (optionTallyMap[optStr] || 0) + qty;
  });

  let html = `
    <div class="container">
      ${renderUserCard()}

      <button class="back-button" onclick="showMyProductsPage()">
        ← 返回團購管線清單
      </button>

      <!-- 頂部商品標題與編輯按鈕 -->
      <div class="header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
        <div>
          <h1 class="header-title" style="margin:0;font-size:22px;">${escapeHtml(product.productName || '')}</h1>
          <div class="header-subtitle" style="margin-top:4px;">單價：NT$ ${formatPrice(product.price)}</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button
            class="button button-secondary"
            style="width:auto;padding:6px 12px;font-size:13px;"
            onclick="showEditProductPage('${escapeJs(product.productId || window.currentProductId)}')"
          >
            ✏️ 編輯商品
          </button>
          <button
            class="button button-secondary"
            style="width:auto;padding:6px 12px;font-size:13px;"
            onclick="exportOrdersCSV()"
          >
            📥 匯出 CSV
          </button>
        </div>
      </div>

      <!-- 生命週期管線推進控制卡片 -->
      <div class="card" style="background:#f8fafc;border:2px solid #e2e8f0;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="stage-badge ${stageInfo.badgeClass}" style="font-size:14px;padding:6px 12px;">
              ${stageInfo.icon} ${stageInfo.label}
            </div>
            <span style="font-size:13px;color:#64748b;">${stageInfo.desc}</span>
          </div>

          <!-- 手動切換階段選單 -->
          <div>
            <select
              class="form-select"
              style="padding:5px 8px;font-size:12px;width:auto;display:inline-block;"
              onchange="advanceProductStage('${escapeJs(product.productId)}', this.value)"
            >
              <option value="OPEN" ${curStage === 'OPEN' ? 'selected' : ''}>🔥 階段1: 進行中</option>
              <option value="CLOSED_PENDING_ORDER" ${curStage === 'CLOSED_PENDING_ORDER' ? 'selected' : ''}>📋 階段2: 待向廠商訂貨</option>
              <option value="ORDERED" ${curStage === 'ORDERED' ? 'selected' : ''}>🚚 階段3: 廠商備貨中</option>
              <option value="ARRIVED" ${curStage === 'ARRIVED' ? 'selected' : ''}>🏪 階段4: 門市取貨中</option>
              <option value="FINISHED" ${curStage === 'FINISHED' ? 'selected' : ''}>🎉 階段5: 全數完結</option>
            </select>
          </div>
        </div>

        <!-- 依當前階段推薦的一鍵推進按鈕 -->
        <div>
          ${renderStageActionButton(product.productId, curStage)}
        </div>
      </div>

      <!-- 廠商叫貨彙總清單 (Stage 2 叫貨核對必備) -->
      <div class="card" style="margin-bottom:16px;border-left:4px solid #f59e0b;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div class="card-title" style="margin:0;font-size:16px;">📋 廠商叫貨彙總單 (${totalValidQuantity} 件)</div>
          <button
            class="quick-action-btn btn-amber"
            onclick="copyVendorTallyText()"
          >
            📋 一鍵複製叫貨單
          </button>
        </div>

        <div style="background:#fff;border-radius:8px;padding:12px;border:1px solid #fed7aa;font-size:14px;">
          ${
            Object.keys(optionTallyMap).length === 0
              ? '<div style="color:#888;">目前尚無有效訂單可叫貨</div>'
              : Object.entries(optionTallyMap).map(([opt, qty]) => `
                <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #fed7aa;">
                  <span style="font-weight:600;color:#1e293b;">• ${escapeHtml(opt)}</span>
                  <span style="font-weight:700;color:#d97706;">${qty} 件</span>
                </div>
              `).join('')
          }
          <div style="display:flex;justify-content:space-between;padding-top:8px;font-weight:700;color:#b45309;">
            <span>合計總量</span>
            <span>${totalValidQuantity} 件 (有效訂單 ${validOrders.length} 筆)</span>
          </div>
        </div>
      </div>

      <!-- 實體門市現場核銷工具卡 -->
      <div class="card" style="margin-bottom:16px;">
        <div class="card-title" style="font-size:16px;margin-bottom:10px;">🏪 門市現場核銷與催單</div>

        <div class="counter-stat-grid">
          <div class="counter-stat-box" style="background:#fef3c7;border-color:#fde68a;">
            <div class="counter-stat-label" style="color:#b45309;">待顧客取貨付款</div>
            <div class="counter-stat-num" style="color:#b45309;" id="count-uncollected">${uncollectedOrders.length} 筆</div>
          </div>
          <div class="counter-stat-box" style="background:#dcfce7;border-color:#bbf7d0;">
            <div class="counter-stat-label" style="color:#15803d;">已到店完成核銷</div>
            <div class="counter-stat-num" style="color:#15803d;" id="count-completed">${completedOrders.length} 筆</div>
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
          <button
            class="quick-action-btn btn-blue"
            style="flex:1;min-width:150px;justify-content:center;padding:10px;"
            onclick="copyUncollectedNoticeText()"
          >
            📢 一鍵複製未取貨催單文案
          </button>
        </div>
      </div>

      <!-- 訂單搜尋與即時篩選區 -->
      <div class="card" style="margin-bottom:16px;">
        <div style="margin-bottom:10px;">
          <input
            type="text"
            id="orderSearchInput"
            class="form-input"
            placeholder="🔍 快速搜尋顧客 LINE 名稱 / 訂單號 / 規格..."
            oninput="filterOrdersList()"
            style="font-size:15px;padding:10px 14px;"
          />
        </div>

        <!-- 訂單狀態篩選按鈕列 -->
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;">
          <button class="quick-action-btn btn-gray active" id="chip-ALL" onclick="setOrderFilterStatus('ALL')">
            全部 (${orders.length})
          </button>
          <button class="quick-action-btn btn-gray" id="chip-UNCOLLECTED" onclick="setOrderFilterStatus('UNCOLLECTED')">
            待取貨 (${uncollectedOrders.length})
          </button>
          <button class="quick-action-btn btn-gray" id="chip-COMPLETED" onclick="setOrderFilterStatus('COMPLETED')">
            已取貨 (${completedOrders.length})
          </button>
          <button class="quick-action-btn btn-gray" id="chip-CANCELLED" onclick="setOrderFilterStatus('CANCELLED')">
            已取消 (${orders.length - validOrders.length})
          </button>
        </div>
      </div>

      <!-- 訂單清單卡片容器 -->
      <div id="ordersCardsContainer">
        ${renderOrderCardsHtml(orders)}
      </div>
    </div>
  `;

  app.innerHTML = html;
}

function renderStageActionButton(productId, curStage) {
  switch (curStage) {
    case 'OPEN':
      return `
        <button
          class="button button-primary"
          style="background:#f59e0b;border-color:#f59e0b;"
          onclick="advanceProductStage('${escapeJs(productId)}', 'CLOSED_PENDING_ORDER', '確定要提前截止此團購，並推進至「待向廠商訂貨」階段嗎？')"
        >
          ➡️ 截止團購，推進至：待向廠商訂貨
        </button>
      `;
    case 'CLOSED_PENDING_ORDER':
      return `
        <button
          class="button button-primary"
          style="background:#0284c7;border-color:#0284c7;"
          onclick="advanceProductStage('${escapeJs(productId)}', 'ORDERED', '確定已統整數量並向廠商下單了嗎？狀態將改為「廠商備貨中」。')"
        >
          ➡️ 標記為：已向廠商訂貨 (廠商備貨中)
        </button>
      `;
    case 'ORDERED':
      return `
        <button
          class="button button-primary"
          style="background:#06c755;border-color:#06c755;"
          onclick="advanceProductStage('${escapeJs(productId)}', 'ARRIVED', '確定商品已送達門市了嗎？推進後將開放顧客至現場取貨付款！')"
        >
          ➡️ 標記為：商品已到門市！開放顧客取貨付款
        </button>
      `;
    case 'ARRIVED':
      return `
        <button
          class="button button-primary"
          style="background:#4b5563;border-color:#4b5563;"
          onclick="advanceProductStage('${escapeJs(productId)}', 'FINISHED', '確定顧客皆已全數取貨完畢，要將此檔團購結案歸檔嗎？')"
        >
          ➡️ 標記為：全數取貨完結 (結案歸檔)
        </button>
      `;
    case 'FINISHED':
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="color:#15803d;font-weight:600;">🎉 此團購已全部結案完結</span>
          <button
            class="button button-secondary"
            style="width:auto;padding:6px 12px;font-size:13px;"
            onclick="advanceProductStage('${escapeJs(productId)}', 'ARRIVED', '確定要重新將狀態改回「門市取貨中」嗎？')"
          >
            🔄 恢復為門市取貨中
          </button>
        </div>
      `;
    default:
      return '';
  }
}

function renderOrderCardsHtml(orders) {
  if (!orders.length) {
    return `
      <div class="card">
        <div style="text-align:center;color:#777;padding:30px 10px;">
          目前還沒有訂單
        </div>
      </div>
    `;
  }

  return orders.map(order => {
    let optionsText = '';
    if (Array.isArray(order.options) && order.options.length > 0) {
      optionsText = order.options.map(o => `${escapeHtml(o.name)}: ${escapeHtml(o.value)}`).join(' / ');
    } else if (typeof order.options === 'object' && order.options !== null) {
      optionsText = Object.entries(order.options).map(e => `${escapeHtml(e[0])}: ${escapeHtml(e[1])}`).join(' / ');
    } else {
      optionsText = escapeHtml(String(order.options || ''));
    }

    const isCompleted = order.status === ORDER_STATUS.COMPLETED;
    const isCancelled = order.status === ORDER_STATUS.CANCELLED;

    return `
      <div
        class="card order-item-card"
        id="order-card-${escapeHtml(order.orderId)}"
        data-order-id="${escapeHtml(order.orderId)}"
        data-customer-name="${escapeHtml(order.displayName || '').toLowerCase()}"
        data-status="${escapeHtml(order.status)}"
        style="margin-bottom:12px;${isCompleted ? 'border-left:4px solid #2563eb;' : (isCancelled ? 'opacity:0.6;' : 'border-left:4px solid #f59e0b;')}"
      >
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;">
          <div>
            <div style="font-size:18px;font-weight:700;color:#0f172a;">
              👤 ${escapeHtml(order.displayName || '未提供名稱')}
            </div>
            <div style="font-size:12px;color:#94a3b8;">
              ${escapeHtml(order.orderId || '-')}
            </div>
          </div>
          <div
            id="order-badge-${escapeHtml(order.orderId)}"
            class="stage-badge ${isCompleted ? 'badge-primary' : (isCancelled ? 'badge-dark' : 'badge-warning')}"
          >
            ${escapeHtml(getOrderStatusLabel(order.status))}
          </div>
        </div>

        <div class="product-info-row">
          <span class="product-info-label">商品規格</span>
          <span class="product-info-value" style="font-weight:600;color:#06c755;">${optionsText || '基本規格'}</span>
        </div>

        <div class="product-info-row">
          <span class="product-info-label">數量 / 金額</span>
          <span class="product-info-value" style="color:#e11d48;font-weight:700;font-size:16px;">
            ${order.quantity || 0} 件 (NT$ ${formatPrice(order.totalPrice || 0)})
          </span>
        </div>

        <div class="product-info-row">
          <span class="product-info-label">下單時間</span>
          <span class="product-info-value">${formatDateTime(order.createdAt)}</span>
        </div>

        ${
          order.notes
            ? `
              <div class="product-info-row" style="background:#fffbeb;padding:4px 8px;border-radius:6px;margin:4px 0;">
                <span class="product-info-label" style="color:#b45309;">📝 顧客備註</span>
                <span class="product-info-value" style="color:#92400e;font-weight:600;">${escapeHtml(order.notes)}</span>
              </div>
            `
            : ''
        }

        <!-- 門市現場取貨收款一鍵完成按鈕 -->
        <div style="margin-top:12px;padding-top:10px;border-top:1px dashed #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div id="quick-action-area-${escapeHtml(order.orderId)}">
            ${
              !isCompleted && !isCancelled
                ? `
                  <button
                    class="quick-action-btn btn-green"
                    style="padding:8px 16px;font-size:14px;"
                    onclick="quickCompleteOrder('${escapeJs(order.orderId)}')"
                  >
                    ✅ 現場取貨收款完成
                  </button>
                `
                : (isCompleted ? '<span style="color:#2563eb;font-weight:600;font-size:13px;">✓ 已取貨付款結清</span>' : '<span style="color:#dc2626;font-size:13px;">已取消</span>')
            }
          </div>

          <!-- 細部狀態變更選單 -->
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:12px;color:#888;">變更:</span>
            <select
              class="form-select"
              style="padding:4px 8px;font-size:12px;width:auto;"
              data-previous-status="${escapeHtml(order.status)}"
              onchange="updateOrderStatus('${escapeJs(order.orderId)}', this.value, this)"
            >
              <option value="${ORDER_STATUS.PENDING}" ${order.status === ORDER_STATUS.PENDING ? 'selected' : ''}>待處理</option>
              <option value="${ORDER_STATUS.CONFIRMED}" ${order.status === ORDER_STATUS.CONFIRMED ? 'selected' : ''}>已確認</option>
              <option value="${ORDER_STATUS.COMPLETED}" ${order.status === ORDER_STATUS.COMPLETED ? 'selected' : ''}>已完成</option>
              <option value="${ORDER_STATUS.CANCELLED}" ${order.status === ORDER_STATUS.CANCELLED ? 'selected' : ''}>已取消</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* =================================================
 * 門市訂單搜尋與動態篩選
 * ================================================= */
function setOrderFilterStatus(status) {
  window.currentOrderFilterStatus = status;

  // 更新按鈕高亮狀態
  ['ALL', 'UNCOLLECTED', 'COMPLETED', 'CANCELLED'].forEach(s => {
    const chip = document.getElementById(`chip-${s}`);
    if (chip) {
      if (s === status) {
        chip.classList.add('active', 'btn-green');
        chip.classList.remove('btn-gray');
      } else {
        chip.classList.remove('active', 'btn-green');
        chip.classList.add('btn-gray');
      }
    }
  });

  filterOrdersList();
}

function filterOrdersList() {
  const searchInput = document.getElementById('orderSearchInput');
  const keyword = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const filterStatus = window.currentOrderFilterStatus || 'ALL';

  const cards = document.querySelectorAll('.order-item-card');
  let visibleCount = 0;

  cards.forEach(card => {
    const orderId = (card.getAttribute('data-order-id') || '').toLowerCase();
    const customerName = (card.getAttribute('data-customer-name') || '').toLowerCase();
    const textContent = card.textContent.toLowerCase();
    const status = card.getAttribute('data-status') || '';

    // 關鍵字搜尋比對
    const matchesKeyword = !keyword ||
      customerName.includes(keyword) ||
      orderId.includes(keyword) ||
      textContent.includes(keyword);

    // 狀態篩選比對
    let matchesStatus = true;
    if (filterStatus === 'UNCOLLECTED') {
      matchesStatus = (status !== ORDER_STATUS.COMPLETED && status !== ORDER_STATUS.CANCELLED);
    } else if (filterStatus === 'COMPLETED') {
      matchesStatus = (status === ORDER_STATUS.COMPLETED);
    } else if (filterStatus === 'CANCELLED') {
      matchesStatus = (status === ORDER_STATUS.CANCELLED);
    }

    if (matchesKeyword && matchesStatus) {
      card.style.display = 'block';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
}

/* =================================================
 * 實體門市作業工具：一鍵完成核銷
 * ================================================= */
async function quickCompleteOrder(orderId) {
  if (!confirm('確認已收取現金並將商品交付給客人核銷完成？')) {
    return;
  }

  setLoading('正在完成取貨核銷...');

  try {
    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('無法取得 LINE ID Token');
    }

    const result = await apiRequest({
      action: 'updateOrderStatus',
      idToken: idToken,
      orderId: orderId,
      status: ORDER_STATUS.COMPLETED
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    // 找到記憶體中此訂單並更新
    if (Array.isArray(window.currentProductOrders)) {
      const ord = window.currentProductOrders.find(o => o.orderId === orderId);
      if (ord) ord.status = ORDER_STATUS.COMPLETED;
    }

    // 局部平滑更新卡片外觀
    const card = document.getElementById(`order-card-${orderId}`);
    if (card) {
      card.setAttribute('data-status', ORDER_STATUS.COMPLETED);
      card.style.borderLeft = '4px solid #2563eb';
    }

    const badge = document.getElementById(`order-badge-${orderId}`);
    if (badge) {
      badge.textContent = '已完成';
      badge.className = 'stage-badge badge-primary';
    }

    const actionArea = document.getElementById(`quick-action-area-${orderId}`);
    if (actionArea) {
      actionArea.innerHTML = '<span style="color:#2563eb;font-weight:600;font-size:13px;">✓ 已取貨付款結清</span>';
    }

    // 更新計數器數字
    const uncollectedEl = document.getElementById('count-uncollected');
    const completedEl = document.getElementById('count-completed');
    if (uncollectedEl && completedEl) {
      const valid = window.currentProductOrders.filter(o => o.status !== ORDER_STATUS.CANCELLED);
      const done = valid.filter(o => o.status === ORDER_STATUS.COMPLETED).length;
      const wait = valid.length - done;
      uncollectedEl.textContent = `${wait} 筆`;
      completedEl.textContent = `${done} 筆`;
    }

    alert('✅ 取貨收款核銷完成！');

  } catch (error) {
    console.error('[QUICK COMPLETE]', error);
    alert('更新失敗：' + handleApiErrorMessage(error));
  } finally {
    hideLoading();
  }
}

/* =================================================
 * 推進團購商品生命週期階段
 * ================================================= */
async function advanceProductStage(productId, nextStage, promptMsg) {
  if (promptMsg && !confirm(promptMsg)) {
    return;
  }

  setLoading('正在推進團購階段...');

  try {
    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('無法取得 LINE ID Token');
    }

    const result = await apiRequest({
      action: 'updateProductStage',
      idToken: idToken,
      productId: productId,
      stage: nextStage
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    alert('團購階段已更新為：「' + getProductStageInfo(nextStage).label + '」');
    await showProductOrders(productId);

  } catch (error) {
    console.error('[ADVANCE STAGE]', error);
    alert('推進階段失敗：' + handleApiErrorMessage(error));
  } finally {
    hideLoading();
  }
}

/* =================================================
 * 封存／刪除團購
 * ================================================= */
async function archiveProduct(productId, productName) {
  const ok = confirm(
    `確定要封存「${productName}」嗎？\n\n` +
    '封存後此團購將從前台與後台清單中隱藏。\n' +
    '原先的訂單與資料仍會完整保留在 Google 試算表中備查。'
  );

  if (!ok) return;

  setLoading('正在封存團購...');

  try {
    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('無法取得 LINE ID Token');
    }

    const result = await apiRequest({
      action: 'deleteProduct',
      idToken: idToken,
      productId: productId
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    alert('團購已封存');
    await showMyProductsPage();

  } catch (error) {
    console.error('[ARCHIVE PRODUCT]', error);
    alert('封存失敗：' + handleApiErrorMessage(error));
  } finally {
    hideLoading();
  }
}

/* =================================================
 * 門市作業工具：一鍵複製廠商叫貨單
 * ================================================= */
async function copyVendorTallyText() {
  const product = window.currentProductData;
  const orders = window.currentProductOrders || [];

  if (!product) {
    alert('找不到商品資訊');
    return;
  }

  const validOrders = orders.filter(o => o.status !== ORDER_STATUS.CANCELLED);
  if (!validOrders.length) {
    alert('目前沒有有效訂單可叫貨');
    return;
  }

  const tallyMap = {};
  let totalUnits = 0;
  validOrders.forEach(o => {
    const qty = Number(o.quantity) || 1;
    totalUnits += qty;
    let optStr = '基本規格';
    if (Array.isArray(o.options) && o.options.length > 0) {
      optStr = o.options.map(x => `${x.name}: ${x.value}`).join(' / ');
    } else if (typeof o.options === 'string' && o.options.trim()) {
      optStr = o.options;
    }
    tallyMap[optStr] = (tallyMap[optStr] || 0) + qty;
  });

  const lines = [
    `【天增團購 - 廠商叫貨單】`,
    `📦 商品：${product.productName}`,
    `💰 團購售價：NT$ ${formatPrice(product.price)}`,
    `📊 訂單總筆數：${validOrders.length} 筆`,
    `📦 叫貨總件數：${totalUnits} 件`,
    `=========================`,
    `規格叫貨明細：`
  ];

  Object.entries(tallyMap).forEach(([opt, qty]) => {
    lines.push(`• ${opt}：${qty} 件`);
  });

  lines.push(`=========================`);
  lines.push(`叫貨統整時間：${formatDateTime(new Date())}`);

  const text = lines.join('\n');

  try {
    await navigator.clipboard.writeText(text);
    alert('✅ 廠商叫貨單已成功複製到剪貼簿！\n可直接開啟 LINE 貼給廠商叫貨。');
  } catch (e) {
    prompt('複製失敗，請手動複製下方文字：', text);
  }
}

/* =================================================
 * 門市作業工具：一鍵複製未取貨催單文案
 * ================================================= */
async function copyUncollectedNoticeText() {
  const product = window.currentProductData;
  if (!product) {
    alert('找不到商品資訊');
    return;
  }

  const text =
`【天增團購 - 門市到貨取貨提醒 🏪】

親愛的顧客您好：
您在天增團購登記訂購的「${product.productName}」已經抵達門市囉！

歡迎於營業時間前往門市取貨付款。
到店取貨時，請直接告知門市人員您的 LINE 暱稱即可核對取貨。

感謝您的支持與配合！😊`;

  try {
    await navigator.clipboard.writeText(text);
    alert('✅ 到貨取貨提醒已複製到剪貼簿！\n可貼至 LINE 官方帳號群發或直接私訊通知顧客。');
  } catch (e) {
    prompt('複製失敗，請手動複製下方文字：', text);
  }
}

/* =================================================
 * 門市作業工具：匯出 CSV 訂單名單
 * ================================================= */
function exportOrdersCSV() {
  const product = window.currentProductData;
  const orders = window.currentProductOrders || [];

  if (!orders.length) {
    alert('目前沒有訂單可匯出');
    return;
  }

  const bom = '\uFEFF';
  let csv = bom + '訂單編號,下單時間,顧客名稱,商品規格,訂購數量,單價,總金額,訂單狀態,顧客備註\r\n';

  orders.forEach(o => {
    let optStr = '';
    if (Array.isArray(o.options) && o.options.length > 0) {
      optStr = o.options.map(x => `${x.name}: ${x.value}`).join(' / ');
    } else if (typeof o.options === 'string') {
      optStr = o.options;
    }

    const row = [
      o.orderId || '',
      formatDateTime(o.createdAt),
      o.displayName || '',
      optStr,
      o.quantity || 0,
      o.unitPrice || 0,
      o.totalPrice || 0,
      getOrderStatusLabel(o.status),
      o.notes || ''
    ];

    const escapedRow = row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    csv += escapedRow + '\r\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const prodName = (product?.productName || '團購').replace(/[\/\\:*?"<>|]/g, '_');
  a.download = `天增團購_${prodName}_訂單清單.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* =================================================
 * 跨商品所有訂單頁面 (showAllOrdersPage & renderAllOrdersPage)
 * ================================================= */
async function showAllOrdersPage() {
  setLoading('正在載入所有門市訂單...');
  try {
    const idToken = liff.getIDToken();
    if (!idToken) throw new Error('無法取得 LINE ID Token');

    const result = await apiRequest({
      action: 'getAllOrders',
      idToken: idToken
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    window.allOrdersCache = result.orders || [];
    window.allOrdersFilter = window.allOrdersFilter || 'ALL';
    window.allOrdersSearch = window.allOrdersSearch || '';

    renderAllOrdersPage();
  } catch (error) {
    console.error('[ALL ORDERS]', error);
    alert('載入所有訂單失敗：\n' + handleApiErrorMessage(error));
  } finally {
    hideLoading();
  }
}

function renderAllOrdersPage() {
  hideLoading();
  const app = document.getElementById('app');
  if (!app) return;

  const orders = window.allOrdersCache || [];
  const activeFilter = window.allOrdersFilter || 'ALL';
  const query = (window.allOrdersSearch || '').trim().toLowerCase();

  // 統計總數
  const totalCount = orders.length;
  const pendingOrders = orders.filter(o => o.status !== ORDER_STATUS.COMPLETED && o.status !== ORDER_STATUS.CANCELLED);
  const completedOrders = orders.filter(o => o.status === ORDER_STATUS.COMPLETED);
  const cancelledOrders = orders.filter(o => o.status === ORDER_STATUS.CANCELLED);

  // 根據搜尋與篩選條件過濾
  let filtered = orders.filter(o => {
    // 狀態篩選
    if (activeFilter === 'PENDING') {
      if (o.status === ORDER_STATUS.COMPLETED || o.status === ORDER_STATUS.CANCELLED) return false;
    } else if (activeFilter === 'COMPLETED') {
      if (o.status !== ORDER_STATUS.COMPLETED) return false;
    } else if (activeFilter === 'CANCELLED') {
      if (o.status !== ORDER_STATUS.CANCELLED) return false;
    }

    // 關鍵字搜尋（比對顧客姓名、商品名稱、訂單編號、規格）
    if (query) {
      const matchName = String(o.displayName || '').toLowerCase().includes(query);
      const matchProd = String(o.productName || '').toLowerCase().includes(query);
      const matchId = String(o.orderId || '').toLowerCase().includes(query);
      let matchOpt = false;
      if (Array.isArray(o.options)) {
        matchOpt = o.options.some(opt => String(opt.value || '').toLowerCase().includes(query));
      } else if (typeof o.options === 'string') {
        matchOpt = o.options.toLowerCase().includes(query);
      }
      return matchName || matchProd || matchId || matchOpt;
    }
    return true;
  });

  // 若搜尋欄有輸入關鍵字，檢查比對出的顧客待取貨總計（跨商品聚合核銷功能）
  let matchedCustomerPendingOrders = [];
  let matchedCustomerName = '';
  let matchedCustomerTotalAmount = 0;

  if (query) {
    matchedCustomerPendingOrders = filtered.filter(o => o.status !== ORDER_STATUS.COMPLETED && o.status !== ORDER_STATUS.CANCELLED);
    if (matchedCustomerPendingOrders.length > 0) {
      matchedCustomerName = matchedCustomerPendingOrders[0].displayName || query;
      matchedCustomerTotalAmount = matchedCustomerPendingOrders.reduce((sum, o) => sum + (o.totalPrice || (o.unitPrice * o.quantity) || 0), 0);
    }
  }

  let html = `
    <div class="container">
      ${renderUserCard()}

      <button class="back-button" onclick="renderAdminHome()">
        ← 返回管理首頁
      </button>

      <div class="header">
        <h1 class="header-title">門市所有訂單</h1>
        <div class="header-subtitle">跨商品訂單整合與現場快速核銷</div>
      </div>

      <!-- 統計摘要 -->
      <div class="stat-grid" style="grid-template-columns:repeat(3, 1fr);margin-bottom:16px;">
        <div class="stat-card" style="text-align:center;padding:12px 6px;">
          <div class="stat-value" style="font-size:22px;color:#f59e0b;">${pendingOrders.length}</div>
          <div class="stat-label" style="font-size:12px;">待取貨</div>
        </div>
        <div class="stat-card" style="text-align:center;padding:12px 6px;">
          <div class="stat-value" style="font-size:22px;color:#10b981;">${completedOrders.length}</div>
          <div class="stat-label" style="font-size:12px;">已取貨</div>
        </div>
        <div class="stat-card" style="text-align:center;padding:12px 6px;">
          <div class="stat-value" style="font-size:22px;color:#6b7280;">${totalCount}</div>
          <div class="stat-label" style="font-size:12px;">全部筆數</div>
        </div>
      </div>

      <!-- 現場跨商品快速核銷搜尋框 -->
      <div class="card" style="padding:14px;margin-bottom:16px;">
        <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
          <span>🔍 現場櫃台即時搜尋</span>
          <button class="button button-secondary button-small" style="font-size:12px;padding:4px 8px;" onclick="exportAllOrdersCSV()">📥 匯出 CSV</button>
        </div>
        <input
          type="text"
          id="allOrdersSearchInput"
          class="form-input"
          placeholder="輸入客人姓名/LINE暱稱、商品名或單號..."
          value="${escapeHtml(window.allOrdersSearch || '')}"
          oninput="handleAllOrdersSearchInput(this.value)"
          style="font-size:15px;"
        >

        <!-- 狀態過濾標籤 -->
        <div style="display:flex;gap:6px;margin-top:10px;overflow-x:auto;padding-bottom:4px;">
          <button class="button button-small ${activeFilter === 'ALL' ? 'button-primary' : 'button-secondary'}" onclick="setAllOrdersFilter('ALL')">全部 (${totalCount})</button>
          <button class="button button-small ${activeFilter === 'PENDING' ? 'button-primary' : 'button-secondary'}" style="${activeFilter === 'PENDING' ? 'background:#f59e0b;border-color:#f59e0b;' : ''}" onclick="setAllOrdersFilter('PENDING')">🏪 待取貨 (${pendingOrders.length})</button>
          <button class="button button-small ${activeFilter === 'COMPLETED' ? 'button-primary' : 'button-secondary'}" style="${activeFilter === 'COMPLETED' ? 'background:#10b981;border-color:#10b981;' : ''}" onclick="setAllOrdersFilter('COMPLETED')">✅ 已取貨 (${completedOrders.length})</button>
          <button class="button button-small ${activeFilter === 'CANCELLED' ? 'button-primary' : 'button-secondary'}" onclick="setAllOrdersFilter('CANCELLED')">已取消 (${cancelledOrders.length})</button>
        </div>
      </div>

      <!-- 🚀 當搜尋到特定客人且有待取商品時，直出「跨商品一鍵全部核銷」橫幅 -->
      ${
        matchedCustomerPendingOrders.length > 0
          ? `
            <div class="card" style="background:#fef3c7;border:2px solid #f59e0b;padding:16px;margin-bottom:16px;border-radius:12px;">
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                <div>
                  <div style="font-weight:800;font-size:16px;color:#92400e;">
                    👤 客戶【${escapeHtml(matchedCustomerName)}】共有 ${matchedCustomerPendingOrders.length} 件商品待領取
                  </div>
                  <div style="font-size:14px;color:#b45309;margin-top:2px;">
                    應收總金額：<strong style="font-size:18px;color:#b91c1c;">NT$ ${formatPrice(matchedCustomerTotalAmount)}</strong>
                  </div>
                </div>
                <button
                  class="button button-primary"
                  style="background:#16a34a;border-color:#16a34a;padding:10px 16px;font-weight:700;font-size:14px;box-shadow:0 4px 10px rgba(22,163,74,0.3);"
                  onclick="batchCompleteCustomerOrders(${escapeJs(JSON.stringify(matchedCustomerPendingOrders.map(o => o.orderId)))}, '${escapeJs(matchedCustomerName)}', ${matchedCustomerTotalAmount})"
                >
                  ⚡ 一鍵全部核銷收款 (${matchedCustomerPendingOrders.length} 件)
                </button>
              </div>
            </div>
          `
          : ''
      }

      <!-- 訂單清單 -->
      <div style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;color:#6b7280;font-weight:600;">顯示 ${filtered.length} 筆訂單</span>
        ${query ? `<button style="border:none;background:none;color:#ef4444;font-size:12px;cursor:pointer;text-decoration:underline;" onclick="clearAllOrdersSearch()">✕ 清除搜尋</button>` : ''}
      </div>
  `;

  if (filtered.length === 0) {
    html += `
      <div class="card" style="text-align:center;padding:32px 16px;color:#9ca3af;">
        <div style="font-size:36px;margin-bottom:8px;">📭</div>
        <div style="font-size:15px;font-weight:600;">沒有符合條件的訂單</div>
      </div>
    `;
  } else {
    filtered.forEach(order => {
      const isCompleted = order.status === ORDER_STATUS.COMPLETED;
      const isCancelled = order.status === ORDER_STATUS.CANCELLED;
      const isPending = !isCompleted && !isCancelled;
      const optStr = formatOrderOptionsText(order.options);
      const prodStageInfo = getProductStageInfo(order.productStatus || 'UNKNOWN');

      html += `
        <div class="card" style="padding:14px;margin-bottom:12px;border-left:4px solid ${isCompleted ? '#10b981' : isCancelled ? '#9ca3af' : '#f59e0b'};">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
            <div>
              <div style="font-weight:700;font-size:15px;color:#111;">
                👤 ${escapeHtml(order.displayName || 'LINE 顧客')}
              </div>
              <div style="font-size:12px;color:#6b7280;margin-top:2px;">
                單號：<code>${escapeHtml(order.orderId)}</code> · ${formatDateTime(order.createdAt)}
              </div>
            </div>
            <div>
              ${
                isCompleted
                  ? '<span class="status-badge" style="background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;">✅ 已取貨收款</span>'
                  : isCancelled
                    ? '<span class="status-badge" style="background:#f3f4f6;color:#6b7280;">已取消</span>'
                    : '<span class="status-badge" style="background:#fffbeb;color:#92400e;border:1px solid #fde68a;">🏪 待取貨</span>'
              }
            </div>
          </div>

          <!-- 商品名稱與所屬商品狀態標籤 -->
          <div style="background:#f8fafc;padding:10px;border-radius:8px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
              <span style="font-weight:700;color:#1e293b;font-size:14px;">📦 ${escapeHtml(order.productName || '團購商品')}</span>
              <span style="font-size:11px;padding:2px 6px;border-radius:4px;background:#e2e8f0;color:#334155;">${prodStageInfo.badge}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#475569;margin-top:6px;">
              <span>規格：<strong>${escapeHtml(optStr)}</strong> × <strong>${order.quantity}</strong></span>
              <span style="font-weight:700;color:#b91c1c;font-size:14px;">NT$ ${formatPrice(order.totalPrice || (order.unitPrice * order.quantity))}</span>
            </div>
            ${
              order.notes
                ? `
                  <div style="margin-top:6px;font-size:12px;color:#b45309;background:#fffbeb;padding:4px 8px;border-radius:6px;">
                    📝 備註：${escapeHtml(order.notes)}
                  </div>
                `
                : ''
            }
          </div>

          <!-- 操作按鈕 -->
          ${
            isPending
              ? `
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                  <button
                    class="button button-primary button-small"
                    style="background:#16a34a;border-color:#16a34a;padding:6px 14px;font-weight:700;"
                    onclick="completeSingleOrderInAll('${escapeJs(order.orderId)}', '${escapeJs(order.displayName)}')"
                  >
                    ✅ 現場取貨收款完成
                  </button>
                </div>
              `
              : ''
          }
        </div>
      `;
    });
  }

  html += `</div>`;
  app.innerHTML = html;
}

let allOrdersSearchTimeout = null;
function handleAllOrdersSearchInput(val) {
  window.allOrdersSearch = val;
  if (allOrdersSearchTimeout) clearTimeout(allOrdersSearchTimeout);
  allOrdersSearchTimeout = setTimeout(() => {
    renderAllOrdersPage();
    const input = document.getElementById('allOrdersSearchInput');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, 100);
}

function clearAllOrdersSearch() {
  window.allOrdersSearch = '';
  renderAllOrdersPage();
}

function setAllOrdersFilter(filter) {
  window.allOrdersFilter = filter;
  renderAllOrdersPage();
}

/**
 * 跨商品一鍵全部核銷收款
 */
async function batchCompleteCustomerOrders(orderIds, customerName, totalAmount) {
  if (!orderIds || orderIds.length === 0) return;
  const ok = confirm(`確認已向客戶【${customerName}】收取現金 NT$ ${formatPrice(totalAmount)}，並核銷這 ${orderIds.length} 筆待取商品？`);
  if (!ok) return;

  setLoading('正在處理整批核銷收款...');
  try {
    const idToken = liff.getIDToken();
    if (!idToken) throw new Error('無法取得 LINE ID Token');

    const result = await apiRequest({
      action: 'batchUpdateOrderStatus',
      idToken: idToken,
      orderIds: orderIds,
      status: ORDER_STATUS.COMPLETED
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    const idSet = {};
    orderIds.forEach(id => idSet[id] = true);
    if (window.allOrdersCache) {
      window.allOrdersCache.forEach(o => {
        if (idSet[o.orderId]) o.status = ORDER_STATUS.COMPLETED;
      });
    }

    alert(`🎉 成功完成客戶【${customerName}】共 ${result.updatedCount || orderIds.length} 筆訂單核銷收款！`);
    renderAllOrdersPage();
  } catch (err) {
    console.error('[BATCH COMPLETE ORDERS]', err);
    alert('整批核銷失敗：\n' + handleApiErrorMessage(err));
  } finally {
    hideLoading();
  }
}

/**
 * 單筆訂單現場取貨收款完成
 */
async function completeSingleOrderInAll(orderId, customerName) {
  const ok = confirm(`確認已完成【${customerName}】的此筆現場取貨收款？`);
  if (!ok) return;

  setLoading('正在更新訂單狀態...');
  try {
    const idToken = liff.getIDToken();
    if (!idToken) throw new Error('無法取得 LINE ID Token');

    const result = await apiRequest({
      action: 'updateOrderStatus',
      idToken: idToken,
      orderId: orderId,
      status: ORDER_STATUS.COMPLETED
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    if (window.allOrdersCache) {
      const target = window.allOrdersCache.find(o => o.orderId === orderId);
      if (target) target.status = ORDER_STATUS.COMPLETED;
    }

    renderAllOrdersPage();
  } catch (err) {
    console.error('[SINGLE COMPLETE ORDER]', err);
    alert('核銷失敗：\n' + handleApiErrorMessage(err));
  } finally {
    hideLoading();
  }
}

/**
 * 匯出所有訂單為 CSV (含 BOM 中文不亂碼)
 */
function exportAllOrdersCSV() {
  const orders = window.allOrdersCache || [];
  if (orders.length === 0) {
    alert('目前無訂單可匯出');
    return;
  }

  const headers = ['訂單編號', '下單時間', '顧客姓名', 'LINE_ID', '商品編號', '商品名稱', '規格', '單價', '數量', '小計', '訂單狀態', '顧客備註'];
  const rows = orders.map(o => {
    const optStr = formatOrderOptionsText(o.options);
    const total = o.totalPrice || (o.unitPrice * o.quantity) || 0;
    return [
      `"${o.orderId || ''}"`,
      `"${formatDateTime(o.createdAt)}"`,
      `"${(o.displayName || '').replace(/"/g, '""')}"`,
      `"${o.lineUserId || ''}"`,
      `"${o.productId || ''}"`,
      `"${(o.productName || '').replace(/"/g, '""')}"`,
      `"${optStr.replace(/"/g, '""')}"`,
      o.unitPrice || 0,
      o.quantity || 1,
      total,
      `"${getOrderStatusLabel(o.status)}"`,
      `"${(o.notes || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `天增團購_所有訂單名冊_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* =================================================
 * 系統管理與店員權限名單 (showSystemPage & renderSystemPage)
 * ================================================= */
async function showSystemPage() {
  setLoading('正在載入系統管理員名單...');
  try {
    const idToken = liff.getIDToken();
    if (!idToken) throw new Error('無法取得 LINE ID Token');

    const result = await apiRequest({
      action: 'getAdmins',
      idToken: idToken
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    window.systemAdminsCache = result.admins || [];
    window.systemUsersCache = result.users || [];
    window.systemUserRole = result.currentUserRole || 'ADMIN';
    window.systemCurrentUserId = result.currentUserId || '';

    renderSystemPage();
  } catch (error) {
    console.error('[SYSTEM PAGE]', error);
    alert('載入系統管理失敗：\n' + handleApiErrorMessage(error));
  } finally {
    hideLoading();
  }
}

function renderSystemPage() {
  hideLoading();
  const app = document.getElementById('app');
  if (!app) return;

  const admins = window.systemAdminsCache || [];
  const users = window.systemUsersCache || [];
  const isOwner = window.systemUserRole === 'OWNER';
  const myUserId = window.systemCurrentUserId || '';

  let html = `
    <div class="container">
      ${renderUserCard()}

      <button class="back-button" onclick="renderAdminHome()">
        ← 返回管理首頁
      </button>

      <div class="header">
        <h1 class="header-title">系統管理與店員權限</h1>
        <div class="header-subtitle">門市管理人員名單與權限設定</div>
      </div>
  `;

  // 若為 OWNER，顯示新增管理員表單（支援直接從現有使用者下拉挑選）
  if (isOwner) {
    html += `
      <div class="card" style="margin-bottom:16px;">
        <div class="card-title" style="margin-bottom:12px;">➕ 新增或設定管理人員</div>
        <div style="font-size:13px;color:#6b7280;line-height:1.5;margin-bottom:14px;">
          💡 請直接從下方選單挑選曾在天增系統開啟過頁面的使用者或店員，點選後會自動帶入名稱與 ID，免去手動複製貼上！
        </div>
        <form onsubmit="handleSaveAdminSubmit(event)">
          <!-- 核心：直接從目前使用者中下拉挑選 -->
          <div class="form-group">
            <label class="form-label" for="selectExistingUser">👤 選擇現有使用者 / 店員 <span style="color:#ef4444;">*</span></label>
            <select id="selectExistingUser" class="form-select" onchange="handleUserSelectionChange(this.value)">
              <option value="">-- 請點此挑選店員或顧客 --</option>
              ${
                users.map(u => {
                  const existingAdmin = admins.find(a => a.lineUserId === u.lineUserId && a.status === 'ACTIVE');
                  const roleTag = existingAdmin ? ` (現為 ${existingAdmin.role})` : '';
                  return `<option value="${escapeHtml(u.lineUserId)}" data-name="${escapeHtml(u.displayName)}">${escapeHtml(u.displayName)}${roleTag} (ID: ${escapeHtml(u.lineUserId.substring(0, 8))}...)</option>`;
                }).join('')
              }
              <option value="__MANUAL__">✍️ 手動輸入其他 LINE User ID...</option>
            </select>
          </div>

          <!-- LINE User ID (選擇後自動帶入並保持唯讀保護) -->
          <div id="userIdFormGroup" class="form-group" style="display:none;">
            <label class="form-label" for="newAdminUserId">LINE User ID <span style="color:#ef4444;">*</span></label>
            <input type="text" id="newAdminUserId" class="form-input" placeholder="例如：U1234567890abcdef..." required>
          </div>

          <div class="form-group">
            <label class="form-label" for="newAdminName">管理稱謂 / 顯示姓名 <span style="color:#ef4444;">*</span></label>
            <input type="text" id="newAdminName" class="form-input" placeholder="例如：店長小王、櫃台小美" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="newAdminRole">設定權限身分</label>
            <select id="newAdminRole" class="form-select">
              <option value="ADMIN">🛡️ 門市管理員 (ADMIN - 可開團、叫貨、核銷)</option>
              <option value="VIEWER">👁️ 檢視人員 (VIEWER - 僅查看訂單名冊)</option>
              <option value="OWNER">👑 共同系統擁有者 (OWNER - 完整權限)</option>
            </select>
          </div>

          <button type="submit" class="button button-primary" style="width:100%;font-weight:700;">
            💾 儲存並授與權限
          </button>
        </form>
      </div>
    `;
  } else {
    html += `
      <div class="card" style="background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;padding:12px;margin-bottom:16px;">
        ℹ️ 您目前的身分為 <strong>${escapeHtml(window.systemUserRole)}</strong>。只有系統擁有者 (OWNER) 具備新增或異動管理員之權限。
      </div>
    `;
  }

  // 管理員名單卡片
  html += `
    <div class="card">
      <div class="card-title" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
        <span>👥 現有管理人員名單 (${admins.length})</span>
        <button class="button button-secondary button-small" style="font-size:12px;padding:4px 8px;" onclick="showSystemPage()">🔄 重新整理</button>
      </div>
  `;

  if (admins.length === 0) {
    html += `<div style="color:#9ca3af;text-align:center;padding:20px;">尚無設定資料</div>`;
  } else {
    admins.forEach(admin => {
      const isActive = admin.status === 'ACTIVE';
      const isSelf = admin.lineUserId === myUserId;
      let roleBadge = '';
      if (admin.role === 'OWNER') {
        roleBadge = '<span class="status-badge" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;">👑 系統擁有者 (OWNER)</span>';
      } else if (admin.role === 'ADMIN') {
        roleBadge = '<span class="status-badge" style="background:#dbeafe;color:#1e40af;border:1px solid #bfdbfe;">🛡️ 管理員 (ADMIN)</span>';
      } else {
        roleBadge = '<span class="status-badge" style="background:#f3f4f6;color:#374151;">👁️ 檢視者 (VIEWER)</span>';
      }

      html += `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f1f5f9;flex-wrap:wrap;gap:8px;">
          <div>
            <div style="font-weight:700;font-size:15px;color:#111;display:flex;align-items:center;gap:6px;">
              ${escapeHtml(admin.displayName || '未命名人員')}
              ${roleBadge}
              ${isSelf ? '<span style="font-size:11px;color:#059669;font-weight:600;">(您自己)</span>' : ''}
            </div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px;">
              ID：<code>${escapeHtml(admin.lineUserId)}</code>
            </div>
          </div>
          <div>
            ${
              isOwner && !isSelf
                ? isActive
                  ? `<button class="button button-secondary button-small" style="color:#ef4444;border-color:#fecaca;" onclick="handleDeactivateAdmin('${escapeJs(admin.lineUserId)}', '${escapeJs(admin.displayName)}')">⛔ 停用</button>`
                  : `<button class="button button-secondary button-small" style="color:#10b981;border-color:#a7f3d0;" onclick="handleReactivateAdmin('${escapeJs(admin.lineUserId)}', '${escapeJs(admin.displayName)}', '${escapeJs(admin.role)}')">🔄 啟用</button>`
                : `<span style="font-size:12px;color:${isActive ? '#10b981' : '#9ca3af'};font-weight:600;">${isActive ? '🟢 啟用中' : '🔴 已停用'}</span>`
            }
          </div>
        </div>
      `;
    });
  }

  html += `
      </div>
    </div>
  `;

  app.innerHTML = html;
}

function handleUserSelectionChange(val) {
  const userIdGroup = document.getElementById('userIdFormGroup');
  const userIdInput = document.getElementById('newAdminUserId');
  const nameInput = document.getElementById('newAdminName');
  const select = document.getElementById('selectExistingUser');
  const selectedOption = select ? select.options[select.selectedIndex] : null;

  if (!val) {
    if (userIdGroup) userIdGroup.style.display = 'none';
    if (userIdInput) userIdInput.value = '';
    if (nameInput) nameInput.value = '';
    return;
  }

  if (val === '__MANUAL__') {
    if (userIdGroup) userIdGroup.style.display = 'block';
    if (userIdInput) {
      userIdInput.value = '';
      userIdInput.readOnly = false;
      userIdInput.focus();
    }
    if (nameInput) nameInput.value = '';
  } else {
    const displayName = selectedOption ? selectedOption.getAttribute('data-name') : '';
    if (userIdGroup) userIdGroup.style.display = 'block';
    if (userIdInput) {
      userIdInput.value = val;
      userIdInput.readOnly = true;
    }
    if (nameInput) {
      nameInput.value = displayName || '';
    }
  }
}

async function handleSaveAdminSubmit(event) {
  event.preventDefault();
  const userId = document.getElementById('newAdminUserId').value.trim();
  const name = document.getElementById('newAdminName').value.trim();
  const role = document.getElementById('newAdminRole').value;

  if (!userId) {
    alert('請先從「選擇現有使用者 / 店員」下拉選單中挑選人員！');
    return;
  }

  if (!name) {
    alert('請填寫管理稱謂或顯示姓名');
    return;
  }

  setLoading('正在儲存管理員設定...');
  try {
    const idToken = liff.getIDToken();
    if (!idToken) throw new Error('無法取得 LINE ID Token');

    const result = await apiRequest({
      action: 'saveAdmin',
      idToken: idToken,
      targetUserId: userId,
      name: name,
      role: role,
      status: 'ACTIVE'
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    alert('🎉 管理員設定已成功儲存！');
    showSystemPage();
  } catch (err) {
    console.error('[SAVE ADMIN]', err);
    alert('儲存失敗：\n' + handleApiErrorMessage(err));
  } finally {
    hideLoading();
  }
}

async function handleDeactivateAdmin(userId, name) {
  const ok = confirm(`確認要停用【${name}】的管理員權限嗎？`);
  if (!ok) return;

  setLoading('正在停用權限...');
  try {
    const idToken = liff.getIDToken();
    if (!idToken) throw new Error('無法取得 LINE ID Token');

    const result = await apiRequest({
      action: 'deleteAdmin',
      idToken: idToken,
      targetUserId: userId
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    alert('已成功停用該管理員權限！');
    showSystemPage();
  } catch (err) {
    console.error('[DEACTIVATE ADMIN]', err);
    alert('停用失敗：\n' + handleApiErrorMessage(err));
  } finally {
    hideLoading();
  }
}

async function handleReactivateAdmin(userId, name, role) {
  setLoading('正在重新啟用權限...');
  try {
    const idToken = liff.getIDToken();
    if (!idToken) throw new Error('無法取得 LINE ID Token');

    const result = await apiRequest({
      action: 'saveAdmin',
      idToken: idToken,
      targetUserId: userId,
      name: name,
      role: role,
      status: 'ACTIVE'
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    alert('已重新啟用管理員權限！');
    showSystemPage();
  } catch (err) {
    console.error('[REACTIVATE ADMIN]', err);
    alert('啟用失敗：\n' + handleApiErrorMessage(err));
  } finally {
    hideLoading();
  }
}

/* =================================================
 * 編輯商品資料頁面與送出 (showEditProductPage & updateProduct)
 * ================================================= */
async function showEditProductPage(productId) {
  if (!productId) {
    alert('缺少商品編號');
    return;
  }

  setLoading('正在讀取商品資料...');

  try {
    const result = await apiRequest({
      action: 'getProduct',
      productId: productId
    });

    if (!result.success || !result.product) {
      throw new Error(handleApiErrorMessage(result));
    }

    renderEditProductPage(result.product);

  } catch (error) {
    console.error('[EDIT PRODUCT] 讀取失敗:', error);
    alert('讀取商品失敗：\n' + handleApiErrorMessage(error));
  } finally {
    hideLoading();
  }
}

function renderEditProductPage(product) {
  hideLoading();
  const app = document.getElementById('app');

  const startAtVal = toInputDateTime(product.startAt);
  const endAtVal = toInputDateTime(product.endAt);
  const isClosed = product.status === 'CLOSED';

  app.innerHTML = `
    <div class="container">
      <button class="back-button" onclick="showMyProductsPage()">
        ← 返回團購清單
      </button>

      <div class="header">
        <h1 class="header-title">修改商品</h1>
        <div class="header-subtitle">編號：${escapeHtml(product.productId)}</div>
      </div>

      <div class="card">
        <input type="hidden" id="editProductId" value="${escapeHtml(product.productId)}">

        <div class="form-group">
          <label class="field-label">商品狀態</label>
          <select id="editProductStatus" class="form-select">
            <option value="OPEN" ${!isClosed ? 'selected' : ''}>🟢 進行中 (OPEN)</option>
            <option value="CLOSED" ${isClosed ? 'selected' : ''}>🔴 已截止 / 關閉 (CLOSED)</option>
          </select>
          <div class="form-help" style="margin-top:4px;color:#777;font-size:12px;">若設為已截止，前台將立即停止接單。</div>
        </div>

        <div class="form-group">
          <label class="field-label">商品名稱 *</label>
          <input
            id="editProductName"
            class="form-input"
            type="text"
            maxlength="100"
            value="${escapeHtml(product.productName || '')}"
            placeholder="例如：日本麝香葡萄"
          >
        </div>

        <div class="form-group">
          <label class="field-label">商品售價 *</label>
          <input
            id="editProductPrice"
            class="form-input"
            type="number"
            min="0"
            step="1"
            value="${product.price != null ? product.price : ''}"
            placeholder="例如：250"
          >
        </div>

        <div class="form-group">
          <label class="field-label">最大訂購數量</label>
          <input
            id="editProductMaxQty"
            class="form-input"
            type="number"
            min="0"
            step="1"
            value="${product.maxQty != null ? product.maxQty : 0}"
            placeholder="0 = 不限量"
          >
          <div class="form-help" style="margin-top:4px;color:#777;font-size:12px;">0 代表不限量。</div>
        </div>

        <div class="form-group">
          <label class="field-label">開始時間 *</label>
          <input
            id="editProductStartAt"
            class="form-input"
            type="datetime-local"
            value="${startAtVal}"
          >
        </div>

        <div class="form-group">
          <label class="field-label">截止時間（選填，留空代表常態團購、無截止時間）</label>
          <input
            id="editProductEndAt"
            class="form-input"
            type="datetime-local"
            value="${endAtVal}"
          >
        </div>

        <div class="form-group">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label class="field-label" style="margin-bottom:0;">商品規格項目（顏色、尺寸、差價、加購等）</label>
            <button
              type="button"
              class="button button-secondary"
              style="width:auto;padding:4px 12px;font-size:12px;"
              onclick="addOptionRowUI('editOptionsContainer')"
            >
              ＋ 新增規格組
            </button>
          </div>

          <div id="editOptionsContainer" style="display:flex;flex-direction:column;gap:12px;margin-bottom:8px;">
            ${renderVisualOptionsEditor(product.options, 'editOptionsContainer')}
          </div>

          <div class="form-help" style="color:#374151;font-size:12px;line-height:1.6;background:#f0fdf4;padding:12px;border-radius:8px;border:1px solid #86efac;margin-top:8px;">
            <div style="font-weight:700;color:#166534;margin-bottom:4px;">💰 如何設定不同規格不同價格？</div>
            <div>• <strong>指定各規格價格（覆蓋底價）</strong>：用 <code>($價格)</code>，例如：<code>3層30cm ($390), 3層40cm ($420)</code></div>
            <div>• <strong>加價購（在底價上加額）</strong>：用 <code>(+加價)</code>，例如：<code>一般包裝, 禮盒包裝 (+$20)</code></div>
            <div>• <strong>一般同價規格</strong>：直接填寫，例如：<code>黑, 米白, 卡其</code></div>
            <div style="margin-top:6px;font-size:11px;color:#6b7280;">提示：可選值用逗號（,）或頓號（、）分開。若此商品無規格，全部刪除留空即可。</div>
          </div>
        </div>

        <div class="form-group">
          <label class="field-label">商品說明文案</label>
          <textarea
            id="editProductDescription"
            class="form-textarea"
            rows="6"
            placeholder="輸入商品詳細介紹、規格、到貨日程..."
          >${escapeHtml(product.description || '')}</textarea>
        </div>

        <button
          id="updateProductBtn"
          class="button button-primary"
          onclick="updateProduct()"
        >
          儲存修改
        </button>

        <button
          class="button button-secondary"
          style="margin-top:10px;"
          onclick="showMyProductsPage()"
        >
          取消返回
        </button>
      </div>
    </div>
  `;
}

function renderVisualOptionsEditor(options, containerId = 'editOptionsContainer') {
  if (!Array.isArray(options) || options.length === 0) {
    return `
      <div id="noOptionsNotice" style="text-align:center;padding:14px;background:#f9fafb;border:1px dashed #d1d5db;border-radius:8px;color:#777;font-size:13px;">
        目前此商品無規格選項（如需設定顏色、尺寸或不同價格，請點右上角「＋ 新增規格組」）
      </div>
    `;
  }

  return options.map((opt, idx) => createOptionRowHTML(opt.name || '', Array.isArray(opt.values) ? opt.values.join(', ') : '', idx)).join('');
}

function createOptionRowHTML(name, valuesStr, idx) {
  return `
    <div class="option-editor-row" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;position:relative;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-weight:700;font-size:13px;color:#374151;">規格項目</span>
        <button
          type="button"
          onclick="removeOptionRowUI(this)"
          style="background:none;border:none;color:#e11d48;font-size:13px;font-weight:600;cursor:pointer;padding:2px 6px;"
        >
          ✕ 刪除這組
        </button>
      </div>

      <div style="margin-bottom:8px;">
        <label style="display:block;font-size:12px;color:#6b7280;margin-bottom:4px;">規格名稱（例如：顏色、尺寸、口味、配件）</label>
        <input
          class="form-input option-row-name"
          type="text"
          value="${escapeHtml(name)}"
          placeholder="例如：尺寸 或 配件"
          style="padding:8px 12px;font-size:14px;background:#fff;"
        >
      </div>

      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <label style="font-size:12px;color:#6b7280;">可選值（用逗號隔開，可含價格）</label>
        </div>
        <input
          class="form-input option-row-values"
          type="text"
          value="${escapeHtml(valuesStr)}"
          placeholder="例如：3層30cm ($390), 3層40cm ($420)"
          style="padding:8px 12px;font-size:14px;background:#fff;"
        >
        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;align-items:center;">
          <span style="font-size:11px;color:#6b7280;">快速填入範例：</span>
          <button type="button" onclick="appendOptionSample(this, '3層30cm ($390), 3層40cm ($420)')" style="background:#e0f2fe;border:1px solid #bae6fd;border-radius:4px;color:#0284c7;font-size:11px;padding:2px 8px;cursor:pointer;">
            不同尺寸不同價 ($390)
          </button>
          <button type="button" onclick="appendOptionSample(this, '一般包裝, 禮盒包裝 (+$20)')" style="background:#fef3c7;border:1px solid #fde68a;border-radius:4px;color:#b45309;font-size:11px;padding:2px 8px;cursor:pointer;">
            加價購 (+$20)
          </button>
          <button type="button" onclick="appendOptionSample(this, '黑, 米白, 卡其')" style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;color:#4b5563;font-size:11px;padding:2px 8px;cursor:pointer;">
            一般顏色
          </button>
        </div>
      </div>
    </div>
  `;
}

function appendOptionSample(btn, sampleText) {
  const row = btn.closest('.option-editor-row');
  const input = row ? row.querySelector('.option-row-values') : null;
  if (input) {
    input.value = sampleText;
    input.focus();
  }
}

function addOptionRowUI(containerId = 'editOptionsContainer') {
  const container = document.getElementById(containerId) || document.getElementById('editOptionsContainer');
  if (!container) return;

  const notice = container.querySelector('#noOptionsNotice') || document.getElementById('noOptionsNotice');
  if (notice) notice.remove();

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = createOptionRowHTML('', '', Date.now());
  const newRow = tempDiv.firstElementChild;
  container.appendChild(newRow);

  const firstInput = newRow.querySelector('.option-row-name');
  if (firstInput) firstInput.focus();
}

function removeOptionRowUI(btn) {
  const row = btn.closest('.option-editor-row');
  const container = row ? row.parentElement : null;
  if (row) row.remove();

  if (container && container.querySelectorAll('.option-editor-row').length === 0) {
    container.innerHTML = `
      <div id="noOptionsNotice" style="text-align:center;padding:14px;background:#f9fafb;border:1px dashed #d1d5db;border-radius:8px;color:#777;font-size:13px;">
        目前此商品無規格選項（如需設定顏色、尺寸或不同價格，請點右上角「＋ 新增規格組」）
      </div>
    `;
  }
}

function collectOptionsFromContainer(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return { valid: true, options: [] };

  const parsedOptions = [];
  const rows = container.querySelectorAll('.option-editor-row');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nameInput = row.querySelector('.option-row-name');
    const valuesInput = row.querySelector('.option-row-values');

    const name = nameInput ? nameInput.value.trim() : '';
    const rawVals = valuesInput ? valuesInput.value.trim() : '';

    if (!name && !rawVals) continue; // 空行跳過

    if (!name) {
      alert(`第 ${i + 1} 組規格名稱不能為空！`);
      if (nameInput) nameInput.focus();
      return { valid: false };
    }

    if (!rawVals) {
      alert(`請填寫「${name}」的可選項目值！`);
      if (valuesInput) valuesInput.focus();
      return { valid: false };
    }

    // 支援逗號 (全形/半形)、頓號、斜線、換行分隔（注意：絕不可包含空白 \s，因選項中包含 ($390) 或 (+$20) 等價格標籤）
    const valList = rawVals
      .split(/[,，、/／\n]+/)
      .map(v => v.trim())
      .filter(Boolean);

    if (valList.length === 0) {
      alert(`請填寫「${name}」的可選項目值！`);
      if (valuesInput) valuesInput.focus();
      return { valid: false };
    }

    parsedOptions.push({
      name: name,
      values: valList,
      required: true
    });
  }

  return { valid: true, options: parsedOptions };
}

async function updateProduct() {
  const button = document.getElementById('updateProductBtn');
  const productId = document.getElementById('editProductId').value.trim();
  const productName = document.getElementById('editProductName').value.trim();
  const price = document.getElementById('editProductPrice').value.trim();
  const maxQty = document.getElementById('editProductMaxQty').value.trim();
  const startAt = document.getElementById('editProductStartAt').value;
  const endAt = document.getElementById('editProductEndAt').value;
  const description = document.getElementById('editProductDescription').value.trim();
  const status = document.getElementById('editProductStatus').value;

  // 從視覺化規格卡片中收集規格項目
  const optionsResult = collectOptionsFromContainer('editOptionsContainer');
  if (!optionsResult.valid) return;
  const parsedOptions = optionsResult.options;

  if (!productId) {
    alert('缺少商品編號');
    return;
  }

  if (!productName) {
    alert('請輸入商品名稱');
    return;
  }

  const priceNumber = Number(price);
  if (price === '' || !Number.isFinite(priceNumber) || priceNumber < 0) {
    alert('請輸入正確商品價格');
    return;
  }

  const maxQtyValue = Number(maxQty);
  if (maxQty !== '' && (!Number.isInteger(maxQtyValue) || maxQtyValue < 0)) {
    alert('最大訂購數量必須是 0 或正整數');
    return;
  }

  if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
    alert('截止時間必須晚於開始時間');
    return;
  }

  try {
    if (button) {
      button.disabled = true;
      button.textContent = '儲存中...';
    }

    setLoading('正在儲存商品修改...');

    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('無法取得 LINE ID Token');
    }

    const result = await apiRequest({
      action: 'updateProduct',
      idToken: idToken,
      productId: productId,
      product: {
        productName: productName,
        price: Number(price),
        maxQty: maxQty === '' ? 0 : maxQtyValue,
        startAt: startAt,
        endAt: endAt,
        description: description,
        options: parsedOptions,
        status: status
      }
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    alert('🎉 商品修改成功！');
    await showMyProductsPage();

  } catch (error) {
    console.error('[UPDATE PRODUCT] 失敗:', error);
    hideLoading();
    alert('修改失敗：\n' + handleApiErrorMessage(error));

    if (button) {
      button.disabled = false;
      button.textContent = '儲存修改';
    }
  }
}
