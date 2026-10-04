// The card shown on the start page – rendered once at build time into public/showcase.html.
import { EXAMPLES, exampleCard } from "../../src/lib/examples";
import { renderCardHTML } from "../../src/lib/render";

export const SHOWCASE_ID = "oma";

export function showcaseHTML(): string {
  const example = EXAMPLES.find((e) => e.id === SHOWCASE_ID) ?? EXAMPLES[0];
  return renderCardHTML(exampleCard(example), { reactionMode: "showcase" });
}
