import type { ReactNode } from 'react';

/**
 * Horizontal snap-scroll row on mobile, CSS grid from md upwards.
 * Pass grid column classes (e.g. "md:grid-cols-3") via className.
 */
export default function ScrollRow({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0 [&>*]:w-[78%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[46%] md:[&>*]:w-auto ${className}`}
    >
      {children}
    </div>
  );
}
