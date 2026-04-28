interface Props {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: Props) {
  return (
    <div className="border-b border-gray-200 pb-4 mb-6">
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
