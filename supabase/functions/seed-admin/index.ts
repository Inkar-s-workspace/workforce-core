import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = "admin@accramedical.com";
  const password = "admin123.123admin";

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === email);

  let userId: string;

  if (existing) {
    userId = existing.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    userId = data.user.id;
  }

  // Upsert HR role
  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role: "hr" }, { onConflict: "user_id,role" });

  if (roleError) return new Response(JSON.stringify({ error: roleError.message }), { status: 400 });

  return new Response(JSON.stringify({ success: true, userId, email }), {
    headers: { "Content-Type": "application/json" },
  });
});
