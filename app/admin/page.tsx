'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Download, Shield, ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';
import Footer from '@/components/Footer';

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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75" />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
        <div className="glass-effect p-8 rounded-xl text-center max-w-md">
          <Shield className="text-red-400 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
              Admin Panel
            </h1>
            <p className="text-white/60 text-sm sm:text-base">
              Total Users: {users.length}
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        <div className="glass-effect rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-white/90">User</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-white/90 hidden sm:table-cell">Email</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-white/90">Fan Score</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-white/90">Quiz Score</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-white/90">Status</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-white/90 hidden md:table-cell">Verified At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.image && (
                          <img
                            src={user.image}
                            alt={user.displayName}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium text-white text-sm">{user.displayName || 'N/A'}</div>
                          <div className="text-xs text-white/40 sm:hidden">{user.email || 'N/A'}</div>
                          <div className="text-xs text-white/40 hidden sm:block">{user.spotifyId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-white/70 hidden sm:table-cell">{user.email || 'N/A'}</td>
                    <td className="px-4 sm:px-6 py-4">
                      {user.verifications[0] ? (
                        <span className={`font-semibold text-sm ${
                          user.verifications[0].fanScore >= 70 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {user.verifications[0].fanScore}
                        </span>
                      ) : (
                        <span className="text-white/40 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {user.quizAttempts[0] ? (
                        <span className={`font-semibold text-sm ${
                          user.quizAttempts[0].score >= 7 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {user.quizAttempts[0].score}/10
                        </span>
                      ) : (
                        <span className="text-white/40 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {user.verifications[0]?.quizPassed ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-white/10 text-white/60 rounded-full text-xs font-medium">
                          Not Verified
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-white/60 hidden md:table-cell">
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
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
