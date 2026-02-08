document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("adminLoginForm");
  if (loginForm) {
    bindAdminLogin();
    return;
  }

  const panel = document.getElementById("productsTbody");
  if (panel) {
    ensureAdmin();
    bindAdminLogout();
    bindAdminUI();
    loadProducts();
    loadOrders();
    loadAnalytics();
  }
});

let PRODUCT_CACHE = new Map();

function bindAdminUI() {
  const btnAdd = document.getElementById("btnAddProduct");
  if (btnAdd) btnAdd.addEventListener("click", () => openCreateProduct());

  const btnProductsApply = document.getElementById("btnProductsApply");
  if (btnProductsApply) btnProductsApply.addEventListener("click", () => loadProducts());

  const btnOrdersRefresh = document.getElementById("btnOrdersRefresh");
  if (btnOrdersRefresh) btnOrdersRefresh.addEventListener("click", () => loadOrders());
  const btnOrdersApply = document.getElementById("btnOrdersApply");
  if (btnOrdersApply) btnOrdersApply.addEventListener("click", () => loadOrders());

  const btnAnalyticsRefresh = document.getElementById("btnAnalyticsRefresh");
  if (btnAnalyticsRefresh) btnAnalyticsRefresh.addEventListener("click", () => loadAnalytics());

  const btnSave = document.getElementById("btnProductSave");
  if (btnSave) btnSave.addEventListener("click", () => submitProduct());

  // Avoid inline onclick handlers (CSP). Use event delegation.
  const tbody = document.getElementById("productsTbody");
  if (tbody && tbody.dataset.bound !== "1") {
    tbody.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest("button[data-action]") : null;
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      if (!id) return;
      if (action === "edit") {
        const p = PRODUCT_CACHE.get(id);
        if (p) openEditProduct(p);
      }
      if (action === "delete") {
        deleteProduct(id);
      }
    });
    tbody.dataset.bound = "1";
  }

  const ordersList = document.getElementById("ordersList");
  if (ordersList && ordersList.dataset.bound !== "1") {
    ordersList.addEventListener("change", (e) => {
      const sel = e.target && e.target.closest ? e.target.closest("select[data-order-id]") : null;
      if (!sel) return;
      const id = sel.getAttribute("data-order-id");
      const status = sel.value;
      if (!id) return;
      updateOrderStatus(id, status);
    });
    ordersList.dataset.bound = "1";
  }
}

function bindAdminLogin() {
  const form = document.getElementById("adminLoginForm");
  const err = document.getElementById("adminError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.classList.add("d-none");

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;

    try {
      const data = await API.request("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        useAdmin: true
      });
      localStorage.setItem("adminToken", data.token);
      window.location.href = "admin.html";
    } catch (e) {
      err.textContent = e.message;
      err.classList.remove("d-none");
    }
  });
}

function ensureAdmin() {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    window.location.href = "admin-login.html";
    return;
  }
  // Quick client-side role check to avoid showing admin UI to non-admin users.
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    if (!payload || payload.role !== "admin") {
      localStorage.removeItem("adminToken");
      window.location.href = "admin-login.html";
    }
  } catch (_) {
    localStorage.removeItem("adminToken");
    window.location.href = "admin-login.html";
  }
}

function bindAdminLogout() {
  const btn = document.getElementById("adminLogout");
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("adminToken");
    window.location.href = "admin-login.html";
  });
}

function pricesText(p) {
  const map = {};
  const opts = (p.sizeOptions && p.sizeOptions.length) ? p.sizeOptions : (p.sizes || []);
  (opts || []).forEach((s) => (map[s.size] = s.price));
  return ["S","M","L"].filter(x => map[x] != null).map(x => x + ":" + map[x]).join(" | ");
}

