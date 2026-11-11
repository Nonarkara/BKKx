import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartView } from "../../PartView";
import { PARTS } from "../../../data/shophouse-parts";
import { ESSAY_META } from "../../../data/shophouse-essay";

export const dynamicParams = false;
export function generateStaticParams() {
  return PARTS.map((p) => ({ n: String(p.n) }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const part = PARTS[Number((await params).n) - 1];
  if (!part) return {};
  return {
    title: `${part.title} · ${ESSAY_META.title} · Shophouse Metropolis`,
    description: part.dek,
    alternates: { canonical: `/shophouses/read/${part.n}` },
  };
}

export default async function ReadPart({ params }: { params: Promise<{ n: string }> }) {
  const part = PARTS[Number((await params).n) - 1];
  if (!part) notFound();
  return <PartView part={part} />;
}
