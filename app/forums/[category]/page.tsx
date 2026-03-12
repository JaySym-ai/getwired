import type { Metadata } from "next";
import { CategoryFeedClient } from "./CategoryFeedClient";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const name = slug.replace(/-/g, " ");
  const desc = `Browse posts in ${name}`;
  return {
    title: name,
    description: desc,
    openGraph: {
      title: `${name} | Forums | GetWired.dev`,
      description: desc,
    },
    twitter: {
      card: "summary",
      title: `${name} | Forums | GetWired.dev`,
      description: desc,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  return <CategoryFeedClient slug={category} />;
}
