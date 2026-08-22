"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Input, Label, NumberField, Spinner, TextField, toast } from "@heroui/react";

// Ціна/кількість — числа (NaN = ще не введено): NumberField працює з number,
// а перед відправкою значення перевіряються без повторного парсингу рядків.
type Item = { name: string; price: number; quantity: number };

const EMPTY_ITEM: Item = { name: "", price: Number.NaN, quantity: 1 };

export function NewReceiptForm() {
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<Item[]>([{ ...EMPTY_ITEM }]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateItem = (index: number, patch: Partial<Item>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // Валідація на межі перед мутацією: сервер теж перевіряє, але зрозумілу
    // помилку краще показати одразу, не чекаючи відповіді API.
    if (!phone.trim()) {
      setError("Вкажіть телефон гостя");
      return;
    }
    const hasInvalidItem = items.some(
      (item) => !item.name.trim() || !Number.isFinite(item.price) || item.price < 0 || !(item.quantity >= 1),
    );
    if (hasInvalidItem) {
      setError("Заповніть назву, ціну та кількість для кожної позиції");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const response = await fetch("/api/admin/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        items: items.map((item) => ({
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
        })),
      }),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      toast.danger(data?.error?.message ?? "Не вдалося внести чек");
      return;
    }

    const data = (await response.json()) as { totalAmount: number; bonusAmount: number; percentage: number };
    toast.success(`Чек на ${data.totalAmount} ₴ внесено`, {
      description: `Нараховано бонусів: ${data.bonusAmount} ₴ (${data.percentage}%)`,
    });
    setPhone("");
    setItems([{ ...EMPTY_ITEM }]);
  };

  return (
    <Card className="max-w-2xl">
      <Card.Content>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <TextField value={phone} onChange={setPhone} type="tel" isRequired name="phone" autoComplete="off">
            <Label>Телефон гостя</Label>
            <Input placeholder="+380..." />
          </TextField>

          <div className="grid gap-3">
            <p className="text-sm font-medium text-foreground">Позиції чека</p>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_8rem_7rem_auto] sm:items-end">
                <TextField
                  value={item.name}
                  onChange={(value) => updateItem(index, { name: value })}
                  isRequired
                  aria-label={`Назва позиції ${index + 1}`}
                >
                  <Label>Назва</Label>
                  <Input placeholder="Назва позиції" />
                </TextField>
                <NumberField
                  value={item.price}
                  onChange={(value) => updateItem(index, { price: value })}
                  minValue={0}
                  step={0.01}
                  isRequired
                  formatOptions={{ maximumFractionDigits: 2 }}
                  aria-label={`Ціна позиції ${index + 1}`}
                >
                  <Label>Ціна, ₴</Label>
                  <NumberField.Group>
                    <NumberField.Input />
                  </NumberField.Group>
                </NumberField>
                <NumberField
                  value={item.quantity}
                  onChange={(value) => updateItem(index, { quantity: value })}
                  minValue={1}
                  step={1}
                  isRequired
                  aria-label={`Кількість позиції ${index + 1}`}
                >
                  <Label>К-сть</Label>
                  <NumberField.Group>
                    <NumberField.DecrementButton />
                    <NumberField.Input />
                    <NumberField.IncrementButton />
                  </NumberField.Group>
                </NumberField>
                <Button
                  type="button"
                  variant="ghost"
                  isDisabled={items.length === 1}
                  onPress={() => removeItem(index)}
                  aria-label={`Прибрати позицію ${index + 1}`}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onPress={addItem} className="justify-self-start">
              + Додати позицію
            </Button>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" variant="primary" isPending={isSubmitting} className="justify-self-start">
            {isSubmitting && <Spinner size="sm" color="current" />}
            Зберегти чек
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}
