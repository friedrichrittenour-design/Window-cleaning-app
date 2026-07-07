import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

const services = [
  {
    icon: "🪟",
    title: "Window Cleaning",
    text: "Streak-free interior & exterior window washing, with Basic, Plus Tracks, and Premium tiers plus screen cleaning.",
    bg: "bg-[#d8f6ff]",
  },
  {
    icon: "🍂",
    title: "Gutter Cleaning",
    text: "Debris removal and flush-out for gutters & downspouts so water flows where it should.",
    bg: "bg-[#ffe0f7]",
  },
  {
    icon: "🧼",
    title: "House Washing",
    text: "Soft-wash exterior siding, brick, and stucco cleaning that lifts dirt and grime without damage.",
    bg: "bg-[#fff9c4]",
  },
  {
    icon: "🔄",
    title: "Recurring Plans",
    text: "Monthly, quarterly, or seasonal visits with priority scheduling and loyalty pricing.",
    bg: "bg-[#e2ffd6]",
  },
];

const testimonials = [
  {
    quote:
      "Best window cleaning we've ever had. Our windows have never looked this good!",
    author: "Sarah M.",
    bg: "bg-[#d8f6ff]",
  },
  {
    quote:
      "Professional, punctual, and reasonably priced. We're now on their quarterly plan.",
    author: "David R., Riverside Cafe",
    bg: "bg-[#ffe0f7]",
  },
  {
    quote:
      "They even cleaned our tracks and sills without being asked. Real attention to detail.",
    author: "Priya K.",
    bg: "bg-[#fff9c4]",
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar
        links={[
          { href: "#services", label: "Services" },
          { href: "#why-us", label: "Why Us" },
          { href: "#testimonials", label: "Reviews" },
        ]}
        cta={{ href: "/signup", label: "Get a Free Quote" }}
      />

      <div className="bg-black border-t-[3px] border-electric border-b-[3px] border-b-pink-neon overflow-hidden whitespace-nowrap py-2">
        <div className="inline-block pl-full animate-marquee">
          <span className="text-yellow-neon font-display font-bold tracking-wide text-sm">
            ★ NOW BOOKING ★ FULLY INSURED ★ INSTANT PHOTO QUOTES ★ NOW
            BOOKING ★ FULLY INSURED ★ INSTANT PHOTO QUOTES ★
          </span>
        </div>
      </div>

      <main>
        <section className="bg-diagonal-navy border-b-4 border-pink-neon py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-pink-neon font-bold text-sm tracking-widest uppercase mb-2 block">
                ✧ Residential &amp; Commercial ✧
              </span>
              <h1 className="font-display uppercase text-4xl md:text-5xl leading-[1.15] text-gradient-retro mb-4">
                Spotless Homes.
                <br />
                Instant Quotes.
              </h1>
              <p className="text-white max-w-[46ch] mb-6">
                Snap a photo of your house or porch and get an instant price
                estimate for window cleaning, gutter cleaning, or house
                washing — no waiting for a callback. Fully insured.
              </p>
              <div className="flex flex-wrap gap-4 mb-7">
                <Button href="/signup">Get an Instant Quote</Button>
                <Button href="#services" variant="ghost">
                  Our Services
                </Button>
              </div>
              <ul className="flex flex-wrap gap-5 text-green-neon font-bold text-sm uppercase">
                <li>✔ Fully insured</li>
                <li>✔ 5-star rated</li>
                <li>✔ Photo-based pricing</li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-64 md:w-72 md:h-72 grid grid-cols-2 grid-rows-2 gap-2.5 p-4 bg-black border-4 border-electric shadow-hard -rotate-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="border-2 border-black shadow-[inset_0_0_16px_rgba(255,255,255,0.6)]"
                    style={{
                      background: "linear-gradient(135deg, #ff2fd0, #00c8ff)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="bg-grid py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-pink-neon font-bold text-sm tracking-widest uppercase mb-2 block">
                What We Offer
              </span>
              <h2 className="font-display uppercase text-3xl text-navy" style={{ textShadow: "2px 2px 0 #00c8ff" }}>
                Our Services
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-7">
              {services.map((s) => (
                <Card key={s.title} className={s.bg}>
                  <div className="text-3xl mb-4">{s.icon}</div>
                  <h3 className="font-display uppercase text-lg mb-2 text-navy">
                    {s.title}
                  </h3>
                  <p className="text-sm text-[#10102a]">{s.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="why-us" className="bg-navy py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[0.8fr_1.2fr] gap-12 items-center">
            <div className="h-64 md:h-80 border-4 border-green-neon shadow-hard bg-diagonal-stripes" />
            <div>
              <span className="text-yellow-neon font-bold text-sm tracking-widest uppercase mb-2 block">
                Why Choose Us
              </span>
              <h2
                className="font-display uppercase text-3xl text-white mb-6"
                style={{ textShadow: "2px 2px 0 #ff2fd0" }}
              >
                Reliable, Insured &amp; Detail-Obsessed
              </h2>
              <ul className="grid gap-5">
                {[
                  ["Instant photo-based quotes", "Upload a picture and get a price range in seconds."],
                  ["Fully licensed & insured", "Work with confidence — every job is covered."],
                  ["On-time, every time", "Text and email reminders before every visit."],
                  ["Give $20, get $20", "Refer a friend and you both save on your next job."],
                ].map(([title, body]) => (
                  <li key={title} className="relative pl-9">
                    <span className="absolute left-0 -top-0.5 w-6 h-6 rounded-full bg-yellow-neon border-2 border-black flex items-center justify-center text-navy text-xs">
                      ★
                    </span>
                    <strong className="block text-electric uppercase text-sm">
                      {title}
                    </strong>
                    <span className="text-white text-sm">{body}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="testimonials" className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-pink-neon font-bold text-sm tracking-widest uppercase mb-2 block">
                Testimonials
              </span>
              <h2 className="font-display uppercase text-3xl text-navy">
                What Our Customers Say
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-7">
              {testimonials.map((t) => (
                <Card key={t.author} className={t.bg}>
                  <p className="italic text-sm text-[#10102a]">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <cite className="block mt-3 not-italic font-bold text-pink-neon uppercase text-xs">
                    — {t.author}
                  </cite>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-yellow-neon border-t-4 border-black py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <span className="text-pink-neon font-bold text-sm tracking-widest uppercase mb-2 block">
              Get Started
            </span>
            <h2
              className="font-display uppercase text-3xl text-navy mb-4"
              style={{ textShadow: "2px 2px 0 #ff2fd0" }}
            >
              Get Your Instant Quote
            </h2>
            <p className="text-[#10102a] mb-8">
              Create a free account, upload a photo of your windows, and
              we&apos;ll send you a price estimate right away.
            </p>
            <Button href="/signup">Create Free Account</Button>
          </div>
        </section>
      </main>

      <footer className="bg-black border-t-4 border-pink-neon py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-display font-extrabold text-yellow-neon uppercase">
            <span>🪟</span>
            <span>Superior Window Washing</span>
          </div>
          <p className="text-electric text-sm">
            &copy; {new Date().getFullYear()} Superior Window Washing.
            All rights reserved.
          </p>
          <div className="flex gap-5">
            <a href="tel:+15551234567" className="text-green-neon font-bold text-sm hover:text-pink-neon">
              (555) 123-4567
            </a>
            <a
              href="mailto:hello@superiorwindowwashing.com"
              className="text-green-neon font-bold text-sm hover:text-pink-neon"
            >
              hello@superiorwindowwashing.com
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
