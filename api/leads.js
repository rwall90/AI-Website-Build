const REQUIRED_ENV_VARS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_PASSWORD",
];

const TABLE_NAME = "leads";

module.exports = async function handler(request, response) {
  setSecurityHeaders(response);

  if (request.method === "OPTIONS") {
    return response.status(204).end();
  }

  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    return response.status(500).json({
      message: `Missing server configuration: ${missing.join(", ")}`,
    });
  }

  try {
    if (request.method === "POST") {
      return createLead(request, response);
    }

    if (request.method === "GET") {
      if (!isAdmin(request)) {
        return response.status(401).json({ message: "Invalid admin password." });
      }

      return listLeads(response);
    }

    if (request.method === "DELETE") {
      if (!isAdmin(request)) {
        return response.status(401).json({ message: "Invalid admin password." });
      }

      return clearLeads(response);
    }

    response.setHeader("Allow", "GET, POST, DELETE, OPTIONS");
    return response.status(405).json({ message: "Method not allowed." });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Unexpected server error.",
    });
  }
};

async function createLead(request, response) {
  const lead = sanitizeLead(request.body || {});
  const validationError = validateLead(lead);

  if (validationError) {
    return response.status(400).json({ message: validationError });
  }

  const supabaseResponse = await supabaseFetch(TABLE_NAME, {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      name: lead.name,
      email: lead.email,
      company: lead.company,
      phone: lead.phone,
      volume: lead.volume,
      message: lead.message,
      source: "website",
    }),
  });

  const data = await parseSupabaseResponse(supabaseResponse);

  if (!supabaseResponse.ok) {
    return response.status(502).json({
      message: data.message || "Could not save lead.",
    });
  }

  return response.status(201).json({ lead: mapLead(data[0]) });
}

async function listLeads(response) {
  const supabaseResponse = await supabaseFetch(
    `${TABLE_NAME}?select=*&order=submitted_at.desc`
  );
  const data = await parseSupabaseResponse(supabaseResponse);

  if (!supabaseResponse.ok) {
    return response.status(502).json({
      message: data.message || "Could not load leads.",
    });
  }

  return response.status(200).json({ leads: data.map(mapLead) });
}

async function clearLeads(response) {
  const supabaseResponse = await supabaseFetch(`${TABLE_NAME}?id=not.is.null`, {
    method: "DELETE",
  });
  const data = await parseSupabaseResponse(supabaseResponse);

  if (!supabaseResponse.ok) {
    return response.status(502).json({
      message: data.message || "Could not clear leads.",
    });
  }

  return response.status(204).end();
}

function sanitizeLead(lead) {
  return {
    name: cleanString(lead.name),
    email: cleanString(lead.email).toLowerCase(),
    company: cleanString(lead.company),
    phone: cleanString(lead.phone),
    volume: cleanString(lead.volume),
    message: cleanString(lead.message),
  };
}

function validateLead(lead) {
  if (!lead.name || !lead.email || !lead.company || !lead.phone || !lead.volume) {
    return "Please complete all required fields.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return "Please enter a valid email address.";
  }

  if (lead.message.length < 10) {
    return "Please add a short note about what you need.";
  }

  return "";
}

function cleanString(value) {
  return String(value || "").trim().slice(0, 1000);
}

function isAdmin(request) {
  return request.headers["x-admin-password"] === process.env.ADMIN_PASSWORD;
}

async function supabaseFetch(path, options = {}) {
  const baseUrl = process.env.SUPABASE_URL.replace(/\/$/, "");

  return fetch(`${baseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

async function parseSupabaseResponse(supabaseResponse) {
  const text = await supabaseResponse.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function mapLead(lead) {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    company: lead.company,
    phone: lead.phone,
    volume: lead.volume,
    message: lead.message,
    submittedAt: lead.submitted_at,
  };
}

function setSecurityHeaders(response) {
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Password");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Content-Type-Options", "nosniff");
}
