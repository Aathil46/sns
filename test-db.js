import { createClient } from '@libsql/client';
const sqlite = createClient({ url: 'file:local.db' });
async function run() {
  const res = await sqlite.execute("SELECT username, trust_score, risk_score FROM users WHERE username IN ('trusted_expert', 'normal_student', 'sc4mm3r')");
  console.log(res.rows);
}
run();