async function loadProducts() {
  const tbody = document.getElementById("productsTbody");
  if (!tbody) return;

  const q = (document.getElementById("productSearch") || {}).value || "";
  const available = (document.getElementById("productAvailability") || {}).value || "";

  let url = "/api/products?limit=200";
  if (q) url += "&q=" + encodeURIComponent(q);
  if (available !== "") url += "&available=" + encodeURIComponent(available);

  try {
    const { items } = await API.request(url, { useAdmin: true });
    PRODUCT_CACHE = new Map();
    (items || []).forEach((p) => { if (p && p._id) PRODUCT_CACHE.set(String(p._id), p); });
    tbody.innerHTML = (items || []).map((p) => `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            <img src="${p.imageUrl || "img/americano.jpg"}" style="width:44px;height:44px;object-fit:cover" class="rounded" />
            <div>
              <div class="fw-semibold">${escapeHtml(p.name || p.title || "")}</div>
              <div class="text-muted small">${escapeHtml(p._id)}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(p.type || p.category || "")}</td>
        <td>${p.isAvailable ? '<span class="badge text-bg-success">Yes</span>' : '<span class="badge text-bg-secondary">No</span>'}</td>
        <td class="text-muted">${pricesText(p)}</td>
        <td class="text-end">
          <button class="btn btn-outline-dark btn-sm" data-bs-toggle="modal" data-bs-target="#productModal" data-action="edit" data-id="${p._id}">Edit</button>
          <button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${p._id}">Delete</button>
        </td>
      </tr>
    `).join("");
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-danger">Failed: ${escapeHtml(e.message)}</td></tr>`;
  }
}

function openCreateProduct() {
  setProductForm({
    _id: "",
    name: "",
    type: "",
    description: "",
    ingredients: [],
    imageUrl: "",
    isAvailable: true,
    sizeOptions: []
  });
  document.getElementById("productModalTitle").textContent = "Add product";
}

function openEditProduct(p) {
  setProductForm(p);
  document.getElementById("productModalTitle").textContent = "Edit product";
}

function setProductForm(p) {
  document.getElementById("productId").value = p._id || "";
  document.getElementById("pName").value = p.name || p.title || "";
  document.getElementById("pType").value = p.type || p.category || "";
  document.getElementById("pDescription").value = p.description || "";
  document.getElementById("pImageUrl").value = p.imageUrl || "";
  document.getElementById("pIngredients").value = (p.ingredients || []).join(", ");
  document.getElementById("pAvailable").value = String(!!p.isAvailable);

  const map = {};
  const opts = (p.sizeOptions && p.sizeOptions.length) ? p.sizeOptions : (p.sizes || []);
  (opts || []).forEach((s) => (map[s.size] = s.price));
  document.getElementById("priceS").value = map.S ?? "";
  document.getElementById("priceM").value = map.M ?? "";
  document.getElementById("priceL").value = map.L ?? "";

  const err = document.getElementById("productFormError");
  err.classList.add("d-none");
  err.textContent = "";
}

function getSizeOptionsFromForm() {
  const s = Number(document.getElementById("priceS").value || "");
  const m = Number(document.getElementById("priceM").value || "");
  const l = Number(document.getElementById("priceL").value || "");

  const arr = [];
  if (!Number.isNaN(s) && document.getElementById("priceS").value !== "") arr.push({ size: "S", price: s });
  if (!Number.isNaN(m) && document.getElementById("priceM").value !== "") arr.push({ size: "M", price: m });
  if (!Number.isNaN(l) && document.getElementById("priceL").value !== "") arr.push({ size: "L", price: l });

  return arr;
}

