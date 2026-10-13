// Copy for the public pages: Pricing, Contact, Terms, Disclaimer.
// Plan prices follow the PRD (§4.7). Legal copy is a product draft — have it reviewed before launch.

import { MEMBER_LIMIT } from "./studio-content";

/** Placeholder inbox until the real support address is set up. */
export const SUPPORT_EMAIL = "support@threadflank.com";

export const LEGAL_UPDATED = "September 27, 2026";

export type Plan = {
  id: string;
  name: string;
  blurb: string;
  /** Monthly price in ₹; `null` means custom / contact sales. */
  monthly: number | null;
  /** Per-month price when billed yearly. */
  yearly: number | null;
  /** One-time price (lifetime plans). */
  once?: number;
  features: string[];
  cta: string;
  featured?: boolean;
};

export const pricingContent = {
  title: "Pricing",
  description: "Start with free AI looks. Top up with a credit pack whenever you need more — no subscription.",
  audiences: [
    { id: "shoppers", label: "For you" },
    { id: "brands", label: "For brands" },
  ],
  periods: [
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
  ],
  yearlyNote: "Save 25%",
  perMonth: "/mo",
  billedYearly: "billed yearly",
  oneTime: "one-time",
  custom: "Custom",
  popular: "Most popular",
  currentPlan: "Your plan",
  /**
   * Shoppers buy one-time credit packs: 1 credit = 1 generated image. The live packs, prices and
   * free allowance come from the API (set in the admin panel); these are shown until it answers.
   */
  credits: {
    fallback: {
      paymentsEnabled: false,
      currency: "INR",
      freeCredits: 3,
      videoCost: 5,
      packs: [
        { id: "starter", name: "Starter", description: "15 AI looks", price: 49, credits: 15, featured: false },
        { id: "creator", name: "Creator", description: "100 AI looks — best value", price: 299, credits: 100, featured: true },
      ],
    },
    free: {
      id: "free",
      name: "Free",
      blurb: (n: number) => `${n} AI looks to try it on yourself.`,
      features: (n: number) => [`${n} free AI looks`, "Try on from one selfie", "Wardrobe, brand feed & chat", "Share looks with your circle"],
      cta: "Start free",
      signedIn: "Included with your account",
    },
    packFeatures: (credits: number, videoCost: number) => [
      `${credits} AI looks (1 credit each)`,
      "Credits never expire",
      "Group looks, poses & makeup edits",
      `Motion videos (${videoCost} credits each)`,
      "Failed renders are refunded",
    ],
    looks: "looks",
    perLook: (price: number) => `₹${price.toFixed(price < 10 ? 2 : 1).replace(/\.0$/, "")} per look`,
    oneTime: "one-time",
    best: "Best value",
    buy: (name: string) => `Get ${name}`,
    comingSoon: "Coming soon",
    paying: "Opening payment…",
    paid: (credits: number, balance: number) => `Payment received — ${credits} credits added. You now have ${balance}.`,
    balance: (n: number) => `You have ${n} credit${n === 1 ? "" : "s"}`,
  },
  brands: [
    {
      id: "d2c",
      name: "D2C Starter Widget",
      blurb: "Try-on on your product pages.",
      monthly: 4999,
      yearly: 3999,
      features: ["Embeddable try-on widget", "Shopify & custom stores", "1,000 sessions a month", "Brand posts & stories in the feed", "Standard brand dashboard"],
      cta: "Start trial",
      featured: true,
    },
    {
      id: "enterprise",
      name: "Enterprise White-Label",
      blurb: "Your brand, our drape engine.",
      monthly: null,
      yearly: null,
      features: ["Unlimited sessions", "Custom SLA", "Model fine-tuning on your catalogue", "Stock-aware try-on", "Advanced analytics"],
      cta: "Talk to sales",
    },
  ] satisfies Plan[],
  faqTitle: "Questions",
  faq: [
    {
      q: "What does one credit get me?",
      a: "One generated image: a Drape render, a new pose or a makeup edit. A group look is one image too, so it uses one credit. Failed renders are refunded automatically.",
    },
    {
      q: "Do credits expire?",
      a: "No. Credits stay on your account until you use them, and packs are one-time payments, not subscriptions.",
    },
    {
      q: "Who can be in my twin circle?",
      a: `Up to ${MEMBER_LIMIT} people close to you — a partner, family or friends — each with their own selfie and body details. A look can show you and one of them together. You need their permission to add their photo.`,
    },
    {
      q: "How do I pay?",
      a: "Securely through Razorpay — UPI, cards, net banking and wallets. Credits are added the moment the payment goes through.",
    },
    {
      q: "Do you sell clothes?",
      a: "No. Brand links take you to the brand's own store; we never handle your order or payment for clothes.",
    },
  ],
};

