import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AtlasView } from "./AtlasView";
import { worlds, type World } from "../../walkthrough-data";

type Params = { district: string };

type Props = { params: Promise<Params> };

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
      title: `${world.name} — 3D atlas · BKKx`,
      description: `Walk ${world.name} in a 3D browser atlas before downloading the Minecraft world.`,
      url: `/atlas/${world.id}`,
    },
  };
}

export default async function AtlasPage({ params }: Props) {
  const { district } = await params;
  const world = resolveWorld(district);
  if (!world) {
    notFound();
  }
  return <AtlasView world={world} />;
}
