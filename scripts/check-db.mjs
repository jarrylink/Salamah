import { neon } from "@neondatabase/serverless";
import { modules } from "../src/features/management/config.ts";
import { readFile } from "node:fs/promises";
import ts from "typescript";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const sql = neon(process.env.DATABASE_URL);
const columns = await sql.query("select table_name,column_name from information_schema.columns where table_schema='public'");
const available = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`));
const missing = [];
for (const definition of Object.values(modules)) {
  for (const field of definition.fields.filter((field) => field.type !== "password")) {
    if (!available.has(`${definition.table}.${field.name}`)) missing.push(`${definition.table}.${field.name}`);
  }
}
console.log(JSON.stringify({ checkedModules: Object.keys(modules).length, missingColumns: missing }, null, 2));
if (missing.length) process.exitCode = 1;

// EXPLAIN without ANALYZE plans statements but does not execute their writes.
// Read SQL directly from application source so these checks exercise its actual statements.
const id = "b3f7ee42-940d-4e2f-a873-ac63e47c29e2";
const fixtures = [
  ["insert into academic_sessions", [id,"Plan check","2026-09-01","2027-07-31"]],
  ["insert into academic_terms", [id]],
  ["update academic_sessions", [id,id]],
  ["update academic_terms", [id,id]],
  ["delete from subject_combination_subjects", [id,"2026-09-01T00:00:00Z"]],
  ["insert into grade_sections", [id,id]],
  ["insert into fee_payments", [id,100,"2026-09-01","PLAN-CHECK","cash",id]],
  ["insert into inventory_transactions", [id,id,"stock_in",1,"2026-09-01","PLAN-CHECK",null,id]],
  ["insert into class_subjects", [id,id,id,id]],
  ["insert into assessment_scores", [id,id,10,id]],
];
const plans=[];
for(const file of ["src/features/management/actions.ts","src/features/academic/actions/sessions.ts","src/features/results/actions/scores.ts"]) {
  const source=ts.createSourceFile(file,await readFile(file,"utf8"),ts.ScriptTarget.Latest,true);
  const visit=(node)=>{
    if(ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text==='query') {
      const argument=node.arguments[0];
      if(argument && (ts.isStringLiteral(argument)||ts.isNoSubstitutionTemplateLiteral(argument))) {
        const fixture=fixtures.find(([prefix])=>argument.text.trim().startsWith(prefix));
        if(fixture) plans.push(sql.query(`EXPLAIN ${argument.text}`,fixture[1]));
      }
    }
    ts.forEachChild(node,visit);
  };
  visit(source);
}
await sql.transaction(plans,{readOnly:true});
console.log(`Validated ${plans.length} write statement plans without executing writes.`);
