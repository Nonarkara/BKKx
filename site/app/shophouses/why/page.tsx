import type { Metadata } from "next";
import Link from "next/link";
import { CAROUSEL, MEASURES, PRINCIPLES, SOURCES } from "../../data/shophouse-why";

export const metadata: Metadata = {
  title: "Why shophouses are good for cities · Shophouse Metropolis",
  description:
    "Nine measured reasons a shophouse street works, in Thai and English, held against Bangkok’s own frontages, alleys and storey counts. Diagrams by Abhinav Bhardwaj.",
  alternates: { canonical: "/shophouses/why" },
  openGraph: {
    title: "Why shophouses are good for cities — ทำไมตึกแถวจึงดีต่อเมือง",
    description:
      "Narrow plots, a door every few seconds, a wall you can still talk down from. The diagrams are credited. The Bangkok numbers are this project’s.",
    url: "/shophouses/why",
  },
};

export default function WhyShophousesPage() {
  return (
    <div className="shophouse-essay sh-why">
      <header className="sh-masthead">
        <Link href="/shophouses" className="sh-wordmark">
          Shophouse<em>Metropolis</em>
        </Link>
        <nav aria-label="Why shophouses">
          <a href="#measures">Measures</a>
          <a href="#principles">Nine principles</a>
          <a href="#sources">Sources</a>
          <Link href="/shophouses/bible">Bible</Link>
          <Link href="/shophouses">Essay</Link>
        </nav>
      </header>

      <article className="sh-why-hero">
        <p className="sh-eyebrow">
          <span lang="th">ส่วนหนึ่งของระบบตึกแถว</span>
          <span lang="en">A section of the shophouse system</span>
        </p>
        <h1>
          <span lang="en">Why shophouses are good for cities</span>
          <span lang="th">ทำไมตึกแถวจึงดีต่อเมือง</span>
        </h1>
        <div className="sh-why-lede">
          <p lang="th">
            กฎหมายแยกห้องแถวซึ่งเป็นไม้ ออกจากตึกแถวซึ่งกันไฟ ถนนไม่ได้แยก หลักด้านล่างใช้กับทั้งสองเมื่อหน้าร้านเปิด
            ตึกแถวดีต่อเมืองเมื่อวัดได้ไม่กี่อย่าง: กั้นขอบถนนให้เป็นห้อง สูงพอที่คนบนชั้นยังทักคนเดินถนนได้
            และหั่นระยะร้อยเมตรออกเป็นประตูหลายบานกับเจ้าของหลายคน ภาพมาจากชุด{" "}
            <em>{CAROUSEL.title}</em> ของ {CAROUSEL.author} วันที่ {CAROUSEL.date} ตัวเลขคู่ภาพเป็นของกรุงเทพฯ
            จากรอยอาคารที่ระบบนี้คัดไว้ และจากงานที่รวบรวมไว้ในไบเบิลแล้ว เป็นกฎคร่าว ใช้ได้จนกว่าประตูม้วนจะลง
            หรือจนกว่าแปลงจะกว้างจนหมดจังหวะ
          </p>
          <p lang="en">
            The building law splits ห้องแถว, the timber row, from ตึกแถว, the fire-resistant one. The street does
            not. The principles below apply to both while the shop is open. A shophouse street is good for a city
            when it does a few things that can be measured: it holds the edge of the street, it stays at a height
            a person can still call down from, and it breaks a hundred metres into many doors with many owners.
            The drawings are from {CAROUSEL.author}&apos;s carousel <em>{CAROUSEL.title}</em>, {CAROUSEL.date}. The
            numbers beside them are Bangkok&apos;s, from the footprints this system has screened and from the
            studies already in the Bible. They are rules of thumb. They hold until a shutter comes down, or a plot
            grows wide enough to lose the rhythm.
          </p>
        </div>
      </article>

      <section className="sh-why-measures" id="measures" aria-labelledby="measures-title">
        <div className="sh-why-measures-head">
          <h2 id="measures-title">
            <span lang="th">ตัวเลขของกรุงเทพฯ ที่ใช้คู่กับภาพ</span>
            <span lang="en">The Bangkok numbers these drawings are held against</span>
          </h2>
          <p lang="en">
            Ewing and Handy, in 2009, showed that enclosure, human scale, transparency and complexity can be
            scored from the physical edge of a street. That paper prepares a test of walking. It does not finish
            one. It is the reason the drawings below sit next to frontages, not next to a mood.
          </p>
        </div>
        <dl>
          {MEASURES.map((m) => (
            <div key={m.labelEn}>
              <dt>
                <span lang="th">{m.labelTh}</span>
                <span lang="en">{m.labelEn}</span>
              </dt>
              <dd>
                {m.value}
                <small>
                  <span lang="th">{m.noteTh}</span>
                  <span lang="en">{m.noteEn}</span>
                </small>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <nav className="sh-why-contents" aria-label="Principles">
        <ol>
          {PRINCIPLES.map((p) => (
            <li key={p.id}>
              <a href={`#${p.id}`}>
                <span>{p.index}</span>
                <span lang="th">{p.titleTh}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="sh-why-principles" id="principles">
        {PRINCIPLES.map((p) => (
          <section className="sh-why-principle" id={p.id} key={p.id} aria-labelledby={`${p.id}-title`}>
            <header>
              <p className="sh-why-index">{p.index}</p>
              <h2 id={`${p.id}-title`}>
                <span lang="th">{p.titleTh}</span>
                <span lang="en">{p.titleEn}</span>
              </h2>
            </header>
            <div className="sh-why-principle-grid">
              <div className="sh-why-prose">
                <p lang="th">{p.th}</p>
                <p lang="en">{p.en}</p>
              </div>
              <figure>
                <img
                  src={p.src}
                  alt={p.alt}
                  width={483}
                  height={600}
                  loading={p.index === "01" ? "eager" : "lazy"}
                />
                <figcaption>
                  {`Diagram: ${CAROUSEL.author} ${CAROUSEL.handle}, `}
                  <a href={CAROUSEL.postUrl}>{CAROUSEL.postUrl.replace("https://", "")}</a>
                  <span>Sheet {p.slide}</span>
                </figcaption>
              </figure>
            </div>
            <aside className="sh-why-bangkok">
              <p className="sh-why-kicker">
                <span lang="th">บนถนนกรุงเทพฯ</span>
                <span lang="en">On a Bangkok street</span>
              </p>
              <p lang="th">{p.bangkokTh}</p>
              <p lang="en">{p.bangkokEn}</p>
            </aside>
            {p.caveatEn && p.caveatTh && (
              <div className="sh-why-caveat">
                <p lang="th">{p.caveatTh}</p>
                <p lang="en">{p.caveatEn}</p>
              </div>
            )}
          </section>
        ))}
      </div>

      <section className="sh-why-close" aria-labelledby="close-title">
        <h2 id="close-title">
          <span lang="th">สิ่งที่เก้าข้อนี้ไม่ได้พิสูจน์</span>
          <span lang="en">What these nine do not settle</span>
        </h2>
        <div className="sh-why-lede">
          <p lang="th">
            ทั้งเก้าข้อเป็นกฎคร่าวจากเมืองอื่น ยกมาเทียบกับแปลงของกรุงเทพฯ มันไม่ได้พิสูจน์ว่าตึกแถวดี
            ว่าผู้อยู่อาศัยปลอดภัย หรือว่าอาคารหลังใดหลังหนึ่งควรเก็บไว้ แปลงแคบที่ปิดประตูม้วนสอบตกเรื่องประตู
            ตึกสี่ชั้นบนซอยสามเมตรอาจแคบเกินกฎเรื่องรูปตัด และที่ท่าเตียนความแคบนั้นเป็นปัญหาการค้าไปแล้ว
            รอยอาคารที่คัดไว้เป็นรูปทรง ไบเบิลบอกอย่างนั้น แผนที่แรงกดดันก็บอกอย่างนั้น รูปทรงไม่ใช่การสำรวจภาคสนาม
          </p>
          <p lang="en">
            These nine are rules of thumb from other cities, held against Bangkok&apos;s plots. They do not
            settle that a shophouse is good, that a resident is safe, or that any one building should be kept.
            A narrow plot with the shutter down fails the door test. A four-storey row on a three-metre alley
            can be tighter than the section guide, and at Tha Tien that narrowness was already a problem for
            trade. The screened footprints are geometry. The Bible says so, and so does the pressure map.
          </p>
        </div>
      </section>

      <section className="sh-why-sources" id="sources" aria-labelledby="sources-title">
        <h2 id="sources-title">
          <span lang="th">แหล่งที่ภาพวาดอ้าง และรายละเอียดที่ตรวจแล้ว</span>
          <span lang="en">Sources, checked against the publications</span>
        </h2>
        <p className="sh-why-sources-note" lang="en">
          Names, years and page ranges below were checked against the publications, not copied off the
          diagrams. Where a diagram rounds a figure, the entry says so.
        </p>
        <ol>
          {SOURCES.map((s) => (
            <li key={s.id} id={s.id}>
              <cite>{s.citation}</cite>
              {s.url && (
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.url.replace("https://", "")}
                </a>
              )}
              <span>{s.usedFor}</span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="sh-why-credit">
        <p lang="th">
          ภาพประกอบนำมาเผยแพร่พร้อมเครดิต เพื่ออธิบายตึกแถวกรุงเทพฯ ในเชิงการศึกษา ลายเส้นยังเป็นของ{" "}
          {CAROUSEL.author} (<a href={CAROUSEL.profileUrl}>{CAROUSEL.handle}</a>) จากโพสต์{" "}
          <a href={CAROUSEL.postUrl}>{CAROUSEL.title}</a> วันที่ {CAROUSEL.date}
        </p>
        <p lang="en">
          The diagrams are reproduced with credit for educational commentary on the Bangkok shophouse.
          The drawings remain {CAROUSEL.author}&apos;s (<a href={CAROUSEL.profileUrl}>{CAROUSEL.handle}</a>), from{" "}
          <a href={CAROUSEL.postUrl}>{CAROUSEL.title}</a>, {CAROUSEL.date}.
        </p>
        <p className="sh-why-footer-links">
          <Link href="/shophouses">← The essay</Link>
          <Link href="/shophouses/bible">The Bible</Link>
          <Link href="/shophouses/atlas">The pressure atlas</Link>
          <Link href="/shophouses/research">Bibliography</Link>
        </p>
      </footer>
    </div>
  );
}
