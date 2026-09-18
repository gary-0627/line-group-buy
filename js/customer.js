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
    renderProductError(handleApiErrorMessage(error), productId);
  } finally {
    hideLoading();
  }
}

function renderProductPage(product) {
  hideLoading();
  const app = document.getElementById('app');
  const isOpen = product.status === 'OPEN';
  const stageInfo = getProductStageInfo(product.status);

  let statusText = stageInfo.label;
  let statusClass = isOpen ? 'status-open' : 'status-closed';

  const maxQtyText = product.maxQty > 0
    ? `最多 ${product.maxQty} 件`
    : '不限數量';

  app.innerHTML = `
    <div class="container">
      ${renderCustomerUserCard()}

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div class="stage-badge ${stageInfo.badgeClass}" style="font-size:14px;padding:6px 12px;">
            ${stageInfo.icon} ${stageInfo.label}
          </div>
          <span style="font-size:12px;color:#64748b;">${stageInfo.desc}</span>
        </div>

        ${
          product.status === 'ARRIVED'
            ? `
              <div style="background:#dbeafe;border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;margin-bottom:14px;color:#1e40af;font-size:14px;line-height:1.5;">
                <strong>🏪 門市到貨公告：</strong><br/>
                此商品已全數抵達天增門市！請有登記下單的顧客於營業時間前往門市取貨付款。到店時出示 LINE 暱稱即可核對取貨。
              </div>
            `
            : ''
        }

        <h1 class="product-name">
          ${escapeHtml(product.productName)}
        </h1>

        <div class="product-price">
          NT$ ${formatPrice(product.price)}${hasTieredPricing(product.options) ? ' 起' : ''}
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

function updateCustomerUserCard() {
  const name = currentUser?.displayName || 'LINE 使用者';
  const nameEl = document.querySelector('.user-card .user-name');
  const avatarEl = document.querySelector('.user-card .user-avatar');
  if (nameEl) nameEl.textContent = name;
  if (avatarEl) avatarEl.textContent = name.charAt(0);
}

function renderOrderForm(product) {
  return `
    <div class="card">
      <div class="card-title">
        我要訂購
      </div>

      ${renderProductOptionsForm(product.options)}

      <div class="quantity-section">
        <label class="field-label">
          訂購數量
        </label>

        <div class="quantity-control">
          <button
            type="button"
            class="quantity-button"
            onclick="changeQuantity(-1)"
            aria-label="減少數量"
          >
            −
          </button>

          <input
            id="quantity"
            class="quantity-input"
            type="number"
            inputmode="numeric"
            pattern="[0-9]*"
            min="1"
            value="1"
            oninput="handleQuantityInput(this.value)"
            onblur="validateQuantityInput(this)"
            aria-label="訂購數量"
          >

          <button
            type="button"
            class="quantity-button"
            onclick="changeQuantity(1)"
            aria-label="增加數量"
          >
            ＋
          </button>
        </div>

        <div class="quantity-quick-row">
          <button type="button" class="quick-add-btn" onclick="setExactQuantity(1)">1</button>
          <button type="button" class="quick-add-btn" onclick="changeQuantity(5)">+5</button>
          <button type="button" class="quick-add-btn" onclick="changeQuantity(10)">+10</button>
          <button type="button" class="quick-add-btn" onclick="changeQuantity(20)">+20</button>
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

function renderProductOptionsForm(options) {
  if (!Array.isArray(options) || options.length === 0) {
    return '';
  }

  let html = '<div class="product-options-container" style="margin-bottom:20px;">';

  options.forEach((opt, idx) => {
    const optName = opt.name || `規格 ${idx + 1}`;
    const values = Array.isArray(opt.values) ? opt.values : [];
    const isRequired = opt.required !== false;

    html += `
      <div class="form-group" style="margin-bottom:16px;">
        <label class="field-label" style="font-weight:700;display:flex;align-items:center;gap:4px;">
          <span>${escapeHtml(optName)}</span>
          ${isRequired ? '<span style="color:#e11d48;font-size:12px;">*必選</span>' : ''}
        </label>
        <div class="option-chips-row" data-option-name="${escapeHtml(optName)}" style="display:flex;flex-wrap:wrap;gap:8px;">
    `;

    values.forEach(val => {
      html += `
        <button
          type="button"
          class="option-chip"
          data-value="${escapeHtml(val)}"
          onclick="selectOptionChip(this, '${escapeJs(optName)}', '${escapeJs(val)}')"
          style="padding:8px 16px;border:1.5px solid #d1d5db;background:#fff;border-radius:8px;font-size:14px;font-weight:600;color:#374151;cursor:pointer;transition:all 0.15s;touch-action:manipulation;"
        >
          ${escapeHtml(val)}
        </button>
      `;
    });

    html += `
        </div>
        <input type="hidden" id="selected-option-${idx}" name="product-option" data-option-name="${escapeHtml(optName)}" value="">
      </div>
    `;
  });

  html += '</div>';
  return html;
}

function selectOptionChip(button, optionName, value) {
  const container = button.closest('.option-chips-row');
  if (!container) return;

  // 切換同組按鈕樣式
  container.querySelectorAll('.option-chip').forEach(btn => {
    btn.style.borderColor = '#d1d5db';
    btn.style.background = '#fff';
    btn.style.color = '#374151';
    btn.classList.remove('selected');
  });

  button.style.borderColor = '#06c755';
  button.style.background = '#f0fdf4';
  button.style.color = '#06c755';
  button.classList.add('selected');

  // 將選取的值存入隱藏欄位
  const group = button.closest('.form-group');
  const input = group ? group.querySelector('input[name="product-option"]') : null;
  if (input) {
    input.value = value;
  }

  // 選取規格後立即重新計算總金額（支援不同規格不同價格動態連動）
  updateOrderTotal();
}

function renderUnavailableProduct(product) {
  const stageInfo = getProductStageInfo(product.status);
  let title = '本團購已截止';
  let icon = '🔒';
  let desc = '目前非開放登記期間。';

  if (product.status === 'ARRIVED') {
    title = '商品已抵達門市！';
    icon = '🏪';
    desc = '有登記下單的顧客，請於營業時間前往門市取貨付款。<br>到店出示 LINE 暱稱即可核對。';
  } else if (product.status === 'ORDERED') {
    title = '廠商備貨中';
    icon = '🚚';
    desc = '已統整向廠商叫貨中，物流配送中。抵達門市後將開放取貨付款！';
  } else if (product.status === 'CLOSED_PENDING_ORDER') {
    title = '登記截止／備貨準備中';
    icon = '📋';
    desc = '登記已截止，門市人員正統整數量向廠商叫貨。';
  } else if (product.status === 'FINISHED') {
    title = '本檔團購已完結';
    icon = '🎉';
    desc = '此商品團購已全數取貨結案。';
  } else if (product.status === 'DRAFT') {
    title = '團購尚未開始';
    icon = '⏳';
    desc = product.startAt ? `預計開始時間：${formatDateTime(product.startAt)}` : '敬請期待。';
  }

  return `
    <div class="card">
      <div style="text-align:center;padding:24px 10px;">
        <div style="font-size:44px;margin-bottom:12px;">${icon}</div>
        <div style="font-size:20px;font-weight:700;margin-bottom:8px;color:#1e293b;">${title}</div>
        <div style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:20px;">${desc}</div>
        <button class="button button-primary" onclick="showMyOrdersPage()">
          查看我的訂單進度
        </button>
      </div>
    </div>
  `;
}

function getMaxAllowedQuantity() {
  if (!currentProduct) return 999;
  return currentProduct.remainingQuantity != null
    ? currentProduct.remainingQuantity
    : (currentProduct.maxQty > 0 ? currentProduct.maxQty : 999);
}

function changeQuantity(delta) {
  if (!currentProduct) return;

  const maxQty = getMaxAllowedQuantity();
  orderQuantity += delta;

  if (orderQuantity < 1) orderQuantity = 1;
  if (orderQuantity > maxQty) orderQuantity = maxQty;

  syncQuantityDisplay();
  updateOrderTotal();
}

function setExactQuantity(val) {
  if (!currentProduct) return;
  const maxQty = getMaxAllowedQuantity();
  const num = parseInt(val, 10) || 1;
  orderQuantity = Math.max(1, Math.min(num, maxQty));
  syncQuantityDisplay();
  updateOrderTotal();
}

function handleQuantityInput(rawVal) {
  if (!currentProduct) return;
  if (rawVal === '') {
    // 顧客正在打字中，先不清空
    return;
  }
  const maxQty = getMaxAllowedQuantity();
  const num = parseInt(rawVal, 10);
  if (!isNaN(num) && num >= 1) {
    orderQuantity = Math.min(num, maxQty);
    updateOrderTotal();
  }
}

function validateQuantityInput(inputElement) {
  if (!currentProduct) return;
  const maxQty = getMaxAllowedQuantity();
  let num = parseInt(inputElement.value, 10);
  if (isNaN(num) || num < 1) {
    num = 1;
  } else if (num > maxQty) {
    num = maxQty;
  }
  orderQuantity = num;
  inputElement.value = orderQuantity;
  updateOrderTotal();
}

function syncQuantityDisplay() {
  const quantityElement = document.getElementById('quantity');
  if (quantityElement) {
    if (quantityElement.tagName === 'INPUT') {
      quantityElement.value = orderQuantity;
    } else {
      quantityElement.textContent = orderQuantity;
    }
  }
}

function getEffectiveUnitPrice() {
  if (!currentProduct) return 0;
  let unitPrice = Number(currentProduct.price || 0);

  // 尋找目前已選取的規格標籤
  const selectedInputs = document.querySelectorAll('input[name="product-option"]');
  let totalDelta = 0;

  selectedInputs.forEach(input => {
    const val = input.value.trim();
    if (val) {
      const tag = parseOptionPriceTag(val);
      if (tag) {
        if (tag.type === 'EXACT') {
          unitPrice = tag.price; // 直接覆蓋單價（例如 3層40cm ($420)）
        } else if (tag.type === 'DELTA') {
          totalDelta += tag.delta; // 加價購（例如 盒子+$20）
        }
      }
    }
  });

  return unitPrice + totalDelta;
}

function updateOrderTotal() {
  if (!currentProduct) return;

  const unitPrice = getEffectiveUnitPrice();
  const total = unitPrice * Number(orderQuantity);
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

  // 收集並驗證客戶選擇的商品規格
  const selectedOptions = [];
  const productOptions = Array.isArray(currentProduct.options) ? currentProduct.options : [];

  for (let i = 0; i < productOptions.length; i++) {
    const opt = productOptions[i];
    const optName = opt.name || `規格 ${i + 1}`;
    const input = document.querySelector(`input[name="product-option"][data-option-name="${optName}"]`);
    const val = input ? input.value.trim() : '';

    if (opt.required !== false && !val) {
      alert(`請選擇「${optName}」`);
      return;
    }

    if (val) {
      selectedOptions.push({
        name: optName,
        value: val
      });
    }
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
    log('[ORDER] selectedOptions:', selectedOptions);

    const result = await apiRequest({
      action: 'createOrder',
      idToken: idToken,
      productId: currentProduct.productId,
      quantity: orderQuantity,
      options: selectedOptions,
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
            ${
              Array.isArray(order.options) && order.options.length > 0
                ? `
                  <div class="product-info-row">
                    <span class="product-info-label">選擇規格</span>
                    <span class="product-info-value" style="color:#06c755;font-weight:600;">
                      ${order.options.map(o => `${escapeHtml(o.name)}: ${escapeHtml(o.value)}`).join(' / ')}
                    </span>
                  </div>
                `
                : ''
            }
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
      <div class="card">
        <div style="text-align:center;color:#777;padding:30px 10px;">
          目前沒有訂單紀錄
        </div>
      </div>
    `;
  } else {
    orderHtml = orders.map(order => {
      let optionsText = '';
      if (Array.isArray(order.options) && order.options.length > 0) {
        optionsText = order.options.map(o => `${escapeHtml(o.name)}: ${escapeHtml(o.value)}`).join(' / ');
      }

      const prodStage = getProductStageInfo(order.productStatus || 'CLOSED_PENDING_ORDER');
      const isPending = order.status === ORDER_STATUS.PENDING;
      const isOpenProduct = order.productStatus === 'OPEN';
      const isArrived = order.productStatus === 'ARRIVED';
      const isCompleted = order.status === ORDER_STATUS.COMPLETED;
      const isCancelled = order.status === ORDER_STATUS.CANCELLED;

      return `
        <div class="card" style="margin-bottom:14px;${isCompleted ? 'border-left:4px solid #2563eb;' : (isCancelled ? 'opacity:0.6;' : 'border-left:4px solid #06c755;')}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px;">
            <div style="font-size:18px;font-weight:700;color:#0f172a;">
              ${escapeHtml(order.productName || '-')}
            </div>
            <div class="stage-badge ${isCompleted ? 'badge-primary' : (isCancelled ? 'badge-dark' : 'badge-warning')}">
              ${escapeHtml(getOrderStatusLabel(order.status))}
            </div>
          </div>

          <!-- 實體門市貨態進度標籤 -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:15px;">${prodStage.icon}</span>
              <span style="font-size:13px;font-weight:600;color:#334155;">門市進度：${escapeHtml(prodStage.label)}</span>
            </div>
            <span style="font-size:12px;color:#64748b;">${escapeHtml(prodStage.desc)}</span>
          </div>

          ${
            isArrived && !isCompleted && !isCancelled
              ? `
                <div style="background:#dbeafe;border:1px solid #bfdbfe;border-radius:8px;padding:8px 12px;margin-bottom:12px;color:#1e40af;font-size:13px;">
                  🏪 <strong>商品已到店：</strong>請抽空至門市自取付款，告知 LINE 暱稱即可核對取貨！
                </div>
              `
              : ''
          }

          <div class="product-info-row">
            <span class="product-info-label">訂單編號</span>
            <span class="product-info-value">${escapeHtml(order.orderId || '-')}</span>
          </div>
          ${
            optionsText
              ? `
                <div class="product-info-row">
                  <span class="product-info-label">商品規格</span>
                  <span class="product-info-value" style="color:#06c755;font-weight:600;">${optionsText}</span>
                </div>
              `
              : ''
          }
          <div class="product-info-row">
            <span class="product-info-label">訂購數量</span>
            <span class="product-info-value">${order.quantity || 0} 件</span>
          </div>
          <div class="product-info-row">
            <span class="product-info-label">應付總額</span>
            <span class="product-info-value" style="color:#e11d48;font-weight:700;font-size:16px;">
              NT$ ${formatPrice(order.totalPrice || 0)}
            </span>
          </div>
          <div class="product-info-row">
            <span class="product-info-label">登記時間</span>
            <span class="product-info-value">${formatDateTime(order.createdAt)}</span>
          </div>

          <!-- 顧客自主取消按鈕（僅限開團中且待處理之訂單） -->
          ${
            isOpenProduct && isPending
              ? `
                <div style="margin-top:12px;padding-top:10px;border-top:1px dashed #e2e8f0;text-align:right;">
                  <button
                    class="button button-secondary"
                    style="width:auto;padding:6px 14px;font-size:13px;color:#dc2626;border-color:#fca5a5;"
                    onclick="cancelCustomerOrder('${escapeJs(order.orderId)}')"
                  >
                    取消此訂單
                  </button>
                </div>
              `
              : ''
          }
        </div>
      `;
    }).join('');
  }

  app.innerHTML = `
    <div class="container">
      ${renderCustomerUserCard()}

      <button class="back-button" onclick="location.reload()">
        ← 返回商品頁
      </button>

      <div class="header">
        <h1 class="header-title">
          我的訂單
        </h1>
        <div class="header-subtitle">查看取貨進度與訂單狀態</div>
      </div>

      ${orderHtml}
    </div>
  `;
}

/**
 * 顧客在開團期間自主取消未叫貨訂單
 */
async function cancelCustomerOrder(orderId) {
  if (!confirm('確定要取消這筆訂單嗎？\n取消後將釋出數量，如欲重新購買需重新登記。')) {
    return;
  }

  setLoading('正在取消訂單...');

  try {
    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('無法取得 LINE ID Token');
    }

    const result = await apiRequest({
      action: 'cancelMyOrder',
      idToken: idToken,
      orderId: orderId
    });

    if (!result.success) {
      throw new Error(handleApiErrorMessage(result));
    }

    alert('訂單已成功取消！');
    await showMyOrdersPage();

  } catch (error) {
    console.error('[CANCEL ORDER]', error);
    alert('取消失敗：' + handleApiErrorMessage(error));
  } finally {
    hideLoading();
  }
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
