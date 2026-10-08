const API = "http://127.0.0.1:8080/api";

// ================= LOGIN =================
async function login() {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorBox = document.getElementById("error");

    const roleInput = document.querySelector('input[name="role"]:checked');

    if (!roleInput) {
        errorBox.textContent = "Please select a role.";
        errorBox.classList.remove("hidden");
        return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const role = roleInput.value;

    if (!username || !password) {
        errorBox.textContent = "Please enter username and password.";
        errorBox.classList.remove("hidden");
        return;
    }

    try {
        const response = await fetch(API + "/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                username: username,
                password: password,
                role: role
            })
        });

        const data = await response.json();

        if (!response.ok) {
            errorBox.textContent = data.message || "Invalid demo credentials.";
            errorBox.classList.remove("hidden");
            return;
        }

        // Login successful
        sessionStorage.setItem("loggedIn", "1");
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("role", data.role);

        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Login error:", error);

        errorBox.textContent =
            "Cannot connect to the Java backend. Make sure Spring Boot is running on port 8080.";

        errorBox.classList.remove("hidden");
    }
}


// ================= LOGOUT =================
async function logout() {
    try {
        await fetch(API + "/logout", {
            method: "POST",
            credentials: "include"
        });
    } catch (error) {
        console.error(error);
    }

    sessionStorage.clear();
    window.location.href = "index.html";
}


// ================= ESCAPE HTML =================
function esc(s) {
    return String(s ?? "").replace(
        /[&<>"']/g,
        m => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[m])
    );
}


// ================= SHELL =================
function shell() {

    // Check login
    if (
        !sessionStorage.getItem("loggedIn") &&
        !location.pathname.endsWith("index.html") &&
        location.pathname !== "/"
    ) {
        location.href = "index.html";
        return;
    }

    const shellElement = document.getElementById("shell");

    if (!shellElement) return;

    // Get the page content before changing shell
    const pageContent = document.querySelector("main.page");

    shellElement.innerHTML = `
        <header class="topbar">

            <a class="logo" href="dashboard.html">
                ♥ <b>Life</b>Link
            </a>

            <div id="topUser">
                Demo User
                <button class="linkbtn" onclick="logout()">
                    Logout
                </button>
            </div>

        </header>

        <div class="layout">

            <aside>

                <div class="side-title">
                    USER MENU
                </div>

                <a href="dashboard.html">
                    ▦ Dashboard
                </a>

                <a href="organs.html">
                    ♥ Available Organs
                </a>

                <a href="matching.html">
                    ⚙ Organ Matching
                </a>

                <a href="requests.html">
                    ▤ My Requests
                </a>

                <a href="hospitals.html">
                    ▣ Hospital Directory
                </a>

                <a href="help.html">
                    ◉ Multilingual AI Help
                </a>

            </aside>

        </div>
    `;

    // Put the current page inside the layout
    const layout = shellElement.querySelector(".layout");

    if (pageContent && layout) {
        layout.appendChild(pageContent);
    }
}
// ================= DASHBOARD =================



