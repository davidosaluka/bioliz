import { getCategoriesAdmin } from "@/actions/categories";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = {
  title: "New Product",
};

export default async function NewProductPage() {
  const categories = await getCategoriesAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Add Product</h1>
        <p className="text-muted-foreground">Create a new product listing</p>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
