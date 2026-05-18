interface FieldErrorProps {
  id?: string;
  message: string | null;
}

/**
 * Single-line error message rendered under a form field. Renders `null` when
 * no message is present so the surrounding layout doesn't shift.
 */
export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm font-medium text-[#E53935]">
      {message}
    </p>
  );
}
