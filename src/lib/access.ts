/**
 * Single source of truth for roles, module visibility, and health personas.
 *
 * Adding a new user:
 *   1. Add their email to ALLOWED_EMAILS in .env.local (controls sign-in)
 *   2. Add an entry in EMAIL_CONFIG below (controls what they see + who Gemini thinks they are)
 *
 * Adding a new module:
 *   1. Add the key to the MODULES tuple
 *   2. Add it to the roles that should see it in ROLE_MODULES
 *   3. Wire it up in the sidebar + dashboard home
 */

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

export const MODULES = ["ideas", "health"] as const;
export type Module = (typeof MODULES)[number];

// ---------------------------------------------------------------------------
// Roles + what each role can access
// ---------------------------------------------------------------------------

export const ROLES = ["admin", "member"] as const;
export type Role = (typeof ROLES)[number];

const ROLE_MODULES: Record<Role, readonly Module[]> = {
  admin:  ["ideas", "health"],
  member: ["health"],
};

// ---------------------------------------------------------------------------
// Health personas
// Each persona ID maps to a markdown file at scripts/personas/<id>.md
// That file becomes the system-prompt context for Gemini coaching.
// ---------------------------------------------------------------------------

export const HEALTH_PERSONAS = [
  "fintech-athlete",
  "natural-bodybuilder",
  "early-pregnancy",
] as const;
export type HealthPersona = (typeof HEALTH_PERSONAS)[number];

// ---------------------------------------------------------------------------
// Per-email config
// Add every allowlisted email here. Unknown emails default to "member" role
// with the "fintech-athlete" persona (safe fallback for dev).
// ---------------------------------------------------------------------------

interface UserConfig {
  role: Role;
  displayName: string;
  persona: HealthPersona;
}

const EMAIL_CONFIG: Record<string, UserConfig> = {
  "qa.devadutta@gmail.com": {
    role: "admin",
    displayName: "Devadutta",
    persona: "fintech-athlete",
  },
  "talk2devdmohapatra@gmail.com": {
    role: "admin",
    displayName: "Devadutta",
    persona: "fintech-athlete",
  },
  "pritychoudhary2422@gmail.com": {
    role: "member",
    displayName: "Prity",
    persona: "early-pregnancy",
  },
};

const FALLBACK_CONFIG: UserConfig = {
  role: "member",
  displayName: "Guest",
  persona: "fintech-athlete",
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export function getUserConfig(email: string | null | undefined): UserConfig {
  return EMAIL_CONFIG[email?.toLowerCase() ?? ""] ?? FALLBACK_CONFIG;
}

export function getRole(email: string | null | undefined): Role {
  return getUserConfig(email).role;
}

export function getPersona(email: string | null | undefined): HealthPersona {
  return getUserConfig(email).persona;
}

export function getDisplayName(email: string | null | undefined): string {
  return getUserConfig(email).displayName;
}

/** Returns the list of modules this email is allowed to access. */
export function getAllowedModules(email: string | null | undefined): readonly Module[] {
  return ROLE_MODULES[getRole(email)];
}

/** Returns true if this email can access the given module. */
export function canAccess(email: string | null | undefined, module: Module): boolean {
  return (getAllowedModules(email) as readonly string[]).includes(module);
}

/** Returns true if this email has the admin role. */
export function isAdmin(email: string | null | undefined): boolean {
  return getRole(email) === "admin";
}
