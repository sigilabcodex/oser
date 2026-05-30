import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { layoutProfileToCss, type LayoutProfile } from "./index";

export type WriteLayoutProfileCssOptions = {
  profilePath: string;
  outputPath?: string;
  outputDirectory?: string;
};

export type WriteLayoutProfileCssResult = {
  profile: LayoutProfile;
  profilePath: string;
  cssPath: string;
  css: string;
};

export async function loadLayoutProfile(profilePath: string): Promise<LayoutProfile> {
  return JSON.parse(await readFile(profilePath, "utf8")) as LayoutProfile;
}

export async function writeLayoutProfileCss(
  options: WriteLayoutProfileCssOptions
): Promise<WriteLayoutProfileCssResult> {
  const profile = await loadLayoutProfile(options.profilePath);
  const css = layoutProfileToCss(profile);
  const cssPath = options.outputPath ?? generatedCssPath(options.profilePath, options.outputDirectory);

  await mkdir(dirname(cssPath), { recursive: true });
  await writeFile(cssPath, `${css}\n`, "utf8");

  return {
    profile,
    profilePath: options.profilePath,
    cssPath,
    css
  };
}

function generatedCssPath(profilePath: string, outputDirectory = join("dist", ".tmp", "layout-profiles")): string {
  const extension = extname(profilePath);
  const name = extension ? basename(profilePath, extension) : basename(profilePath);
  return join(outputDirectory, `${safeFileName(name)}.css`);
}

function safeFileName(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "layout-profile";
}
