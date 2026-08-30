/* ==========================================
   TENDENCIA INMOBILIARIA - LOGIN AUTH ENGINE WITH REFRESH TOKENS
   Dual-Token System (Access + Refresh Tokens)
   ========================================== */

import '../css/design-tokens.css';
import '../css/components.css';
import '../css/main.css';

document.addEventListener("DOMContentLoaded", () => {
    // If already logged in, redirect to admin page immediately
    const token = localStorage.getItem("TENDENCIA_AUTH_TOKEN");
    if (token) {
        window.location.href = "subir-propiedad.html";
        return;
    }

    setupLoginForm();
});

function setupLoginForm() {
    const form = document.getElementById("login-form");
    const errorBox = document.getElementById("login-error-msg");
    const submitBtn = document.getElementById("login-submit-btn");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorBox.style.display = "none";

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Autenticando...</span>`;

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("TENDENCIA_AUTH_TOKEN", data.token);
                if (data.refreshToken) {
                    localStorage.setItem("TENDENCIA_REFRESH_TOKEN", data.refreshToken);
                }
                localStorage.setItem("TENDENCIA_AUTH_USER", JSON.stringify(data.user));
                window.location.href = "subir-propiedad.html";
                return;
            }
        } catch (err) {
            console.warn("Backend API offline, proceeding with Standalone Demo Auth.");
        }

        // Standalone Demo Authentication Fallback
        const demoToken = "DEMO_SESSION_TOKEN_VIP";
        const demoUser = { id: 1, name: "Asesor Admin Demo", email: email || "admin@demoinmobiliaria.com", role: "ADMIN" };
        localStorage.setItem("TENDENCIA_AUTH_TOKEN", demoToken);
        localStorage.setItem("TENDENCIA_REFRESH_TOKEN", demoToken);
        localStorage.setItem("TENDENCIA_AUTH_USER", JSON.stringify(demoUser));

        alert("Aviso Modo Demo: Sesión iniciada en modo demostración. Los cambios que realices (crear, editar, eliminar) se guardan en la memoria local de tu navegador.");
        window.location.href = "subir-propiedad.html";
    });
}
