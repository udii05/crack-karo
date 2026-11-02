"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { ProviderStatus, api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";

export default function ProviderSettings() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<ProviderStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [removeTarget, setRemoveTarget] = useState<ProviderStatus | null>(null);
  const [removing, setRemoving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setProviders(await api.providers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load providers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const defaultProvider = useMemo(() => {
    const connected = providers.filter((provider) => provider.configured);
    return connected[0]?.provider ?? "gemini";
  }, [providers]);

  function openProvider(provider: ProviderStatus) {
    setEditing(provider);
    setApiKey("");
    setShowKey(false);
    setModel(provider.model || provider.default_model);
    setFormError("");
    setNotice("");
  }

  function closeModal() {
    if (saving) return;
    setEditing(null);
    setApiKey("");
    setFormError("");
  }

  async function save() {
    if (!editing) return;
    if (!apiKey.trim() && !editing.configured) {
      setFormError("Enter an API key to connect this provider.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const updated = await api.saveProvider(
        editing.provider,
        apiKey.trim(),
        model
      );
      setProviders((current) =>
        current.map((provider) =>
          provider.provider === updated.provider ? updated : provider
        )
      );
      setNotice(`${updated.label} connected.`);
      setEditing(null);
      setApiKey("");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not verify this provider."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.deleteProvider(removeTarget.provider);
      setProviders((current) =>
        current.map((provider) =>
          provider.provider === removeTarget.provider
            ? { ...provider, configured: false, key_hint: "" }
            : provider
        )
      );
      setNotice(`${removeTarget.label} key removed.`);
      setRemoveTarget(null);
      setEditing(null);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not remove this key."
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <section className="card p-0">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink-900">LLM Providers</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Configure API keys for your preferred AI providers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="btn-secondary btn-sm shrink-0"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </button>
        </div>

        {notice && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 sm:mx-6">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {notice}
          </div>
        )}

        {error && (
          <div className="mx-5 mt-4 flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:mx-6 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </span>
            <button type="button" onClick={() => void load()} className="btn-secondary btn-sm">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="divide-y divide-line">
            {[0, 1].map((item) => (
              <div key={item} className="flex items-center justify-between px-5 py-5 sm:px-6">
                <div>
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-48 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-line">
            {providers.map((provider) => {
              const isDefault = provider.provider === defaultProvider;
              return (
                <div
                  key={provider.provider}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-ink-900">
                        {provider.label}
                      </span>
                      <span className="rounded-md border border-line bg-[#f8faff] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        api
                      </span>
                      {isDefault && (
                        <span className="badge bg-emerald-50 text-emerald-700">
                          Default
                        </span>
                      )}
                      {provider.configured && (
                        <span className="badge bg-emerald-50 text-emerald-700">
                          Connected
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {provider.models.length} models ·{" "}
                      {provider.configured
                        ? `default model ${provider.model}`
                        : "no default model"}
                    </div>
                    {provider.configured && (
                      <div className="mt-0.5 text-[10px] text-slate-400">
                        Key {provider.key_hint}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center justify-end">
                    <button
                      type="button"
                      onClick={() => openProvider(provider)}
                      className={
                        provider.configured ? "btn-secondary btn-sm" : "btn-primary btn-sm"
                      }
                    >
                      {provider.configured ? "Configure" : "Connect"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-start gap-2 border-t border-line px-5 py-3 text-[11px] leading-relaxed text-slate-400 sm:px-6">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
          Keys are encrypted at rest, never logged, and never returned to the
          browser. The platform fallback is used only when no provider is connected.
        </div>
      </section>

      <Modal
        open={Boolean(editing)}
        onClose={closeModal}
        title={editing ? `${editing.configured ? "Configure" : "Connect"} ${editing.label}` : ""}
        description="Add the API key for your provider. The key is encrypted and used only for your sessions."
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={() => void save()} disabled={saving}>
              {saving ? "Verifying..." : editing?.configured ? "Save changes" : "Connect provider"}
            </button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-[#f8faff] px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink-900">{editing.label}</span>
                <span className="rounded-md border border-line bg-white px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                  api
                </span>
              </div>
              {editing.configured && (
                <span className="badge bg-emerald-50 text-emerald-700">Connected</span>
              )}
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {formError}
              </div>
            )}

            <div>
              <label className="label" htmlFor="provider-key">API key</label>
              <div className="relative">
                <input
                  id="provider-key"
                  type={showKey ? "text" : "password"}
                  className="input pr-10"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={
                    editing.configured
                      ? "Leave blank to keep the saved key"
                      : `Paste your ${editing.label} API key`
                  }
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((value) => !value)}
                  aria-label={showKey ? "Hide API key" : "Show API key"}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                {editing.configured
                  ? `Current key ${editing.key_hint}. Leave blank to update the model without replacing it.`
                  : "The key is verified before it is saved."}
              </p>
            </div>

            <div>
              <label className="label" htmlFor="provider-model">Default model</label>
              <select
                id="provider-model"
                className="input"
                value={model}
                onChange={(event) => setModel(event.target.value)}
              >
                {editing.models.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-slate-400">
                This model is used for interviews, scoring, coaching, and practice analysis.
              </p>
            </div>

            {editing.configured && (
              <button
                type="button"
                onClick={() => setRemoveTarget(editing)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove saved key
              </button>
            )}

            <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-400">
              <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
              We never display the saved key again. Removing it does not delete your interviews.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove provider key?"
        description={
          removeTarget
            ? `${removeTarget.label} will stop using this key. Other providers are unaffected.`
            : ""
        }
        confirmLabel="Remove key"
        busy={removing}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => void remove()}
      />
    </>
  );
}
