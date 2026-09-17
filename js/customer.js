/*************************************************
 * LINE 團購系統 - 顧客端頁面與邏輯 (js/customer.js)
 *************************************************/

/* =================================================
 * 載入並渲染顧客商品頁
 * ================================================= */
async function loadProduct(productId) {
  log('[PRODUCT] 開始載入商品：', productId);
  setLoading('正在載入商品...');

  try {
    const result = await apiRequest({
      action: 'getProduct',
      productId: productId
    });

    log('[PRODUCT] API 回應：', result);

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    if (!result.product) {
      throw new Error('API 沒有回傳商品資料');
    }

    currentProduct = result.product;
    renderProductPage(currentProduct);

  } catch (error) {
    console.error('[PRODUCT] 載入失敗：', error);
    renderProductError(handleApiErrorMessage(error));
  } finally {
    hideLoading();
  }
}

function renderProductPage(product) {
  const app = document.getElementById('app');
  const isOpen = product.status === 'OPEN';

  let statusText = '尚未開始';
  let statusClass = 'status-draft';

  if (product.status === 'OPEN') {
    statusText = '訂購中';
    statusClass = 'status-open';
  } else if (product.status === 'CLOSED') {
    statusText = '已截止';
    statusClass = 'status-closed';
  }

  const maxQtyText = product.maxQty > 0
    ? `最多 ${product.maxQty} 件`
    : '不限數量';

  app.innerHTML = `
    <div class="container">
      ${renderCustomerUserCard()}

      <div class="card">
        <div class="product-status ${statusClass}">
          ${statusText}
        </div>

        <h1 class="product-name">
          ${escapeHtml(product.productName)}
        </h1>

        <div class="product-price">
          NT$ ${formatPrice(product.price)}
        </div>

        ${
          product.description
            ? `<div class="product-description">${escapeHtml(product.description)}</div>`
            : ''
        }

        <div>
          ${
            product.startAt
              ? `
                <div class="product-info-row">
                  <span class="product-info-label">開始時間</span>
                  <span class="product-info-value">${formatDateTime(product.startAt)}</span>
                </div>
              `
              : ''
          }

          ${
            product.endAt
              ? `
                <div class="product-info-row">
                  <span class="product-info-label">截止時間</span>
                  <span class="product-info-value">${formatDateTime(product.endAt)}</span>
                </div>
              `
              : ''
          }

          <div class="product-info-row">
            <span class="product-info-label">訂購限制</span>
            <span class="product-info-value">${maxQtyText}</span>
          </div>
        </div>
      </div>

      ${
        isOpen
          ? renderOrderForm(product)
          : renderUnavailableProduct(product)
      }
    </div>
  `;

  if (isOpen) {
    orderQuantity = 1;
    updateOrderTotal();
  }
}

function renderCustomerUserCard() {
  const name = currentUser?.displayName || 'LINE 使用者';

  return `
    <div class="user-card">
      <div class="user-avatar">
        ${escapeHtml(name.charAt(0))}
      </div>
      <div class="user-info">
        <div class="user-name">
          ${escapeHtml(name)}
        </div>
        <div class="user-role">
          LINE 使用者
        </div>
      </div>
    </div>
  `;
}

function renderOrderForm(product) {
  return `
    <div class="card">
      <div class="card-title">
        我要訂購
      </div>

      <div class="quantity-section">
        <label class="field-label">
          訂購數量
        </label>

        <div class="quantity-control">
          <button
            type="button"
            class="quantity-button"
            onclick="changeQuantity(-1)"
          >
            −
          </button>

          <div id="quantity" class="quantity-value">
            1
          </div>

          <button
            type="button"
            class="quantity-button"
            onclick="changeQuantity(1)"
          >
            ＋
          </button>
        </div>
      </div>

      <div class="total-box">
        <span class="total-label">總金額</span>
        <strong id="orderTotal" class="total-price">
          NT$ ${formatPrice(product.price)}
        </strong>
      </div>

      <button
        id="submitOrderButton"
        class="button button-primary"
        onclick="submitOrder()"
      >
        確認訂購
      </button>

      <button
        class="button button-secondary"
        onclick="showMyOrdersPage()"
      >
        查看我的訂單
      </button>
    </div>
  `;
}

