import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AtlasView } from "./AtlasView";
import { worlds, type World } from "../../walkthrough-data";

type Params = { district: string };

type SearchParams = { embed?: string; at?: string };

type Props = {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
};

function parseInitialView(value: string | undefined) {
  if (!value) return undefined;
  // Three parts (lng,lat,zoom) or five (…,pitch,bearing). The two-part-longer
  // form is what "Cite this view" copies, so a pasted link reproduces the
  // full camera pose; the three-part form stays valid for every link already
  // in the wild and for the homepage quarter chips.
  const parts = value.split(",").map(Number);
  if (parts.length !== 3 && parts.length !== 5) return undefined;
  const [lng, lat, zoom, pitch, bearing] = parts;
  if (
    !Number.isFinite(lng) ||
    !Number.isFinite(lat) ||
    !Number.isFinite(zoom) ||
    lng < -180 ||
    lng > 180 ||
    lat < -90 ||
    lat > 90 ||
    zoom < 0 ||
    zoom > 22
  ) {
    return undefined;
  }
  const view: {
    center: [number, number];
    zoom: number;
    pitch?: number;
    bearing?: number;
  } = { center: [lng, lat], zoom };
  if (parts.length === 5) {
    if (!Number.isFinite(pitch) || pitch < 0 || pitch > 85) return undefined;
    if (!Number.isFinite(bearing) || bearing < -360 || bearing > 360) return undefined;
    view.pitch = pitch;
    view.bearing = bearing;
  }
  return view;
}

export function generateStaticParams(): Params[] {
  return worlds.map((world) => ({ district: world.id }));
}

function resolveWorld(district: string): World | undefined {
  return worlds.find((world) => world.id === district);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  const world = resolveWorld(district);
  if (!world) {
    return { title: "Atlas not found" };
  }
  return {
    title: `${world.name} — 3D atlas`,
    description: `Walk ${world.name} (${world.thai}) in a 3D browser atlas. ${world.description}`,
    alternates: { canonical: `/atlas/${world.id}` },
    openGraph: {
      title: `${world.name} — 3D atlas · BKKxC(ulture)`,
      description: `Walk ${world.name} in a 3D browser atlas before downloading the Minecraft world.`,
      url: `/atlas/${world.id}`,
    },
  };
}

export default async function AtlasPage({ params, searchParams }: Props) {
  const { district } = await params;
  const query = await searchParams;
  const world = resolveWorld(district);
  if (!world) {
    notFound();
  }
  return (
    <AtlasView
      world={world}
      embedded={query.embed === "1"}
      initialView={parseInitialView(query.at)}
    />
  );
}
