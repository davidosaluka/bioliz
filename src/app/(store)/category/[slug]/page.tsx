import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getCategoryBySlug, getProducts } from "@/lib/data";
import { createMetadata } from "@/lib/metadata";
import { ProductGrid } from "@/components/store/product-grid";
import { BreadcrumbJsonLd } from "@/components/store/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category" };
  return createMetadata({
    title: `Buy ${category.name} in Nigeria`,
    description:
      category.description ??
      `Shop ${category.name} at Bioliz Global Sport. Delivery available across Nigeria.`,
    path: `/category/${category.slug}`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const { products } = await getProducts({ category: slug });

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: category.name, path: `/category/${category.slug}` },
        ]}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white">{category.name}</h1>
      {category.description && (
        <p className="mt-2 text-muted-foreground">{category.description}</p>
      )}
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </div>
    </>
  );
}
