"use client";

import { useActionState } from "react";
import { addProfileAction, type AddProfileState } from "./actions";

const initial: AddProfileState = {};

type AddProfileFormProps = {
  submitLabel?: string;
};

export function AddProfileForm({
  submitLabel = "保存档案",
}: AddProfileFormProps) {
  const [state, action, pending] = useActionState(addProfileAction, initial);

  return (
    <form action={action} className="mt-4 flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm">
        显示名称
        <input
          name="displayName"
          required
          maxLength={40}
          placeholder="例如：小明 / 本人"
          className="hub-field"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        出生日期
        <input
          name="birthDate"
          type="date"
          required
          className="hub-field"
        />
      </label>
      {state.error ? (
        <p role="alert" className="hub-alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="hub-cta">
        {pending ? "保存中…" : submitLabel}
      </button>
    </form>
  );
}
