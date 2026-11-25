export type ProjectType = "systems" | "web" | "experiments";

export interface ColouristCredit {
  role: string;
  title: string;
  link?: string;
}

export interface ColouristProject {
  slug: string;
  client: string;
  title: string;
  type: ProjectType;
  year: string;
  /** Swatch shown beside the centred row of the list carousel. */
  tileColor?: string;
  /** Original project graphic shown in the grid and project details. */
  poster: string;
  credits: ColouristCredit[];
  description?: string;
  stack?: string;
  href?: string;
  source?: string;
}

export interface ColouristSite {
  socials?: { label: string; href: string }[];
  name: string;
  email: string;
  instagramUrl: string;
  instagramHandle: string;
  location: string;
  timezone: string;
  /** Role word that takes the cursor hue on the home title. */
  role: string;
  titleSuffix: string;
  subTitle: string;
  /** Info screen paragraphs; blank lines become line breaks. */
  description: string;
  featuredLogos: string[];
  builtBy: { label: string; href: string };
}

