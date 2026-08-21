"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;

  if (!email || !password || !displayName?.trim()) {
    return { error: "All fields are required." };
  }

  // 1. Create the auth user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  const userId = signUpData.user?.id;
  if (!userId) {
    return { error: "Signup succeeded but user ID was missing. Please try signing in." };
  }

  // 2. Write the display name into the profiles table.
  //    upsert handles the edge case where the row already exists
  //    (e.g. user signs up twice after disabling email confirmation).
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, display_name: displayName.trim() });

  if (profileError) {
    // Auth user was created — don't leave them stuck. Return a soft error
    // that lets them sign in; their display name can be set later.
    console.error("profiles upsert failed:", profileError.message);
    return { error: "Account created but display name could not be saved. Please sign in and try again." };
  }

  revalidatePath("/");
  return { success: true };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

// NOTE: This server action is dead code. Sign out is now handled client-side
// in app/page.tsx so that the Supabase browser client can immediately fire
// its onAuthStateChange event and update the UI context without a hard refresh.
/*
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}
*/