async function loadDashboard() {

    try {

        const response = await fetch(API + "/dashboard", {
            credentials: "include"
        });

        if (!response.ok) {
            sessionStorage.clear();
            location.href = "index.html";
            return;
        }

        const data = await response.json();

        // Top user
        const topUser = document.getElementById("topUser");

        if (topUser) {
            topUser.innerHTML = `
                ${esc(data.user?.fullName || "User")}
                <button class="linkbtn" onclick="logout()">Logout</button>
            `;
        }

        // Dashboard counts
        const organsCount = document.getElementById("organsCount");
        if (organsCount) {
            organsCount.textContent = data.availableOrgans ?? 0;
        }

        const hospitalCount = document.getElementById("hospitalCount");
        if (hospitalCount) {
            hospitalCount.textContent = data.hospitals ?? 0;
        }

        const requestCount = document.getElementById("requestCount");
        if (requestCount) {
            requestCount.textContent = data.requests ?? 0;
        }

        // User profile
        const profile = document.getElementById("profile");

        if (profile) {

            const u = data.user || {};

            profile.innerHTML = `
                <div class="profile-info">

                    <p>
                        <strong>Name:</strong>
                        ${esc(u.fullName || "Not available")}
                    </p>

                    <p>
                        <strong>Blood Group:</strong>
                        ${esc(u.bloodGroup || "Not available")}
                    </p>

                    <p>
                        <strong>Age:</strong>
                        ${u.age ?? "Not available"}
                    </p>

                    <p>
                        <strong>Required Organ:</strong>
                        ${esc(u.requiredOrgan || "Not available")}
                    </p>

                </div>
            `;
        }

    } catch (error) {

        console.error("Dashboard error:", error);

    }
}
// ================= ORGANS =================
let allOrgans = [];
function initOrgansPage() {

    shell();

    loadOrgans();

}
async function loadOrgans() {

    try {

        const response = await fetch(API + "/organs", {
            credentials: "include"
        });

        allOrgans = await response.json();

        renderOrgans(allOrgans);

    } catch (error) {

        console.error("Organs error:", error);

    }
}

function renderOrgans(list) {

    const organCards = document.getElementById("organCards");

    if (!organCards) return;

    organCards.innerHTML = list.map(o => `
        <div class="organ-card">

            <div class="organ-icon">♥</div>

            <h3>${esc(o.organType)}</h3>

            <p>Hospital: ${esc(o.hospital.name)}</p>

            <p>
                Blood group:
                <b>${esc(o.bloodGroup)}</b>
            </p>

            <p>Quantity: ${o.quantity}</p>

            <span class="badge">${esc(o.status)}</span>

            <button
                class="primary small"
                onclick="requestOrgan(${o.id})">
                Request Organ
            </button>

        </div>
    `).join("");
}


// ================= SEARCH ORGANS =================
function filterCards() {

    const searchElement = document.getElementById("search");
    const bloodElement = document.getElementById("blood");

    const q = (searchElement?.value || "").toLowerCase();
    const b = (bloodElement?.value || "").toLowerCase();

    const filtered = allOrgans.filter(o => {

        const text =
            `${o.organType} ${o.hospital.name} ${o.bloodGroup}`
            .toLowerCase();

        return text.includes(q) &&
               (!b || text.includes(b));
    });

    renderOrgans(filtered);
}


