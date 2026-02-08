// ============================
// CART (MongoDB) - uses /api/cart
// ============================

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  loadCart();

  bindCartActions();

  const clearBtn = document.getElementById("clearCartBtn");
  if (clearBtn) clearBtn.addEventListener("click", clearCart);

  const placeBtn = document.getElementById("placeOrderBtn");
  if (placeBtn) placeBtn.addEventListener("click", placeOrder);
});

// Avoid inline onclick handlers (CSP). Use event delegation.
function bindCartActions() {
  const listEl = document.getElementById("cartItemsList");
  if (!listEl) return;
  // Prevent double-binding
  if (listEl.dataset.bound === "1") return;
  listEl.dataset.bound = "1";

  listEl.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest("[data-action]") : null;
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    const qty = btn.getAttribute("data-qty");

    if (action === "remove") removeCartItem(id);
    if (action === "dec") changeQty(id, Number(qty) - 1);
    if (action === "inc") changeQty(id, Number(qty) + 1);
  });
}

function formatPriceKZT(n) {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₸";
}

async function loadCart() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const emptyEl = document.getElementById("emptyCart");
  const cartEl = document.getElementById("cartItems");
  const listEl = document.getElementById("cartItemsList");

  bindCartActions();

  try {
    const { cart } = await API.request("/api/cart");
    const items = (cart && cart.items) ? cart.items : [];

    if (!items.length) {
      emptyEl && (emptyEl.style.display = "block");
      cartEl && (cartEl.style.display = "none");
      updateSummary([]);
      return;
    }

    emptyEl && (emptyEl.style.display = "none");
    cartEl && (cartEl.style.display = "flex");

    listEl.innerHTML = items.map((i) => renderCartItem(i)).join("");
    updateSummary(items);
  } catch (e) {
    emptyEl && (emptyEl.style.display = "block");
    cartEl && (cartEl.style.display = "none");
    if (emptyEl) emptyEl.querySelector("p").textContent = "Failed to load cart: " + e.message;
  }
}

function renderCartItem(item) {
  const p = item.productId || {};
  const name = p.name || p.title || "Product";
  const img = p.imageUrl || "img/americano.jpg";
  const qty = item.qty;
  const line = item.unitPrice * item.qty;

  return `
    <div class="list-group-item py-3">
      <div class="d-flex gap-3 align-items-center">
        <img src="${img}" alt="${escapeHtml(name)}" style="width: 80px; height: 80px; object-fit: cover;" class="rounded">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="fw-semibold">${escapeHtml(name)}</div>
              <div class="text-muted small">${escapeHtml(item.size)}</div>
              <div class="text-muted small">Unit: ${formatPriceKZT(item.unitPrice)}</div>
            </div>
            <button class="btn btn-outline-danger btn-sm" data-action="remove" data-id="${item._id}">Remove</button>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-outline-secondary btn-sm" data-action="dec" data-id="${item._id}" data-qty="${qty}">-</button>
              <input class="form-control form-control-sm text-center" style="width: 60px" value="${qty}" readonly>
              <button class="btn btn-outline-secondary btn-sm" data-action="inc" data-id="${item._id}" data-qty="${qty}">+</button>
            </div>
            <div class="fw-semibold">${formatPriceKZT(line)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function changeQty(itemId, newQty) {
  if (newQty < 1) return;

  try {
    await API.request("/api/cart/items/" + itemId, {
      method: "PATCH",
      body: JSON.stringify({ qty: newQty })
    });
    await loadCart();
    updateCartCount();
  } catch (e) {
    alert(e.message);
  }
}

async function removeCartItem(itemId) {
  try {
    await API.request("/api/cart/items/" + itemId, { method: "DELETE" });
    await loadCart();
    updateCartCount();
  } catch (e) {
    alert(e.message);
  }
}

async function clearCart() {
  if (!confirm("Clear cart?")) return;
  try {
    await API.request("/api/cart/clear", { method: "DELETE" });
    await loadCart();
    updateCartCount();
  } catch (e) {
    alert(e.message);
  }
}

function updateSummary(items) {
  const count = items.reduce((a, i) => a + i.qty, 0);
  const subtotal = items.reduce((a, i) => a + i.qty * i.unitPrice, 0);
  const total = subtotal;

  const elCount = document.getElementById("summaryItemCount");
  const elSub = document.getElementById("summarySubtotal");
  const elTot = document.getElementById("summaryTotal");

  if (elCount) elCount.textContent = count;
  if (elSub) elSub.textContent = formatPriceKZT(subtotal);
  if (elTot) elTot.textContent = formatPriceKZT(total);
}

async function placeOrder() {
  try {
    const { order } = await API.request("/api/orders", { method: "POST", body: JSON.stringify({}) });
    alert("Order created! Status: " + order.status);
    await loadCart();
    updateCartCount();
  } catch (e) {
    alert(e.message);
  }
}
