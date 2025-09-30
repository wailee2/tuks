import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

// Services (paths assume services live at ../services/*)
import { fetchOrders } from '../services/order';
import { getTickets } from '../services/support';
import { getAllUsers } from '../services/admin';
import { getUserInventory } from '../services/inventory';
import { getProfile } from '../services/profile';

// Recharts (used for pie + line charts)
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

// Small presentational stat card component
const StatCard = ({ title, value, subtitle, children }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
    <div className="flex justify-between items-start">
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
      </div>
      {children}
    </div>
  </div>
);

// Tiny utility for colors
const STATUS_COLORS = {
  OPEN: '#F59E0B',
  ASSIGNED: '#06B6D4',
  RESOLVED: '#10B981',
  CLOSED: '#9CA3AF',
};
const PRIORITY_COLORS = {
  LOW: '#60A5FA',
  MEDIUM: '#FBBF24',
  HIGH: '#F97316',
  URGENT: '#EF4444',
};

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const token = user?.token; // if your auth stores token directly

  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState({ total: 0, available: 0 });
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week'); // week | month | 3months

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Fetch orders
        const ordersRes = await fetchOrders();
        if (!mounted) return;
        setOrders(Array.isArray(ordersRes) ? ordersRes : []);

        // Tickets (support/admin: backend may return all tickets for admin or only user's tickets)
        const ticketsRes = await getTickets(token, {});
        if (!mounted) return;
        setTickets(Array.isArray(ticketsRes) ? ticketsRes : []);

        // Inventory - get user inventory (for available items) and derive totals
        const invRes = await getUserInventory();
        // invRes could be array of products
        const myItems = Array.isArray(invRes) ? invRes : [];
        const availableCount = myItems.reduce((acc, p) => acc + (p.quantityAvailable ?? 0), 0);
        const totalCount = myItems.length;
        setInventory({ total: totalCount, available: availableCount });

        // Users (admin/owner only)
        if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
          const usersRes = await getAllUsers(token);
          setUsers(Array.isArray(usersRes) ? usersRes : []);
        }

        // Profile (followers/following + posts activity)
        if (user?.username) {
          const profRes = await getProfile(user.username, token);
          setProfile(profRes || null);
        }
      } catch (err) {
        // console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token, user?.role, user?.username]);

  if (!user) return <p className="p-6">Please login</p>;

  // --- Tickets aggregation ---
  const ticketStatusCounts = tickets.reduce(
    (acc, t) => {
      const s = (t.status || 'OPEN').toUpperCase();
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    { OPEN: 0, ASSIGNED: 0, RESOLVED: 0, CLOSED: 0 }
  );

  const ticketPriorityCounts = tickets.reduce(
    (acc, t) => {
      const p = (t.priority || 'LOW').toUpperCase();
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    },
    { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 }
  );

  const ticketStatusData = Object.entries(ticketStatusCounts).map(([name, value]) => ({ name, value }));
  const ticketPriorityData = Object.entries(ticketPriorityCounts).map(([name, value]) => ({ name, value }));


  const followers = profile?.followers_count ?? profile?.followers ?? 0;
  const following = profile?.following_count ?? profile?.following ?? 0;

 
  const buildActivitySeries = (period) => {
    const raw = Array.isArray(profile?.postsActivity) ? profile.postsActivity : [];
    // Fallback: if no activity data, synthesize from orders/tickets as placeholder
    if (!raw.length) {
      // create last 7 days or 30 days placeholder
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      const list = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        list.push({ date: d.toISOString().slice(0, 10), count: Math.floor(Math.random() * 5) });
      }
      return list;
    }

    // Filter depending on period
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));

    // normalize and aggregate by date
    const map = {};
    raw.forEach((p) => {
      const d = p.date?.slice(0, 10) || new Date(p.createdAt || p.created_at || Date.now()).toISOString().slice(0, 10);
      if (new Date(d) >= cutoff) {
        map[d] = (map[d] || 0) + (p.count ?? 1);
      }
    });

    // fill missing dates
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ date: key, count: map[key] || 0 });
    }
    return out;
  };

  const activitySeries = buildActivitySeries(timeframe);

  // Colors for pies
  const renderStatusCells = ticketStatusData.map((entry) => (
    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#ccc'} />
  ));
  const renderPriorityCells = ticketPriorityData.map((entry) => (
    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? '#ccc'} />
  ));

  // Orders list - show latest 5
  const latestOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  };

  // Roles summary
  const rolesSummary = users.reduce((acc, u) => {
    acc.total = (acc.total || 0) + 1;
    const r = (u.role || 'USER').toUpperCase();
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <main className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
            <p className="text-sm text-gray-500">Role: <span className="font-medium">{user.role}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Logout</button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
          {/* Orders stat */}
          <StatCard title="Orders" value={orders.length} subtitle="Total orders (your account)">
            <div className="text-xs text-gray-400">Latest: {latestOrders[0]?.id ?? '—'}</div>
          </StatCard>

          {/* Inventory stat */}
          <StatCard title="Inventory" value={inventory.total} subtitle={`Available items: ${inventory.available}`}>
            <div className="text-xs text-gray-400">Your items</div>
          </StatCard>

          {/* Followers / Following */}
          <StatCard title="Followers / Following" value={`${followers} / ${following}`} subtitle="Social reach">
            <div className="text-xs text-gray-400">Posts: {profile?.postsCount ?? '-'}</div>
          </StatCard>
        </section>

        {/* Tickets section (only show to SUPPORT, ADMIN, OWNER) */}
        {(user.role === 'SUPPORT' || user.role === 'ADMIN' || user.role === 'OWNER') && (
          <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <StatCard title="Support Tickets" value={tickets.length} subtitle="Total tickets">
                <div className="text-xs text-gray-400">Assigned to you: {tickets.filter(t => t.assignee === user.id).length}</div>
              </StatCard>

              <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="text-sm font-medium mb-2">Ticket Status</div>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ticketStatusData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={60} label />
                      {renderStatusCells}
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-sm font-medium mt-4 mb-2">Ticket Priority</div>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ticketPriorityData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={60} label />
                      {renderPriorityCells}
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Tickets Overview</h2>
                  <div className="text-sm text-gray-500">Updated live</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500">Open</div>
                    <div className="text-xl font-semibold">{ticketStatusCounts.OPEN}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500">Assigned</div>
                    <div className="text-xl font-semibold">{ticketStatusCounts.ASSIGNED}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500">Resolved</div>
                    <div className="text-xl font-semibold">{ticketStatusCounts.RESOLVED}</div>
                  </div>
                </div>

                {/* latest tickets list */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Latest tickets</h3>
                  <ul className="space-y-2 max-h-48 overflow-auto">
                    {tickets.slice(0, 6).map((t) => (
                      <li key={t.id} className="flex items-center justify-between p-2 bg-white rounded-md border">
                        <div>
                          <div className="text-sm font-medium">{t.title ?? `#${t.id}`}</div>
                          <div className="text-xs text-gray-400">{t.requesterName ?? t.requester ?? 'Unknown'}</div>
                        </div>
                        <div className="text-xs text-gray-500">{(t.priority || 'LOW').toUpperCase()}</div>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* Orders list card */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Orders</h2>
                <div className="text-sm text-gray-500">Showing latest 5</div>
              </div>

              <ul className="space-y-2">
                {latestOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between p-3 bg-white rounded-md border">
                    <div>
                      <div className="font-medium">Order #{o.id}</div>
                      <div className="text-xs text-gray-400">{formatDate(o.createdAt)}</div>
                    </div>
                    <div className="text-sm text-gray-600">{o.status ?? '—'}</div>
                  </li>
                ))}

                {!latestOrders.length && <div className="text-sm text-gray-400">No orders yet</div>}
              </ul>
            </div>
          </div>

          {/* Roles & Users (Owner/Admin only) */}
          {(user.role === 'OWNER' || user.role === 'ADMIN') && (
            <div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-2">Users & Roles</h2>
                <div className="text-sm text-gray-500 mb-3">Total users: {rolesSummary.total ?? users.length}</div>
                <div className="space-y-2">
                  {Object.entries(rolesSummary)
                    .filter(([k]) => k !== 'total')
                    .map(([roleKey, count]) => (
                      <div key={roleKey} className="flex justify-between bg-gray-50 p-2 rounded-md">
                        <div className="text-sm">{roleKey}</div>
                        <div className="font-medium">{count}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Activity chart (followers/posts) */}
        <section className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Activity — Posts / Engagement</h2>
            <div className="flex items-center gap-2">
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="text-sm border rounded p-1">
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="3months">Last 90 days</option>
              </select>
            </div>
          </div>

          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activitySeries} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" name="Posts" stroke="#0EA5A4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* footer small */}
        <footer className="mt-6 text-xs text-gray-400">Dashboard · clean UI · no sidebar</footer>
      </main>
    </div>
  );
}
