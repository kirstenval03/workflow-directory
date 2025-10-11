export default function AdminNavbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex space-x-6 items-center">
          <h1 className="text-lg font-semibold text-gray-800">AI-Architechs Admin</h1>
          <a href="/admin" className="text-gray-600 hover:text-blue-600">Jobs</a>
          <a href="/admin/applications" className="text-gray-600 hover:text-blue-600">Applications</a>
          <a href="/admin/candidates" className="text-gray-600 hover:text-blue-600">Candidates</a>
        </div>
        <button className="text-gray-500 hover:text-red-600">Logout</button>
      </div>
    </nav>
  );
}
