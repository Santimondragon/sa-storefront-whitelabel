import React from "react";

export type ThreeColumnContentProps = {
  column1?: string | null;
  column2?: string | null;
  column3?: string | null;
};

export function ThreeColumnContent(props: ThreeColumnContentProps) {
  const { column1, column2, column3 } = props;
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <div className="p-4 border rounded">{column1 ?? "Column 1"}</div>
      <div className="p-4 border rounded">{column2 ?? "Column 2"}</div>
      <div className="p-4 border rounded">{column3 ?? "Column 3"}</div>
    </section>
  );
}
