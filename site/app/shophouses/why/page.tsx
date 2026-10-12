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
          <a href="#grew-up">Where I grew up</a>
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

      <section className="sh-why-close sh-why-grew" id="grew-up" aria-labelledby="grew-up-title">
        <p className="sh-why-byline">Non Arkara</p>
        <h2 id="grew-up-title">
          <span lang="th">บ้านที่ผมโตมา</span>
          <span lang="en">Where I grew up</span>
        </h2>
        <div className="sh-why-lede">
          <p lang="th">
            ผมโตในตึกแถวคอนกรีตเสริมเหล็ก สร้างราวทศวรรษ 1960 ถึง 1970 หน้ากว้างราวสี่เมตร สี่ชั้น
            พอได้เรียนสถาปัตย์ ผมถึงเข้าใจว่าสี่ชั้นคือสูงสุดที่ทำได้ ก่อนกฎหมายอาคารจะบังคับให้มีลิฟต์
            และลิฟต์ในตึกแถวหน้ากว้างสี่เมตรมันไม่คุ้มที่จะติด เท่าที่ผมอ่านจากกฎหมายอาคารได้
            ผมไม่ได้กลับไปไล่ข้อกฎหมายแบบนักกฎหมาย
          </p>
          <p lang="en">
            I grew up in a reinforced-concrete shophouse from the 1960s or the 1970s. The front was about
            four metres. It was four storeys. Later, studying architecture, I came to think four storeys was
            the maximum before the building code required a lift, and a lift in a four-metre row house is not
            economical. That is as far as I could tell from the building code. I have not checked it the way
            a lawyer would.
          </p>
        </div>
        <div className="sh-why-lede">
          <p lang="th">
            ตาและยายเป็นคนซื้อ เขาเป็นคนนครราชสีมา ซื้อไว้ให้ลูก ๆ รวมทั้งแม่ผม ได้มีที่อยู่ระหว่างมาเรียนที่กรุงเทพฯ
            ตึกอยู่ติดกับที่วันนี้เป็นสยามดิสคัฟเวอรี่กับย่านสยาม ผมเกิดห่างจากนั้นไม่ถึงหนึ่งกิโลเมตร
            ที่โรงพยาบาลพญาไท คนกรุงเทพฯ เต็มตัว
          </p>
          <p lang="en">
            My mother&apos;s parents bought it. They were from Nakhon Ratchasima. They bought it so their
            children, my mother among them, would have a place to stay while they studied in Bangkok. The row
            stood right beside where Siam Discovery and the Siam area are now. I was born less than a kilometre
            away, at Phaya Thai Hospital. Bangkok, the whole way.
          </p>
        </div>
        <div className="sh-why-lede">
          <p lang="th">
            สยามช่วงทศวรรษ 1980 ยังไม่พัฒนา มีห้างใหญ่ห้างเดียว คือสยามเซ็นเตอร์ อาคารบรูทัลลิสต์ นอกนั้นเป็นสวน เป็นวัด
            และโรงแรมสยามอินเตอร์คอนติเนนตัล คนออกแบบคือ <a href="#salerno">Joseph P. Salerno</a>{" "}
            ผมเข้าใจว่าเขาเป็นศิษย์ของ Frank Lloyd Wright โรงแรมหลังนั้นถูกรื้อไปสร้างสยามพารากอน
          </p>
          <p lang="en">
            Siam in the 1980s was not yet developed. There was one big mall, Siam Center, and it was brutalist.
            Around it were parks, temples, and the Siam Intercontinental Hotel.{" "}
            <a href="#salerno">Joseph P. Salerno</a> designed it. I understood him to be a disciple of Frank Lloyd
            Wright. The hotel was later demolished for Siam Paragon.
          </p>
        </div>
        <div className="sh-why-lede">
          <p lang="th">
            ครอบครัวต้องย้าย เพราะที่ตรงนั้นถูกเวนคืนไปทำทางลงทางด่วนที่ไม่ได้สร้าง ได้ค่าเวนคืน แล้วไปสร้างบ้านที่ชานเมือง
            ตึกแถวยังยืนอยู่ ตอนนี้มีคนย้ายถิ่นมาอยู่แบบไม่เป็นทางการ ได้ไฟฟ้ากับน้ำมาใช้ ไม่ทราบว่าจัดกันอย่างไร
            เป็นพื้นที่สีเทาทางกฎหมายที่เมืองยังไม่ได้จัดการ
          </p>
          <p lang="en">
            The family was moved out by eminent domain, for an expressway landing that was never built. The
            family was paid, and they built their house in the suburbs. The shophouses are still standing.
            Migrants live in them now, informally. They have somehow got electricity and water. It is a legal
            grey area the city has not resolved.
          </p>
        </div>
        <div className="sh-why-lede">
          <p lang="th">
            ทุกคนรู้จักกัน อยู่ชิดขนาดนั้น จะเป็นศัตรูกันไม่ได้ เพื่อนบ้านคอยดูแลกัน และคอยดูคนแปลกหน้าด้วย
            มีร้านตัดผม มีร้านข้าวผัดที่ผมยังแวะกินอยู่
          </p>
          <p lang="en">
            Everyone knew everyone. You lived that close, so you could not be enemies. Neighbours watched out
            for each other, and they watched out for strangers. There was a barber. There is a fried-rice shop
            I still eat at.
          </p>
        </div>
        <div className="sh-why-lede">
          <p lang="th">
            ทุกข้อในงานวิจัยเมืองเก่าด้านบน ผมเห็นด้วยหมด ขนาดที่ยังเป็นของคน ชุมชน เพื่อนบ้านที่เคลียร์เรื่องกันเอง
            และตาบนถนน ซึ่งเป็นคำของ Jane Jacobs จาก{" "}
            <a href="#jacobs">The Death and Life of Great American Cities</a> ปี 1961
            แต่ผมไม่ได้เป็นแฟนของ Jacobs การอนุรักษ์ที่แช่แข็งย่านตึกต่ำบนทำเลดี ทำให้ที่นั่นแพง
            และทำให้คนในย่านเป็น NIMBY ถ้าจะให้คนมาอยู่ตรงนั้นได้มากขึ้น ตรงนั้นต้องหนาแน่นขึ้น
            นั่นคือข้อที่ Edward Glaeser จากฮาร์วาร์ด เถียงไว้ ใน{" "}
            <a href="#glaeser">Triumph of the City</a> ปี 2011 และผมเห็นด้วย
          </p>
          <p lang="en">
            I recognise every point in the old-town research above. Human scale. Community. Neighbours
            reconciling a conflict. Eyes on the street, Jane Jacobs&apos;s phrase, from{" "}
            <a href="#jacobs">The Death and Life of Great American Cities</a> (1961). I am not a Jacobs fan as
            such. Preservation that freezes low-rise streets on prime land makes them expensive, and it turns
            the neighbours into NIMBYs. To let more people live there, you need density. That is Edward
            Glaeser&apos;s critique. He is at Harvard. The book is{" "}
            <a href="#glaeser">Triumph of the City</a> (2011), and I agree with it.
          </p>
        </div>
        <div className="sh-why-lede">
          <p lang="th">
            แต่ของที่ชุมชนตึกต่ำทำได้จริง ผมไม่ทิ้ง เรื่องขัดแย้งเคลียร์กันได้ คนอยากรู้จักกัน
            เทศกาลกับอะไรที่ทำด้วยกันเกิดขึ้นเอง เพราะมีคนบนถนนลงมือจัด
            นั่นคือวิธีที่คนแปลกหน้าอยู่ด้วยกันได้ ผมไม่ได้ทำให้มันโรแมนติก
          </p>
          <p lang="en">
            A low-rise community still does something I will not give up. Conflicts get sorted. People want to
            know each other. Festivals, and the things a street does together, start because someone on the
            street decided to. That is how strangers manage to live together. I am not romanticising it.
          </p>
        </div>
      </section>

      <section className="sh-why-sources" id="sources" aria-labelledby="sources-title">
        <h2 id="sources-title">
          <span lang="th">แหล่งที่อ้าง และรายละเอียดที่ตรวจแล้ว</span>
          <span lang="en">Sources, checked against the publications</span>
        </h2>
        <p className="sh-why-sources-note" lang="en">
          Names, years and page ranges below were checked against the publications, not copied off the
          diagrams. Where a diagram rounds a figure, the entry says so. The last three entries belong to
          the section above, not to the drawings.
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
