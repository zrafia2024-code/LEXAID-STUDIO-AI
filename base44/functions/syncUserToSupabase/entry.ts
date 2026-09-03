import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";

// Mirrors a newly registered Base44 user into the owner's Supabase project:
// (1) creates/confirms the user in Supabase Auth, (2) upserts a row in a table.
// Best-effort: registration is never blocked by Supabase failures.

const TABLE = "pwa_users";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseUrl = (secrets.get("SUPABASE_URL") || "").replace(/\/+$/, "");
    const serviceKey = secrets.get("SUPABASE_SERVICE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const headers = {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json",
    };

    const results = { auth: null, table: null };

    // 1. Supabase Auth: create the user. "Already registered" is treated as success.
    try {
      const create = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: user.email,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name || "",
            base44_user_id: user.id,
          },
        }),
      });

      if (create.ok) {
        results.auth = "created";
      } else {
        const body = await create.json().catch(() => ({}));
        const msg = (body?.msg || body?.message || "").toString();
        results.auth = msg.toLowerCase().includes("already")
          ? "exists"
          : `create_failed_${create.status}`;
      }
    } catch (e) {
      results.auth = "error";
    }

    // 2. Upsert a row in the pwa_users table (dedupe by email).
    try {
      const upsert = await fetch(`${supabaseUrl}/rest/v1/${TABLE}?on_conflict=email`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({
          email: user.email,
          name: user.full_name || "",
          base44_user_id: user.id,
        }),
      });
      results.table = upsert.ok ? "upserted" : `failed_${upsert.status}`;
    } catch (e) {
      results.table = "error";
    }

    return Response.json({ ok: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
