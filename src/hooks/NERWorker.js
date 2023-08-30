import { pipeline, env, AutoTokenizer } from "@xenova/transformers";

// Skip local model check
env.allowLocalModels = false;

// Use the Singleton pattern to enable lazy construction of the pipeline.
class PipelineSingleton {
  static task = "token-classification";
  static model = "Xenova/bert-base-multilingual-cased-ner-hrl";
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      self.postMessage({ type: "prepare-model", status: "loading" });
      try {
        const tokenizer = await AutoTokenizer.from_pretrained(this.model);
        const ner = await pipeline(this.task, this.model, {
          progress_callback,
        });
        this.instance = { ner, tokenizer };
        self.postMessage({ type: "prepare-model", status: "ready" });
      } catch (e) {
        self.postMessage({ type: "prepare-model", status: "error" });
        throw e;
      }
    }
    return this.instance;
  }
}

self.addEventListener("message", async (event) => {
  if (event.data.type === "prepare-model") {
    await PipelineSingleton.getInstance();
  }

  if (event.data.type === "extract") {
    try {
      const { ner } = await PipelineSingleton.getInstance();

      const documents = [];
      for (let i = 0; i < event.data.texts.length; i++) {
        const text = event.data.texts[i];
        let named_entities = await ner(text);
        documents.push(named_entities);
        self.postMessage({
          type: "progress",
          percent: i / event.data.texts.length,
          callbackId: event.data.progressCallbackId,
        });
      }

      return self.postMessage({
        type: "extract",
        status: "ready",
        documents,
        callbackId: event.data.callbackId,
      });
    } catch (e) {
      return self.postMessage({
        type: "extract",
        status: "error",
        documents: undefined,
        callbackId: event.data.callbackId,
      });
    }
  }
});
