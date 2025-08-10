import React, { useEffect, useState } from "react";
import { getNetworkStats } from "../../api/users";

const NetworkStats: React.FC = () => {
  const [stats, setStats] = useState<{followers: number, following: number, mutualConnections: number, networkReach: number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const networkStats = await getNetworkStats();
        setStats(networkStats);
      } catch (err) {
        console.error("Failed to fetch network stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div>Loading network stats...</div>;
  if (!stats) return null;

  return (
    <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, margin: '16px 0' }}>
      <h3>Your Network</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div>
          <strong>{stats.followers}</strong>
          <div>Followers</div>
        </div>
        <div>
          <strong>{stats.following}</strong>
          <div>Following</div>
        </div>
        <div>
          <strong>{stats.mutualConnections}</strong>
          <div>Mutual Follows</div>
        </div>
        <div>
          <strong>{stats.networkReach}</strong>
          <div>Network Reach</div>
        </div>
      </div>
    </div>
  );
};

export default NetworkStats;