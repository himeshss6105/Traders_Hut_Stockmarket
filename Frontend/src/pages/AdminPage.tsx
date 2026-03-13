import { useState, useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";

const ADMIN_PASSWORD = "Himeshss@060105"; // you can change this

const AdminPage = () => {
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const handleLogin = () => {
        if (password === ADMIN_PASSWORD) {
            setAuthenticated(true);
            setError("");
        } else {
            setError("Invalid admin password");
        }
    };

    useEffect(() => {
        if (!authenticated) return;
        setLoading(true);
        fetch("${import.meta.env.VITE_API_URL}/api/admin/users", {
            headers: { "x-admin-key": ADMIN_PASSWORD }
        })
            .then(r => r.json())
            .then(data => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { setError("Failed to fetch users"); setLoading(false); });
    }, [authenticated]);

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.profession?.toLowerCase().includes(search.toLowerCase())
    );

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-background text-white flex items-center justify-center">
                <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-10 w-full max-w-md text-center">
                    <div className="text-4xl mb-4">🔐</div>
                    <h1 className="text-2xl font-black mb-2">ADMIN LOGIN</h1>
                    <p className="text-gray-500 text-sm mb-6">Traders Hut Admin Panel</p>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleLogin()}
                        placeholder="Enter admin password"
                        className="w-full bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 mb-4"
                    />
                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                    <button
                        onClick={handleLogin}
                        className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-all"
                    >
                        Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-white">
            <SiteHeader />
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-black">ADMIN <span className="text-green-400">PANEL</span></h1>
                        <p className="text-gray-400 mt-1">Total Users: <span className="text-green-400 font-bold">{users.length}</span></p>
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 w-64"
                    />
                </div>

                {loading && (
                    <div className="text-center py-20">
                        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading users...</p>
                    </div>
                )}

                {!loading && (
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-700 bg-zinc-800">
                                    <th className="text-left px-6 py-4 text-gray-400 text-sm font-semibold">#</th>
                                    <th className="text-left px-6 py-4 text-gray-400 text-sm font-semibold">Name</th>
                                    <th className="text-left px-6 py-4 text-gray-400 text-sm font-semibold">Email</th>
                                    <th className="text-left px-6 py-4 text-gray-400 text-sm font-semibold">Profession</th>
                                    <th className="text-left px-6 py-4 text-gray-400 text-sm font-semibold">Income Range</th>
                                    <th className="text-left px-6 py-4 text-gray-400 text-sm font-semibold">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((user, i) => (
                                    <tr key={user._id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 text-sm">{i + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                                                    {user.name?.[0]?.toUpperCase()}
                                                </div>
                                                <span className="text-white font-medium">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-zinc-700 text-gray-300 text-xs px-2 py-1 rounded-full">{user.profession || "N/A"}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30">{user.incomeRange || "N/A"}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "N/A"}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-500">No users found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
