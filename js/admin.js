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

          <button class="admin-menu-button" onclick="showAllOrdersPage()">
            <div class="admin-menu-icon">🧾</div>
            <div class="admin-menu-title">所有訂單</div>
            <div class="admin-menu-description">查看所有客戶訂單</div>
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

  log('[ADMIN] renderAdminHome 完成');
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
          <label class="field-label">截止時間 *</label>
          <input
            id="productEndAt"
            class="form-input"
            type="datetime-local"
          >
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

  if (!startAt || !endAt) {
    alert('請設定開始與截止時間');
    return;
  }

  if (new Date(endAt) <= new Date(startAt)) {
    alert('截止時間必須晚於開始時間');
    return;
  }

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
        options: []
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
 * 團購清單列表 (所有 ADMIN / OWNER 共管)
 * ================================================= */
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

    renderMyProductsPage(result.products || []);

  } catch (error) {
    console.error('[MY PRODUCTS]', error);
    alert('取得團購失敗：' + handleApiErrorMessage(error));
  } finally {
    hideLoading();
  }
}

function renderMyProductsPage(products) {
  const app = document.getElementById('app');

  let html = `
    <div class="container">
      ${renderUserCard()}

      <button class="back-button" onclick="renderAdminHome()">
        ← 返回管理首頁
      </button>

      <div class="header">
        <h1 class="header-title">團購清單</h1>
        <div class="header-subtitle">查看與管理全部團購商品</div>
      </div>
  `;

  if (!products.length) {
    html += `
      <div class="card">
        <div style="text-align:center;color:#777;padding:30px 10px;">
          目前沒有團購
        </div>
      </div>
    `;
  } else {
    products.forEach(function(product) {
      let statusText = '尚未開始';
      let statusClass = 'status-draft';

      if (product.status === 'OPEN') {
        statusText = '進行中';
        statusClass = 'status-open';
      } else if (product.status === 'CLOSED') {
        statusText = '已截止';
        statusClass = 'status-closed';
      }

      const limitText = product.maxQty > 0
        ? `${product.totalQuantity || 0} / ${product.maxQty}`
        : `${product.totalQuantity || 0}`;

      html += `
        <div class="card" id="product-card-${escapeHtml(product.productId)}">
          <div class="product-status ${statusClass}">
            ${statusText}
          </div>

          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;">
            <div style="font-size:20px;font-weight:700;">
              ${escapeHtml(product.productName)}
            </div>
            <div style="color:#e11d48;font-size:18px;font-weight:700;white-space:nowrap;">
              NT$ ${formatPrice(product.price)}
            </div>
          </div>

          <div class="product-info-row">
            <span class="product-info-label">訂單數</span>
            <span class="product-info-value">${product.orderCount || 0}</span>
          </div>

          <div class="product-info-row">
            <span class="product-info-label">已訂總量</span>
            <span class="product-info-value">${limitText}</span>
          </div>

          <div class="product-info-row">
            <span class="product-info-label">截止時間</span>
            <span class="product-info-value">${formatDateTime(product.endAt)}</span>
          </div>

          <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
            <button
              class="button button-primary"
              style="flex:1;min-width:90px;"
              onclick="showProductOrders('${escapeJs(product.productId)}')"
            >
              查看訂單
            </button>

            <button
              class="button button-secondary"
              style="flex:1;min-width:90px;"
              onclick="showEditProductPage('${escapeJs(product.productId)}')"
            >
              ✏️ 編輯
            </button>

            ${
              product.status !== 'CLOSED'
                ? `
                  <button
                    class="button button-secondary"
                    style="flex:1;min-width:90px;"
                    onclick="closeProduct('${escapeJs(product.productId)}', '${escapeJs(product.productName)}')"
                  >
                    提前關閉
                  </button>
                `
                : ''
            }
          </div>
        </div>
      `;
    });
  }

  html += `</div>`;
  app.innerHTML = html;
}

/* =================================================
 * 團購訂單明細與狀態更新 (含平滑局部更新)
 * ================================================= */
