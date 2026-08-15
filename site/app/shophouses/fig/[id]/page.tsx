import type { Metadata } from "next";
import { Figure } from "../../figures";
import type { FigureId } from "../../../data/shophouse-essay";

// One figure alone on a white page, at a fixed width, so headless Chrome can
// screenshot it into a PNG for the Word manuscript. Not linked from anywhere
// and not indexed — this route exists for the export script.

export const metadata: Metadata = {
  title: "Figure export",
  robots: { index: false, follow: false },
};

export default async function FigureExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="shophouse-essay sh-figexport">
      <div className="sh-figexport-inner">
        <Figure id={id as FigureId} />
      </div>
    </div>
  );
}
