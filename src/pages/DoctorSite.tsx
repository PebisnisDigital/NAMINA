import { useMemo } from "react";
import { ViniCinematic } from "../components/ViniCinematic";
import { createDoctorTemplate } from "../static/doctorTemplate";
import { prepareSite, resolveMedia } from "../static/sites";

/** The doctor's site shares the exact same cinematic renderer and responsive layout as /vini. */
export function DoctorSite() {
  const site = useMemo(() => prepareSite(createDoctorTemplate("contoh-dokter")), []);
  return <ViniCinematic content={site.content} assetUrls={resolveMedia(site)} presentation="doctor" />;
}
