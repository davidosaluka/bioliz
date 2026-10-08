import { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { BreadcrumbJsonLd } from "@/components/store/json-ld";

export const metadata: Metadata = createMetadata({
  title: "About Bioliz Global Sport",
  description:
    "Bioliz Global Sport is a Nigerian supplier of gym equipment, snooker tables, table tennis tables and sports gear for homes, gyms, hotels, offices and clubs.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black uppercase tracking-[-0.05em] text-white">
          About Bioliz Global Sport
        </h1>

      <div className="mt-8 space-y-6 text-muted-foreground">
        <p>
          <strong className="text-foreground">BUILD YOUR SPACE. TRAIN HARDER. PLAY BETTER.</strong>{" "}
          Bioliz Global Sport is a Nigerian supplier of premium gym equipment,
          snooker tables, table tennis tables, sports and recreational equipment.
        </p>

        <p>
          We serve home gyms, commercial gyms, hotels, offices, clubs and
          recreation centres across Nigeria. Whether you need a single Olympic
          barbell or a full hotel fitness centre setup, we source durable,
          commercial-grade equipment and deliver it to your location.
        </p>

        <h2 className="mt-8 text-2xl font-black uppercase tracking-[-0.04em] text-white">
          What we supply
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            "Gym & fitness equipment",
            "Gym bikes & cardio machines",
            "Snooker & pool tables",
            "Table tennis tables",
            "Sports equipment",
            "Recreational & game room equipment",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>

        <h2 className="mt-8 text-2xl font-black uppercase tracking-[-0.04em] text-white">
          How to order
        </h2>
        <p>
          Browse our catalogue, add items to your cart and checkout. Your order is
          sent to us on WhatsApp where we confirm pricing, availability and
          delivery. No online payment is taken — everything is agreed directly
          with you.
        </p>

        <p>
          For bulk orders, hotels, gyms and corporate clients, use our{" "}
          <a href="/quote" className="text-primary hover:underline">
            Request a Quote
          </a>{" "}
          form and we will respond with a custom package.
        </p>
      </div>
    </div>
    </>
  );
}
