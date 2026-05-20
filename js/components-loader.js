// Shared toasts + confirmation modals =====
(function initFeedbackUI() {
  if (window.NeoMamaUI) return;

  // PRELOADER SETUP =====
  const isInsidePages = window.location.pathname.includes("/pages/");
  const basePath = isInsidePages ? "../" : "";

  // Load Lottie Library
  const lottieScript = document.createElement("script");
  lottieScript.src = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.9.6/lottie.min.js";
  document.head.appendChild(lottieScript);

  lottieScript.onload = () => {
    lottie.loadAnimation({
      container: document.getElementById('lottie-container'),
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: `${basePath}assets/preloader.json`
    });
  };

  // Preloader Management
  let componentsToLoad = 0;
  let componentsLoaded = 0;
  let minTimeElapsed = false;

  const checkAllLoaded = () => {
    if (componentsLoaded >= componentsToLoad && minTimeElapsed) {
      const preloader = document.getElementById("nm-preloader");
      if (preloader) {
        preloader.classList.add("fade-out");
        setTimeout(() => preloader.remove(), 600);
      }
    }
  };

  setTimeout(() => {
    minTimeElapsed = true;
    checkAllLoaded();
  }, 3000);

  window.trackComponentLoad = () => {
    componentsToLoad++;
    return () => {
      componentsLoaded++;
      checkAllLoaded();
    };
  };

  const styles = document.createElement("style");
  styles.textContent = `
    .nm-toast-stack {
      position: fixed;
      right: 24px;
      top: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: min(360px, calc(100vw - 32px));
      pointer-events: none;
    }

    .nm-toast {
      display: grid;
      grid-template-columns: 38px 1fr 28px;
      align-items: start;
      gap: 12px;
      padding: 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(226, 232, 240, 0.95);
      box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
      color: #1e293b;
      font-family: 'Poppins', sans-serif;
      pointer-events: auto;
      transform: translateX(16px);
      opacity: 0;
      transition: opacity 0.25s ease, transform 0.25s ease;
    }

    .nm-toast.show {
      transform: translateX(0);
      opacity: 1;
    }

    .nm-toast-icon {
      width: 38px;
      height: 38px;
      border-radius: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #1b4965, #2c7da0);
    }

    .nm-toast.success .nm-toast-icon { background: linear-gradient(135deg, #16a34a, #43aa8b); }
    .nm-toast.error .nm-toast-icon { background: linear-gradient(135deg, #dc2626, #e63946); }
    .nm-toast.warning .nm-toast-icon { background: linear-gradient(135deg, #d97706, #f4a261); }

    .nm-toast-title {
      margin: 0 0 3px;
      color: #1b4965;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.3;
    }

    .nm-toast-message {
      margin: 0;
      color: #475569;
      font-size: 13px;
      line-height: 1.45;
      white-space: pre-line;
    }

    .nm-toast-close {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 8px;
      background: #f1f5f9;
      color: #64748b;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }

    .nm-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(15, 23, 42, 0.46);
      backdrop-filter: blur(4px);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .nm-modal-backdrop.show { opacity: 1; }

    .nm-confirm-modal {
      width: min(440px, 100%);
      border-radius: 18px;
      background: white;
      box-shadow: 0 26px 70px rgba(15, 23, 42, 0.28);
      overflow: hidden;
      transform: translateY(12px) scale(0.98);
      transition: transform 0.2s ease;
      font-family: 'Poppins', sans-serif;
    }

    .nm-modal-backdrop.show .nm-confirm-modal {
      transform: translateY(0) scale(1);
    }

    .nm-confirm-body {
      display: grid;
      grid-template-columns: 46px 1fr;
      gap: 14px;
      padding: 24px 24px 18px;
    }

    .nm-confirm-icon {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      background: linear-gradient(135deg, #1b4965, #2c7da0);
    }

    .nm-confirm-modal.danger .nm-confirm-icon { background: linear-gradient(135deg, #dc2626, #e63946); }
    .nm-confirm-modal.warning .nm-confirm-icon { background: linear-gradient(135deg, #d97706, #f4a261); }

    .nm-confirm-title {
      margin: 0 0 6px;
      color: #1b4965;
      font-size: 18px;
      font-weight: 700;
    }

    .nm-confirm-message {
      margin: 0;
      color: #475569;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-line;
    }

    .nm-confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 0 24px 24px;
    }

    .nm-btn {
      min-width: 96px;
      border: none;
      border-radius: 999px;
      padding: 10px 18px;
      cursor: pointer;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 700;
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }

    .nm-btn:hover { transform: translateY(-1px); }

    .nm-btn-secondary {
      background: #eef2f7;
      color: #475569;
    }

    .nm-btn-primary {
      background: linear-gradient(135deg, #2c7da0, #1b4965);
      color: white;
      box-shadow: 0 10px 22px rgba(27, 73, 101, 0.2);
    }

    .nm-confirm-modal.danger .nm-btn-primary {
      background: linear-gradient(135deg, #e63946, #dc2626);
      box-shadow: 0 10px 22px rgba(220, 38, 38, 0.2);
    }

    @media (max-width: 640px) {
      .nm-toast-stack {
        right: 16px;
        top: 16px;
      }

      .nm-confirm-body {
        grid-template-columns: 1fr;
      }

      .nm-confirm-actions {
        flex-direction: column-reverse;
      }

      .nm-btn {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(styles);

  function getToastStack() {
    let stack = document.querySelector(".nm-toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "nm-toast-stack";
      document.body.appendChild(stack);
    }
    return stack;
  }

  function inferToastType(message, fallback = "info") {
    const text = String(message || "").toLowerCase();
    if (text.includes("success") || text.includes("saved") || text.includes("created") || text.includes("registered") || text.includes("deleted")) return "success";
    if (text.includes("fail") || text.includes("error") || text.includes("cannot") || text.includes("invalid") || text.includes("not found")) return "error";
    if (text.includes("please") || text.includes("required") || text.includes("must") || text.includes("too large")) return "warning";
    return fallback;
  }

  function toastTitle(type) {
    switch (type) {
      case "success": return "Success";
      case "error": return "Action needed";
      case "warning": return "Check details";
      default: return "NeoMama";
    }
  }

  function toastIcon(type) {
    switch (type) {
      case "success": return "S";
      case "error": return "!";
      case "warning": return "!";
      default: return "N";
    }
  }

  function showToast(message, options = {}) {
    const type = options.type || inferToastType(message);
    const toast = document.createElement("div");
    toast.className = `nm-toast ${type}`;

    const icon = document.createElement("div");
    icon.className = "nm-toast-icon";
    icon.textContent = options.icon || toastIcon(type);

    const content = document.createElement("div");
    const title = document.createElement("p");
    title.className = "nm-toast-title";
    title.textContent = options.title || toastTitle(type);

    const body = document.createElement("p");
    body.className = "nm-toast-message";
    body.textContent = String(message || "");
    content.append(title, body);

    const close = document.createElement("button");
    close.className = "nm-toast-close";
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss notification");
    close.textContent = "×";

    toast.append(icon, content, close);
    getToastStack().appendChild(toast);

    const removeToast = () => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 220);
    };

    close.addEventListener("click", removeToast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(removeToast, options.duration || 4200);
  }

  function showConfirm(options = {}) {
    const title = options.title || "Confirm action";
    const message = options.message || "Are you sure?";
    const confirmText = options.confirmText || "Confirm";
    const cancelText = options.cancelText || "Cancel";
    const variant = options.variant || "default";

    return new Promise(resolve => {
      const backdrop = document.createElement("div");
      backdrop.className = "nm-modal-backdrop";

      const modal = document.createElement("div");
      modal.className = `nm-confirm-modal ${variant}`;
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");

      const body = document.createElement("div");
      body.className = "nm-confirm-body";

      const icon = document.createElement("div");
      icon.className = "nm-confirm-icon";
      icon.textContent = variant === "danger" ? "!" : "N";

      const copy = document.createElement("div");
      const heading = document.createElement("h3");
      heading.className = "nm-confirm-title";
      heading.textContent = title;

      const text = document.createElement("p");
      text.className = "nm-confirm-message";
      text.textContent = message;
      copy.append(heading, text);
      body.append(icon, copy);

      const actions = document.createElement("div");
      actions.className = "nm-confirm-actions";

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "nm-btn nm-btn-secondary";
      cancelBtn.type = "button";
      cancelBtn.textContent = cancelText;

      const confirmBtn = document.createElement("button");
      confirmBtn.className = "nm-btn nm-btn-primary";
      confirmBtn.type = "button";
      confirmBtn.textContent = confirmText;

      actions.append(cancelBtn, confirmBtn);
      modal.append(body, actions);
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      let settled = false;
      const close = (value) => {
        if (settled) return;
        settled = true;
        document.removeEventListener("keydown", onKeydown);
        backdrop.classList.remove("show");
        setTimeout(() => {
          backdrop.remove();
          resolve(value);
        }, 180);
      };

      function onKeydown(event) {
        if (event.key === "Escape") close(false);
      }

      cancelBtn.addEventListener("click", () => close(false));
      confirmBtn.addEventListener("click", () => close(true));
      backdrop.addEventListener("click", event => {
        if (event.target === backdrop) close(false);
      });
      document.addEventListener("keydown", onKeydown);

      requestAnimationFrame(() => {
        backdrop.classList.add("show");
        confirmBtn.focus();
      });
    });
  }

  window.NeoMamaUI = { showToast, showConfirm };
  window.showToast = showToast;
  window.showConfirm = showConfirm;
  window.alert = (message) => showToast(message);
})();

document.addEventListener("DOMContentLoaded", () => {

  const navbarContainer = document.getElementById("navbar");
  const footerContainer = document.getElementById("footer");

  const isInsidePages = window.location.pathname.includes("/pages/");
  const basePath = isInsidePages ? "../" : "";

  function setCommonLinks() {

      const links = {
          home: `${basePath}index.html`,
          about: `${basePath}index.html#about`,
          features: `${basePath}index.html#features`,
          "how-it-works": `${basePath}index.html#how-it-works`,
          contact: `${basePath}pages/contact.html`,
          faq: `${basePath}pages/faq.html`,
          privacy: `${basePath}pages/privacy.html`,
          terms: `${basePath}pages/terms.html`,
          login: `${basePath}pages/login.html`
      };

      document.querySelectorAll("[data-link]").forEach(link => {
          const key = link.getAttribute("data-link");

          if (links[key]) {
              link.setAttribute("href", links[key]);
          }
      });
  }

  function setNavbarAuthState() {
      const authToken = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
      const loginButton = navbarContainer?.querySelector(".login-btn");

      if (!authToken || !loginButton) return;

      const role = localStorage.getItem("role") || "";
      const storedName = (localStorage.getItem("doctorName") || "User").trim();
      const getInitials = (value) => (value || "User")
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map(part => part.charAt(0).toUpperCase())
          .join("") || "U";
      const settingsPath = role === "midwife"
          ? `${basePath}pages/midwife-settings.html`
          : `${basePath}pages/settings.html`;

      const account = document.createElement("div");
      account.className = "navbar-account";

      const dashboardLink = document.createElement("a");
      dashboardLink.href = `${basePath}pages/dashboard.html`;
      dashboardLink.className = "btn dashboard-btn";
      dashboardLink.textContent = "Dashboard";

      const profileLink = document.createElement("a");
      profileLink.href = settingsPath;
      profileLink.className = "navbar-profile";
      profileLink.title = "Profile settings";

      const avatar = document.createElement("span");
      avatar.className = "navbar-avatar";
      avatar.textContent = getInitials(storedName);

      const profileName = document.createElement("span");
      profileName.className = "navbar-name";
      profileName.textContent = storedName;

      profileLink.append(avatar, profileName);
      account.append(dashboardLink, profileLink);
      loginButton.replaceWith(account);

      fetch("http://localhost:5001/api/Auth/profile", {
          headers: {
              "Authorization": "Bearer " + authToken
          }
      })
          .then(response => {
              if (!response.ok) throw new Error("Profile unavailable");
              return response.json();
          })
          .then(profile => {
              const profileDisplayName = (profile.name || storedName || "User").trim();
              profileName.textContent = profileDisplayName;
              avatar.textContent = getInitials(profileDisplayName);

              if (profile.name) {
                  localStorage.setItem("doctorName", profile.name);
              }

              if (profile.profileImage && profile.profileImage.length > 10) {
                  const profileImg = document.createElement("img");
                  profileImg.src = profile.profileImage;
                  profileImg.alt = profileDisplayName;
                  avatar.textContent = "";
                  avatar.appendChild(profileImg);
              }
          })
          .catch(() => {
              // Keep the stored session UI if profile refresh is temporarily unavailable.
          });
  }

  if (navbarContainer) {
    const done = window.trackComponentLoad();
    fetch(`${basePath}components/navbar/navbar.html`)
        .then(response => response.text())
        .then(data => {
            navbarContainer.innerHTML = data;
            setCommonLinks();
            setNavbarAuthState();
            done();
        })
        .catch(error => {
            console.error("Navbar load error:", error);
            done();
        });
}

  if (footerContainer) {
      const done = window.trackComponentLoad();
      fetch(`${basePath}components/footer/footer.html`)
          .then(response => response.text())
          .then(data => {
              footerContainer.innerHTML = data;
              setCommonLinks();
              done();
          })
          .catch(error => {
              console.error("Footer load error:", error);
              done();
          });
  }

