/* eslint-disable @typescript-eslint/naming-convention */
import { getDate } from "@mr-hope/vuepress-shared";
import { load } from "@mr-hope/vuepress-shared";
import { blue, cyan } from "chalk";
import { readFile, existsSync, writeFile } from "fs-extra";
import { getLocales, resolveUrl } from "./utils";

import type { AppDir } from "@vuepress/core";
import type { PageSeoInfo, SeoContent, SeoOptions } from "./types";

export const generateSeo = (
  options: SeoOptions,
  base: string,
  { page, app, permalink }: PageSeoInfo
): SeoContent => {
  const {
    frontmatter: {
      author: pageAuthor,
      date,
      banner,
      cover,
      tag,
      tags = tag as string[],
    },
    git = {},
  } = page;
  const { siteData } = app;
  const locales = getLocales(siteData.locales);

  const type = ["article", "category", "tag", "timeline"].some(
    (folder) =>
      page.filePathRelative && page.filePathRelative.startsWith(`/${folder}`)
  )
    ? "website"
    : "article";

  const author =
    pageAuthor === false
      ? ""
      : (pageAuthor as string) ||
        options.author ||
        (app.options.themeConfig.author as string | undefined) ||
        "";
  const { updatedTime } = git;

  const modifiedTime = updatedTime ? new Date(updatedTime).toISOString() : "";
  const articleTags: string[] = Array.isArray(tags)
    ? tags
    : typeof tag === "string"
    ? [tag]
    : [];

  let publishTime = "";

  if (date instanceof Date) publishTime = new Date(date).toISOString();
  else if (date) {
    const dateInfo = getDate(date);
    if (dateInfo && dateInfo.value) publishTime = dateInfo.value.toISOString();
  }

  return {
    "og:url": resolveUrl(base, permalink || page.path),
    "og:site_name": siteData.title,
    "og:title": page.title,
    "og:description": page.frontmatter.description || "",
    "og:type": type,
    "og:image": cover
      ? resolveUrl(base, cover)
      : banner
      ? resolveUrl(base, banner)
      : "",
    "og:updated_time": modifiedTime,
    "og:locale": page.lang,
    "og:locale:alternate": locales,

    "twitter:card": "summary_large_image",
    "twitter:image:alt": siteData.title,

    "article:author": author,
    "article:tag": articleTags,
    "article:published_time": publishTime,
    "article:modified_time": modifiedTime,
  };
};

export const generateRobotsTxt = async (dir: AppDir): Promise<void> => {
  const spinner = load("Generating robots.txt", "Seo");
  const publicPath = dir.public("robots.txt");

  let content = existsSync(publicPath)
    ? await readFile(publicPath, { encoding: "utf8" })
    : "";

  if (content && !content.includes("User-agent"))
    spinner.fail(`${blue("SEO")}: robots.txt seems invalid!`);
  else {
    content += "\nUser-agent:*\nDisallow:\n";

    await writeFile(dir.dest("robots.txt"), content, {
      flag: "w",
    });

    spinner.succeed(`${blue("SEO")}: ${cyan("robots.txt")} generated!`);
  }
};
