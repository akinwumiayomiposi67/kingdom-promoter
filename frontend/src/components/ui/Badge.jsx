const STATUS_MAP = {
  pending:   'bg-yellow-100 text-yellow-800',
  paid:      'bg-green-100 text-green-800',
  failed:    'bg-red-100 text-red-800',
  active:    'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

export default function Badge({ status }) {
  const classes = STATUS_MAP[status] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${classes}`}>
      {status}
    </span>
  );
}
