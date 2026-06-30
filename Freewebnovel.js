const fetchHtml = require("@libs/fetch").fetchHtml;
const cheerio = require("cheerio");

class FreeWebNovelPlugin {
    constructor() {
        this.id = "freewebnovel";
        this.name = "Free Web Novel (Fixed)";
        this.icon = "assets/icon.png";
        this.site = "https://freewebnovel.com";
        this.version = "3.0.2";
    }

    async popularNovels(pageNo) {
        const url = `${this.site}/most-popular-novel?page=${pageNo}`;
        const html = await fetchHtml({ url });
        const $ = cheerio.load(html);
        const novels = [];
        $(".li-row").each((i, el) => {
            novels.push({
                name: $(el).find(".title a").text().trim(),
                cover: $(el).find(".img img").attr("src"),
                path: $(el).find(".title a").attr("href")?.replace(this.site, ""),
            });
        });
        return novels;
    }

    async parseNovel(novelPath) {
        const chapters = [];
        let pageNo = 1;
        let hasNextPage = true;
        let novelName = "";
        let novelCover = "";
        let novelSummary = "";
        let author = "";
        let artist = "";
        let status = "";
        let genres = "";
        const basePath = novelPath.replace(".html", "");

        while (hasNextPage) {
            const url = pageNo === 1 
                ? `${this.site}${novelPath}` 
                : `${this.site}${basePath}/page-${pageNo}.html`;
            let html;
            try {
                html = await fetchHtml({ url });
            } catch (error) {
                break;
            }
            const $ = cheerio.load(html);
            if (pageNo === 1) {
                novelName = $(".m-desc .title").text().trim();
                novelCover = $(".m-imgc img").attr("src") || "";
                novelSummary = $(".txt").text().trim();
                $(".m-desc .txt:not(.re-desc)").each((i, el) => {
                    const text = $(el).text();
                    if (text.includes("Author:")) author = text.replace("Author:", "").trim();
                    if (text.includes("Status:")) status = text.replace("Status:", "").trim();
                    if (text.includes("Genre:")) genres = text.replace("Genre:", "").trim();
                });
            }
            const pageChapters = [];
            $(".chaplist ul li a").each((i, el) => {
                const chapterUrl = $(el).attr("href");
                if (chapterUrl) {
                    pageChapters.push({
                        name: $(el).attr("title") || $(el).text().trim(),
                        path: chapterUrl.replace(this.site, ""),
                        releaseTime: "",
                    });
                }
            });
            if (pageChapters.length > 0) {
                chapters.push(...pageChapters);
                const nextButton = $(".page a:contains('Next'), .pagination .next");
                if (nextButton.length > 0) {
                    pageNo++;
                } else {
                    hasNextPage = false;
                }
            } else {
                hasNextPage = false;
            }
        }
        return {
            path: novelPath,
            name: novelName,
            cover: novelCover,
            summary: novelSummary,
            author: author,
            artist: artist,
            status: status,
            genres: genres,
            chapters: chapters,
        };
    }

    async parseChapter(chapterPath) {
        const url = `${this.site}${chapterPath}`;
        const html = await fetchHtml({ url });
        const $ = cheerio.load(html);
        $(".txtnav, .adsbygoogle, script, style").remove();
        const chapterText = $("#chr-content").html() || "";
        return chapterText;
    }

    async searchNovels(searchTerm, pageNo) {
        const url = `${this.site}/search.html?searchkey=${encodeURIComponent(searchTerm)}`;
        const html = await fetchHtml({ url });
        const $ = cheerio.load(html);
        const novels = [];
        $(".li-row").each((i, el) => {
            novels.push({
                name: $(el).find(".title a").text().trim(),
                cover: $(el).find(".img img").attr("src"),
                path: $(el).find(".title a").attr("href")?.replace(this.site, ""),
            });
        });
        return novels;
    }
}

module.exports = new FreeWebNovelPlugin();
