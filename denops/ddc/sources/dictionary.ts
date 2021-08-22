import {
  BaseSource,
  Candidate,
  DdcEvent
} from "https://deno.land/x/ddc_vim@v0.2.2/types.ts#^";
import { Denops, fn } from "https://deno.land/x/ddc_vim@v0.2.2/deps.ts#^";

type DictCache = {
  mtime: Date | null;
  candidates: Candidate[];
};

export class Source extends BaseSource {
  private cache: { [filename: string]: DictCache } = {};
  private dicts: string[] = [];
  events = ["InsertEnter"] as DdcEvent[];

  private getDictionaries(dictOpt: string): string[] {
    if (dictOpt) {
      return dictOpt.split(",");
    } else {
      return [];
    }
  }

  private makeCache(): void {
    if (!this.dicts) {
      return;
    }

    for (const dictFile of this.dicts) {
      const mtime = Deno.statSync(dictFile).mtime;
      if (
        dictFile in this.cache &&
        this.cache[dictFile].mtime?.getTime() == mtime?.getTime()
      ) {
        return;
      }
      const texts = Deno.readTextFileSync(dictFile).split("\n");
      this.cache[dictFile] = {
        "mtime": mtime,
        "candidates": texts.map((word) => ({ word })),
      };
    }
  }

  async onEvent(args:{
    denops: Denops,
    sourceParams: Record<string, unknown>,
  }): Promise<void> {
    this.dicts = this.getDictionaries(
      (await fn.getbufvar(args.denops, 1, "&dictionary") as string),
    );
    const paths = args.sourceParams.dictPaths;
    if (paths && Array.isArray(paths)) {
      this.dicts = this.dicts.concat(paths as string[]);
    }
    this.makeCache();
  }

  async gatherCandidates(
  ): Promise<Candidate[]> {
    if (!this.dicts) {
      return [];
    }

    return this.dicts.map((dict) => this.cache[dict].candidates)
      .flatMap((candidate) => candidate);
  }
}
