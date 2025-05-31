"use client";

import { useAtom } from "jotai";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";

import { LoginForm } from "~/components/login-form";
import { loginDialogOpenAtom } from "~/lib/atoms";

export function LoginDialog() {
  const [isOpen, setIsOpen] = useAtom(loginDialogOpenAtom);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>Welcome back</DialogTitle>
      </DialogHeader>
      <DialogContent className="max-w-md">
        <LoginForm onSuccess={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
