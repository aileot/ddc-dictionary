import {
  BaseSource,
  Candidate,
  Context,
  DdcOptions,
  SourceOptions,
} from "https://deno.land/x/ddc_vim@v0.0.5/types.ts";
import { Denops, fn } from "https://deno.land/x/ddc_vim@v0.0.5/deps.ts";

type DictCache = {
  mtime: Date | null;
  candidates: Candidate[];
};

export class Source extends BaseSource {
  private cache: { [filename: string]: DictCache } = {};

  private getDictionaries(dictOpt: string): string[] {
    return dictOpt.split(",");
  }

  private makeCache(dicts: string[]): void {
    if (!dicts) {
      return;
    }

    for (const dictFile of dicts) {
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

  async gatherCandidates(
    denops: Denops,
    _context: Context,
    _ddcOptions: DdcOptions,
    _options: SourceOptions,
    _params: Record<string, unknown>,
  ): Promise<Candidate[]> {
    // if (!Object.keys(this.cache).length) {
    // }
    const dictOpt = (await fn.getbufvar(denops, 1, "&dictionary")) as string;
    const dicts = this.getDictionaries(dictOpt);
    this.makeCache(dicts);

    let candidates: Candidate[] = [];
    for (const file of dicts) {
      candidates.concat(this.cache[file].candidates);
      candidates = candidates.concat(this.cache[file].candidates);
    }
    return candidates;
  }
}
