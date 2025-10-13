import { GetStartedButton } from "~/components/ui/get-started-button";
import { Link } from "react-router";

interface LovableCTASectionProps {
  isSignedIn?: boolean;
}

export const LovableCTASection = ({ isSignedIn = false }: LovableCTASectionProps) => {
  return (
    <div className="w-full py-12 lg:py-20">
      <div className="container mx-auto">
        <div className="flex flex-col text-center p-4 lg:p-14 gap-8 items-center">
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
          <div className="flex justify-center">
            <Link to={isSignedIn ? "/dashboard" : "/sign-up"}>
              <GetStartedButton />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};