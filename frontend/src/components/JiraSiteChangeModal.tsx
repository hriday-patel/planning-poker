"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import {
  Alert,
  Button,
  Field,
  Input,
  ModalFooter,
  ModalHeader,
  ModalShell,
} from "@/components/ui";

interface JiraSiteChangeModalProps {
  currentSiteUrl: string;
  onClose: () => void;
  onSave: (siteUrl: string) => Promise<void>;
}

export default function JiraSiteChangeModal({
  currentSiteUrl,
  onClose,
  onSave,
}: JiraSiteChangeModalProps) {
  const [siteUrl, setSiteUrl] = useState(currentSiteUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!siteUrl.trim()) {
      setError("Enter a Jira site URL");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(siteUrl.trim());
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update Jira site",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell isOpen onClose={onClose} maxWidthClassName="max-w-md">
      <ModalHeader
        icon={Globe}
        title="Change Jira Site"
        subtitle="Update the Jira site used for sprint imports."
        onClose={onClose}
      />

      <div className="space-y-5 overflow-y-auto p-5">
        {error && <Alert variant="danger">{error}</Alert>}

        <Field
          label="Jira site"
          helperText="Must be an HTTPS URL, e.g. https://jsw.ibm.com/secure/Dashboard.jspa"
        >
          <Input
            value={siteUrl}
            onChange={(event) => setSiteUrl(event.target.value)}
            placeholder="https://jsw.ibm.com/secure/Dashboard.jspa"
            autoComplete="url"
            autoFocus
          />
        </Field>
      </div>

      <ModalFooter layout="split">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isSaving}
          className="w-full"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!siteUrl.trim()}
          className="w-full"
        >
          Save
        </Button>
      </ModalFooter>
    </ModalShell>
  );
}
