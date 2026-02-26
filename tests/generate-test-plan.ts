/**
 * Generates tests/test-plan.xlsx — a structured test plan covering all
 * unit tests, E2E tests, and manual verification steps.
 *
 * Run with:  npm run test:plan
 */
import * as XLSX from "xlsx";
import { resolve } from "path";

type Row = (string | number)[];

interface Sheet {
  name: string;
  headers: string[];
  rows: Row[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const unitTests: Row[] = [
  // ID, Feature, Test Case, Expected Result, Priority, Status
  ["UT-01", "Token Generation", "Returns a 64-char hex string (32 bytes)", "string of length 64, /^[0-9a-f]+$/", "High", "Automated", ""],
  ["UT-02", "Token Generation", "Generates unique tokens on each call", "20 calls → 20 distinct values", "High", "Automated", ""],
  ["UT-03", "JWT Verification", "Valid JWT returns {userId, sessionToken}", "Payload matches signed claims", "Critical", "Automated", ""],
  ["UT-04", "JWT Verification", "Garbage token returns null", "null", "High", "Automated", ""],
  ["UT-05", "JWT Verification", "Expired JWT returns null", "null", "High", "Automated", ""],
  ["UT-06", "JWT Verification", "Wrong-secret JWT returns null", "null", "High", "Automated", ""],
  ["UT-07", "Session Cookie", "Has httpOnly + sameSite lax + path /", "Options object matches", "High", "Automated", ""],
  ["UT-08", "Session Cookie", "Default maxAge = 7 days", "604800 seconds", "Medium", "Automated", ""],
  ["UT-09", "Session Cookie", "Custom maxAge accepted", "Returns provided value", "Medium", "Automated", ""],
  ["UT-10", "Session Cookie", "secure = false outside production", "false in test env", "Medium", "Automated", ""],
  ["UT-11", "createSession", "Creates DB session row", "prisma.session.create called once", "Critical", "Automated", ""],
  ["UT-12", "createSession", "Returns a verifiable JWT", "verifyJwt(result).userId = userId", "Critical", "Automated", ""],
  ["UT-13", "Verify Email HTML", "EN subject correct", "Subject = 'Verify your email address'", "Medium", "Automated", ""],
  ["UT-14", "Verify Email HTML", "DE subject correct", "Subject = 'E-Mail-Adresse bestätigen'", "Medium", "Automated", ""],
  ["UT-15", "Verify Email HTML", "Verify URL embedded in body", "Body contains full verify URL", "High", "Automated", ""],
  ["UT-16", "Reset Email HTML", "EN subject correct", "Subject = 'Reset your password'", "Medium", "Automated", ""],
  ["UT-17", "Reset Email HTML", "DE subject correct", "Subject = 'Passwort zurücksetzen'", "Medium", "Automated", ""],
  ["UT-18", "Reset Email HTML", "Reset URL embedded in body", "Body contains full reset URL", "High", "Automated", ""],
  ["UT-19", "Register API", "Valid input → 201 + sends email", "Status 201, sendVerificationEmail called", "Critical", "Automated", ""],
  ["UT-20", "Register API", "Duplicate email → 400", "Status 400, no DB create, no email", "High", "Automated", ""],
  ["UT-21", "Register API", "Invalid email format → 400", "Status 400", "High", "Automated", ""],
  ["UT-22", "Register API", "Password < 8 chars → 400", "Status 400", "High", "Automated", ""],
  ["UT-23", "Register API", "Name < 2 chars → 400", "Status 400", "Medium", "Automated", ""],
  ["UT-24", "Register API", "Invalid locale → 400", "Status 400", "Low", "Automated", ""],
  ["UT-25", "Register API", "DE locale → email sent with 'de'", "sendVerificationEmail locale param = 'de'", "Medium", "Automated", ""],
  ["UT-26", "Login API", "Valid credentials → 200 + cookie set", "Status 200, Set-Cookie contains session=", "Critical", "Automated", ""],
  ["UT-27", "Login API", "Non-existent email → 401", "Status 401", "High", "Automated", ""],
  ["UT-28", "Login API", "Wrong password → 401", "Status 401", "High", "Automated", ""],
  ["UT-29", "Login API", "Unverified email → 403", "Status 403, body mentions verify", "High", "Automated", ""],
  ["UT-30", "Login API", "Invalid email format → 400", "Status 400", "Medium", "Automated", ""],
  ["UT-31", "Login API", "Empty password → 400", "Status 400", "Medium", "Automated", ""],
  ["UT-32", "Logout API", "Valid session → deletes DB record", "prisma.session.delete called with token", "Critical", "Automated", ""],
  ["UT-33", "Logout API", "Clears session cookie in response", "Set-Cookie: session=; Max-Age=0", "High", "Automated", ""],
  ["UT-34", "Logout API", "No cookie → 200 gracefully", "Status 200, no DB call", "Medium", "Automated", ""],
  ["UT-35", "Logout API", "Invalid JWT → 200 gracefully", "Status 200, no DB call", "Medium", "Automated", ""],
  ["UT-36", "Verify Email API", "Missing token → 400", "Status 400", "High", "Automated", ""],
  ["UT-37", "Verify Email API", "Unknown token → 400", "Status 400, no DB update", "High", "Automated", ""],
  ["UT-38", "Verify Email API", "Valid token → 200 + emailVerified set", "Status 200, update called with emailVerified:true", "Critical", "Automated", ""],
  ["UT-39", "Verify Email API", "Already-verified → 200 idempotent", "Status 200, no update call", "Medium", "Automated", ""],
  ["UT-40", "Forgot Password API", "Existing user → 200 + email sent", "Status 200, update + sendPasswordResetEmail called", "Critical", "Automated", ""],
  ["UT-41", "Forgot Password API", "Non-existent email → 200 (no enumeration)", "Status 200, nothing called", "Critical", "Automated", ""],
  ["UT-42", "Forgot Password API", "Invalid email → 400", "Status 400", "High", "Automated", ""],
  ["UT-43", "Forgot Password API", "resetToken + expiry stored on user", "update.data contains resetToken, resetTokenExpiry", "High", "Automated", ""],
  ["UT-44", "Reset Password API", "Valid token → 200 + password changed", "Status 200, update called with new password", "Critical", "Automated", ""],
  ["UT-45", "Reset Password API", "Clears token + sets emailVerified=true", "update.data: resetToken:null, emailVerified:true", "High", "Automated", ""],
  ["UT-46", "Reset Password API", "Deletes all sessions after reset", "prisma.session.deleteMany called", "High", "Automated", ""],
  ["UT-47", "Reset Password API", "Unknown token → 400", "Status 400", "High", "Automated", ""],
  ["UT-48", "Reset Password API", "Expired token → 400", "Status 400", "High", "Automated", ""],
  ["UT-49", "Reset Password API", "Short password → 400", "Status 400", "Medium", "Automated", ""],
  ["UT-50", "Me API", "Authenticated → 200 + user object", "Status 200, body.user.email present", "Critical", "Automated", ""],
  ["UT-51", "Me API", "Not authenticated → 401", "Status 401", "Critical", "Automated", ""],
  ["UT-52", "Me API", "No password field in response", "body.user.password undefined", "High", "Automated", ""],
];

const e2eTests: Row[] = [
  ["E2E-01", "Navigation", "Homepage loads & shows hero section", "Visit /, expect h1 visible, URL = /en/", "High", "Automated", ""],
  ["E2E-02", "Navigation", "Nav shows Login + Register when logged out", "Both links visible on /en/", "High", "Automated", ""],
  ["E2E-03", "Navigation", "Language switcher → German locale", "Click DE, URL becomes /de/, html lang='de'", "Medium", "Automated", ""],
  ["E2E-04", "Navigation", "Logo links back to homepage", "Click logo from /auth/login, URL = /en/", "Low", "Automated", ""],
  ["E2E-05", "Auth Guard", "/members without session → redirect to login", "URL matches /auth/login after goto /members", "Critical", "Automated", ""],
  ["E2E-06", "Register", "Register page renders correctly", "Email, password, name fields visible", "Medium", "Automated", ""],
  ["E2E-07", "Register", "Validation error for invalid email", "Form stays, no redirect", "High", "Automated", ""],
  ["E2E-08", "Register", "Duplicate email shows error alert", "[role=alert] visible", "High", "Automated", ""],
  ["E2E-09", "Register", "Valid new email → success message", "Main shows 'check your email'", "Critical", "Automated", ""],
  ["E2E-10", "Login", "Login page renders correctly", "Email, password, submit button visible", "Medium", "Automated", ""],
  ["E2E-11", "Login", "Wrong password → error alert", "[role=alert] visible", "High", "Automated", ""],
  ["E2E-12", "Login", "Non-existent email → error alert", "[role=alert] visible", "High", "Automated", ""],
  ["E2E-13", "Login", "Valid credentials → redirect to /members", "URL matches /members after form submit", "Critical", "Automated", ""],
  ["E2E-14", "Login", "Nav shows user dropdown after login", "Button with user name/email visible", "High", "Automated", ""],
  ["E2E-15", "Logout", "Logout → homepage + Login/Register in nav", "URL = /en/, Login link visible", "Critical", "Automated", ""],
  ["E2E-16", "Logout", "After logout, /members redirects to login", "URL matches /auth/login", "Critical", "Automated", ""],
  ["E2E-17", "Members", "Authenticated user accesses /members", "URL = /en/members, h1 visible", "Critical", "Automated", ""],
  ["E2E-18", "Members", "Welcome banner shows user name", "h1 contains 'Test User'", "High", "Automated", ""],
  ["E2E-19", "Members", "Content cards rendered", "At least one card visible", "Medium", "Automated", ""],
  ["E2E-20", "Members", "German /de/members loads correctly", "html lang=de, members content visible", "Medium", "Automated", ""],
  ["E2E-21", "Forgot Password", "Forgot-password page renders", "Email field + submit button visible", "Medium", "Automated", ""],
  ["E2E-22", "Forgot Password", "Submission shows confirmation", "Main/alert shows 'email' or 'sent'", "High", "Automated", ""],
];

const manualTests: Row[] = [
  ["MT-01", "Email", "Verify registration email is sent", "Register, check inbox for verification link", "Critical", "Manual", ""],
  ["MT-02", "Email", "Email verification link works", "Click link → page shows green checkmark", "Critical", "Manual", ""],
  ["MT-03", "Email", "Forgot-password email is sent", "Submit forgot-password, check inbox", "Critical", "Manual", ""],
  ["MT-04", "Email", "Password reset link works end-to-end", "Click link → set new password → login succeeds", "Critical", "Manual", ""],
  ["MT-05", "Session", "Session expires after 7 days", "Wait or set cookie expiry to past, access /members", "Medium", "Manual", ""],
  ["MT-06", "Session", "Tampered cookie is rejected", "Modify session cookie value, access /members → redirect", "High", "Manual", ""],
  ["MT-07", "i18n", "Registration email uses locale language", "Register with DE locale, verify email is in German", "Medium", "Manual", ""],
  ["MT-08", "UX", "Resend verification email button works", "Login with unverified account, click resend, check inbox", "High", "Manual", ""],
];

// ─── Build workbook ───────────────────────────────────────────────────────────

function buildSheet(sheet: Sheet) {
  const data = [sheet.headers, ...sheet.rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Column widths
  ws["!cols"] = sheet.headers.map((h) => ({ wch: Math.max(h.length + 4, 20) }));

  // Bold header row
  const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "1E3A5F" } } };
  sheet.headers.forEach((_, ci) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (ws[cell]) ws[cell].s = headerStyle;
  });

  return ws;
}

const wb = XLSX.utils.book_new();

const headers = ["ID", "Feature", "Test Case", "Expected Result", "Priority", "Type", "Status"];

const sheets: Sheet[] = [
  { name: "Unit Tests", headers, rows: unitTests },
  { name: "E2E Tests", headers, rows: e2eTests },
  { name: "Manual Tests", headers, rows: manualTests },
];

for (const sheet of sheets) {
  XLSX.utils.book_append_sheet(wb, buildSheet(sheet), sheet.name);
}

const outPath = resolve(__dirname, "test-plan.xlsx");
XLSX.writeFile(wb, outPath);

console.log(`✓ Test plan written to ${outPath}`);
console.log(`  Unit tests:   ${unitTests.length}`);
console.log(`  E2E tests:    ${e2eTests.length}`);
console.log(`  Manual tests: ${manualTests.length}`);
console.log(`  Total:        ${unitTests.length + e2eTests.length + manualTests.length}`);
