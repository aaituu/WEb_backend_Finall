// ============================
// AUTH (MongoDB) - /api/auth + /api/users
// ============================

document.addEventListener("DOMContentLoaded", () => {
  renderNavbarAuth();
  bindLogin();
  bindSignup();
  bindPasswordToggles();
  loadProfile();
  loadFeedbackHistory();
});

function setUserSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function clearUserSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    return null;
  }
}

function renderNavbarAuth() {
  const navbar = document.querySelector(".navbar-nav");
  if (!navbar) return;

  const token = localStorage.getItem("token");
  const adminToken = localStorage.getItem("adminToken");
  const user = getCurrentUser();

  // remove old items (for repeated init)
  navbar.querySelectorAll(".auth-nav-item").forEach((x) => x.remove());

  if (token && user) {
    navbar.insertAdjacentHTML(
      "beforeend",
      `
      <li class="nav-item auth-nav-item">
        <a class="nav-link" href="profile.html">Hi, ${escapeHtml(user.name)}</a>
      </li>
      <li class="nav-item auth-nav-item">
        <a class="nav-link" href="cart.html">Cart</a>
      </li>
      <li class="nav-item auth-nav-item">
        <a class="nav-link" href="#" id="logoutBtn">Logout</a>
      </li>
    `
    );

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clearUserSession();
      window.location.href = "index.html";
    });
  } else {
    navbar.insertAdjacentHTML(
      "beforeend",
      `
      <li class="nav-item auth-nav-item"><a class="nav-link" href="login.html">Login</a></li>
      <li class="nav-item auth-nav-item"><a class="nav-link" href="signup.html">Sign up</a></li>
    `
    );
  }

  if (adminToken) {
    navbar.insertAdjacentHTML(
      "beforeend",
      `
      <li class="nav-item auth-nav-item">
        <a class="nav-link" href="admin.html">Admin</a>
      </li>
    `
    );
  }
}

function bindLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const data = await API.request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setUserSession(data.token, data.user);
      window.location.href = "menu.html";
    } catch (err) {
      showError(err.message);
    }
  });
}

function bindSignup() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const data = await API.request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });
      setUserSession(data.token, data.user);
      window.location.href = "menu.html";
    } catch (err) {
      alert(err.message);
    }
  });
}

async function loadProfile() {
  const nameEl = document.getElementById("profileName");
  if (!nameEl) return; // not on profile page

  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const { user } = await API.request("/api/users/me");
    localStorage.setItem("currentUser", JSON.stringify(user));

    document.getElementById("avatarInitials").textContent = getInitials(user.name);
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;
    const since = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US") : "-";
    const member = document.getElementById("memberSince");
    if (member) member.textContent = since;
  } catch (e) {
    clearUserSession();
    window.location.href = "login.html";
  }
}

// ============================
// Feedback history (MongoDB) - Profile page
// ============================

async function loadFeedbackHistory() {
  const listEl = document.getElementById('feedbackList');
  if (!listEl) return;

  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const searchInput = document.getElementById('searchFeedback');
  const filterSel = document.getElementById('filterSubject');
  const clearBtn = document.getElementById('clearHistoryBtn');
  const countEl = document.getElementById('feedbackCount');
  const noEl = document.getElementById('noFeedback');

  let all = [];

  async function fetchAll() {
    try {
      const { items } = await API.request('/api/feedback/my?limit=200');
      all = items || [];
      render();
    } catch (e) {
      // keep empty state
      all = [];
      render();
    }
  }

  function render() {
    const q = (searchInput && searchInput.value ? searchInput.value.trim().toLowerCase() : '');
    const subj = (filterSel && filterSel.value ? filterSel.value.trim().toLowerCase() : '');

    let filtered = all;
    if (subj) filtered = filtered.filter(x => (x.subject || '').toLowerCase() === subj);
    if (q) {
      filtered = filtered.filter(x =>
        (x.subject || '').toLowerCase().includes(q) ||
        (x.message || '').toLowerCase().includes(q)
      );
    }

    if (countEl) countEl.textContent = String(all.length);

    // clear old rendered items except empty placeholder
    listEl.querySelectorAll('.feedback-item').forEach(n => n.remove());

    if (!filtered.length) {
      noEl && noEl.classList.remove('d-none');
      return;
    }

    noEl && noEl.classList.add('d-none');

    filtered.forEach((f) => {
      const date = f.createdAt ? new Date(f.createdAt).toLocaleString('en-US') : '';
      const item = document.createElement('div');
      item.className = 'feedback-item border rounded-3 p-3 mb-3';
      item.innerHTML = `
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div class="fw-semibold">${escapeHtml(f.subject || 'General Inquiry')}</div>
            <div class="text-muted small">${escapeHtml(date)}</div>
          </div>
          <span class="badge text-bg-success">sent</span>
        </div>
        <div class="mt-2 text-muted">${escapeHtml(f.message || '')}</div>
      `;
      listEl.appendChild(item);
    });
  }

  if (searchInput) searchInput.addEventListener('input', render);
  if (filterSel) filterSel.addEventListener('change', render);

  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!confirm('Clear all feedback history?')) return;
      try {
        await API.request('/api/feedback/my', { method: 'DELETE' });
        all = [];
        render();
      } catch (e) {
        alert(e.message);
      }
    });
  }

  fetchAll();
}

function showError(msg) {
  const wrap = document.getElementById("errorMessage");
  const text = document.getElementById("errorText");
  if (wrap) wrap.style.display = "block";
  if (text) text.textContent = msg;
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// keep existing helper used by profile layout
function getInitials(name) {
  const names = String(name || "").trim().split(" ");
  if (names.length >= 2) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  return String(name || "").substring(0, 2).toUpperCase();
}


function bindPasswordToggles() {
  const pairs = [
    { inputId: 'loginPassword', btnId: 'toggleLoginPassword' },
    { inputId: 'password', btnId: 'togglePassword' }
  ];

  pairs.forEach(({ inputId, btnId }) => {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (!input || !btn) return;

    if (!btn.innerHTML || btn.innerHTML.trim() === '👁️' || btn.innerHTML.trim() === '👁') {
      btn.innerHTML = '<i class="bi bi-eye"></i>';
    }

    btn.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.innerHTML = isHidden ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
    });
  });
}
