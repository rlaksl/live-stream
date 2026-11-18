"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BroadcastFormState } from "./actions";
import { isoToKstInput } from "./schedule";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "./types";

type Props = {
  action: (state: BroadcastFormState, formData: FormData) => Promise<BroadcastFormState>;
  defaultValues?: { title: string; description: string; category: Category; scheduled_at: string | null };
  submitLabel: string;
};

/** 입력칸 공통 모양: 시안의 "방송 정보" 패널(4px, 어두운 바탕, 포커스 시 주황 테두리) */
export const fieldClass =
  "w-full rounded-sm border border-input bg-background px-3.5 py-3 text-[15px] outline-none focus-visible:border-primary";

/** 방송 등록·수정 폼. 송출 화면의 "방송 정보" 패널과 같은 모양이라 두 화면이 이어져 보인다. */
export function BroadcastForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-[18px] rounded-sm border bg-card p-6">
      <h2 className="text-lg font-bold">방송 정보</h2>
      <Field label="제목" htmlFor="title">
        <input
          id="title"
          name="title"
          required
          maxLength={100}
          defaultValue={defaultValues?.title}
          className={fieldClass}
        />
      </Field>
      <Field label="카테고리" htmlFor="category">
        <select id="category" name="category" defaultValue={defaultValues?.category ?? "talk"} className={fieldClass}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="예정 시간 (선택, 한국 시간 · 편성표에 표시)" htmlFor="scheduled_at">
        <input
          id="scheduled_at"
          name="scheduled_at"
          type="datetime-local"
          defaultValue={isoToKstInput(defaultValues?.scheduled_at ?? null)}
          className={cn(fieldClass, "[color-scheme:dark]")}
        />
      </Field>
      <Field label="설명 (선택)" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={defaultValues?.description}
          className={fieldClass}
        />
      </Field>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="mt-2 h-auto py-4 text-[17px] font-bold">
        {submitLabel}
      </Button>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm text-[#d4d4d8]">
        {label}
      </label>
      {children}
    </div>
  );
}
