export default function PageHeader({ title, description, action, badge }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          {badge && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-slate-500 text-sm mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
