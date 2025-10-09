import { MoveRight, PhoneCall } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";

function CTA() {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="flex flex-col text-center bg-muted rounded-md p-4 lg:p-14 gap-8 items-center">
          <div>
            <Badge>Get started</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular">
              Try our platform today!
            </h3>
            <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl">
              Managing a small business today is already tough. Avoid further
              complications by ditching outdated, tedious trade methods. Our goal
              is to streamline SMB trade, making it easier and faster than ever.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="gap-4" variant="outline">
              Jump on a call <PhoneCall className="w-4 h-4" />
            </Button>
            <Button asChild className="gap-4">
              <Link to="/sign-up">
                Sign up here <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild className="gap-4 !bg-blue-600 !text-white !hover:bg-blue-700 !border-blue-600 border">
              <Link to="/sign-in">
                Login <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { CTA };