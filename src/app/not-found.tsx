import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="mb-2 text-4xl font-bold text-white">404</h2>
      <p className="mb-2 text-xl text-white">Page not found</p>
      <p className="mb-6 max-w-md text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <a href="/shop" className={buttonVariants({ variant: "default" })}>
        Continue shopping
      </a>
    </div>
  );
}
