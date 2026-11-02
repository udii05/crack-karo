"use client";

import { ChangeEvent, useId, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ResumeUpload({
  onUploaded,
  compact = false,
}: {
  onUploaded?: (skills: string[]) => void;
  compact?: boolean;
}) {
  const inputId = useId();
  const [fileName, setFileName] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await api.uploadResume(file);
      setFileName(result.file_name);
      setSkills(result.skills || []);
      setMessage("Resume uploaded and analysed.");
      onUploaded?.(result.skills || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "" : "card"}>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <FileText className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Resume</h3>
          <p className="text-xs text-slate-500">Extract skills and tailor your practice.</p>
        </div>
      </div>

      <label
        htmlFor={inputId}
        className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/30"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
        ) : (
          <UploadCloud className="h-5 w-5 text-slate-400" />
        )}
        <span className="mt-2 text-sm font-medium text-slate-600">
          {loading ? "Analysing..." : "Upload a resume"}
        </span>
        <span className="mt-0.5 text-xs text-slate-400">PDF, DOCX, or TXT up to 5 MB</span>
        <input
          id={inputId}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={handleFile}
          disabled={loading}
        />
      </label>

      {message && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {message}
          </div>
          <div className="mt-1 truncate text-emerald-700">{fileName}</div>
          {skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {skills.slice(0, 12).map((skill) => (
                <span key={skill} className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium capitalize">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
