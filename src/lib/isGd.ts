export async function createLinkMock(long: string) {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return "https://is.gd/iKpnPV";
}

export async function createLink(long: string) {
  try {
    const url = new URL("https://is.gd/create.php");
    const params = new URLSearchParams();
    params.set("format", "json");
    params.set("url", long);
    url.search = params.toString();

    const response = await fetch(url);
    const json = await response.json();
    return json.shorturl ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
}
