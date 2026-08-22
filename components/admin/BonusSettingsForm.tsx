"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, Label, NumberField, Skeleton, Spinner, toast } from "@heroui/react";

const MIN_PERCENTAGE = 0;
const MAX_PERCENTAGE = 100;

// Форма ставки бонусів: значення вантажиться з API після монтування, тому на час
// завантаження показуємо Skeleton за формою майбутнього контенту, а не голий текст.
export function BonusSettingsForm() {
  const [percentage, setPercentage] = useState<number>(Number.NaN);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/bonus-settings")
      .then((response) => response.json())
      .then((data: { percentage: number }) => {
        setPercentage(data.percentage);
        setIsLoading(false);
      });
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // Валідація на межі перед мутацією: NumberField не дасть ввести текст,
    // але порожнє значення (NaN) чи вихід за межі перевіряємо самі.
    if (!Number.isFinite(percentage) || percentage < MIN_PERCENTAGE || percentage > MAX_PERCENTAGE) {
      setFieldError(`Вкажіть відсоток від ${MIN_PERCENTAGE} до ${MAX_PERCENTAGE}`);
      return;
    }

    setFieldError(null);
    setIsSaving(true);
    const response = await fetch("/api/admin/bonus-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percentage: Number(percentage) }),
    });
    setIsSaving(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      toast.danger(data?.error?.message ?? "Не вдалося зберегти ставку бонусів");
      return;
    }

    toast.success("Ставку бонусів збережено");
  };

  if (isLoading) {
    return (
      <Card className="max-w-md">
        <Card.Content className="grid gap-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-28" />
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card className="max-w-md">
      <Card.Content>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <NumberField
            value={percentage}
            onChange={setPercentage}
            minValue={MIN_PERCENTAGE}
            maxValue={MAX_PERCENTAGE}
            step={0.1}
            isRequired
            formatOptions={{ maximumFractionDigits: 1 }}
          >
            <Label>Відсоток від суми чека</Label>
            <NumberField.Group>
              <NumberField.DecrementButton />
              <NumberField.Input />
              <NumberField.IncrementButton />
            </NumberField.Group>
          </NumberField>
          {fieldError && <p className="text-sm text-danger">{fieldError}</p>}
          <p className="text-sm text-muted">Стільки бонусів у гривнях нараховується гостю з кожного внесеного чека.</p>
          <Button type="submit" variant="primary" isPending={isSaving} className="justify-self-start">
            {isSaving && <Spinner size="sm" color="current" />}
            Зберегти
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}
