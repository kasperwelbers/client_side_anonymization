"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ModelStatus, NERCallback, ProgressCallback } from "@/types";
import CallbackManager from "@/classes/CallbackManager";

interface FeatureExtractorOut {
  modelStatus: ModelStatus;
  prepareModel: () => void;
  extractNER: (texts: string[], callback: NERCallback) => void;
}

export default function useFeatureExtractor(
  autoLoad?: boolean
): FeatureExtractorOut {
  const [modelStatus, setModelStatus] = useState<ModelStatus>("idle");
  const worker = useRef<Worker | null>(null);
  const callbackManager = useRef(
    new CallbackManager<NERCallback | ProgressCallback>()
  );

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL("./NERWorker.js", import.meta.url), {
        type: "module",
      });
    }

    worker.current.onmessage = (e) => {
      if (e.data.type === "prepare-model") {
        callbackManager.current.delete(e.data.callbackId);
        setModelStatus(e.data.status);
      }
      if (e.data.type === "extract") {
        const callback = callbackManager.current.pop(e.data.callbackId);
        callback?.(e.data.documents);
      }
      if (e.data.type === "progress") {
        const callback = callbackManager.current.get(e.data.callbackId);
        if (e.data.percent === 1) {
          callbackManager.current.delete(e.data.callbackId);
        }
        callback?.(e.data.percent);
      }
    };

    return () => {
      if (!worker.current) return;
      worker.current.terminate();
      worker.current = null;
    };
  }, [callbackManager]);

  const prepareModel = useCallback(() => {
    if (!worker.current?.postMessage) return;
    worker.current.postMessage({ type: "prepare-model" });
  }, [worker]);

  const extractNER = useCallback(
    (
      texts: string[],
      onComplete: NERCallback,
      onProgress?: ProgressCallback
    ) => {
      if (!worker.current?.postMessage) return;
      const callbackId = callbackManager.current.set(onComplete);
      const progressCallbackId = onProgress
        ? callbackManager.current.set(onProgress)
        : undefined;
      worker.current.postMessage({
        type: "extract",
        texts,
        callbackId,
        progressCallbackId,
      });
    },
    [worker, callbackManager]
  );

  if (autoLoad && modelStatus === "idle") prepareModel();

  return { modelStatus, prepareModel, extractNER };
}