export const contactContent = {
  title: "Contact us",
  description: "Questions, feedback or a brand partnership — we read everything.",
  topics: [
    { value: "support", label: "Help with my account" },
    { value: "billing", label: "Plans & billing" },
    { value: "brands", label: "Brand partnership" },
    { value: "privacy", label: "Privacy & data" },
    { value: "feedback", label: "Feedback" },
  ],
  name: "Your name",
  email: "Email",
  topic: "Topic",
  message: "Message",
  messagePlaceholder: "Tell us what's going on…",
  submit: "Send message",
  sent: "Your email app should open with the message ready — hit send there. No email app? Write to us directly at",
  channels: [
    { id: "email", title: "Email", body: "We reply within one working day.", value: SUPPORT_EMAIL },
    { id: "brands", title: "Brands", body: "Widget, feed placements and enterprise.", value: "Pick “Brand partnership”" },
    { id: "privacy", title: "Your data", body: "Export or delete your selfie and photos.", value: "Pick “Privacy & data”" },
  ],
};

export type LegalSection = { heading: string; body: string[] };

export const termsContent = (brandName: string) => ({
  title: "Terms & conditions",
  intro: `These terms govern your use of ${brandName}: the website, the Drape studio, the wardrobe, the twin circle, the brand feed and messaging. By creating an account you agree to them.`,
  sections: [
    {
      heading: "1. Your account",
      body: [
        "You must be at least 16 years old to create an account. Keep your password private; you're responsible for activity on your account.",
        "Give accurate information when you sign up. We may suspend accounts that break these terms or put other people at risk.",
      ],
    },
    {
      heading: "2. Your twin and your photos",
      body: [
        "You own the photos you upload and the body details you enter. You give us a limited licence to store and process them only to provide the service — rendering try-ons from your selfie and showing your saved looks.",
        "Only upload photos of yourself, or of people who have clearly agreed. Don't upload images of anyone under 16 without their parent or guardian's consent.",
      ],
    },
    {
      heading: "3. Twin circle members",
      body: [
        "You can add a small circle of people (a partner, family, close friends) with their own selfies and body details. Before adding someone's photo or measurements you must have their permission, and you must remove them if they ask.",
        "Circle members may be able to see looks and wardrobe items you choose to share with them.",
      ],
    },
    {
      heading: "4. Acceptable use",
      body: [
        "Don't use the service to create sexual, harassing, deceptive or defamatory images of anyone, to impersonate a real person, or to undress or alter a person's body without consent.",
        "Don't scrape the service, reverse-engineer the models, or try to get around usage limits or plan restrictions.",
      ],
    },
    {
      heading: "5. AI-generated looks",
      body: [
        "Try-ons, combinations and styling suggestions are generated by AI. They're a visual guide, not a promise of how a garment will fit, drape or look in real life. See the Disclaimer for more.",
        "You may share looks you create for personal, non-commercial use. Brand imagery remains the property of the brand.",
      ],
    },
    {
      heading: "6. Brands, links and purchases",
      body: [
        "Brand posts, stories and product links point to third-party stores. We don't sell clothes and aren't a party to any purchase you make there; the brand's own terms, prices, sizing and return policies apply.",
        "Some links may earn us a commission. That never changes the price you pay.",
      ],
    },
    {
      heading: "7. Plans and payments",
      body: [
        "Paid plans renew automatically until cancelled. You can cancel at any time and keep access until the end of the paid period. Prices are shown in Indian rupees and include applicable taxes unless stated otherwise.",
        "Lifetime plans cover the Pro features for as long as the service operates.",
      ],
    },
    {
      heading: "8. Messaging and content you post",
      body: [
        "You're responsible for messages, comments and looks you share. We may remove content that breaks these terms or the law.",
      ],
    },
    {
      heading: "9. Ending your account",
      body: [
        "You can delete your account at any time from Contact us → Privacy & data. We delete your selfie, photos, wardrobe and looks within 30 days, except where we must keep records by law.",
      ],
    },
    {
      heading: "10. Liability",
      body: [
        `${brandName} is provided “as is”. To the extent the law allows, we aren't liable for indirect losses, or for purchases, fit, returns or delivery handled by third-party stores. Nothing here limits rights you have under consumer law.`,
      ],
    },
    {
      heading: "11. Changes",
      body: [
        "We may update these terms. If a change is significant we'll tell you in the app or by email before it takes effect. Continuing to use the service after that means you accept the new terms.",
      ],
    },
  ] satisfies LegalSection[],
});

