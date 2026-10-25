/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://david188888.github.io",
  generateRobotsTxt: true,
  outDir: "out",
  trailingSlash: true,
  // `/zh/*` duplicates the unprefixed Chinese pages and is kept only so links
  // from before Chinese became the default locale still resolve.
  exclude: ["/zh", "/zh/*"],
};
