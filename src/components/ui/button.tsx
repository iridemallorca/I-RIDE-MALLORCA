import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
};

export const Button: React.FC<Props> = ({ variant="default", size="md", className="", ...rest }) => {
  const base = "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = variant === "outline"
    ? "border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
    : "bg-neutral-900 text-white hover:bg-neutral-800";
  const sizes = size === "lg" ? "h-11 px-6 text-base" : size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-sm";
  return <button className={`${base} ${variants} ${sizes} ${className}`} {...rest} />;
};

export default Button;
