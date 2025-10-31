/*
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_SID    = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_TOKEN  = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_FROM   = Deno.env.get("TWILIO_FROM")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

async function sendSMS(to: string, body: string) {
  const creds = btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const form = new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
}

async function getUserPhones(orgId: string, userIds: string[]) {
  if (!userIds.length) return {} as Record<string,string>;
  const { data, error } = await admin
    .from("profiles")
    .select("id, phone_e164")
    .eq("org_id", orgId)
    .in("id", userIds);
  if (error) throw error;
  const map: Record<string,string> = {};
  (data ?? []).forEach((r: any) => { if (r.phone_e164) map[r.id] = r.phone_e164; });
  return map;
}

async function getName(table: "teams" | "projects", id: string) {
  const { data } = await admin.from(table).select("name").eq("id", id).maybeSingle();
  return (data as any)?.name ?? null;
}

type DBEvent = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: "tasks" | "team_members" | "project_teams" | string;
  schema: string;
  record: any;
  old_record?: any | null;
};

Deno.serve(async (req) => {
  try {
    const evt = (await req.json()) as DBEvent;

    if (evt.table === "tasks") {
      const r = evt.record ?? {};
      const o = evt.old_record ?? null;
      const orgId = r.org_id as string | null;

      const becameAssigned =
        (evt.type === "INSERT" && !!r.assignee_id) ||
        (evt.type === "UPDATE" && r.assignee_id && (!o || r.assignee_id !== o.assignee_id));

      if (orgId && becameAssigned) {
        const assignee = r.assignee_id as string;
        const phones = await getUserPhones(orgId, [assignee]);
        const to = phones[assignee];
        if (to) {
          const due = r.due_date ? ` (vence ${r.due_date})` : "";
          const title = r.title ?? "Tarefa";
          await sendSMS(to, `Nova tarefa atribuída: "${title}"${due}`);
        }
      }
    }

    if (evt.table === "team_members" && evt.type === "INSERT") {
      const r = evt.record ?? {};
      const { org_id: orgId, user_id: userId, team_id: teamId } = r;
      if (orgId && userId && teamId) {
        const [phones, teamName] = await Promise.all([
          getUserPhones(orgId, [userId]),
          getName("teams", teamId),
        ]);
        const to = phones[userId];
        if (to) await sendSMS(to, `Você entrou no time "${teamName ?? "Time"}".`);
      }
    }

    if (evt.table === "project_teams" && evt.type === "INSERT") {
      const r = evt.record ?? {};
      const { org_id: orgId, team_id: teamId, project_id: projectId } = r;
      if (orgId && teamId && projectId) {
        const { data: members } = await admin
          .from("team_members")
          .select("user_id")
          .eq("org_id", orgId)
          .eq("team_id", teamId);

        const userIds = (members ?? []).map((m: any) => m.user_id).filter(Boolean);
        const [phones, projectName] = await Promise.all([
          getUserPhones(orgId, userIds),
          getName("projects", projectId),
        ]);

        await Promise.all(userIds.map(async (uid: string) => {
          const to = phones[uid];
          if (to) await sendSMS(to, `Seu time foi adicionado ao projeto "${projectName ?? "Projeto"}".`);
        }));
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" }});
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
*/