// Sidebar load
const sidebarContainer = document.getElementById("sidebar");

if (sidebarContainer) {
    const done = window.trackComponentLoad();
    fetch(`${basePath}components/sidebar/sidebar.html`)
        .then(response => response.text())
        .then(data => {
            sidebarContainer.innerHTML = data;
            
            // Bind sidebar logout button
            const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");
            if (sidebarLogoutBtn) {
                sidebarLogoutBtn.onclick = async function () {
                    const confirmed = await showConfirm({
                        title: "Log out?",
                        message: "Are you sure you want to logout?",
                        confirmText: "Logout",
                        variant: "danger"
                    });
                    if (confirmed) {
                        localStorage.removeItem("authToken");
                        localStorage.removeItem("token");
                        localStorage.removeItem("doctorEmail");
                        localStorage.removeItem("doctorName");
                        localStorage.removeItem("role");
                        window.location.href = `${basePath}pages/login.html`;
                    }
                };
            }

            // Highlight active link
            const currentPath = window.location.pathname.split("/").pop();
            const sidebarLinks = sidebarContainer.querySelectorAll(".sidebar-menu a");
            
            const role = localStorage.getItem("role") || "";

            sidebarLinks.forEach(link => {
                const href = link.getAttribute("href");
                
                // Hide manage clinic for midwives
                if (role === "midwife" && href && href.includes("manage-clinic.html")) {
                    link.parentElement.remove();
                }

                // Change settings link for midwives
                if (role === "midwife" && href && href.includes("settings.html")) {
                    link.setAttribute("href", "midwife-settings.html");
                }

                if (href && href.includes(currentPath)) {
                    link.parentElement.classList.add("active");
                }
            });
            done();
        })
        .catch(error => {
            console.error("Sidebar load error:", error);
            done();
        });

    // Load chat widget on all dashboard pages
    loadChatWidget(basePath);
}

});

// Chat widget loader =====
function loadChatWidget(basePath) {
    const done = window.trackComponentLoad ? window.trackComponentLoad() : () => {};
    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${basePath}components/chat/chat.css`;
    document.head.appendChild(link);

    // Load html
    fetch(`${basePath}components/chat/chat.html`)
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML("beforeend", html);
            // Load JS after HTML is injected
            const script = document.createElement("script");
            script.src = `${basePath}components/chat/chat.js`;
            script.onload = () => done();
            document.body.appendChild(script);
        })
        .catch(err => {
            console.warn("Chat widget load error:", err);
            done();
        });
}
