export function tarEntry(name: string, bytes: Uint8Array): Uint8Array[] {
  if (
    !/^[a-zA-Z0-9_./-]{1,255}$/.test(name) ||
    name.startsWith("/") ||
    name.split("/").includes("..")
  )
    throw new Error("Invalid archive path.");
  const split = name.lastIndexOf("/");
  const prefix = name.length > 100 ? name.slice(0, split) : "";
  const filename = name.length > 100 ? name.slice(split + 1) : name;
  if (filename.length > 100 || prefix.length > 155)
    throw new Error("Archive path is too long.");
  const header = new Uint8Array(512);
  const encoder = new TextEncoder();
  const write = (value: string, offset: number) =>
    header.set(encoder.encode(value), offset);
  const octal = (value: number, width: number) =>
    value.toString(8).padStart(width - 1, "0") + "\0";
  write(filename, 0);
  write(prefix, 345);
  write("0000600\0", 100);
  write("0000000\0", 108);
  write("0000000\0", 116);
  write(octal(bytes.length, 12), 124);
  write(octal(Math.floor(Date.now() / 1000), 12), 136);
  header.fill(32, 148, 156);
  write("0", 156);
  write("ustar\0", 257);
  write("00", 263);
  write(
    header
      .reduce((n, b) => n + b, 0)
      .toString(8)
      .padStart(6, "0") + "\0 ",
    148,
  );
  return [header, bytes, new Uint8Array((512 - (bytes.length % 512)) % 512)];
}
