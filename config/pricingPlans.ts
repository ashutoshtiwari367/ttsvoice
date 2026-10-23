export type PricingCurrency = "INR" | "USD";

export type PricingPlanType = "free" | "paid";

export interface PricingPrice {
  INR: string;
  USD: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  type: PricingPlanType;
  characters: string;
  description: string;
  price: PricingPrice;
  popular?: boolean;
  tileFeatures: string[];
}

export interface PricingAddOn {
  id: string;
  name: string;
  description: string;
  value: string;
  price: PricingPrice;
  popular?: boolean;
  availableFor?: string[];
}

export interface PricingComparisonItem {
  id: string;
  label: string;
  values: Record<string, string | boolean>;
}

export interface PricingComparisonSection {
  id: string;
  title: string;
  items: PricingComparisonItem[];
}

export interface PricingConfig {
  plans: PricingPlan[];
  addOns?: PricingAddOn[];
  comparisonSections: PricingComparisonSection[];
}

export const pricingConfig: PricingConfig = {
  plans: [
    {
      id: "free",
      name: "Free",
      type: "free",
      characters: "1K / week",
      description:
        "A simple way to try IndianTTS and create voiceovers without paying.",
      price: {
        INR: "₹0",
        USD: "$0",
      },
      tileFeatures: [
        "1K characters every week",
        "MP3 download",
        "24-hour audio retention",
        "Limited voices and languages",
      ],
    },

    {
      id: "micro",
      name: "Micro",
      type: "paid",
      characters: "10K",
      description:
        "A small prepaid pack for short projects, experiments and quick voiceovers.",
      price: {
        INR: "₹29",
        USD: "$1",
      },
      tileFeatures: [
        "10K characters",
        "No ads",
        "MP3 download",
        "24-hour audio retention",
        "Credits valid for 7 days",
      ],
    },

    {
      id: "standard",
      name: "Standard",
      type: "paid",
      characters: "50K",
      description:
        "Your everyday prepaid voice balance. Standard credits never expire.",
      price: {
        INR: "₹99",
        USD: "$2",
      },
      popular: true,
      tileFeatures: [
        "50K characters",
        "No ads",
        "MP3 download",
        "7-day audio retention",
        "Credits never expire",
        "Add-ons available",
      ],
    },
  ],

  addOns: [
    {
      id: "100k-characters",
      name: "100K Characters",
      description: "Add more characters whenever you need them.",
      value: "100K characters",
      price: {
        INR: "₹149",
        USD: "$3",
      },
      availableFor: ["standard"],
    },

    {
      id: "250k-characters",
      name: "250K Characters",
      description: "A larger character boost for bigger projects.",
      value: "250K characters",
      price: {
        INR: "₹299",
        USD: "$4",
      },
      availableFor: ["standard"],
    },

    {
      id: "500k-characters",
      name: "500K Characters",
      description: "Extra capacity for frequent and larger voice projects.",
      value: "500K characters",
      price: {
        INR: "₹499",
        USD: "$6",
      },
      availableFor: ["standard"],
    },
  ],

  comparisonSections: [
    {
      id: "usage",
      title: "Usage",
      items: [
        {
          id: "characters",
          label: "Character allowance",
          values: {
            free: "1K / week",
            micro: "10K",
            standard: "50K",
          },
        },

        {
          id: "creditValidity",
          label: "Credit validity",
          values: {
            free: "Weekly reset",
            micro: "7 days",
            standard: "Never expires",
          },
        },

        {
          id: "recharge",
          label: "Additional character purchases",
          values: {
            free: false,
            micro: false,
            standard: true,
          },
        },
      ],
    },

    {
      id: "audio",
      title: "Audio",
      items: [
        {
          id: "mp3Download",
          label: "MP3 download",
          values: {
            free: true,
            micro: true,
            standard: true,
          },
        },

        {
          id: "audioRetention",
          label: "Audio retention",
          values: {
            free: "24 hours",
            micro: "24 hours",
            standard: "7 days",
          },
        },

        {
          id: "voices",
          label: "Voice access",
          values: {
            free: "Limited",
            micro: "Standard",
            standard: "Standard",
          },
        },

        {
          id: "languages",
          label: "Language access",
          values: {
            free: "Limited",
            micro: "Standard",
            standard: "Standard",
          },
        },
      ],
    },

    {
      id: "experience",
      title: "Experience",
      items: [
        {
          id: "ads",
          label: "Ads",
          values: {
            free: true,
            micro: false,
            standard: false,
          },
        },

        {
          id: "addOns",
          label: "Add-ons",
          values: {
            free: false,
            micro: false,
            standard: true,
          },
        },
      ],
    },
  ],
};

/*
 * Backward-compatible export.
 * Existing components can continue importing pricingPlans
 * while the application moves to the reusable pricingConfig.
 */
export const pricingPlans = pricingConfig.plans;