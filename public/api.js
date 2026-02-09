const API = {
  async request(path, options = {}) {
    const token = localStorage.getItem("token");
    const adminToken = localStorage.getItem("adminToken");
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      options.headers || {}
    );

    // if admin route or explicitly asked, prefer admin token
    const useAdmin = options.useAdmin === true;
    const authToken = useAdmin ? adminToken : token;

    if (authToken) headers.Authorization = "Bearer " + authToken;

    const res = await fetch(path, Object.assign({}, options, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data && data.message ? data.message : "Request failed";
      throw new Error(msg);
    }
    return data;
  }
};


async function updateCartCount() {
  const token = localStorage.getItem("token");
  const links = document.querySelectorAll('a[href="cart.html"]');
  if (!links.length) return;

  // remove old badge if not logged in
  if (!token) {
    links.forEach((a) => {
      const b = a.querySelector(".cart-badge");
      if (b) b.remove();
    });
    return;
  }

  try {
    const { cart } = await API.request("/api/cart");
    const count = (cart && cart.items) ? cart.items.reduce((a, i) => a + i.qty, 0) : 0;

    links.forEach((a) => {
      let badge = a.querySelector(".cart-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "badge bg-success ms-2 cart-badge";
        a.appendChild(badge);
      }
      badge.textContent = count;
    });
  } catch {
    // ignore
  }
}

function showToast(message) {
  const el = document.createElement("div");
  el.className = "toast align-items-center text-bg-dark border-0 position-fixed bottom-0 end-0 m-3";
  el.role = "alert";
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  document.body.appendChild(el);

  try {
    const t = new bootstrap.Toast(el, { delay: 2000 });
    t.show();
    el.addEventListener("hidden.bs.toast", () => el.remove());
  } catch {
    alert(message);
    el.remove();
  }
}
