"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signInAsTestAccount, signUp } from "./actions";
import { TEST_ACCOUNTS, type TestAccountKey } from "./test-accounts";

type Props = { mode: "login" | "signup"; next: string };

export function AuthForm({ mode, next }: Props) {
  const [state, formAction, pending] = useActionState(mode === "login" ? signIn : signUp, undefined);

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">{mode === "login" ? "로그인" : "회원가입"}</h1>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="이메일" name="email" type="email" autoComplete="email" />
        <Field
          label="비밀번호"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        {mode === "signup" && <Field label="닉네임 (2~12자)" name="nickname" autoComplete="nickname" />}
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {mode === "login" ? "로그인" : "가입하고 시작하기"}
        </Button>
      </form>

      {mode === "login" ? (
        <>
          <TestAccountButtons next={next} />
          <p className="text-center text-sm text-muted-foreground">
            계정이 없나요?{" "}
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-primary underline">
              회원가입
            </Link>
          </p>
        </>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          이미 계정이 있나요?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-primary underline">
            로그인
          </Link>
        </p>
      )}
    </div>
  );
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<"input">) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required {...props} />
    </div>
  );
}

function TestAccountButtons({ next }: { next: string }) {
  const [pending, startTransition] = useTransition();

  function login(key: TestAccountKey) {
    startTransition(async () => {
      await signInAsTestAccount(key, next);
    });
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-primary/40 p-4">
      <p className="text-sm font-medium">평가용 테스트 계정으로 바로 로그인</p>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(TEST_ACCOUNTS) as TestAccountKey[]).map((key) => (
          <Button key={key} variant="outline" disabled={pending} onClick={() => login(key)}>
            {TEST_ACCOUNTS[key].nickname}
          </Button>
        ))}
      </div>
    </div>
  );
}