export const disclaimerContent = (brandName: string) => ({
  title: "Disclaimer",
  intro: `${brandName} helps you picture outfits before you wear or buy them. Please read how far that picture can be trusted.`,
  sections: [
    {
      heading: "AI try-on is an approximation",
      body: [
        "Draped looks are generated by AI from your photo, your body details and an image of the garment. Colour, texture, fit, length and drape can differ from the real item — especially with loose, sheer, embellished or layered garments like sarees, lehengas and dupattas.",
        "Screen settings and lighting also change how colours look. Always check the brand's size guide and product photos before buying.",
      ],
    },
    {
      heading: "Not sizing or body advice",
      body: [
        "Height, weight and skin-tone fields are used only to make renders more consistent. They are not a measurement service and we don't give health, fitness or body-image advice.",
      ],
    },
    {
      heading: "Styling suggestions",
      body: [
        "AI combinations and occasion plans are suggestions based on what's in your wardrobe. They may not suit every dress code, culture or venue — use your own judgement.",
      ],
    },
    {
      heading: "Brands and third-party links",
      body: [
        "Brand content in the feed is provided by the brands. We don't guarantee prices, stock, delivery or quality, and we're not responsible for purchases made on other websites. Some links may be affiliate links.",
      ],
    },
    {
      heading: "Images of other people",
      body: [
        "You're responsible for having consent before adding anyone to your twin circle or uploading their photo. Generated looks must not be used to mislead, harass or impersonate anyone.",
      ],
    },
    {
      heading: "Coming-soon features",
      body: [
        "Multiple poses and short motion clips are in development. Their availability and quality may change before release.",
      ],
    },
  ] satisfies LegalSection[],
});

export const privacyContent = (brandName: string) => ({
  title: "Privacy policy",
  intro: `We value your privacy. This policy explains what personal data ${brandName} collects, why we collect it, how it is protected, and your rights over your data.`,
  sections: [
    {
      heading: "1. Information We Collect",
      body: [
        "Account details: Email address, username, optional profile details (avatar, bio, phone number, location).",
        "Digital Twin data: Selfies and photos you upload, body measurements (height, weight, age, skin tone), and generated avatar models.",
        "Activity & Usage: Wardrobe items, saved looks, try-on history, and interactions with brand posts and messages.",
      ],
    },
    {
      heading: "2. How We Use Your Information",
      body: [
        "To generate and render high-fidelity digital try-on models.",
        "To personalize styling recommendations, occasion plans, and feed content.",
        "To facilitate messaging and friend interactions within your permission settings.",
        "We do NOT sell your photos, personal information, or biometric representations to third parties.",
      ],
    },
    {
      heading: "3. AI Processing & Third-Party APIs",
      body: [
        "Photos uploaded for virtual try-on are securely processed by our AI inference pipelines solely for the purpose of garment draping.",
        "Images are retained in encrypted storage to power your try-ons and can be deleted by you at any time.",
      ],
    },
    {
      heading: "4. Your Data Rights & Deletion",
      body: [
        "You have the right to access, update, export, or delete your personal data.",
        "You can delete your photos or entire account at any time via your account settings or by contacting privacy@threadflank.com.",
        "Upon deletion request, your uploaded photos and generated looks are permanently purged within 30 days.",
      ],
    },
    {
      heading: "5. Contacting Privacy Support",
      body: [
        "If you have questions about this Privacy Policy or wish to exercise data rights, reach out to us at privacy@threadflank.com.",
      ],
    },
  ] satisfies LegalSection[],
});

export const siteFooter = {
  links: [
    { label: "Pricing", href: "/pricing" },
    { label: "Contact us", href: "/contact" },
    { label: "Terms & conditions", href: "/terms" },
    { label: "Privacy policy", href: "/privacy" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
};
