
const API = "https://lifelink-full-stack-java07.onrender.com/api";

// ---------- Common API functions ----------

async function apiRequest(path, options = {}) {
    const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
    };

    const response = await fetch(`${API}${path}`, {
        ...options,
        headers,
        credentials: "include"
    });

    const contentType = response.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        const message =
            typeof data === "object" && data !== null
                ? data.message || data.error || "Request failed"
                : data || "Request failed";

        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return data;
}

function getArray(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];

    const keys = [
        "data",
        "items",
        "organs",
        "requests",
        "hospitals",
        "matches",
        "results",
        "content"
    ];

    for (const key of keys) {
        if (Array.isArray(data[key])) return data[key];
    }

    return [];
}

function getElement(...ids) {
    for (const id of ids) {
        const element = document.getElementById(id);
        if (element) return element;
    }
    return null;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function showMessage(message, type = "info") {
    const element = getElement(
        "message",
        "pageMessage",
        "loginMessage",
        "statusMessage"
    );

    if (!element) {
        console.log(message);
        return;
    }

    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = "block";
}

function showError(error) {
    console.error(error);
    showMessage(error.message || "Something went wrong. Please try again.", "error");
}

function showStatus(status) {
    const safeStatus = escapeHTML(status || "Unknown");
    return `<span class="status-badge">${safeStatus}</span>`;
}

// ---------- Login and session ----------

async function login(event) {
    if (event) event.preventDefault();

    const usernameInput = getElement("username");
    const passwordInput = getElement("password");
    const roleInput = document.querySelector('input[name="role"]:checked');

    const username = usernameInput?.value.trim();
    const password = passwordInput?.value;
    const role = roleInput?.value ||
        getElement("role")?.value ||
        "user";

    if (!username || !password) {
        showMessage("Please enter your username and password.", "error");
        return;
    }

    try {
        showMessage("Logging in...", "info");

        const result = await apiRequest("/login", {
            method: "POST",
            body: JSON.stringify({ username, password, role })
        });

        sessionStorage.setItem("username", result.username || username);
        sessionStorage.setItem("role", result.role || role);
        sessionStorage.setItem(
            "fullName",
            result.fullName || result.username || username
        );

        // Verify that the backend session is available.
        await apiRequest("/session");

        window.location.href = "dashboard.html";
    } catch (error) {
        showError(error);
    }
}

async function requireLogin() {
    try {
        const user = await apiRequest("/session");

        if (user.username) {
            sessionStorage.setItem("username", user.username);
        }

        if (user.role) {
            sessionStorage.setItem("role", user.role);
        }

        if (user.fullName) {
            sessionStorage.setItem("fullName", user.fullName);
        }

        return user;
    } catch (error) {
        if (error.status === 401 || error.status === 403) {
            sessionStorage.removeItem("username");
            sessionStorage.removeItem("role");
            sessionStorage.removeItem("fullName");
            window.location.href = "index.html";
            return null;
        }

        showError(error);
        return null;
    }
}

async function logout(event) {
    if (event) event.preventDefault();

    try {
        await apiRequest("/logout", { method: "POST" });
    } catch (error) {
        console.warn("Logout request failed:", error);
    } finally {
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("role");
        sessionStorage.removeItem("fullName");
        window.location.href = "index.html";
    }
}

// ---------- Dashboard ----------

async function loadDashboard() {
    try {
        const data = await apiRequest("/dashboard");

        const user = data.user || {};

        const nameElement = getElement(
            "userName", "fullName", "welcomeName", "usernameDisplay"
        );

        if (nameElement) {
            nameElement.textContent =
                user.fullName ||
                sessionStorage.getItem("fullName") ||
                sessionStorage.getItem("username") ||
                "User";
        }

        const bloodGroup = getElement("bloodGroup");
        if (bloodGroup) {
            bloodGroup.textContent = user.bloodGroup || "Not available";
        }

        const age = getElement("age");
        if (age) age.textContent = user.age ?? "Not available";

        const requiredOrgan = getElement("requiredOrgan");
        if (requiredOrgan) {
            requiredOrgan.textContent = user.requiredOrgan || "Not available";
        }

        const availableOrgans = getElement("availableOrgans");
        if (availableOrgans) {
            availableOrgans.textContent = data.availableOrgans ?? 0;
        }

        const hospitals = getElement("hospitals", "hospitalCount");
        if (hospitals) hospitals.textContent = data.hospitals ?? 0;

        const requests = getElement("requests", "requestCount");
        if (requests) requests.textContent = data.requests ?? 0;
    } catch (error) {
        showError(error);
    }
}

// ---------- Organs ----------

let cachedOrgans = [];

async function loadOrgans() {
    const container = getElement(
        "organCards", "organsList", "organsContainer"
    );

    try {
        const data = await apiRequest("/organs");
        cachedOrgans = getArray(data);

        if (!container) {
            console.warn("Organ display container was not found.");
            return;
        }

        renderOrgans(cachedOrgans);
    } catch (error) {
        showError(error);
        if (container) {
            container.innerHTML = "<p>Unable to load available organs.</p>";
        }
    }
}

function renderOrgans(organs) {
    const container = getElement(
        "organCards", "organsList", "organsContainer"
    );

    if (!container) return;

    if (!organs.length) {
        container.innerHTML = "<p>No available organs found.</p>";
        return;
    }

    container.innerHTML = organs.map(organ => {
        const id = organ.id ?? organ.organId;
        const name = organ.organType ?? organ.organ ?? organ.name ?? "Organ";
        const blood = organ.bloodGroup ?? "Not specified";
        const hospital = organ.hospitalName ??
            organ.hospital?.name ??
            organ.hospital ??
            "Not specified";
        const city = organ.city ?? organ.hospital?.city ?? "";

        return `
            <article class="organ-card">
                <h3>${escapeHTML(name)}</h3>
                <p><strong>Blood group:</strong> ${escapeHTML(blood)}</p>
                <p><strong>Hospital:</strong> ${escapeHTML(hospital)}</p>
                <p><strong>City:</strong> ${escapeHTML(city)}</p>
                <p><strong>Status:</strong>
                    ${showStatus(organ.status || "Available")}
                </p>
                <button type="button"
                    data-request-organ="${escapeHTML(id ?? "")}"
                    ${id == null ? "disabled" : ""}>
                    Request Organ
                </button>
            </article>
        `;
    }).join("");

    container.querySelectorAll("[data-request-organ]").forEach(button => {
        button.addEventListener("click", () => {
            createOrganRequest(button.dataset.requestOrgan);
        });
    });
}

function filterOrgans() {
    const search = (
        getElement("search", "organSearch")?.value || ""
    ).toLowerCase();

    const blood = getElement("blood", "bloodFilter")?.value || "";

    const filtered = cachedOrgans.filter(organ => {
        const name = String(
            organ.organType ?? organ.organ ?? organ.name ?? ""
        ).toLowerCase();

        const hospital = String(
            organ.hospitalName ?? organ.hospital?.name ?? organ.hospital ?? ""
        ).toLowerCase();

        const matchesSearch =
            name.includes(search) || hospital.includes(search);

        const matchesBlood =
            !blood || String(organ.bloodGroup || "") === blood;

        return matchesSearch && matchesBlood;
    });

    renderOrgans(filtered);
}

// ---------- Organ matching ----------

async function loadMatching() {
    const container = getElement(
        "matchingResults", "matchingCards", "matchResults"
    );

    const organSelect = getElement(
        "organType", "requiredOrgan", "organ"
    );

    const organ = organSelect?.value || "Kidney";

    if (container) {
        container.innerHTML = "<p>Finding matching organs...</p>";
    }

    try {
        const data = await apiRequest(
            `/matching?organ=${encodeURIComponent(organ)}`
        );

        console.log("Matching API response:", data);

        const matches = getArray(data);

        if (!container) {
            console.warn("Matching results container was not found.");
            return;
        }

        if (!matches.length) {
            container.innerHTML =
                "<p>No matching organs were found.</p>";
            return;
        }

        container.innerHTML = matches.map(match => {
            const matchedOrgan = match.organ &&
                typeof match.organ === "object"
                ? match.organ
                : match;

            const id = matchedOrgan.id ??
                matchedOrgan.organId ??
                match.organId;

            const name = matchedOrgan.organType ??
                matchedOrgan.name ??
                matchedOrgan.organ ??
                organ;

            const score = match.score ??
                match.matchingScore ??
                match.priorityScore ??
                match.matchScore;

            const hospital = matchedOrgan.hospitalName ??
                matchedOrgan.hospital?.name ??
                matchedOrgan.hospital ??
                "Not specified";

            const blood = matchedOrgan.bloodGroup || "Not specified";

            return `
                <article class="matching-card">
                    <h3>${escapeHTML(name)}</h3>
                    <p><strong>Blood group:</strong> ${escapeHTML(blood)}</p>
                    <p><strong>Hospital:</strong> ${escapeHTML(hospital)}</p>
                    ${
                        score !== undefined
                            ? `<p><strong>Matching score:</strong> ${escapeHTML(score)}%</p>`
                            : ""
                    }
                    <button type="button"
                        data-request-organ="${escapeHTML(id ?? "")}"
                        ${id == null ? "disabled" : ""}>
                        Request Organ
                    </button>
                </article>
            `;
        }).join("");

        container.querySelectorAll("[data-request-organ]").forEach(button => {
            button.addEventListener("click", () => {
                createOrganRequest(button.dataset.requestOrgan);
            });
        });
    } catch (error) {
        showError(error);

        if (container) {
            container.innerHTML =
                "<p>Unable to load matching results. Please try again.</p>";
        }
    }
}

// ---------- Create an organ request ----------

async function createOrganRequest(organId) {
    if (!organId) {
        showMessage("The organ ID is missing.", "error");
        return;
    }

    try {
        const result = await apiRequest(
            `/requests/${encodeURIComponent(organId)}`,
            { method: "POST" }
        );

        showMessage(
            result.message || "Organ request submitted successfully.",
            "success"
        );

        await loadRequests();
    } catch (error) {
        showError(error);
    }
}

// ---------- Requests ----------

async function loadRequests() {
    const container = getElement(
        "requestsList", "requestCards", "requestsContainer"
    );

    try {
        const data = await apiRequest("/requests");
        const requests = getArray(data);

        if (!container) {
            console.warn("Requests display container was not found.");
            return;
        }

        if (!requests.length) {
            container.innerHTML = "<p>No requests found.</p>";
            return;
        }

        container.innerHTML = requests.map(request => `
            <article class="request-card">
                <h3>Request #${escapeHTML(request.id ?? "")}</h3>
                <p><strong>Organ:</strong>
                    ${escapeHTML(request.organ?.organType ??
                        request.organ?.name ??
                        request.organ ??
                        "Not specified")}
                </p>
                <p><strong>Blood group:</strong>
                    ${escapeHTML(request.bloodGroup || "Not specified")}
                </p>
                <p><strong>Hospital:</strong>
                    ${escapeHTML(request.hospital?.name ??
                        request.hospital ??
                        "Not specified")}
                </p>
                <p><strong>City:</strong>
                    ${escapeHTML(request.city || "Not specified")}
                </p>
                <p><strong>Priority score:</strong>
                    ${escapeHTML(request.priorityScore ?? "Not available")}
                </p>
                <p><strong>Status:</strong>
                    ${showStatus(request.status)}
                </p>
                <p><strong>Created:</strong>
                    ${escapeHTML(request.createdAt || "Not available")}
                </p>
            </article>
        `).join("");
    } catch (error) {
        showError(error);

        if (container) {
            container.innerHTML = "<p>Unable to load requests.</p>";
        }
    }
}

// ---------- Hospitals ----------

async function loadHospitals() {
    const container = getElement(
        "hospitalsList", "hospitalCards", "hospitalsContainer"
    );

    try {
        const data = await apiRequest("/hospitals");
        const hospitals = getArray(data);

        if (!container) {
            console.warn("Hospitals display container was not found.");
            return;
        }

        if (!hospitals.length) {
            container.innerHTML = "<p>No hospitals found.</p>";
            return;
        }

        container.innerHTML = hospitals.map(hospital => `
            <article class="hospital-card">
                <h3>${escapeHTML(hospital.name || "Hospital")}</h3>
                <p><strong>City:</strong>
                    ${escapeHTML(hospital.city || "Not specified")}
                </p>
                <p><strong>Phone:</strong>
                    ${escapeHTML(hospital.phone || "Not available")}
                </p>
            </article>
        `).join("");
    } catch (error) {
        showError(error);

        if (container) {
            container.innerHTML = "<p>Unable to load hospitals.</p>";
        }
    }
}

// ---------- Help page ----------

function loadHelp() {
    const container = getElement(
        "helpContent", "helpContainer", "helpSection"
    );

    // If the page already contains its help content, leave it unchanged.
    if (!container) {
        console.log("Help page loaded.");
        return;
    }

    if (container.children.length > 0) return;

    container.innerHTML = `
        <section>
            <h2>LifeLink Help</h2>
            <h3>How to use LifeLink</h3>
            <ol>
                <li>Log in using your account and role.</li>
                <li>View the dashboard for summary information.</li>
                <li>Browse available organs or check matching results.</li>
                <li>Submit a request for an available organ.</li>
                <li>Check the Requests page to view request status.</li>
                <li>Visit the Hospitals page to view hospital information.</li>
            </ol>
            <p>For login or data-loading problems, check your connection
            and contact your system administrator.</p>
        </section>
    `;
}

// ---------- Global functions for HTML onload attributes ----------

// These assignments fix "loadMatching is not defined",
// "loadRequests is not defined", and similar errors.
window.login = login;
window.requireLogin = requireLogin;
window.logout = logout;
window.loadDashboard = loadDashboard;
window.loadOrgans = loadOrgans;
window.loadMatching = loadMatching;
window.loadRequests = loadRequests;
window.loadHospitals = loadHospitals;
window.loadHelp = loadHelp;
window.filterOrgans = filterOrgans;

// ---------- Automatic page setup ----------

document.addEventListener("DOMContentLoaded", () => {
    const page = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    const loginForm = getElement("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", login);
    }

    const logoutButton = getElement("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    const searchInput = getElement("search", "organSearch");
    const bloodFilter = getElement("blood", "bloodFilter");

    if (searchInput) {
        searchInput.addEventListener("input", filterOrgans);
    }

    if (bloodFilter) {
        bloodFilter.addEventListener("change", filterOrgans);
    }

    // HTML pages may already use body onload attributes.
    // Do not call the same page loader twice here.
    const protectedPages = [
        "dashboard.html",
        "organs.html",
        "matching.html",
        "requests.html",
        "hospitals.html",
        "help.html"
    ];

    if (protectedPages.includes(page)) {
        requireLogin().then(user => {
            if (!user) return;

            switch (page) {
                case "dashboard.html":
                    loadDashboard();
                    break;
                case "organs.html":
                    loadOrgans();
                    break;
                case "matching.html":
                    loadMatching();
                    break;
                case "requests.html":
                    loadRequests();
                    break;
                case "hospitals.html":
                    loadHospitals();
                    break;
                case "help.html":
                    loadHelp();
                    break;
            }
        });
    }
});
