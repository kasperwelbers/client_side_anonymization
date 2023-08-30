"use client";

import useNER from "@/hooks/useNER";
import { NER } from "@/types";
import { useState, useEffect } from "react";

export default function Upload() {
  const { modelStatus, prepareModel, extractNER } = useNER();
  const [referenceText, setReferenceText] = useState<string>(
    "For national security, nobody should know that Steve lives in Connecticut"
  );
  const [anonimizedText, setAnonimizedText] = useState<string>("");
  const [deferredReferenceText, setDeferredReferenceText] =
    useState<string>(referenceText);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setDeferredReferenceText(referenceText);
    }, 500);
    return () => clearTimeout(timer);
  }, [referenceText]);

  useEffect(() => {
    if (modelStatus !== "ready") return;
    let anonymizedText = deferredReferenceText;
    const callback = (documents: NER[]) => {
      for (let namedEntity of documents[0]) {
        anonymizedText = anonymizedText.replace(
          namedEntity.word,
          "[" + namedEntity.entity + "]"
        );
      }
      setAnonimizedText(anonymizedText);
      setLoading(false);
    };

    extractNER([deferredReferenceText], callback);
  }, [deferredReferenceText, extractNER, modelStatus]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12">
      <div className="max-w-2xl p-3">
        <h1 className="text-5xl font-bold mb-2 text-left">
          Client side anonymization
        </h1>
        <h2 className="text-2xl mb-10 mt-2">
          This is a quick proof-of-concept for anonymizing text on the client
          side. Currently it only means to demonstrate that we can efficiently
          run transformers in the browser to preprocess text. Once you click the
          button, the model will be downloaded and the named entities replaced
          by NER tags.
        </h2>
      </div>

      <div
        key="submissions"
        className="grid grid-cols-2 w-full max-w-2xl gap-5"
      >
        <textarea
          rows={8}
          value={referenceText}
          className="w-full rounded p-1 m-2 border-2 border-gray-300"
          placeholder="type reference text"
          onChange={(e) => setReferenceText(e.target.value)}
        />
        <div
          className={`overflow-auto h-60 p-3 ${loading ? "opacity-50" : ""}`}
        >
          {anonimizedText}
        </div>
      </div>
      <div className="pt-10">
        <button
          disabled={modelStatus === "ready"}
          className="bg-slate-700 text-white p-3 rounded w-40"
          onClick={() => prepareModel()}
        >
          {modelStatus === "idle" ? "load model" : ""}
          {modelStatus === "loading" ? "loading..." : ""}
          {modelStatus === "error" ? "Error :(" : ""}{" "}
          {modelStatus === "ready" ? "Model active" : ""}
        </button>
      </div>
    </main>
  );
}
