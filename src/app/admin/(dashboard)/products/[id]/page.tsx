import { notFound } from "next/navigation";
import { getProductAdmin } from "@/actions/products";
import { getCategoriesAdmin } from "@/actions/categories";
import { ProductForm } from "@/components/admin/product-form";
import { ProductWithVariants } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductAdmin(id);
  return {
    title: product ? `Edit ${product.name}` : "Edit Product",
  };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductAdmin(id),
    getCategoriesAdmin(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Edit Product</h1>
        <p className="text-muted-foreground">Update product details</p>
      </div>
      <ProductForm product={product as ProductWithVariants} categories={categories} />
    </div>
  );
}
