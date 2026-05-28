const SESSION_KEY = "frontdesk-ai-admin-password";

const loginPanel = document.querySelector("#admin-login-panel");
const loginForm = document.querySelector("#admin-login-form");
const loginStatus = document.querySelector("#login-status");
const passwordInput = document.querySelector("#admin-password");
const adminPanel = document.querySelector("#admin-panel");
const rows = document.querySelector("#lead-rows");
const emptyState = document.querySelector("#empty-state");
const count = document.querySelector("#lead-count");
const search = document.querySelector("#lead-search");
const exportButton = document.querySelector("#export-leads");
const clearButton = document.querySelector("#clear-leads");
const logoutButton = document.querySelector("#logout-admin");

let leads = [];
let adminPassword = sessionStorage.getItem(SESSION_KEY) || "";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function matchesSearch(lead, query) {
  const haystack = [
    lead.name,
    lead.email,
    lead.company,
    lead.phone,
    lead.volume,
    lead.message,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

async function apiRequest(options = {}) {
  const response = await fetch("/api/leads", {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Request failed.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function loadLeads() {
  const data = await apiRequest();
  leads = data.leads || [];
  renderLeads();
}

function showAdmin() {
  loginPanel.hidden = true;
  adminPanel.hidden = false;
  logoutButton.hidden = false;
  exportButton.disabled = false;
  clearButton.disabled = false;
}

function showLogin(message = "") {
  adminPassword = "";
  sessionStorage.removeItem(SESSION_KEY);
  loginPanel.hidden = false;
  adminPanel.hidden = true;
  logoutButton.hidden = true;
  exportButton.disabled = true;
  clearButton.disabled = true;
  loginStatus.textContent = message;
}

function renderLeads() {
  const query = search.value.trim();
  const filteredLeads = leads.filter((lead) => matchesSearch(lead, query));

  rows.innerHTML = "";
  count.textContent = `${filteredLeads.length} ${
    filteredLeads.length === 1 ? "lead" : "leads"
  }`;
  emptyState.classList.toggle("is-visible", filteredLeads.length === 0);

  for (const lead of filteredLeads) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(lead.name)}</td>
      <td>${escapeHtml(lead.company)}</td>
      <td><a href="mailto:${escapeAttribute(lead.email)}">${escapeHtml(lead.email)}</a></td>
      <td><a href="tel:${escapeAttribute(lead.phone)}">${escapeHtml(lead.phone)}</a></td>
      <td>${escapeHtml(lead.volume)}</td>
      <td>${escapeHtml(lead.message)}</td>
      <td>${formatDate(lead.submittedAt)}</td>
    `;
    rows.append(row);
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(String(value).trim());
}

function exportCsv() {
  const headers = ["Name", "Company", "Email", "Phone", "Volume", "Message", "Submitted"];
  const lines = leads.map((lead) =>
    [
      lead.name,
      lead.company,
      lead.email,
      lead.phone,
      lead.volume,
      lead.message,
      formatDate(lead.submittedAt),
    ]
      .map((value) => `"${String(value || "").replaceAll('"', '""')}"`)
      .join(",")
  );

  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "frontdesk-ai-leads.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function login(password) {
  adminPassword = password;
  sessionStorage.setItem(SESSION_KEY, adminPassword);
  await loadLeads();
  showAdmin();
  loginStatus.textContent = "";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.classList.remove("is-error");
  loginStatus.textContent = "Checking...";

  try {
    await login(passwordInput.value);
    loginForm.reset();
  } catch (error) {
    showLogin(error.message || "Could not sign in.");
    loginStatus.classList.add("is-error");
  }
});

search.addEventListener("input", renderLeads);
exportButton.addEventListener("click", exportCsv);
clearButton.addEventListener("click", async () => {
  if (confirm("Clear all captured leads?")) {
    await apiRequest({ method: "DELETE" });
    leads = [];
    renderLeads();
  }
});
logoutButton.addEventListener("click", () => showLogin());

if (adminPassword) {
  loadLeads()
    .then(showAdmin)
    .catch(() => showLogin("Please sign in again."));
} else {
  showLogin();
}
