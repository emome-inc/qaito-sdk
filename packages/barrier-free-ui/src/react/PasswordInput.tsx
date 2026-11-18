"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Input } from "./Input";

export function PasswordInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="bf-password">
      <Input type={show ? "text" : "password"} className={className} {...rest} />
      <button
        type="button"
        className="bf-password__toggle"
        aria-pressed={show}
        onClick={() => setShow((s) => !s)}
      >
        {show ? "隠す" : "表示"}
      </button>
    </div>
  );
}
