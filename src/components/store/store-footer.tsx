import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

export function StoreFooter() {
  return (
    <footer className="border-t border-border/50 bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-bold text-white">BIOLIZ GLOBAL SPORT</h3>
            <p className="mt-4 text-sm text-muted-foreground">
              Build your space. Train harder. Play better. Premium gym and sports
              equipment for homes, gyms, hotels, offices and recreation centres.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">Shop</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/shop" className="hover:text-primary">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/quote" className="hover:text-primary">
                  Request a Quote
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">Support</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/contact" className="hover:text-primary">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/order/track" className="hover:text-primary">
                  Track your order
                </Link>
              </li>
              <li>
                <Link href="/delivery-policy" className="hover:text-primary">
                  Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-primary">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-primary">
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>+234 814 330 9703</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>info@biolizglobalsport.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Bioliz Global Sport. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
