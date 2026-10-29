
"use strict";

const API = "https://lifelink-fullstack-java07.onrender.com/api";

// Send requests to the backend and include session cookies.
async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
            ...(options.body ? {
                "Content-Type": "application/json"
            } : {}),
            ...(options.headers || {})
        }
    });

    const responseText = await response.text();
    let data = {};

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch {
            data = { message: responseText };
        }
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            `Request failed with HTTP ${response.status}`
        );
    }

    return data;
}

// Display an error message.
function showError(element, message) {
    if (!element) {
        console.error(message);
        return;
    }

    element.textContent = message;
    element.classList.remove("hidden");
}

// Clear an error message.
function hideError(element) {
    if (element) {
        element.textContent = "";
        element.classList.add("hidden");
    }
}

// Login.
async function login() {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorBox = document.getElementById("error");
    const loginButton = document.getElementById("loginButton");
    const selectedRole = document.querySelector(
        'input[name="role"]:checked'
    );

    if (!usernameInput || !passwordInput) {
        showError(errorBox, "Login form fields were not found.");
        return;
    }

    hideError(errorBox);

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!selectedRole) {
        showError(errorBox, "Please select your role.");
        return;
    }

    if (!username || !password) {
        showError(errorBox, "Enter username and password.");
        return;
    }

    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";
    }

    try {
        const data = await apiRequest("/login", {
            method: "POST",
            body: JSON.stringify({
                username: username,
                password: password,
                role: selectedRole.value
            })
        });

        // Save display information only.
        // The backend session cookie is required for authentication.
        sessionStorage.setItem("username", data.username || username);
        sessionStorage.setItem("role", data.role || selectedRole.value);
        sessionStorage.setItem("fullName", data.fullName || "");

        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Login error:", error);
        showError(errorBox, error.message || "Login failed.");

    } finally {
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = "Login";
        }
    }
}

// Check whether the backend recognizes the login session.
async function checkSession() {
    return apiRequest("/session", {
        method: "GET"
    });
}

// Safely update a dashboard element if it exists.
function setElementText(id, value) {
    const element = document.getElementById(id);

    if (element && value !== undefined && value !== null) {
        element.textContent = value;
    }
}

// Load dashboard data.
async function loadDashboard() {
    const dashboardError = document.getElementById("dashboardError");

    hideError(dashboardError);

    try {
        // Verify authentication first.
        const session = await checkSession();

        console.log("Session verified:", session);

        const username =
            session.username ||
            sessionStorage.getItem("username") ||
            "User";

        const role =
            session.role ||
            sessionStorage.getItem("role") ||
            "user";

        setElementText(
            "welcome",
            `Welcome, ${username} (${role})`
        );

        setElementText("topUser", username);
        setElementText("profile", `Username: ${username} | Role: ${role}`);

        // Fetch dashboard information.
        const data = await apiRequest("/dashboard", {
            method: "GET"
        });

        console.log("Dashboard response:", data);

        // Update these values when matching fields exist in the API response.
        setElementText("totalUsers", data.totalUsers);
        setElementText("totalHospitals", data.totalHospitals);
        setElementText("totalOrgans", data.totalOrgans);
        setElementText("totalRequests", data.totalRequests);

        // Also support alternate IDs used in some dashboard layouts.
        setElementText(
            "organsCount",
            data.availableOrgans ?? data.organsCount
        );

        setElementText(
            "hospitalCount",
            data.registeredHospitals ?? data.hospitalCount
        );

        setElementText(
            "requestCount",
            data.myRequests ?? data.requestCount
        );

    } catch (error) {
        console.error("Dashboard loading error:", error);

        if (error.message.includes("401")) {
            showError(
                dashboardError,
                "Your session could not be verified. Please log in again. If this continues, the session cookie is not reaching the backend."
            );
        } else {
            showError(
                dashboardError,
                "Unable to load dashboard: " + error.message
            );
        }
    }
}

// Logout.
async function logout() {
    try {
        await apiRequest("/logout", {
            method: "POST"
        });

    } catch (error) {
        console.error("Logout error:", error);

    } finally {
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("role");
        sessionStorage.removeItem("fullName");

        window.location.href = "index.html";
    }
}

// Initialize the page.
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", event => {
            event.preventDefault();
            login();
        });
    }

    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", event => {
            event.preventDefault();
            logout();
        });
    }

    // This call was missing from your saved version.
    const currentPage = window.location.pathname.toLowerCase();

    if (currentPage.endsWith("/dashboard.html") ||
        currentPage.endsWith("dashboard.html")) {
        loadDashboard();
    }
});
