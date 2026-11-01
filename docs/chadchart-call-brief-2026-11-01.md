# If Chadchart calls: what these systems can do for Bangkok

A call sheet, written 1 November 2026 from what is live today. Every number
below was read from the live API that evening; re-read them before the call,
they move.

## The 30-second answer (Thai, as spoken)

> ผมมีแผนที่กรุงเทพฯ แบบเปิด ที่รวมข้อมูลน้ำ ฝน ฝุ่น กล้อง และรายงานจาก Traffy
> ไว้ในจอเดียว ใช้บนมือถือได้ทันที ไม่ต้องติดตั้งอะไร ตอนนี้ระบบบอกได้ว่าคลองไหนน้ำใกล้ตลิ่ง
> แต่ยังบอกไม่ได้ว่าถนนไหนน้ำท่วมจริงและจะระบายได้เร็วแค่ไหน เพราะเรายังไม่มีข้อมูลท่อและเครื่องสูบน้ำ
> ผมขอทดลองแค่เขตเดียวก่อน คือวังทองหลาง แล้วจะส่งผลพร้อมค่าความคลาดเคลื่อนกลับให้ กทม. ทั้งหมด

## The one fact that makes the case

Tonight the atlas holds **215 street flood reports** (BMA DDS, Traffy Fondue,
iTIC), and **none of them can be confirmed** by a nearby sensor. That is not a
bug. Bangkok's ~240 live gauges measure canals against their banks, not water
on a street. Bangkok can see its canals, but it cannot yet see its streets.
Closing that gap is the offer.

## What exists today (live, free, no install)

| For BMA | Where | What it really is |
|---|---|---|
| Flood situation on one screen | atlas.nonarkara.org | Gauges judged by FloodDash, rain, radar, BMA canal bulletin, road reports, news. A heuristic watch indicator, **not a warning** (DDPM 1784 issues warnings) |
| Traffy × gauge cross-check | atlas.nonarkara.org/api/water/bkk/roads-xref | Every street report paired with the nearest gauge within 250 m. Says honestly when nothing confirms it |
| Camera wall | Atlas → Cameras | 51 iTIC road cameras plus 1,712 community/operator cameras within BKK + 30 km, each labelled with its source tier |
| Feed health | /api/water/bkk/sources-health | 43 upstream feeds with last-success time. Shows which government feed went quiet, and when |
| Heritage register, block by block | bkk.nonarkara.org | Rattanakosin and the old town in 3D, with quarter cards and sources. For conservation and tourism, not flood |
| Open API | atlas.nonarkara.org/api | 33 documented endpoints any BMA team or vendor can reuse |

## Three-minute demo on his phone

1. Open **atlas.nonarkara.org**. The flood verdict and the map are on the first screen.
2. Tap **Read full warning**: the reason, in Thai, with its sources.
3. Turn on **Cameras**, open one near a reported road. This is the "is it really flooded?" check a duty officer does by hand today.
4. Show **roads-xref**: 215 reports, 0 confirmed. Stop there. That gap is the conversation.
5. If there's time: **bkk.nonarkara.org**, tap a quarter number. Shows the city's heritage at street scale.

## What I can offer, in order

1. **Wang Thonglang drainage pilot (one district).** BMA and Mott MacDonald
   already modelled it, so the data exists inside สำนักการระบายน้ำ. We already
   hold 28 canals, 10 pumps, 2 gates, 11 sumps, 14 risk points and 5 live
   calibration gauges. Missing: pipes, pump curves and logs, gate logs, a
   finer DEM. Replay 25–28 Sep 2026 rain, compare with the five gauges,
   **publish the error, not just the picture.** The draft letter is ready:
   `bkk-3d-atlas/docs/wang-thonglang-pilot/request-to-bma-drainage.th.md`
   (not sent).
2. **Close the Traffy loop.** Each Traffy flood report gets the nearest
   gauge, camera and rain reading attached automatically, so the district
   officer sees evidence beside the complaint. Built as an API today; BMA
   would need to accept a feed back.
3. **Fix the open-data portal quietly.** The 15 Oct audit found
   data.bangkok.go.th flood datasets with **no licence stated**, and one
   flood-risk file whose `UTM_X/UTM_Y` columns actually hold
   longitude/latitude. A short list of fixes is a free, concrete gift
   (`bkk-3d-atlas/docs/source-audit-2026-10-15.md`).

## What not to promise

- Not an official warning, and never a "safe route". Proximity to a gauge does not prove a road is dry.
- No flood depth on streets. The 30 m elevation data cannot resolve a city that is flat to within a metre.
- The camera vehicle-count is an unvalidated experiment, off by default. No faces, no plates, no tracking.
- The tier is **pilot**, not production (§16.2). "This is a pilot" is the honest, complete sentence.

## What to ask him for

1. One named counterpart at สำนักการระบายน้ำ for the Wang Thonglang data.
2. Permission to send the drafted letter under his office's knowledge.
3. A licence statement (CC BY is enough) on the data.bangkok.go.th flood datasets.
4. If cameras come up: the PDPA position for showing BMA CCTV stills publicly.

## Loose ends to settle before showing it

- Feeds come and go. Tonight the BMA canal-gate bulletin returned zero stations; say so if it's still empty.
- The atlas has no visible title on a phone; the wordmark carries it. Fine for a demo, worth knowing.
- Both sites passed three blind MSH audit rounds on 1 Nov (atlas `bkk-atlas-20261101-1793516684-ff53400`, BKKx `bkkx-20261101-c9a9aac`).