async function showProductOrders(productId) {
  if (!productId) {
    alert('缺少商品編號');
    return;
  }

  window.currentProductId = productId;
  setLoading('正在載入團購訂單...');

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

  let html = `
    <div class="container">
      ${renderUserCard()}

      <button class="back-button" onclick="showMyProductsPage()">
        ← 返回團購清單
      </button>

      <div class="header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div>
          <h1 class="header-title" style="margin:0;">團購訂單</h1>
          <div class="header-subtitle">${escapeHtml(product.productName || '')}</div>
        </div>
        <button
          class="button button-secondary"
          style="width:auto;padding:8px 16px;font-size:14px;"
          onclick="showEditProductPage('${escapeJs(product.productId || window.currentProductId)}')"
        >
          ✏️ 修改商品
        </button>
      </div>

      <div class="card">
        <div class="card-title">訂單統計</div>
        <div class="product-info-row">
          <span class="product-info-label">有效訂單數</span>
          <span class="product-info-value" id="stats-order-count">${stats.orderCount || 0}</span>
        </div>
        <div class="product-info-row">
          <span class="product-info-label">訂購總數量</span>
          <span class="product-info-value" id="stats-total-quantity">${stats.totalQuantity || 0}</span>
        </div>
        <div class="product-info-row">
          <span class="product-info-label">訂購總金額</span>
          <span class="product-info-value" id="stats-total-amount">NT$ ${formatPrice(stats.totalAmount || 0)}</span>
        </div>
      </div>
  `;

  if (!orders.length) {
    html += `
      <div class="card">
        <div style="text-align:center;color:#777;padding:30px 10px;">
          目前還沒有訂單
        </div>
      </div>
    `;
  } else {
    orders.forEach(function(order) {
      let optionsText = '';
      if (Array.isArray(order.options)) {
        optionsText = order.options.map(o => `${o.name}: ${o.value}`).join(', ');
      } else if (typeof order.options === 'object' && order.options !== null) {
        optionsText = Object.entries(order.options).map(e => `${e[0]}: ${e[1]}`).join(', ');
      } else {
        optionsText = String(order.options || '');
      }

      html += `
        <div class="card" id="order-card-${escapeHtml(order.orderId)}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;">
            <div style="font-size:18px;font-weight:700;">
              ${escapeHtml(order.displayName || '未提供名稱')}
            </div>
            <div
              id="order-badge-${escapeHtml(order.orderId)}"
              style="color:#06c755;font-weight:700;font-size:14px;white-space:nowrap;"
            >
              ${escapeHtml(getOrderStatusLabel(order.status))}
            </div>
          </div>

          <div class="product-info-row">
            <span class="product-info-label">訂單編號</span>
            <span class="product-info-value">${escapeHtml(order.orderId || '-')}</span>
          </div>

          <div class="product-info-row">
            <span class="product-info-label">訂購數量</span>
            <span class="product-info-value">${order.quantity || 0}</span>
          </div>

          <div class="product-info-row">
            <span class="product-info-label">單價</span>
            <span class="product-info-value">NT$ ${formatPrice(order.unitPrice || 0)}</span>
          </div>

          <div class="product-info-row">
            <span class="product-info-label">總金額</span>
            <span class="product-info-value" style="color:#e11d48;font-weight:700;">
              NT$ ${formatPrice(order.totalPrice || 0)}
            </span>
          </div>

          <div class="product-info-row">
            <span class="product-info-label">商品規格</span>
            <span class="product-info-value">${escapeHtml(optionsText || '-')}</span>
          </div>

          <div class="product-info-row">
            <span class="product-info-label">下單時間</span>
            <span class="product-info-value">${formatDateTime(order.createdAt)}</span>
          </div>

          <div class="order-status-editor">
            <label class="field-label" style="margin-top:10px;">變更訂單狀態</label>
            <select
              class="form-select"
              data-previous-status="${escapeHtml(order.status)}"
              onchange="updateOrderStatus('${escapeJs(order.orderId)}', this.value, this)"
            >
              <option value="${ORDER_STATUS.PENDING}" ${order.status === ORDER_STATUS.PENDING ? 'selected' : ''}>
                待處理
              </option>
              <option value="${ORDER_STATUS.CONFIRMED}" ${order.status === ORDER_STATUS.CONFIRMED ? 'selected' : ''}>
                已確認
              </option>
              <option value="${ORDER_STATUS.COMPLETED}" ${order.status === ORDER_STATUS.COMPLETED ? 'selected' : ''}>
                已完成
              </option>
              <option value="${ORDER_STATUS.CANCELLED}" ${order.status === ORDER_STATUS.CANCELLED ? 'selected' : ''}>
                已取消
              </option>
            </select>
          </div>
        </div>
      `;
    });
  }

  html += `</div>`;
  app.innerHTML = html;
}

/**
 * 更新訂單狀態 (平滑原地更新，避免全頁反覆閃爍重新抓取)
 */
