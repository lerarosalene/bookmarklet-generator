import esbuild from "esbuild-wasm";
import debounce from "lodash/debounce";
import defer from "lodash/defer";
import {
  DEFAULT_BOOKMARK_CODE,
  DEFAULT_BOOKMARK_NAME,
  decode,
  encode,
} from "./encode";
import { createLink, createLinkMock } from "./isGd";

export interface Elements {
  code: HTMLTextAreaElement;
  name: HTMLInputElement;
  result: HTMLTextAreaElement;
  bookmarklet: HTMLAnchorElement;
  bookmarkletContainer: HTMLDivElement;
  copy: HTMLButtonElement;
  help: HTMLSpanElement;
  shareFull: HTMLInputElement;
  shareFullButton: HTMLButtonElement;
  isGdCreateRow: HTMLDivElement;
  isGdCreateButton: HTMLButtonElement;
  isGdRow: HTMLDivElement;
  isGdInput: HTMLInputElement;
  isGdCopyButton: HTMLButtonElement;
}

async function compile(
  source: string,
): Promise<{ code: string; error: null | string }> {
  let code = "",
    error = null;
  try {
    let result = await esbuild.transform(source, {
      minify: true,
      format: "iife",
    });
    code = result.code;
    return { code, error };
  } catch (error) {
    if (error instanceof Error) {
      return { code, error: error.message };
    }
    return { code, error: String(error) };
  }
}

function isSelectable(
  node: EventTarget | Node | null,
): node is HTMLTextAreaElement | HTMLInputElement {
  return (
    node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement
  );
}

function isLocalHost() {
  return new URL(location.href).hostname === "localhost";
}

export class Manager {
  private elements: Elements;
  private esbuildWasmURL: string;
  private esbuildReadyPromise: Promise<void> | null = null;
  private esbuildReadyCallback: Function | null = null;
  private esbuildErrorCallback: Function | null = null;
  private source = "";
  private code = "";
  private error: string | null = null;
  private name = "";
  private codeVersion = 0;

  public constructor(elements: Elements, esbuildWasmURL: string) {
    this.elements = elements;
    this.esbuildWasmURL = esbuildWasmURL;
    this.esbuildReadyPromise = new Promise((resolve, reject) => {
      this.esbuildReadyCallback = resolve;
      this.esbuildErrorCallback = reject;
    });
  }

  private setDefaultValues() {
    this.elements.name.value = DEFAULT_BOOKMARK_NAME;
    this.elements.code.value = DEFAULT_BOOKMARK_CODE;
    this.name = DEFAULT_BOOKMARK_NAME;
    this.codeChanged();
  }

  private loadFromHash() {
    if (location.hash.length > 1) {
      try {
        const { code, name } = decode(location.hash);
        this.elements.code.value = code;
        this.elements.name.value = name;
        this.name = name;
        this.codeChanged();
      } catch (error) {
        console.error("Malformed hash.");
        this.setDefaultValues();
      }
    } else {
      this.setDefaultValues();
    }
  }

  public start() {
    this.loadFromHash();

    fetch(this.esbuildWasmURL)
      .then(response => response.arrayBuffer())
      .then(data => new WebAssembly.Module(data))
      .then(module => esbuild.initialize({ wasmModule: module }))
      .then(() => this.esbuildReadyCallback?.())
      .catch(error => this.esbuildErrorCallback?.(error));

    this.elements.code.addEventListener(
      "input",
      debounce(this.codeChanged, 500),
    );

    this.elements.name.addEventListener("input", this.nameChanged);
    this.name = this.elements.name.value;
    this.codeChanged();

    this.elements.copy.addEventListener(
      "click",
      this.createCopyHandler(this.elements.result),
    );
    this.elements.shareFullButton.addEventListener(
      "click",
      this.createCopyHandler(this.elements.shareFull),
    );
    this.elements.result.addEventListener("focus", this.focusHandler);
    this.elements.shareFull.addEventListener("focus", this.focusHandler);
    this.elements.isGdInput.addEventListener("focus", this.focusHandler);
    this.elements.isGdCopyButton.addEventListener(
      "click",
      this.createCopyHandler(this.elements.isGdInput),
    );
    this.elements.isGdCreateButton.addEventListener(
      "click",
      this.createIsGdLink,
    );
  }

  private createIsGdLink = async () => {
    this.elements.isGdCreateButton.disabled = true;
    const long = location.href;
    const short = isLocalHost()
      ? await createLinkMock(long)
      : await createLink(long);

    defer(() => {
      this.elements.isGdCreateButton.disabled = false;
    });

    if (!short) {
      return;
    }

    if (long === location.href) {
      this.elements.isGdCreateRow.classList.add("hidden-self");
      this.elements.isGdInput.value = short;
      this.elements.isGdRow.classList.remove("hidden-self");
    }
  };

  private focusHandler = (e: Event) => {
    const current = e.currentTarget;
    if (!isSelectable(current)) {
      return;
    }
    current.select();
  };

  private createCopyHandler =
    (node: HTMLTextAreaElement | HTMLInputElement) => () => {
      const selection = window.getSelection();
      if (!selection) {
        return;
      }
      node.focus();
      node.select();
      document.execCommand("copy");
      setTimeout(() => {
        selection.removeAllRanges();
        node.blur();
      }, 100);
    };

  private codeChanged = async () => {
    let version = this.codeVersion + 1;
    let source = this.elements.code.value;
    await this.esbuildReadyPromise;
    const { code, error } = await compile(source);

    if (version > this.codeVersion) {
      this.code = code;
      this.error = error;
      this.source = source;
      this.codeVersion = version;
      this.updateHash();
      this.updateResults();
    }
  };

  private nameChanged = () => {
    this.name = this.elements.name.value;
    this.updateHash();
    this.updateResults();
  };

  private updateHash() {
    location.hash = encode(this.name, this.source);
    this.elements.shareFull.value = location.href;
    this.elements.isGdCreateRow.classList.remove("hidden-self");
    this.elements.isGdRow.classList.add("hidden-self");
    this.elements.isGdInput.value = "";
  }

  private updateResults() {
    this.elements.bookmarkletContainer.classList.remove("hidden");
    this.elements.result.value = this.error ?? this.code;
    this.elements.result.style.height = "0";
    this.elements.result.style.height = `${Math.min(this.elements.result.scrollHeight, 300)}px`;
    this.elements.result.classList.toggle("result-error", Boolean(this.error));
    this.elements.bookmarklet.href = `javascript:${encodeURIComponent(this.code)}`;
    this.elements.bookmarklet.textContent = this.name;
    this.elements.bookmarklet.classList.toggle(
      "link-error",
      Boolean(this.error),
    );
    this.elements.help.classList.toggle("hidden-self", Boolean(this.error));
    this.elements.bookmarklet.draggable = this.error ? false : true;
  }
}