async function submitProduct() {
  const err = document.getElementById("productFormError");
  err.classList.add("d-none");

  const id = document.getElementById("productId").value;
  const payload = {
    name: document.getElementById("pName").value.trim(),
    type: document.getElementById("pType").value.trim(),
    description: document.getElementById("pDescription").value.trim(),
    imageUrl: document.getElementById("pImageUrl").value.trim(),
    ingredients: document.getElementById("pIngredients").value.split(",").map(x => x.trim()).filter(Boolean),
    isAvailable: document.getElementById("pAvailable").value === "true",
    sizeOptions: getSizeOptionsFromForm()
  };

  if (!payload.sizeOptions.length) {
    err.textContent = "Add at least one size price (S/M/L).";
    err.classList.remove("d-none");
    return;
  }

  try {
    if (id) {
      await API.request("/api/products/" + id, { method: "PUT", body: JSON.stringify(payload), useAdmin: true });
    } else {
      await API.request("/api/products", { method: "POST", body: JSON.stringify(payload), useAdmin: true });
    }
    await loadProducts();
    const modal = bootstrap.Modal.getInstance(document.getElementById("productModal"));
    modal && modal.hide();
  } catch (e) {
    err.textContent = e.message;
    err.classList.remove("d-none");
  }
}

async function deleteProduct(id) {
  if (!confirm("Delete product?")) return;
  try {
    await API.request("/api/products/" + id, { method: "DELETE", useAdmin: true });
    await loadProducts();
  } catch (e) {
    alert(e.message);
  }
}

async function loadOrders() {
  const list = document.getElementById("ordersList");
  if (!list) return;

  const status = (document.getElementById("orderStatusFilter") || {}).value || "";
  let url = "/api/orders/admin/all";
  if (status) url += "?status=" + encodeURIComponent(status);

  try {
    const { orders } = await API.request(url, { useAdmin: true });
    list.innerHTML = (orders || []).map((o) => renderOrderCard(o)).join("");
  } catch (e) {
    list.innerHTML = `<div class="text-danger">Failed: ${escapeHtml(e.message)}</div>`;
  }
}

function renderOrderCard(o) {
  const items = (o.items || []).map(i => {
    const nm = i.titleSnapshot || i.name || "";
    return `${escapeHtml(nm)} (${i.size}) x${i.qty}`;
  }).join(", ");
  const created = o.createdAt ? new Date(o.createdAt).toLocaleString() : "";
  return `
    <div class="border rounded p-3">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <div class="fw-semibold">Order #${escapeHtml(o._id)}</div>
          <div class="text-muted small">${created}</div>
          <div class="mt-2">${items}</div>
          <div class="mt-2 fw-semibold">Total: ${o.total} ₸</div>
        </div>
        <div class="d-flex flex-column gap-2">
          <select class="form-select form-select-sm" data-order-id="${o._id}">
            ${["created","processing","completed","cancelled"].map(s => `<option value="${s}" ${o.status===s?"selected":""}>${s}</option>`).join("")}
          </select>
        </div>
      </div>
    </div>
  `;
}

async function updateOrderStatus(id, status) {
  try {
    await API.request("/api/orders/admin/" + id + "/status", {
      method: "PATCH",
      body: JSON.stringify({ status }),
      useAdmin: true
    });
  } catch (e) {
    alert(e.message);
  }
}

async function loadAnalytics() {
  const top = document.getElementById("topProducts");
  const by = document.getElementById("salesByStatus");
  if (!top || !by) return;

  try {
    const t = await API.request("/api/analytics/top-products?limit=8", { useAdmin: true });
    top.innerHTML = `<ol class="mb-0">${(t.results || []).map(r => `<li>${escapeHtml(r.name)} — ${r.soldQty} pcs, ${Math.round(r.revenue)} ₸</li>`).join("")}</ol>`;

    const s = await API.request("/api/analytics/sales-by-status", { useAdmin: true });
    by.innerHTML = `<ul class="mb-0">${(s.results || []).map(r => `<li>${escapeHtml(r._id)} — ${r.orders} orders, ${Math.round(r.revenue)} ₸</li>`).join("")}</ul>`;
  } catch (e) {
    top.textContent = "Failed: " + e.message;
    by.textContent = "Failed: " + e.message;
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
