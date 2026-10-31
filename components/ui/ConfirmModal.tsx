"use client";

import { useState, type ReactNode } from "react";
import { Modal } from "./Modal";
import { Button, Field, Textarea } from "./primitives";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "primary",
  note,
  loading,
  confirmDisabled,
  onClose,
  onConfirm,
  children,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  tone?: "primary" | "danger" | "success";
  /** Show a note box; `required` forces a non-empty value. */
  note?: { label: string; placeholder?: string; required?: boolean; hint?: string };
  loading?: boolean;
  confirmDisabled?: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  children?: ReactNode;
}) {
  const [value, setValue] = useState("");

  const close = () => {
    setValue("");
    onClose();
  };

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={close}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={tone}
            loading={loading}
            disabled={confirmDisabled || Boolean(note?.required && !value.trim())}
            onClick={() => onConfirm(value.trim())}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {note && (
        <Field label={note.label} hint={note.hint}>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={note.placeholder}
          />
        </Field>
      )}
    </Modal>
  );
}
