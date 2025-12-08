import * as React from "react";
import { Outlet } from "react-router-dom";

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Palmer Living Reality</h1>
            <nav className="space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900">Dashboard</a>
              <a href="/properties" className="text-gray-600 hover:text-gray-900">Properties</a>
              <a href="/tenants" className="text-gray-600 hover:text-gray-900">Tenants</a>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
