const fetchHtml = require("@libs/fetch").fetchHtml;
const cheerio = require("cheerio");

class WTRLabPlugin {
    constructor() {
        this.id = "wtrlab";
        this.name = "WTR-LAB (Fixed)";
        this.icon = "assets/icon.png";
        this.site = "https://wtr-lab.com";
        this.version = "3.1.0";
    }

    get headers() {
        return {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://wtr-lab.com/",
            "Origin": "https://wtr-lab.com"
        };
    }

    async popularNovels(pageNo) {
        const url = `${this.site}/en/novel-list?page=${pageNo}`;
        const res = await fetch(url, { headers: this.headers });
        const html = await res.text();
        const $ = cheerio.load(html);
        const novels = [];

        $(".novel-item, .serie-card, .li-row").each((i, el) => {
            const linkAnchor = $(el).find("a").first();
            const name = $(el).find(".title, .novel-title, h5, .serie-title").text().trim();
            if (name) {
                novels.push({
                    name: name,
                    cover: $(el).find("img").attr("src") || $(el).find("img").attr("data-src"),
                    path: linkAnchor.attr("href")?.replace(this.site, ""),
                });
            }
        });
        return novels;
    }

    async parseNovel(novelPath) {
        const url = `${this.site}${novelPath}`;
        const res = await fetch(url, { headers: this.headers });
        const html = await res.text();
        const $ = cheerio.load(html);

        const novelName = $(".novel-title, .serie-title, h1").text().trim();
        const novelCover = $(".novel-cover img, .serie-cover img").attr("src") || "";
        const novelSummary = $(".summary-text, .description, .synopsis, #description").text().trim();
        
        let author = "";
        $(".author, .metadata-item, .serie-info").each((i, el) => {
            if ($(el).text().includes("Author:")) {
                author = $(el).text().replace("Author:", "").trim();
            }
        });

        const chapters = [];
        $(".chapter-list a, .chapters-list a, .list-chapters a, .ch-link, .chapter-item a").each((i, el) => {
            const chapUrl = $(el).attr("href");
            if (chapUrl) {
                chapters.push({
                    name: $(el).text().trim() || `Chapter ${i + 1}`,
                    path: chapUrl.replace(this.site, ""),
                    releaseTime: "",
                });
            }
        });

        return {
            path: novelPath,
            name: novelName,
            cover: novelCover,
            summary: novelSummary,
            author: author,
            status: "Ongoing",
            genres: "",
            chapters: chapters,
        };
    }

    async parseChapter(chapterPath) {
        const url = `${this.site}${chapterPath}`;
        const res = await fetch(url, { headers: this.headers });
        const html = await res.text();
        const $ = cheerio.load(html);

        $(".adsbygoogle, script, style, .header, .footer, .nav-links").remove();

        const selectors = [
            ".chapter-content", 
            ".reader-content", 
            "#chapter-body", 
            ".entry-content",
            ".read-container",
            ".serie-body",
            ".wtr-content",
            "article"
        ];

        let chapterText = "";
        for (const selector of selectors) {
            chapterText = $(selector).html() || "";
            if (chapterText.trim().length > 200) break; 
        }

        return chapterText;
    }

    async searchNovels(searchTerm, pageNo) {
        const url = `${this.site}/en/search?searchkey=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
        const res = await fetch(url, { headers: this.headers });
        const html = await res.text();
        const $ = cheerio.load(html);
        const novels = [];

        $(".novel-item, .serie-card, .li-row").each((i, el) => {
            const name = $(el).find(".title, .novel-title, h5").text().trim();
            if (name) {
                novels.push({
                    name: name,
                    cover: $(el).find("img").attr("src"),
                    path: $(el).find("a").first().attr("href")?.replace(this.site, ""),
                });
            }
        });
        return novels;
    }
}

module.exports = new WTRLabPlugin();
