export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-[3px] border-black shadow-hard p-8 ${className}`}>
      {children}
    </div>
  );
}
