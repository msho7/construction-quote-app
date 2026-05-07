import React from "react";

type PageHeaderProps = {
  title: string;
  subtitle: string;
};

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}