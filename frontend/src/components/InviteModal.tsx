"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2, Mail, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  ModalFooter,
  ModalHeader,
  ModalShell,
} from "@/components/ui";

interface InviteModalProps {
  gameId: string;
  onClose: () => void;
}

interface InviteResponse {
  inviteUrl: string;
  expiresAt: string;
  tokenId: string;
}

export default function InviteModal({ gameId, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [invite, setInvite] = useState<InviteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createInvite = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiFetch(`/api/v1/auth/invite-links/${gameId}`, {
          method: "POST",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "Failed to generate invite link");
        }

        setInvite(data.invite);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate invite link",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void createInvite();
  }, [gameId]);

  const handleCopyLink = async () => {
    if (!invite?.inviteUrl) return;

    try {
      await navigator.clipboard.writeText(invite.inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (_err) {
      setError("Could not copy invite link");
    }
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      maxWidthClassName="max-w-xl"
      opaqueBackdrop
    >
      <ModalHeader
        icon={Users}
        title="Invite Players"
        subtitle="Share a single-use game link"
        onClose={onClose}
      />

      <div className="p-5">
        {isLoading ? (
          <Alert variant="neutral" className="text-center">
            Generating invite link...
          </Alert>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : invite ? (
          <div className="space-y-4">
            <Card className="p-4" variant="secondary">
              <Field
                label={
                  <span className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" aria-hidden="true" />
                    Invite URL
                  </span>
                }
              >
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Input
                    type="text"
                    readOnly
                    value={invite.inviteUrl}
                    onClick={(event) => event.currentTarget.select()}
                    className="min-w-0"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCopyLink}
                    style={
                      copied
                        ? {
                            backgroundColor: "var(--success)",
                            color: "white",
                          }
                        : undefined
                    }
                  >
                    {copied ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </Field>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="p-4" variant="secondary">
                <p
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Expires
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {new Date(invite.expiresAt).toLocaleString()}
                </p>
              </Card>
              <Card className="p-4" variant="secondary">
                <p
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Access
                </p>
                <p className="mt-1 text-sm font-semibold">
                  Single use after join
                </p>
              </Card>
            </div>

            <Card className="p-4" variant="accent">
              <div className="flex gap-3">
                <Mail
                  className="mt-0.5 h-5 w-5 shrink-0"
                  style={{ color: "var(--primary)" }}
                  aria-hidden="true"
                />
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Send this link through your approved chat or email channel.
                  The recipient can sign in with IBM W3ID and join this room
                  directly.
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </div>

      <ModalFooter>
        <Button type="button" onClick={onClose} className="w-full">
          Close
        </Button>
      </ModalFooter>
    </ModalShell>
  );
}

// Made with Bob
