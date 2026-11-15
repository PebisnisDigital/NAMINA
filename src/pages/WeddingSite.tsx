import { useMemo } from "react";
import { ViniCinematic } from "../components/ViniCinematic";
import { createWeddingTemplate } from "../static/weddingTemplate";
import { prepareSite, resolveMedia } from "../static/sites";

/** Wedding theme keeps /vini's cinematic positioning and five-section navigation. */
export function WeddingSite() {
  const site = useMemo(() => prepareSite(createWeddingTemplate("contoh-wedding")), []);
  return <ViniCinematic presentation="wedding" content={site.content} assetUrls={resolveMedia(site)} />;
}
