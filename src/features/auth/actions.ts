"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient, createAuthClient } from "@/lib/supabase";
import { TEST_ACCOUNTS, type TestAccountKey } from "./test-accounts";

export type AuthFormState = { error: string } | undefined;

const nicknameSchema = z
  .string()
  .trim()
  .min(2, "닉네임은 2~12자입니다.")
  .max(12, "닉네임은 2~12자입니다.");

const signUpSchema = z.object({
  email: z.email("이메일 형식이 아닙니다."),
  password: z.string().min(6, "비밀번호는 6자 이상입니다."),
  nickname: nicknameSchema,
});

const signInSchema = z.object({
  email: z.email("이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력하세요."),
});

export async function signUp(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const created = await createAccount(parsed.data);
  if (created.error) return created;

  await signInWithPassword(parsed.data.email, parsed.data.password);
  redirect(safeNext(formData));
}

export async function signIn(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await signInWithPassword(parsed.data.email, parsed.data.password);
  if (error) return { error: "이메일 또는 비밀번호가 맞지 않습니다." };
  redirect(safeNext(formData));
}

/** 테스트 계정으로 바로 로그인한다. 계정이 없으면(DB 초기화 후 등) 먼저 만든다. */
export async function signInAsTestAccount(key: TestAccountKey, next: string) {
  const account = TEST_ACCOUNTS[key];
  const password = process.env.TEST_ACCOUNT_PASSWORD!;

  let { error } = await signInWithPassword(account.email, password);
  if (error) {
    const created = await createAccount({ ...account, password });
    if (created.error) return created;
    ({ error } = await signInWithPassword(account.email, password));
    if (error) return { error: "테스트 계정 로그인에 실패했습니다." };
  }
  redirect(safeRedirect(next));
}

export async function signOut() {
  const auth = await createAuthClient();
  await auth.auth.signOut();
  redirect("/");
}

/** 인증 사용자와 프로필(닉네임)을 함께 만든다. 이메일 인증 없이 바로 쓸 수 있는 계정이다. */
async function createAccount(input: { email: string; password: string; nickname: string }) {
  const db = createAdminClient();

  const { data: taken } = await db
    .from("profiles")
    .select("id")
    .eq("nickname", input.nickname)
    .maybeSingle();
  if (taken) return { error: "이미 사용 중인 닉네임입니다." };

  const { data, error } = await db.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (error) {
    return {
      error: error.code === "email_exists" ? "이미 가입된 이메일입니다." : "회원가입에 실패했습니다.",
    };
  }

  const { error: profileError } = await db
    .from("profiles")
    .insert({ id: data.user.id, nickname: input.nickname });
  if (profileError) {
    // 닉네임을 동시에 가입한 경우 등: 만든 계정을 지우고 다시 시도하게 한다
    await db.auth.admin.deleteUser(data.user.id);
    return { error: "이미 사용 중인 닉네임입니다." };
  }
  return { error: undefined };
}

async function signInWithPassword(email: string, password: string) {
  const auth = await createAuthClient();
  return auth.auth.signInWithPassword({ email, password });
}

function safeNext(formData: FormData) {
  return safeRedirect(String(formData.get("next") ?? "/"));
}

/** 외부 주소로의 리다이렉트를 막는다. */
function safeRedirect(path: string) {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}
