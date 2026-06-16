"use client";

import { useState, useTransition } from "react";
import { toggleModuleAction } from "@/actions/modules";
import type { SwitchableModuleKey } from "@/lib/modules";

export function ModuleToggle({
  moduleKey,
  enabled,
}: {
  moduleKey: SwitchableModuleKey;
  enabled: boolean;
}) {
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      await toggleModuleAction(moduleKey, next);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={on}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        on ? "bg-[var(--primary)]" : "bg-slate-300"
      } disabled:opacity-60`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
