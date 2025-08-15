import { ChangeEvent, useState } from 'react';

export function useForm<T extends Record<string, string>>(initial: T) {
  const [values, setValues] = useState<T>(initial);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function reset(next?: Partial<T>) {
    setValues((prev) => ({ ...initial, ...next }));
  }

  return { values, onChange, setValues, reset };
}
