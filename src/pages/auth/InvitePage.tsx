import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AlertCircle, Building2, CheckCircle2, Loader2, Mail, Shield, Users } from 'lucide-react';
import { Logo } from './shared';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import { workspaceService, type InvitationResolveResponse } from '@features/workspace';
import type { ApiAxiosError } from '@shared/services/types';

const PENDING_INVITE_TOKEN_KEY = 'trussen-pending-invite-token';

export const InvitePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoaded, isSignedIn, user } = useUser();
  const setWorkspace = useAuthStore((s) => s.setWorkspace);
  const showToast = useToastStore((s) => s.showToast);

  const token = useMemo(() => {
    const fromUrl = searchParams.get('token')?.trim();
    if (fromUrl) {
      window.localStorage.setItem(PENDING_INVITE_TOKEN_KEY, fromUrl);
      return fromUrl;
    }
    return window.localStorage.getItem(PENDING_INVITE_TOKEN_KEY) || '';
  }, [searchParams]);

  const [invite, setInvite] = useState<InvitationResolveResponse | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolveInvite = async () => {
      if (!token) {
        setError('This invitation link is missing a token.');
        setIsResolving(false);
        return;
      }

      setIsResolving(true);
      setError(null);

      try {
        const resolved = await workspaceService.resolveInvitation(token);
        if (!cancelled) setInvite(resolved);
      } catch (err) {
        const apiError = err as ApiAxiosError;
        const code = apiError.response?.data?.error?.code;
        const message = apiError.response?.data?.error?.message;

        switch (code) {
          case 'INVITATION_NOT_FOUND':
            setError('This invitation is no longer valid.');
            break;
          case 'INVITATION_EXPIRED':
            setError('This invitation has expired. Ask the workspace admin to send a new one.');
            break;
          case 'INVITATION_REVOKED':
            setError('This invitation has been cancelled by the workspace admin.');
            break;
          case 'INVITATION_ALREADY_ACCEPTED':
            setError('This invitation has already been accepted.');
            break;
          default:
            setError(message || 'Could not load this invitation.');
        }
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    };

    resolveInvite();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const invitePath = token ? `/invite?token=${encodeURIComponent(token)}` : '/invite';
  const authRedirectParam = encodeURIComponent(invitePath);

  const handleAccept = async () => {
    if (!isLoaded || !invite || !token) return;

    if (!isSignedIn) {
      navigate(`/signup?redirect=${authRedirectParam}`);
      return;
    }

    setIsAccepting(true);
    setError(null);

    try {
      const accepted = await workspaceService.acceptInvitation(token);
      window.localStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
      setWorkspace({
        id: accepted.workspace.id,
        name: accepted.workspace.name,
        slug: accepted.workspace.slug,
        logo: accepted.workspace.logo || undefined,
        role: accepted.role.toLowerCase() as 'owner' | 'admin' | 'member' | 'guest',
      });
      showToast("You're now a member of this workspace.", 'success', 'Invitation accepted');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const apiError = err as ApiAxiosError;
      const code = apiError.response?.data?.error?.code;
      const message = apiError.response?.data?.error?.message;

      switch (code) {
        case 'INVITATION_EMAIL_MISMATCH':
          setError(`This invitation was sent to ${invite.invitedEmail}. Please sign in with that email.`);
          break;
        case 'ALREADY_MEMBER':
          setError("You're already a member of this workspace.");
          break;
        case 'INVITATION_NOT_FOUND':
          setError('This invitation is no longer valid.');
          break;
        case 'INVITATION_EXPIRED':
          setError('This invitation has expired. Ask the workspace admin to send a new one.');
          break;
        case 'INVITATION_REVOKED':
          setError('This invitation has been cancelled.');
          break;
        case 'INVITATION_ALREADY_ACCEPTED':
          setError('This invitation has already been accepted.');
          break;
        default:
          setError(message || 'Could not accept this invitation.');
      }
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-bg-dark selection:bg-primary/30">
      <div className="px-5 sm:px-8 py-5">
        <Logo />
      </div>

      <main className="min-h-[calc(100vh-88px)] flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="border border-gray-200 dark:border-border-dark rounded-xl bg-white dark:bg-card-dark shadow-sm overflow-hidden">
            <div className="px-6 py-6 border-b border-gray-100 dark:border-border-dark">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Mail size={20} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight dark:text-white">Workspace invitation</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Review the invitation details before joining.
              </p>
            </div>

            <div className="p-6">
              {isResolving ? (
                <div className="flex items-center justify-center py-14 text-gray-400">
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Loading invitation...
                </div>
              ) : error && !invite ? (
                <div className="flex flex-col items-center text-center py-10">
                  <AlertCircle size={28} className="text-red-500 mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
                </div>
              ) : invite ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    {invite.workspaceLogo ? (
                      <img
                        src={invite.workspaceLogo}
                        alt={invite.workspaceName}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-100 dark:border-border-dark"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-base font-bold">
                        {invite.workspaceName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-400">You've been invited to</p>
                      <p className="font-bold text-gray-900 dark:text-white">{invite.workspaceName}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <InviteDetail icon={<Shield size={15} />} label="Role" value={invite.role.toLowerCase()} />
                    <InviteDetail icon={<Users size={15} />} label="Team" value={invite.teamName} />
                    <InviteDetail icon={<Building2 size={15} />} label="Department" value={invite.departmentName || 'No department'} />
                    <InviteDetail icon={<Mail size={15} />} label="Invited email" value={invite.invitedEmail} />
                  </div>

                  {isSignedIn && user?.primaryEmailAddress?.emailAddress && (
                    <p className="text-xs text-gray-400">
                      Signed in as {user.primaryEmailAddress.emailAddress}
                    </p>
                  )}

                  {error && (
                    <div className="flex gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleAccept}
                    disabled={!isLoaded || isAccepting}
                    className="w-full px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAccepting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {isSignedIn ? 'Accept Invitation' : 'Sign up to accept'}
                  </button>

                  {!isSignedIn && (
                    <button
                      onClick={() => navigate(`/login?redirect=${authRedirectParam}`)}
                      className="w-full text-sm text-gray-500 hover:text-primary transition-colors"
                    >
                      Already have an account? Log in
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const InviteDetail: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-black/20 px-3 py-2.5">
    <span className="text-gray-400">{icon}</span>
    <span className="text-gray-400 min-w-24">{label}</span>
    <span className="font-semibold text-gray-800 dark:text-gray-200 ml-auto text-right">{value}</span>
  </div>
);
