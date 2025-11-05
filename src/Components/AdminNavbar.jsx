import { ReactComponent as BlackLogo } from "../styles/Black-SVG-Landscape.svg";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AdminNavbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* Left Section: Logo + Nav Links */}
        <div className="flex items-center space-x-8">
          <a href="/admin" className="flex items-center space-x-2">
            <BlackLogo className="h-10 w-auto" />
          </a>

          <div className="hidden sm:flex space-x-6">
            <a
              href="/admin"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Jobs
            </a>
            <a
              href="/admin/applications"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Applications
            </a>
            <a
              href="/admin/candidates"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Qualified Architechs
            </a>

            <a
              href="/admin/clients"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Clients
            </a>
          </div>
        </div>

        {/* Right Section: Logout Button */}
        <button
          onClick={handleLogout}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-lg font-medium hover:opacity-90 shadow-sm transition-all"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
