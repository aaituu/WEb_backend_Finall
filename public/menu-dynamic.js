document.addEventListener("DOMContentLoaded", () => {
  loadMenu();
});

function formatPriceKZT(n) {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₸";
}

function bestPrice(sizeOptions) {
  if (!Array.isArray(sizeOptions) || sizeOptions.length === 0) return null;
  return Math.min(...sizeOptions.map((s) => s.price));
}

async function loadMenu() {
  const container = document.getElementById("menu-items-container");
  const empty = document.getElementById("menu-empty");
  if (!container) return;

  container.innerHTML = "";

  try {
    const { items } = await API.request("/api/products?available=true&limit=200");
    if (!items || items.length === 0) {
      empty && empty.classList.remove("d-none");
      return;
    }

    empty && empty.classList.add("d-none");

    container.innerHTML = items
      .map((p) => {
        const name = p.name || p.title || "Product";
        const type = p.type || p.category || "";
        const opts = (p.sizeOptions && p.sizeOptions.length) ? p.sizeOptions : (p.sizes || []);
        const price = bestPrice(opts);
        const img = p.imageUrl || "img/1.jpeg";
        const optionsHtml = (opts || []).map(s => `<option value="${s.size}" data-price="${s.price}">${s.size} - ${formatPriceKZT(s.price)}</option>`).join("");
        return `
          <div class="col-md-6 col-lg-4 menu-item-card" data-name="${escapeHtml(name)}" data-type="${escapeHtml(type)}">
            <div class="card shadow-sm border-0 h-100">
              <div class="row g-0 h-100">
                <div class="col-md-4">
                  <img src="${img}" class="img-fluid rounded-start h-100 object-fit-cover" alt="${escapeHtml(name)}"/>
                </div>
                <div class="col-md-8">
                  <div class="card-body d-flex flex-column h-100">
                    <h5 class="card-title fw-bold text-dark">${escapeHtml(name)}</h5>
                    <p class="card-text text-muted flex-grow-1">${escapeHtml(p.description || "")}</p>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                      <span class="badge bg-dark-subtle text-dark">${escapeHtml(type)}</span>
                      <span class="fw-semibold">${price !== null ? "from " + formatPriceKZT(price) : ""}</span>
                    </div>
                    <div class="mt-3 d-flex gap-2">
                      <select class="form-select form-select-sm js-size-select" data-product-id="${p._id}" id="size-${p._id}" ${optionsHtml ? "" : "disabled"}>
                        ${optionsHtml || `<option value="M">M - ${formatPriceKZT(price || 0)}</option>`}
                      </select>
                      <button class="btn btn-dark btn-sm flex-shrink-0 js-add-to-cart" data-product-id="${p._id}" ${optionsHtml ? "" : "disabled"}>Add</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>`;
      })
      .join("");

    // Avoid inline onclick handlers (CSP). Use event delegation.
    if (container.dataset.bound !== "1") {
      container.addEventListener("click", onMenuClick);
      container.dataset.bound = "1";
    }

    // search UI is initialized by jquery-features.js (if enabled)
  } catch (e) {
    empty && empty.classList.remove("d-none");
    empty && (empty.textContent = "Failed to load products: " + e.message);
  }
}

function onMenuClick(e) {
  const btn = e.target && e.target.closest ? e.target.closest(".js-add-to-cart") : null;
  if (!btn) return;
  const productId = btn.getAttribute("data-product-id");
  if (!productId) return;
  addToCart(productId);
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function addToCart(productId) {
  const token = localStorage.getItem("token");
  if (!token) {
    if (typeof showToast === "function") showToast("Please login to add items to cart");
    window.location.href = "login.html";
    return;
  }

  const sel = document.getElementById("size-" + productId);
  const size = (sel && sel.value) ? sel.value : "M";

  try {
    await API.request("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, size, qty: 1 })
    });

    if (typeof showToast === "function") showToast("Added to cart");
    if (typeof updateCartCount === "function") updateCartCount();
  } catch (e) {
    alert(e.message);
  }
}
