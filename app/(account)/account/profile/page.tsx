"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, CardContent, Input, Label, Skeleton, Spinner, TextField, toast } from "@heroui/react";
import { BackLink } from "@/components/account/BackLink";

type ProfileForm = { name: string; email: string; phone: string };

// FR-024: редактирование профиля (имя/email/телефон).
export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>({ name: "", email: "", phone: "" });
  const [status, setStatus] = useState<"loading" | "idle" | "saving">("loading");

  useEffect(() => {
    fetch("/api/account/profile")
      .then((response) => response.json())
      .then((data: ProfileForm) => {
        setForm({ name: data.name ?? "", email: data.email ?? "", phone: data.phone ?? "" });
        setStatus("idle");
      });
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("saving");

    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setStatus("idle");

    if (response.status === 409) {
      toast.danger("Користувач вже зареєстрований");
      return;
    }
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      toast.danger(data?.error?.message ?? "Не вдалося зберегти зміни");
      return;
    }

    toast.success("Зміни збережено");
  };

  if (status === "loading")
    return (
      <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
        <Skeleton className="h-5 w-24 rounded" />
        <Card className="mt-4">
          <CardContent className="grid gap-4 p-6">
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </CardContent>
        </Card>
      </main>
    );

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <BackLink href="/account">Кабінет</BackLink>
      <Card className="mt-4">
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold text-foreground">Профіль</h1>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <TextField
              value={form.name}
              onChange={(name) => setForm({ ...form, name })}
              isRequired
            >
              <Label>Імʼя</Label>
              <Input />
            </TextField>
            <TextField
              value={form.email}
              onChange={(email) => setForm({ ...form, email })}
              type="email"
            >
              <Label>Email</Label>
              <Input />
            </TextField>
            <TextField
              value={form.phone}
              onChange={(phone) => setForm({ ...form, phone })}
              type="tel"
            >
              <Label>Телефон</Label>
              <Input />
            </TextField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isPending={status === "saving"}
              className="min-h-12 active:scale-[0.98]"
            >
              {status === "saving" && <Spinner size="sm" color="current" />}
              Зберегти
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