async function updateOrderStatus(orderId, status, selectElement) {
  if (!orderId || !status) {
    alert('缺少訂單編號或訂單狀態');
    return;
  }

  const normalizedStatus = String(status).trim().toUpperCase();
  const statusLabel = getOrderStatusLabel(normalizedStatus);

  const confirmed = confirm('確定要將此訂單狀態改為「' + statusLabel + '」嗎？');

  /* ---------- 取消：原地恢復舊選取值，免去整個頁面重新載入 ---------- */
  if (!confirmed) {
    if (selectElement && selectElement.dataset && selectElement.dataset.previousStatus) {
      selectElement.value = selectElement.dataset.previousStatus;
    }
    return;
  }

  if (selectElement) {
    selectElement.disabled = true;
  }

  setLoading('正在更新訂單狀態...');

  try {
    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('無法取得 LINE ID Token');
    }

    const result = await apiRequest({
      action: 'updateOrderStatus',
      idToken: idToken,
      orderId: orderId,
      status: normalizedStatus
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    // 局部平滑更新 UI
    if (selectElement) {
      selectElement.disabled = false;
      selectElement.dataset.previousStatus = normalizedStatus;
      selectElement.value = normalizedStatus;
    }

    const badge = document.getElementById(`order-badge-${orderId}`);
    if (badge) {
      badge.textContent = getOrderStatusLabel(normalizedStatus);
      if (normalizedStatus === ORDER_STATUS.CANCELLED) {
        badge.style.color = '#dc2626';
      } else if (normalizedStatus === ORDER_STATUS.COMPLETED) {
        badge.style.color = '#2563eb';
      } else {
        badge.style.color = '#06c755';
      }
    }

    hideLoading();
    alert('訂單狀態已更新為「' + statusLabel + '」');

  } catch (error) {
    console.error('[UPDATE ORDER STATUS Error]', error);
    hideLoading();

    if (selectElement) {
      selectElement.disabled = false;
      if (selectElement.dataset && selectElement.dataset.previousStatus) {
        selectElement.value = selectElement.dataset.previousStatus;
      }
    }

    alert('更新訂單狀態失敗：\n' + handleApiErrorMessage(error));
  }
}

/* =================================================
 * 提前關閉團購
 * ================================================= */
async function closeProduct(productId, productName) {
  const confirmed = confirm(
    '確定要關閉「' + productName + '」嗎？\n\n' +
    '關閉後將無法再接受新的訂單。'
  );

  if (!confirmed) return;

  setLoading('正在關閉團購...');

  try {
    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('無法取得 LINE ID Token');
    }

    const result = await apiRequest({
      action: 'closeProduct',
      idToken: idToken,
      productId: productId
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    alert('團購已關閉');
    await showMyProductsPage();

  } catch (error) {
    console.error('[CLOSE PRODUCT]', error);
    alert('關閉失敗：' + handleApiErrorMessage(error));
  } finally {
    hideLoading();
  }
}

function showAllOrdersPage() {
  hideLoading();
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="container">
      <button class="back-button" onclick="renderAdminHome()">
        ← 返回管理首頁
      </button>

      <div class="card">
        <div class="card-title">所有訂單</div>
        <div style="color:#777;line-height:1.6;">
          如需按商品查看訂單，請至「團購清單」點選各商品的「查看訂單」。
        </div>
      </div>
    </div>
  `;
}

function showSystemPage() {
  hideLoading();
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="container">
      <button class="back-button" onclick="renderAdminHome()">
        ← 返回管理首頁
      </button>

      <div class="card">
        <div class="card-title">系統管理</div>
        <div style="color:#777;line-height:1.6;">
          OWNER 專用功能將在後續加入。目前所有設定於 Google Sheet「Admins」與「Settings」維護。
        </div>
      </div>
    </div>
  `;
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
          <label class="field-label">截止時間 *</label>
          <input
            id="editProductEndAt"
            class="form-input"
            type="datetime-local"
            value="${endAtVal}"
          >
        </div>

        <div class="form-group">
          <label class="field-label">商品規格選項 (JSON 或空)</label>
          <textarea
            id="editProductOptions"
            class="form-textarea"
            rows="3"
            style="font-family:monospace;font-size:13px;"
            placeholder='例如：[{"name":"顏色","values":["黑","米白","卡其"],"required":true}]'
          >${product.options && Array.isArray(product.options) && product.options.length > 0 ? escapeHtml(JSON.stringify(product.options, null, 2)) : ''}</textarea>
          <div class="form-help" style="margin-top:4px;color:#777;font-size:12px;">由 AI 自動解析生成，亦可在此手動調整規格項目。如無規格請留空。</div>
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
  const optionsRaw = document.getElementById('editProductOptions').value.trim();

  let parsedOptions = [];
  if (optionsRaw) {
    try {
      parsedOptions = JSON.parse(optionsRaw);
      if (!Array.isArray(parsedOptions)) {
        alert('商品規格選項必須是 JSON 陣列格式');
        return;
      }
    } catch (e) {
      alert('商品規格選項的 JSON 格式不正確：\n' + e.message);
      return;
    }
  }

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
