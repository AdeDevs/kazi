import React, { useCallback, useEffect, useState } from 'react';
import { Laptop, LogOut, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader } from '../ui/Card';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { listSessions, revokeSession, revokeSessions } from '../../lib/authApi';
import { SessionInfo } from '../../types/auth';

// The backend stores session times in UTC but sends them without a timezone suffix.
function parseServerTime(value: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
}

function describeDevice(userAgent?: string | null): { label: string; isMobile: boolean } {
  const ua = userAgent || '';
  const os =
    /iPhone/.test(ua) ? 'iPhone'
    : /iPad/.test(ua) ? 'iPad'
    : /Android/.test(ua) ? 'Android'
    : /Mac OS X|Macintosh/.test(ua) ? 'Mac'
    : /Windows/.test(ua) ? 'Windows'
    : /Linux/.test(ua) ? 'Linux'
    : null;
  const browser =
    /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\/|CriOS\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : null;
  const label = browser && os ? `${browser} on ${os}` : os || browser || 'Unknown device';
  return { label, isMobile: /iPhone|Android|Mobile/.test(ua) };
}

function timeAgo(date: Date): string {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

const dateFormat = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

interface SessionsSectionProps {
  /** Called after every session is revoked, to finish signing out locally. */
  onSignedOutEverywhere: () => void;
}

export const SessionsSection: React.FC<SessionsSectionProps> = ({ onSignedOutEverywhere }) => {
  const { isDemo } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionToRevoke, setSessionToRevoke] = useState<SessionInfo | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const list = await listSessions();
      list.sort((a, b) => parseServerTime(b.last_used_at).getTime() - parseServerTime(a.last_used_at).getTime());
      setSessions(list);
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load your sessions.');
    }
  }, []);

  useEffect(() => {
    if (!isDemo) load();
  }, [isDemo, load]);

  const handleRevoke = async () => {
    const target = sessionToRevoke;
    if (!target) return;
    setRevokingId(target.id);
    try {
      await revokeSession(target.id);
      setSessions(prev => (prev ? prev.filter(s => s.id !== target.id) : prev));
      toast.success(`${describeDevice(target.user_agent).label} has been signed out.`);
    } catch (err: any) {
      toast.error(err?.message || 'Could not sign out that device. Try again.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    setIsRevokingAll(true);
    try {
      await revokeSessions();
      toast.success('Signed out of every device.');
      onSignedOutEverywhere();
    } catch (err: any) {
      toast.error(err?.message || 'Could not sign out of every device. Try again.');
      setIsRevokingAll(false);
    }
  };

  return (
    <Card className="space-y-4">
      <CardHeader title="Active Devices & Sessions" subtitle="Devices currently signed in to this KaziHub account." />

      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        {isDemo ? (
          <p className="py-3 text-[11px] text-slate-500">Not available on the demo account.</p>
        ) : loadError ? (
          <div className="py-3 flex items-center justify-between gap-3">
            <p className="text-[11px] text-rose-600 dark:text-rose-400">{loadError}</p>
            <button type="button" onClick={load} className="font-bold text-navy-800 dark:text-navy-400 hover:underline cursor-pointer shrink-0">
              Try again
            </button>
          </div>
        ) : sessions === null ? (
          <p className="py-3 text-[11px] text-slate-500">Loading your devices…</p>
        ) : sessions.length === 0 ? (
          <p className="py-3 text-[11px] text-slate-500">No active sessions found.</p>
        ) : (
          sessions.map((session) => {
            const { label, isMobile } = describeDevice(session.user_agent);
            const DeviceIcon = isMobile ? Smartphone : Laptop;
            return (
              <div key={session.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                    <DeviceIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{label}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Active {timeAgo(parseServerTime(session.last_used_at))}
                      {' · '}Signed in {dateFormat.format(parseServerTime(session.created_at))}
                      {session.ip_address ? ` · ${session.ip_address}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSessionToRevoke(session)}
                  disabled={revokingId === session.id}
                  className="px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {revokingId === session.id ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {!isDemo && sessions && sessions.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-500 max-w-md">
            KaziHub can’t yet tell which of these is the device you’re using now.
          </p>
          <button
            type="button"
            onClick={() => setShowRevokeAll(true)}
            disabled={isRevokingAll}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isRevokingAll ? 'Signing out…' : 'Sign Out of All Devices'}</span>
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={Boolean(sessionToRevoke)}
        onClose={() => setSessionToRevoke(null)}
        onConfirm={handleRevoke}
        title="Sign Out This Device?"
        description={`${describeDevice(sessionToRevoke?.user_agent).label} will need to sign in again. If it’s the device you’re using now, you’ll be signed out here too.`}
        confirmText="Yes, Sign Out Device"
        cancelText="Keep Signed In"
        type="logout"
      />

      <ConfirmationModal
        isOpen={showRevokeAll}
        onClose={() => setShowRevokeAll(false)}
        onConfirm={handleRevokeAll}
        title="Sign Out of All Devices?"
        description="Every device signed in to your account, including this one, will need to sign in again."
        confirmText="Yes, Sign Out Everywhere"
        cancelText="Keep Signed In"
        type="logout"
      />
    </Card>
  );
};
