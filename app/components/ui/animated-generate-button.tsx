import * as React from "react";
import clsx from "clsx";
import { Sparkles } from "lucide-react";

export type AnimatedGenerateButtonProps = {
  className?: string;
  labelIdle?: string;
  labelActive?: string;
  generating?: boolean;
  highlightHueDeg?: number;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  variant?: "filled" | "outline";
};

export default function AnimatedGenerateButton({
  className,
  labelIdle = "Generate",
  labelActive = "Generating",
  generating = false,
  highlightHueDeg = 210,
  onClick,
  type = "button",
  disabled = false,
  id,
  ariaLabel,
  variant = "filled",
}: AnimatedGenerateButtonProps) {
  const isOutline = variant === "outline";
  
  return (
    <div className={clsx("relative inline-block", className)} id={id}>
      <button
        type={type}
        aria-label={ariaLabel || (generating ? labelActive : labelIdle)}
        aria-pressed={generating}
        disabled={disabled}
        onClick={onClick}
        className={clsx(
          "relative flex items-center justify-center rounded-[24px] font-medium",
          "px-4 py-3 sm:px-6 sm:py-3",
          "text-white text-sm sm:text-base",
          "transition-all duration-300",
          "transform hover:scale-105 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900",
          disabled && "opacity-60 cursor-not-allowed hover:scale-100",
          generating && "animate-pulse",
          isOutline
            ? "border-2 border-white/70 hover:border-white/100 hover:shadow-lg hover:shadow-white/20 shadow-none bg-transparent"
            : "border border-gray-600/30 shadow-lg hover:shadow-xl",
          className
        )}
        style={{
          backgroundColor: isOutline 
            ? "transparent" 
            : (generating ? "#050505" : "#0A0A0A")
        }}
      >
        <Sparkles
          className={clsx(
            "mr-2 h-4 w-4 sm:h-5 sm:w-5",
            generating ? "animate-spin text-white" : "text-white/90"
          )}
        />
        <div className="relative flex items-center">
          <span
            className={clsx(
              "transition-opacity duration-300",
              generating ? "opacity-0" : "opacity-100"
            )}
          >
            {labelIdle}
          </span>
          <span
            className={clsx(
              "absolute inset-0 flex items-center transition-opacity duration-300",
              generating ? "opacity-100" : "opacity-0"
            )}
          >
            {labelActive}
          </span>
        </div>
      </button>
    </div>
  );
}