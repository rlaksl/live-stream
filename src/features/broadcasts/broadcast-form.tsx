"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BroadcastFormState } from "./actions";

type Props = {
  action: (state: BroadcastFormState, formData: FormData) => Promise<BroadcastFormState>;
  defaultValues?: { title: string; description: string };
  submitLabel: string;
};

export function BroadcastForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">제목</Label>
        <Input id="title" name="title" required maxLength={100} defaultValue={defaultValues?.title} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">설명 (선택)</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={1000}
          defaultValue={defaultValues?.description}
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
