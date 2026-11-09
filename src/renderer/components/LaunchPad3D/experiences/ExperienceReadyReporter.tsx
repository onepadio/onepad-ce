import { useEffect, useRef } from "react";
import { useProgress } from "@react-three/drei";

type ExperienceReadyReporterProps = {
  experienceId: string;
  /** Only report for the foreground warm-space canvas */
  enabled?: boolean;
};

/**
 * Inside the R3F Canvas: watches drei's DefaultLoadingManager and notifies
 * the DOM UI when the current experience's GPU/asset load has settled.
 */
export default function ExperienceReadyReporter({
  experienceId,
  enabled = true,
}: ExperienceReadyReporterProps) {
  const { active, progress } = useProgress();
  const generationRef = useRef(0);
  const sawLoadingRef = useRef(false);
  const readySentRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    generationRef.current += 1;
    sawLoadingRef.current = false;
    readySentRef.current = false;
    window.dispatchEvent(
      new CustomEvent("desktop3d-experience-loading", {
        detail: { experienceId },
      })
    );
  }, [experienceId, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const gen = generationRef.current;

    if (active) {
      sawLoadingRef.current = true;
      return;
    }

    // Idle: either finished after a load, or assets were already cached.
    // Keep warm (already-cached) switches snappy — soft gate hides the modal
    // unless this takes longer than ~200ms anyway.
    const delayMs = sawLoadingRef.current ? 80 : 50;
    const timer = window.setTimeout(() => {
      if (gen !== generationRef.current) return;
      if (readySentRef.current) return;
      // Still spinning? abort
      if (active) return;
      readySentRef.current = true;
      window.dispatchEvent(
        new CustomEvent("desktop3d-experience-ready", {
          detail: { experienceId, progress },
        })
      );
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [experienceId, enabled, active, progress]);

  // Safety: never leave the modal up forever
  useEffect(() => {
    if (!enabled) return;
    const gen = generationRef.current;
    const timer = window.setTimeout(() => {
      if (gen !== generationRef.current) return;
      if (readySentRef.current) return;
      readySentRef.current = true;
      window.dispatchEvent(
        new CustomEvent("desktop3d-experience-ready", {
          detail: { experienceId, progress: 100, timedOut: true },
        })
      );
    }, 45000);
    return () => window.clearTimeout(timer);
  }, [experienceId, enabled]);

  return null;
}
