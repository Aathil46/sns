import { createClient } from '@libsql/client';
const sqlite = createClient({ url: 'file:local.db' });
async function run() {
  const res = await sqlite.execute("SELECT username, trust_score, risk_score FROM users WHERE id='18f51ee7-e07e-4dbc-a000-01b7b9a8ba85'");
  console.log(res.rows);
  const reports = await sqlite.execute("SELECT * FROM reports WHERE reported_user_id='18f51ee7-e07e-4dbc-a000-01b7b9a8ba85'");
  console.log(reports.rows);
}
run();
