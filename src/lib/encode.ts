import pako from "pako";
import { fromByteArray, toByteArray } from "base64-js";

export const DEFAULT_BOOKMARK_NAME = "Bookmark name";
export const DEFAULT_BOOKMARK_CODE = "// Enter code here\n";

export function encode(name: string, code: string) {
  if (name === DEFAULT_BOOKMARK_NAME && code === DEFAULT_BOOKMARK_CODE) {
    return "";
  }
  const data = JSON.stringify({ name, code });
  const asByteArray = new TextEncoder().encode(data);
  const deflated = pako.deflate(asByteArray, { level: 9 });
  return fromByteArray(deflated);
}

export function decode(hash: string) {
  if (hash.startsWith("#")) {
    hash = hash.substring(1);
  }
  const deflated = toByteArray(hash);
  const inflated = pako.inflate(deflated);
  const text = new TextDecoder().decode(inflated);
  return JSON.parse(text);
}
