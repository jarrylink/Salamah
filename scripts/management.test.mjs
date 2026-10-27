import test from "node:test";
import assert from "node:assert/strict";
import { modules } from "../src/features/management/config.ts";
import { parseRecord, assertImmutable } from "../src/features/management/validation.ts";
import { calculateSubjectResult } from "../src/features/results/lib/calculation.ts";

const form = (data) => { const result = new FormData(); for (const [key, value] of Object.entries(data)) result.set(key, String(value)); return result; };
const id = "b3f7ee42-940d-4e2f-a873-ac63e47c29e2";

test("accounts normalize email and require a strong password on creation", () => {
  assert.throws(() => parseRecord(modules.accounts, form({email:"test@example.com",password:"short",role:"student",status:"active"}), false), /12 characters/);
  const data = parseRecord(modules.accounts, form({email:" TEST@EXAMPLE.COM ",password:"a secure password",role:"student",status:"active"}), false);
  assert.equal(data.email, "test@example.com");
  assert.equal(data.person_id, null);
});
test("blank edit password preserves the current credential", () => {
  const data = parseRecord(modules.accounts, form({email:"test@example.com",password:"",role:"admin",status:"active"}), true);
  assert.equal(data.password, null);
});
test("submitted fields cannot inject columns or grant unknown roles", () => {
  assert.throws(() => parseRecord(modules.accounts, form({email:"a@example.com",password:"a secure password",role:"owner",status:"active"}), false), /valid role/);
  const data = parseRecord(modules.subjects, form({name:"Math",code:"MATH",status:"active",password_hash:"injected",is_current:"true"}), false);
  assert.equal(data.password_hash, undefined);
  assert.equal(data.is_current, undefined);
});
test("student placement cannot be overwritten", () => {
  assert.throws(() => assertImmutable(modules.enrolments, {student_id:id,session_id:id,class_id:id,enrollment_date:"2026-09-01"}, {student_id:id,session_id:id,class_id:"another-class",enrollment_date:"2026-09-01"}), /preserve history/);
});
test("enrolment status can change without moving a historical placement", () => {
  const previous = {student_id:id,session_id:id,class_id:id,enrollment_date:"2026-09-01",status:"active"};
  assert.doesNotThrow(() => assertImmutable(modules.enrolments, {...previous,status:"withdrawn"}, previous));
});
test("invalid dates and non-UUID relationships are rejected", () => {
  assert.throws(() => parseRecord(modules.students, form({person_id:id,admission_number:"001",admission_date:"2026-02-30",status:"active"}), false), /valid date/);
  assert.throws(() => parseRecord(modules.students, form({person_id:"bad",admission_number:"001",admission_date:"2026-02-01",status:"active"}), false), /valid person/);
});
test("amounts convert exactly to kobo and reject invalid precision", () => {
  const base={invoice_id:id,amount_kobo:"1234.56",payment_date:"2026-09-01",reference:"PAY-001",payment_method:"cash"};
  assert.equal(parseRecord(modules.payments,form(base),false).amount_kobo,123456);
  for (const amount of ["-1", "0", "0.001", "1e3", "21474836.48"]) assert.throws(() => parseRecord(modules.payments,form({...base,amount_kobo:amount}),false));
});
test("notice expiry must follow publication", () => {
  assert.throws(() => parseRecord(modules.notices,form({title:"Notice",content:"Details",audience:"everyone",publish_date:"2026-09-20",expiry_date:"2026-09-19",status:"active"}),false), /Expiry/);
});
test("grade bands cover fractional results and missing assessments stay ungraded", () => {
  const bands=[{minimumScore:70,maximumScore:100,grade:"A",point:5,remark:null},{minimumScore:60,maximumScore:69,grade:"B",point:4,remark:null}];
  assert.equal(calculateSubjectResult([69.5],[100],bands).grade,"B");
  assert.equal(calculateSubjectResult([],[],bands).grade,null);
  assert.throws(() => calculateSubjectResult([101],[100],bands));
  assert.throws(() => calculateSubjectResult([10],[],bands));
});
test("management registry contains only safe SQL identifiers and valid references", () => {
  for (const definition of Object.values(modules)) {
    assert.match(definition.table,/^[a-z_]+$/);
    for (const field of definition.fields) {
      assert.match(field.name,/^[a-z_]+$/);
      if (field.reference) assert.ok(modules[field.reference] || ["sessions","terms"].includes(field.reference));
    }
  }
});