// ================= REQUEST ORGAN =================
async function requestOrgan(id) {

    try {

        const response = await fetch(
            API + "/requests/" + id,
            {
                method: "POST",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(data.message || "Request failed");

            return;
        }

        alert(
            "Request created. Priority score: "
            + data.score
            + "%"
        );

        location.href = "requests.html";

    } catch (error) {

        alert("Cannot connect to backend.");
        console.error(error);

    }
}


// ================= MATCHING =================
async function loadMatching() {

    const requiredOrgan =
        document.getElementById("requiredOrgan");

    const results =
        document.getElementById("results");

    if (!requiredOrgan || !results) return;

    try {

        const organ = requiredOrgan.value;

        const response = await fetch(
            API + "/matching?organ=" +
            encodeURIComponent(organ),
            {
                credentials: "include"
            }
        );

        const arr = await response.json();

        if (!arr.length) {

            results.innerHTML =
                "<div class='card'>No available demo matches.</div>";

            return;
        }

        results.innerHTML = arr.map((r, i) => `

            <div class="result">

                <div>

                    <h3>
                        #${i + 1}
                        ${esc(r.organType)}
                        Donor Match

                        <span class="score">
                            ${r.score}%
                        </span>
                    </h3>

                    <p>
                        ${esc(r.hospital)}
                        · ${esc(r.city)}
                        · Blood: ${esc(r.bloodGroup)}
                        · Quantity: ${r.quantity}
                    </p>

                    <ul>
                        ${r.reasons.map(x =>
                            `<li>${esc(x)}</li>`
                        ).join("")}
                    </ul>

                </div>

                <button
                    class="primary"
                    onclick="requestOrgan(${r.id})">
                    Request
                </button>

            </div>

        `).join("");

    } catch (error) {

        console.error("Matching error:", error);

    }
}


// ================= REQUESTS =================
async function loadRequests() {

    try {

        const response = await fetch(
            API + "/requests",
            {
                credentials: "include"
            }
        );

        const arr = await response.json();

        const requestRows =
            document.getElementById("requestRows");

        if (!requestRows) return;

        requestRows.innerHTML = arr.length

            ? arr.map(r => `
                <tr>
                    <td>#${r.id}</td>
                    <td>${esc(r.organ)}</td>
                    <td>${esc(r.bloodGroup)}</td>
                    <td>${esc(r.hospital)}</td>
                    <td>${r.priorityScore}%</td>
                    <td>
                        <span class="badge">
                            ${esc(r.status)}
                        </span>
                    </td>
                </tr>
            `).join("")

            : `<tr>
                <td colspan="6">
                    No requests yet.
                </td>
              </tr>`;

    } catch (error) {

        console.error("Requests error:", error);

    }
}


// ================= HOSPITALS =================
async function loadHospitals() {

    try {

        const response = await fetch(
            API + "/hospitals",
            {
                credentials: "include"
            }
        );

        const hospitals = await response.json();

        const hospitalCards =
            document.getElementById("hospitalCards");

        if (hospitalCards) {

            hospitalCards.innerHTML =
                hospitals.map(h => `

                    <div class="card">

                        <h3>${esc(h.name)}</h3>

                        <p>${esc(h.city)}</p>

                        <p>${esc(h.phone)}</p>

                    </div>

                `).join("");
        }

        if (typeof L !== "undefined" &&
            document.getElementById("map")) {

            const map =
                L.map("map")
                .setView([13.0827, 80.2707], 11);

            L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    maxZoom: 19,
                    attribution: "© OpenStreetMap"
                }
            ).addTo(map);

            hospitals.forEach(h => {

                L.marker([h.lat, h.lng])
                    .addTo(map)
                    .bindPopup(
                        "<b>" +
                        esc(h.name) +
                        "</b><br>" +
                        esc(h.city)
                    );

            });
        }

    } catch (error) {

        console.error("Hospital error:", error);

    }
}


// ================= HELP =================
const helpTexts = {

    en:
        "LifeLink connects recipients, hospitals and synthetic organ inventory. The matching page calculates a demonstration priority score.",

    te:
        "LifeLink వినియోగదారులు, ఆసుపత్రులు మరియు నమూనా అవయవ సమాచారాన్ని కలుపుతుంది.",

    ta:
        "LifeLink பயனர்கள், மருத்துவமனைகள் மற்றும் மாதிரி உறுப்பு தரவுகளை இணைக்கிறது.",

    hi:
        "LifeLink उपयोगकर्ताओं, अस्पतालों और डेमो अंग सूची को जोड़ता है."
};

function changeHelp() {

    const lang =
        document.getElementById("lang");

    const helpText =
        document.getElementById("helpText");

    if (lang && helpText) {
        helpText.textContent =
            helpTexts[lang.value];
    }
}

if (document.getElementById("helpText")) {
    changeHelp();
}


function answer(type) {

    const answerEl =
        document.getElementById("answer");

    if (!answerEl) return;

    if (type === "matching") {

        answerEl.textContent =
            "The engine checks organ type, blood group and simple priority factors, then ranks available records.";

    } else if (type === "request") {

        answerEl.textContent =
            "Open Available Organs or Matching and click Request. The request appears in My Requests.";

    } else {

        answerEl.textContent =
            "No. This prototype uses synthetic data and must not be used for clinical decisions.";
    }
}
// ================= PAGE INITIALIZATION =================

document.addEventListener("DOMContentLoaded", function () {

    if (document.getElementById("shell")) {
        shell();
    }

});