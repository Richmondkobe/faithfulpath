export type Block =
  | { h2: string }
  | { h3: string }
  | { p: string }
  | { list: string[] };

export type Article = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
  date: string;
  isoDate: string;
  body: Block[];
};

export const AUTHOR = {
  name: "Richmond Donkor",
  credential: "Pastor for over twenty years across ten countries",
  image: "/richmond.jpg",
};
