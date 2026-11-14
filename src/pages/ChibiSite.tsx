import { useMemo } from "react";
import { ViniCinematic } from "../components/ViniCinematic";
import { createChibiTemplate } from "../static/chibiTemplate";
import { prepareSite, resolveMedia } from "../static/sites";

/** Chibi is a visual skin over the original NAMINA cinematic layout. */
export function ChibiSite() {
  const site = useMemo(() => prepareSite(createChibiTemplate("contoh-chibi")), []);
  return <ViniCinematic presentation="chibi" content={site.content} assetUrls={resolveMedia(site)} />;
}
