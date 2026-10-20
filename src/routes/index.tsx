import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Globe2, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PublicHeader } from "@/components/public-header";
import { Logo } from "@/components/brand";
import hero from "@/assets/hero-table.jpg";
import chef from "@/assets/chef.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SortedDate Partners — Sell prepaid dining experiences" },
      {
        name: "description",
        content:
          "Partner with SortedDate to sell coffee dates, brunch packages and fixed-price dinners as prepaid experiences across Europe.",
      },
      { property: "og:title", content: "SortedDate Partners — Your restaurant. More experiences. More guests." },
      {
        property: "og:description",
        content: "Create prepaid dining experiences, manage your locations and reach new guests across Europe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const BENEFITS = [
  { icon: Sparkles, title: "Your experiences, your rules", text: "Set descriptions, inclusions, prices, availability and redemption rules for every offer." },
  { icon: Wallet, title: "Paid upfront", text: "Guests pay through a secure branded checkout linked directly to your business account." },
  { icon: Globe2, title: "Built for Europe", text: "Multiple countries, currencies, legal entities and locations in one place." },
  { icon: BadgeCheck, title: "Simple redemption", text: "Validate and redeem vouchers at the table with clear, single-use codes." },
];

const STEPS = [
  { n: "01", title: "Tell us about your business", text: "Legal details, verification documents and your locations." },
  { n: "02", title: "Design your first experience", text: "A coffee date, pizza for two or a brunch package — priced by you." },
  { n: "03", title: "Get reviewed and go live", text: "Our team verifies your business, then you publish when ready." },
];

const FAQ = [
  { q: "What does it cost to join?", a: "Registering and creating experiences is free. Commercial terms, including any platform fee, are agreed in your partner contract before you sell." },
  { q: "Who sets the price?", a: "You do. Prices, inclusions and validity are set by your restaurant, subject to platform review and applicable law." },
  { q: "How do I get paid?", a: "Payments are processed for your own connected business account. We never collect your proceeds into an ordinary platform account." },
  { q: "How long does verification take?", a: "Most applications are reviewed within a few business days once all documents are uploaded." },
  { q: "Can I manage several locations?", a: "Yes. Add every location, choose which experiences apply where, and invite managers and staff with the right permissions." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="mx-auto max-w-6xl px-5 pb-10 pt-20 text-center sm:pt-28">
          <p className="eyebrow">SortedDate for restaurants</p>
          <h1 className="display-xl mx-auto mt-4 max-w-4xl">Your restaurant. More experiences. More guests.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Turn your best moments — a slow Sunday brunch, pizza for two, the perfect espresso — into
            prepaid experiences guests can buy and gift across Europe.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
              <Link to="/signup">Partner with us</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-12 rounded-full px-6 text-base">
              <a href="#how">
                Explore how it works <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </section>
        <div className="mx-auto max-w-6xl px-5">
          <img
            src={hero}
            alt="A sunlit restaurant table with cappuccinos, pastries and a wood-fired pizza"
            width={1600}
            height={1008}
            className="aspect-[16/9] w-full rounded-[2rem] object-cover"
          />
        </div>

        <section id="benefits" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-28">
          <h2 className="display-lg max-w-2xl">Everything you need to sell experiences — nothing you don't.</h2>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-3xl bg-surface p-7">
                <b.icon className="size-6" aria-hidden />
                <h3 className="mt-6 text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-20 bg-surface py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-2">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 className="display-lg mt-3">Live in three steps.</h2>
              <ol className="mt-10 space-y-8">
                {STEPS.map((s) => (
                  <li key={s.n} className="flex gap-5">
                    <span className="text-sm font-medium text-muted-foreground tabular-nums">{s.n}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{s.title}</h3>
                      <p className="mt-1 text-muted-foreground">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Button asChild size="lg" className="mt-10 h-12 rounded-full px-7">
                <Link to="/signup">Start your application</Link>
              </Button>
            </div>
            <img
              src={chef}
              alt="A chef finishing a brunch plate with fresh herbs"
              width={1200}
              height={1408}
              loading="lazy"
              className="aspect-[4/5] w-full rounded-[2rem] object-cover"
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-28">
          <div className="grid gap-10 rounded-[2rem] border p-10 sm:p-14 lg:grid-cols-[auto_1fr] lg:items-center">
            <ShieldCheck className="size-12" aria-hidden />
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Verified partners. Trusted by guests.</h2>
              <p className="mt-3 max-w-3xl text-muted-foreground">
                Every restaurant is reviewed before selling. We verify legal entities and supporting documents,
                review each experience before it goes live, and keep a full audit history of every change.
                Card data is never stored on our platform.
              </p>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 pb-28">
          <h2 className="display-lg text-center">Questions, answered.</h2>
          <Accordion type="single" collapsible className="mt-12">
            {FAQ.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="py-5 text-left text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
      <footer className="border-t bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Logo suffix="Partners" />
          <nav className="flex flex-wrap gap-6" aria-label="Footer">
            <a href="mailto:partners@sorteddate.example" className="hover:text-foreground">Contact</a>
            <span>Terms</span>
            <span>Privacy</span>
            <span>Imprint</span>
          </nav>
          <p>© {2026} SortedDate</p>
        </div>
      </footer>
    </div>
  );
}