function renderUnavailableProduct(product) {
  const isDraft = product.status === 'DRAFT';
  const title = isDraft ? '團購尚未開始' : '本團購已截止';
  const icon = isDraft ? '⏳' : '🔒';

  const timeText = isDraft
    ? (product.startAt ? `<div style="color:#777;margin-bottom:20px;">開始時間：${formatDateTime(product.startAt)}</div>` : '')
    : (product.endAt ? `<div style="color:#777;margin-bottom:20px;">截止時間：${formatDateTime(product.endAt)}</div>` : '');

  return `
    <div class="card">
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:42px;margin-bottom:12px;">${icon}</div>
        <div style="font-size:20px;font-weight:700;margin-bottom:8px;">${title}</div>
        ${timeText}
        <button class="button button-secondary" onclick="showMyOrdersPage()">
          查看我的訂單
        </button>
      </div>
    </div>
  `;
}

function changeQuantity(delta) {
  if (!currentProduct) return;

  // 優先使用後端計算的剩餘庫存，避免選了超量後才被後端擋回
  const maxQty = currentProduct.remainingQuantity != null
    ? currentProduct.remainingQuantity
    : (currentProduct.maxQty > 0 ? currentProduct.maxQty : 999);
  orderQuantity += delta;

  if (orderQuantity < 1) orderQuantity = 1;
  if (orderQuantity > maxQty) orderQuantity = maxQty;

  const quantityElement = document.getElementById('quantity');
  if (quantityElement) {
    quantityElement.textContent = orderQuantity;
  }

  updateOrderTotal();
}

function updateOrderTotal() {
  if (!currentProduct) return;

  const total = Number(currentProduct.price) * Number(orderQuantity);
  const totalElement = document.getElementById('orderTotal');
  if (totalElement) {
    totalElement.textContent = 'NT$ ' + total.toLocaleString();
  }
}

/* =================================================
 * 送出訂單（含防連點鎖定與 requestId）
 * ================================================= */
async function submitOrder() {
  const button = document.getElementById('submitOrderButton');

  if (!currentProduct) {
    alert('商品資料不存在');
    return;
  }

  if (currentProduct.status !== 'OPEN') {
    alert('此團購目前無法訂購');
    return;
  }

  if (!Number.isInteger(orderQuantity) || orderQuantity < 1) {
    alert('訂購數量錯誤');
    return;
  }

  try {
    if (button) {
      button.disabled = true;
      button.textContent = '送出中...';
    }

    setLoading('正在建立訂單...');

    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('無法取得 LINE ID Token，請重新登入');
    }

    const requestId = generateRequestId();
    log('[ORDER] requestId:', requestId);

    const result = await apiRequest({
      action: 'createOrder',
      idToken: idToken,
      productId: currentProduct.productId,
      quantity: orderQuantity,
      options: [],
      requestId: requestId
    });

    log('[ORDER] GAS 回應:', result);

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    renderOrderSuccess(result.order);

  } catch (error) {
    console.error('[ORDER] 建立失敗:', error);
    hideLoading();
    alert('訂購失敗：\n' + handleApiErrorMessage(error));

    if (button) {
      button.disabled = false;
      button.textContent = '確認訂購';
    }
  }
}

