import Link from 'next/link';

interface LogoProps {
  href?: string;
  className?: string;
}

export default function Logo({ href = '/dashboard', className = '' }: LogoProps) {
  return (
    <Link href={href} className={`flex items-center space-x-2 ${className}`}>
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">ES</span>
      </div>
      <span className="text-xl font-bold text-gray-900">ExpenseSplitter</span>
    </Link>
  );
}
