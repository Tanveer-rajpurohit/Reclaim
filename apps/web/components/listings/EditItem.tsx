"use client";
import { Button, Input } from "@/components/ui/Controls";
import { useState, type FormEvent } from "react";
import { useBoard } from "@/components/marketplace/Store";
import type { EditItemProps } from "@/types/listings/type";
export default function EditItem({ item, close }: EditItemProps) {
  const { run } = useBoard();
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await run({ type: "edit", itemId: item.id, name, price })) close();
  }
  return (
    <form
      className="board-form grid gap-6 listing-edit mt-6 max-w-lg"
      onSubmit={submit}
    >
      <label className="grid gap-2 text-sm leading-relaxed text-ink">
        Item name
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={3}
          maxLength={80}
        />
      </label>
      <label className="grid gap-2 text-sm leading-relaxed text-ink">
        Price (₹)
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          required
          min={0}
          max={1_000_000}
        />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" type="submit">
          Save changes
        </Button>
        <Button variant="secondary" type="button" onClick={close}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
