import React from 'react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="text-xl text-gray-600 mt-4">Page not found</p>
        <p className="text-gray-500 mt-2">The page you're looking for doesn't exist or has been moved.</p>
        <Link href="/">
          <a className="mt-6 inline-block px-6 py-2 bg-primary text-white rounded-lg">
            Go back home
          </a>
        </Link>
      </div>
    </div>
  );
}