import React from "react";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className="", children, ...rest }) => (
  <div className={`rounded-xl border bg-white ${className}`} {...rest}>{children}</div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className="", children, ...rest }) => (
  <div className={`px-4 pt-4 ${className}`} {...rest}>{children}</div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className="", children, ...rest }) => (
  <h3 className={`text-xl font-bold ${className}`} {...rest}>{children}</h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className="", children, ...rest }) => (
  <div className={`px-4 pb-4 ${className}`} {...rest}>{children}</div>
);
