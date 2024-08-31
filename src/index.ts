import { Elements, Manager } from "./lib/manager";

const elements: Elements = {
  code: document.querySelector("#code") as HTMLTextAreaElement,
  name: document.querySelector("#bookmark-name") as HTMLInputElement,
  result: document.querySelector("#result") as HTMLTextAreaElement,
  bookmarklet: document.querySelector("#bookmarklet") as HTMLAnchorElement,
  bookmarkletContainer: document.querySelector(
    "#bookmarklet-container",
  ) as HTMLDivElement,
  copy: document.querySelector("#copy") as HTMLButtonElement,
  help: document.querySelector("#help") as HTMLSpanElement,
  shareFull: document.querySelector("#share-full") as HTMLInputElement,
  shareFullButton: document.querySelector(
    "#share-full-button",
  ) as HTMLButtonElement,
  isGdCreateRow: document.querySelector("#is-gd-create-row") as HTMLDivElement,
  isGdCreateButton: document.querySelector(
    "#is-gd-create",
  ) as HTMLButtonElement,
  isGdRow: document.querySelector("#is-gd-row") as HTMLDivElement,
  isGdInput: document.querySelector("#share-short") as HTMLInputElement,
  isGdCopyButton: document.querySelector(
    "#share-short-button",
  ) as HTMLButtonElement,
};

const manager = new Manager(elements, "/esbuild.wasm");
manager.start();