function renderOrderSuccess(order) {
  hideLoading();
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="container">
      <div class="card">
        <div style="text-align:center;padding:20px 0;">
          <div style="font-size:48px;margin-bottom:12px;">🎉</div>
          <h2 style="font-size:22px;margin:0 0 8px;">訂購成功！</h2>
          <div style="color:#777;margin-bottom:24px;">感謝您的訂購，已為您記錄訂單。</div>

          <div style="background:#f9fafb;border-radius:12px;padding:16px;text-align:left;margin-bottom:24px;">
            <div class="product-info-row">
              <span class="product-info-label">訂單編號</span>
              <span class="product-info-value">${escapeHtml(order.orderId)}</span>
            </div>
            <div class="product-info-row">
              <span class="product-info-label">商品名稱</span>
              <span class="product-info-value">${escapeHtml(order.productName)}</span>
            </div>
            <div class="product-info-row">
              <span class="product-info-label">訂購數量</span>
              <span class="product-info-value">${order.quantity} 件</span>
            </div>
            <div class="product-info-row">
              <span class="product-info-label">訂單金額</span>
              <span class="product-info-value" style="color:#06c755;font-weight:700;">NT$ ${formatPrice(order.totalPrice)}</span>
            </div>
            <div class="product-info-row">
              <span class="product-info-label">訂單狀態</span>
              <span class="product-info-value">${getOrderStatusLabel(order.status)}</span>
            </div>
          </div>

          <button class="button button-primary" onclick="showMyOrdersPage()">
            查看我的訂單
          </button>
          <button class="button button-secondary" onclick="location.reload()" style="margin-top:10px;">
            返回商品頁
          </button>
        </div>
      </div>
    </div>
  `;
}

/* =================================================
 * 我的訂單列表
 * ================================================= */
async function showMyOrdersPage() {
  setLoading('正在載入我的訂單...');

  try {
    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('無法取得 LINE ID Token');
    }

    const result = await apiRequest({
      action: 'getMyOrders',
      idToken: idToken
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    renderMyOrders(result.orders || []);

  } catch (error) {
    console.error('[MY ORDERS]', error);
    showError('載入我的訂單失敗：\n' + handleApiErrorMessage(error));
  }
}

function renderMyOrders(orders) {
  hideLoading();
  const app = document.getElementById('app');

  let orderHtml = '';
  if (!orders.length) {
    orderHtml = `
      <div style="text-align:center;color:#777;padding:30px 10px;">
        目前沒有訂單
      </div>
    `;
  } else {
    orderHtml = orders.map(order => `
      <div class="card" style="margin-bottom:12px">
        <div style="font-size:18px;font-weight:700;margin-bottom:10px;">
          ${escapeHtml(order.productName || '-')}
        </div>
        <div class="product-info-row">
          <span class="product-info-label">訂單編號</span>
          <span class="product-info-value">${escapeHtml(order.orderId || '-')}</span>
        </div>
        <div class="product-info-row">
          <span class="product-info-label">數量</span>
          <span class="product-info-value">${order.quantity || 0}</span>
        </div>
        <div class="product-info-row">
          <span class="product-info-label">金額</span>
          <span class="product-info-value">NT$ ${formatPrice(order.totalPrice || 0)}</span>
        </div>
        <div class="product-info-row">
          <span class="product-info-label">狀態</span>
          <span class="product-info-value">${getOrderStatusLabel(order.status)}</span>
        </div>
        <div class="product-info-row">
          <span class="product-info-label">訂購時間</span>
          <span class="product-info-value">${formatDateTime(order.createdAt)}</span>
        </div>
      </div>
    `).join('');
  }

  app.innerHTML = `
    <div class="container">
      ${renderCustomerUserCard()}

      <button class="back-button" onclick="location.reload()">
        ← 返回
      </button>

      <div class="header">
        <h1 class="header-title">
          我的訂單
        </h1>
      </div>

      ${orderHtml}
    </div>
  `;
}

function showNonAdminPage() {
  hideLoading();
  const app = document.getElementById('app');
  app.style.display = 'block';

  app.innerHTML = `
    <div class="container">
      ${renderCustomerUserCard()}

      <div class="card">
        <div style="text-align:center;padding:20px 0;">
          <div style="font-size:42px;margin-bottom:12px;">👤</div>
          <div style="font-size:20px;font-weight:700;margin-bottom:8px;">
            一般使用者
          </div>
          <div style="color:#777;line-height:1.6;margin-bottom:20px;">
            你目前沒有管理員權限。
          </div>
          <button class="button button-primary" onclick="showMyOrdersPage()">
            查看我的訂單
          </button>
        </div>
      </div>
    </div>
  `;
}
