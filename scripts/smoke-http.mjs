import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { modules } from "../src/features/management/config.ts";
import nextEnv from "@next/env";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
nextEnv.loadEnvConfig(process.cwd());

// Read-only application smoke checks: no credentials are printed or changed.
// Local signing uses the project's existing AUTH_SECRET and never changes users.
const base = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
if (!new URL(base).hostname.match(/^(127\.0\.0\.1|localhost)$/)) throw new Error("Smoke checks must target localhost.");
const sql = neon(process.env.DATABASE_URL);
const accounts = await sql.query("select id,email,role,password_hash from users where status='active' and role in ('superadmin','admin','teacher','student','guardian') order by created_at");
const sign = (value) => createHmac("sha256",process.env.AUTH_SECRET).update(value).digest("base64url");
function cookie(account) {
  const payload=Buffer.from(JSON.stringify({userId:account.id,email:account.email,role:account.role,credentialTag:sign(`credential:${account.password_hash}`),expiresAt:Date.now()+600000})).toString("base64url");
  return `salamah_session=${payload}.${sign(payload)}`;
}
async function check(path, account, expectContent) {
  const response=await fetch(`${base}${path}`,{headers:account ? {cookie:cookie(account)} : {},redirect:"manual"});
  if (!account) { assert.ok([303,307,308].includes(response.status),`${path}: expected sign-in redirect, got ${response.status}`); }
  else {
    const body=await response.text();
    assert.equal(response.status,200,`${path}: HTTP ${response.status}, redirect ${response.headers.get('location')}`);
    assert.ok(!body.includes('"digest":"') && !body.includes('NEXT_HTTP_ERROR_FALLBACK;500'),`${path}: streamed server error`);
    assert.ok(!body.includes('NEXT_REDIRECT'), `${path}: unexpected streamed redirect`);
    if (expectContent) assert.ok(body.includes(expectContent),`${path}: missing expected page content`);
  }
  console.log(`PASS ${account?.role ?? 'anonymous'} ${path}`);
}
await check('/dashboard');
await check('/dashboard/manage/accounts');
const admin=accounts.find((account)=>account.role==='superadmin');
assert.ok(admin,'An active Super Admin is needed for read-only smoke tests.');
for (const path of ['/dashboard','/dashboard/academic-sessions','/dashboard/people-access','/dashboard/academic-structure','/dashboard/results','/dashboard/fees','/dashboard/inventory','/dashboard/reports']) await check(path,admin);
for (const [key,definition] of Object.entries(modules)) await check(`/dashboard/manage/${key}`,admin,definition.title.replaceAll('&','&amp;'));
for(const role of ['teacher','student','guardian','admin']) {
  const account=accounts.find((account)=>account.role===role);
  if(!account) {console.log(`SKIP ${role}: no active account`);continue;}
  await check('/dashboard',account);
  if(role==='teacher') await check('/dashboard/results',account);
  if(role!=='superadmin') {
    const response=await fetch(`${base}/dashboard/manage/accounts`,{headers:{cookie:cookie(account)},redirect:'manual'});
    const body=await response.text();
    assert.ok(response.status===307 || response.status===303 || body.includes('NEXT_REDIRECT'), `${role} must not access account management`);
    assert.ok(!body.includes('Sign-in email'),`${role} was shown the account form`);
    console.log(`PASS ${role} denied account management`);
  }
}
const require=createRequire(import.meta.url);
const { encodeReply }=require('next/dist/compiled/react-server-dom-webpack/client.node');
const manifest=JSON.parse(await readFile('.next/dev/server/server-reference-manifest.json','utf8'));
const recordAction=Object.entries(manifest.node).find(([,entry])=>entry.exportedName==='saveRecord')?.[0];
assert.ok(recordAction,'Record action must be present in the development manifest.');
for(const [account,key,message] of [[undefined,'subjects','Sign in is required'],[accounts.find(a=>a.role==='teacher'),'subjects','Administrator access is required'],[accounts.find(a=>a.role==='admin'),'accounts','You do not have access'],[admin,'subjects','Subject name is required']]) {
  if(account===undefined && key==='accounts') continue;
  const body=await encodeReply([key,{ok:false,message:''},new FormData()]);
  const response=await fetch(`${base}/dashboard/manage/${key}`,{method:'POST',headers:{'Next-Action':recordAction,Origin:base,...(account?{cookie:cookie(account)}:{})},body});
  const result=await response.text();
  assert.ok(result.includes(message),`${account?.role??'anonymous'} action should report ${message}; HTTP ${response.status}`);
  console.log(`PASS ${account?.role??'anonymous'} action validation (${key})`);
}
const invalidLogin=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:'invalid-email',password:'invalid'})});
assert.equal(invalidLogin.status,400);
console.log('PASS login rejects malformed credentials');
const teacher=accounts.find(account=>account.role==='teacher');
if(teacher) {
  const response=await fetch(`${base}/dashboard/manage/accounts`,{headers:{cookie:cookie({...teacher,role:'superadmin'})},redirect:'manual'});
  const body=await response.text();
  assert.ok(response.status===307 || body.includes('NEXT_REDIRECT'));
  assert.ok(!body.includes('Sign-in email'));
  console.log('PASS stale signed role cannot grant administrator access');
}
const revoked=await fetch(`${base}/dashboard`,{headers:{cookie:cookie({...admin,password_hash:'previous-password-hash'})},redirect:'manual'});
const revokedBody=await revoked.text();
assert.ok(revoked.status===307 || revokedBody.includes('NEXT_REDIRECT'));
assert.ok(!revokedBody.includes('School at a glance'));
console.log('PASS old credential signature cannot access the dashboard');
console.log('Read-only HTTP smoke checks completed.');
