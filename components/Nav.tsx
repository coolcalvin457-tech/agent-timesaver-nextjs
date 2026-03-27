// ─── Nav (Server Component) ──────────────────────────────────────────────────
//
// Reads the paa_name cookie on the server and passes it to NavClient so
// the first render already knows whether to show "Sign In" or the user's name.
// This eliminates the auth button blink on every page load.

import { cookies } from "next/headers";
import NavClient from "./NavClient";

export default async function Nav() {
  const cookieStore = await cookies();
  const nameCookie = cookieStore.get("paa_name");
  const initialName = nameCookie?.value || null;

  return <NavClient initialName={initialName} />;
}
