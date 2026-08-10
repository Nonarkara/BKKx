import { permanentRedirect } from "next/navigation";

// The register was shipped at /heritage before it became the front door.
// Keep the URL working rather than stranding anyone who saved it.
export default function HeritageRedirect(): never {
  permanentRedirect("/");
}
