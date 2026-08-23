export type Guide = {
  slug: string;
  title: string;
  subtitle: string;
  price: string;
  pages: string;
  description: string;
  contents: string[];
  forWho: string;
  checkoutUrl: string;
};

export const GUIDES: Guide[] = [];
