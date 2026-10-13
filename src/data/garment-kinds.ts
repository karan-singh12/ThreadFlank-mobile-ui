/**
 * Indian garment kinds the try-on treats specially (feature #17, ethnic-wear-first).
 * `draped` garments are redrawn whole by the two-image engine; the rest go through
 * IDM-VTON with garment-specific drape guidance in the prompt.
 */
export type GarmentKind = {
  id: string;
  label: string;
  category: "upper_body" | "lower_body" | "dresses";
  draped: boolean;
  drape: string;
};

export const ETHNIC_GARMENTS: GarmentKind[] = [
  {
    id: "saree",
    label: "Saree",
    category: "dresses",
    draped: true,
    drape:
      "Drape it in the classic Nivi style: pleats tucked at the front waist falling straight to the ankles, the pallu taken over the left shoulder and falling down the back, with a fitted matching blouse.",
  },
  {
    id: "lehenga",
    label: "Lehenga choli",
    category: "dresses",
    draped: true,
    drape:
      "A flared, floor-length lehenga skirt with full volume, a fitted choli blouse, and the dupatta pinned on one shoulder or draped across both arms.",
  },
  {
    id: "anarkali",
    label: "Anarkali",
    category: "dresses",
    draped: true,
    drape: "A long frock-style anarkali kurta flaring from the high waist to below the knee, with churidar leggings and the dupatta over one shoulder.",
  },
  {
    id: "sharara",
    label: "Sharara / gharara set",
    category: "dresses",
    draped: true,
    drape: "A short or mid-length kurti over wide, flared sharara pants that fall to the floor, with the dupatta draped over the shoulders.",
  },
  {
    id: "sherwani",
    label: "Sherwani",
    category: "dresses",
    draped: false,
    drape: "A structured knee-length sherwani with a mandarin collar and front buttons, worn over churidar or straight pants.",
  },
  {
    id: "kurta-set",
    label: "Kurta set",
    category: "dresses",
    draped: false,
    drape: "A straight kurta falling to the knee or mid-thigh with side slits, worn over matching pyjama, churidar or palazzo pants.",
  },
  {
    id: "kurta",
    label: "Kurta / kurti",
    category: "upper_body",
    draped: false,
    drape: "A straight kurta falling to the hip or knee with side slits; keep the neckline and sleeve length from the product image.",
  },
  {
    id: "dupatta",
    label: "Dupatta / stole",
    category: "upper_body",
    draped: true,
    drape: "Add the dupatta draped over both shoulders with the ends falling at the front, keeping the rest of the outfit unchanged.",
  },
  {
    id: "nehru-jacket",
    label: "Nehru jacket",
    category: "upper_body",
    draped: false,
    drape: "A sleeveless Nehru jacket with a mandarin collar worn over a kurta.",
  },
];
