export function passwordInput(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 200)
    throw new Error("Enter a password of at most 200 characters.");
  return value;
}

export function text(
  value: unknown,
  label: string,
  max: number,
  required = false,
): string {
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) throw new Error(`${label} is required.`);
  if (result.length > max)
    throw new Error(`${label} must be ${max} characters or fewer.`);
  return result;
}

export function uuid(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new Error("Invalid record identifier.");
  return value;
}

export function date(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(`${value}T12:00:00Z`)) ||
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value ||
    value < "0001-01-01"
  )
    throw new Error("Choose a valid memory date.");
  return value;
}

export function memoryInput(input: Record<string, unknown>) {
  const memory_time = text(input.memory_time, "Time", 5);
  if (memory_time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(memory_time))
    throw new Error("Choose a valid time.");
  return {
    title: text(input.title, "Title", 200, true),
    memory_date: date(input.memory_date),
    memory_time: memory_time || null,
    description: text(input.description, "Reflection", 20000),
    mood: text(input.mood, "Mood", 60),
    place_id: input.place_id ? uuid(input.place_id) : null,
    favorite: input.favorite === true || input.favorite === "on",
  };
}

export function safeNext(value: string | null): string {
  if (
    !value ||
    !/^\/(home|timeline|memories|albums|stories|places|settings)(\/[^\\%?#]*)?(\?[^\\%]*)?$/.test(
      value,
    )
  )
    return "/home";
  return value;
}

export function uploadExtension(
  mime: string,
  bytes: Uint8Array,
  size: number,
): string {
  if (size <= 0 || size > 10 * 1024 * 1024)
    throw new Error("Each photo must be between 1 byte and 10 MB.");
  const prefix = (values: number[]) => values.every((n, i) => bytes[i] === n);
  if (mime === "image/jpeg" && prefix([255, 216, 255])) return "jpg";
  if (mime === "image/png" && prefix([137, 80, 78, 71, 13, 10, 26, 10]))
    return "png";
  if (
    mime === "image/webp" &&
    prefix([82, 73, 70, 70]) &&
    bytes[8] === 87 &&
    bytes[9] === 69 &&
    bytes[10] === 66 &&
    bytes[11] === 80
  )
    return "webp";
  throw new Error("Choose a valid JPEG, PNG or WebP image.");
}
