'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Download, Shield } from 'lucide-react';
import Papa from 'papaparse';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchUsers();
    }
  }, [status, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin');
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const csvData = users.map(user => ({
      'User ID': user.id,
      'Display Name': user.displayName || '',
      'Email': user.email || '',
      'Spotify ID': user.spotifyId,
      'Created At': new Date(user.createdAt).toLocaleDateString(),
      'Fan Score': user.verifications[0]?.fanScore || 'N/A',
      'Quiz Passed': user.verifications[0]?.quizPassed ? 'Yes' : 'No',
      'Quiz Score': user.quizAttempts[0]?.score || 'N/A',
      'Verified At': user.verifications[0]?.verifiedAt 
        ? new Date(user.verifications[0].verifiedAt).toLocaleString()
        : 'N/A',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fangate-verifications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16003b]">
        <div className="text-2xl text-purple-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16003b]">
        <div className="glass-effect p-8 rounded-2xl text-center">
          <Shield className="text-red-400 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16003b] py-12">
      <div className="container mx-auto px-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-purple bg-clip-text text-transparent">
                Admin Panel
              </span>
            </h1>
            <p className="text-gray-400">
              Total Users: {users.length}
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="gradient-purple px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>

        <div className="glass-effect rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Fan Score</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Quiz Score</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Verified At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.image && (
                          <img
                            src={user.image}
                            alt={user.displayName}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium">{user.displayName || 'N/A'}</div>
                          <div className="text-sm text-gray-400">{user.spotifyId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{user.email || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {user.verifications[0] ? (
                        <span className={`font-semibold ${
                          user.verifications[0].fanScore >= 70 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {user.verifications[0].fanScore}
                        </span>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.quizAttempts[0] ? (
                        <span className={`font-semibold ${
                          user.quizAttempts[0].score >= 7 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {user.quizAttempts[0].score}/10
                        </span>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.verifications[0]?.quizPassed ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                          Verified
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm">
                          Not Verified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.verifications[0]?.verifiedAt 
                        ? new Date(user.verifications[0].verifiedAt).toLocaleString()
                        : 'N/A'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
