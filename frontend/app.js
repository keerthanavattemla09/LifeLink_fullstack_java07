
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

/* ===============================
   AVAILABLE ORGANS PAGE
================================ */

let allOrgans = [];

async function loadOrgans() {
    const container = document.getElementById("organCards");

    if (!container) return;

    container.innerHTML = "<p>Loading available organs...</p>";

    try {
        const organs = await apiRequest("/organs", {
            method: "GET"
        });

        // Accept either a JSON array or an object containing the array.
        allOrgans = Array.isArray(organs)
            ? organs
            : organs.organs || organs.content || [];

        console.log("Organs loaded:", allOrgans);

        if (allOrgans.length === 0) {
            container.innerHTML = "<p>No available organs found.</p>";
            return;
        }

        filterCards();

    } catch (error) {
        console.error("Organs loading error:", error);
        container.innerHTML =
            `<p>Unable to load organs: ${error.message}</p>`;
    }
}

function filterCards() {
    const container = document.getElementById("organCards");

    if (!container) return;

    const searchInput = document.getElementById("search");
    const bloodInput = document.getElementById("blood");

    const searchText = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const selectedBlood = bloodInput ? bloodInput.value : "";

    const filteredOrgans = allOrgans.filter(organ => {
        const organName = String(organ.organType || "").toLowerCase();
        const hospitalName = String(
            organ.hospital?.name || ""
        ).toLowerCase();

        const matchesSearch =
            organName.includes(searchText) ||
            hospitalName.includes(searchText);

        const matchesBlood =
            !selectedBlood || organ.bloodGroup === selectedBlood;

        const matchesStatus =
            !organ.status ||
            organ.status.toLowerCase() === "available";

        return matchesSearch && matchesBlood && matchesStatus;
    });

    if (filteredOrgans.length === 0) {
        container.innerHTML = "<p>No matching organs found.</p>";
        return;
    }

    container.innerHTML = filteredOrgans.map(organ => {
        const hospital = organ.hospital || {};

        // Use textContent-based escaping to avoid inserting API text as HTML.
        const escapeHTML = value => {
            const element = document.createElement("span");
            element.textContent = String(value ?? "");
            return element.innerHTML;
        };

        return `
            <article class="card">
                <h2>${escapeHTML(organ.organType || "Organ")}</h2>
                <p><strong>Blood Group:</strong>
                    ${escapeHTML(organ.bloodGroup || "Not specified")}
                </p>
                <p><strong>Quantity:</strong>
                    ${escapeHTML(organ.quantity ?? 0)}
                </p>
                <p><strong>Status:</strong>
                    ${escapeHTML(organ.status || "Available")}
                </p>
                <p><strong>Hospital:</strong>
                    ${escapeHTML(hospital.name || "Not specified")}
                </p>
                <p><strong>City:</strong>
                    ${escapeHTML(hospital.city || "Not specified")}
                </p>
            </article>
        `;
    }).join("");
}
