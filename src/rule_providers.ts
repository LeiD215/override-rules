import { CDN_URL } from "./constants";
import type { RuleProvider } from "./types";

export const ruleProviders: Record<string, RuleProvider> = {
    ADBlock: {
        type: "http",
        behavior: "domain",
        format: "yaml",
        interval: 86400,
        url: `${CDN_URL}/gh/217heidai/adblockfilters@main/rules/adblockmihomolite.yaml`,
        path: "./ruleset/ADBlock.yaml",
    },
    SogouInput: {
        type: "http",
        behavior: "classical",
        format: "text",
        interval: 86400,
        url: "https://ruleset.skk.moe/Clash/non_ip/sogouinput.txt",
        path: "./ruleset/SogouInput.txt",
    },
    // 自定义：不再使用上游的 StaticResources/CDNResources/AdditionalCDNResources
    // 三个规则集（第三方每天更新的大列表，实测发现混有大量本该属于具体服务的
    // 域名，属于持续性风险，见 _fork/adr/0002-self-maintained-static-resources-list.md）。
    // 改为指向我们 fork 自己维护的一份小名单，内容见 ruleset/MyDirectCDN.list。
    MyDirectCDN: {
        type: "http",
        behavior: "classical",
        format: "text",
        interval: 86400,
        // TODO: 替换成你自己 Fork 的 GitHub 用户名（构建前必须改，否则指向的是
        // 你尚未创建的地址，会导致这个 rule-provider 拉取失败）
        url: `${CDN_URL}/gh/LeiD215/override-rules@main/ruleset/MyDirectCDN.list`,
        path: "./ruleset/MyDirectCDN.list",
    },
    // 强制覆盖名单：优先级高于所有业务规则（广告拦截、GFWList、服务专属分组等），
    // 但低于私有内网直连（保留内网安全兜底）。
    MustDirect: {
        type: "http",
        behavior: "classical",
        format: "text",
        interval: 86400,
        url: `${CDN_URL}/gh/LeiD215/override-rules@main/ruleset/MustDirect.list`,
        path: "./ruleset/MustDirect.list",
    },
    MustProxy: {
        type: "http",
        behavior: "classical",
        format: "text",
        interval: 86400,
        url: `${CDN_URL}/gh/LeiD215/override-rules@main/ruleset/MustProxy.list`,
        path: "./ruleset/MustProxy.list",
    },
    TikTok: {
        type: "http",
        behavior: "classical",
        format: "text",
        interval: 86400,
        url: `${CDN_URL}/gh/powerfullz/override-rules@master/ruleset/TikTok.list`,
        path: "./ruleset/TikTok.list",
    },
    EHentai: {
        type: "http",
        behavior: "classical",
        format: "text",
        interval: 86400,
        url: `${CDN_URL}/gh/powerfullz/override-rules@master/ruleset/EHentai.list`,
        path: "./ruleset/EHentai.list",
    },
    SteamFix: {
        type: "http",
        behavior: "classical",
        format: "text",
        interval: 86400,
        url: `${CDN_URL}/gh/powerfullz/override-rules@master/ruleset/SteamFix.list`,
        path: "./ruleset/SteamFix.list",
    },
    GoogleFCM: {
        type: "http",
        behavior: "classical",
        format: "text",
        interval: 86400,
        url: `${CDN_URL}/gh/powerfullz/override-rules@master/ruleset/FirebaseCloudMessaging.list`,
        path: "./ruleset/FirebaseCloudMessaging.list",
    },
    AdditionalFilter: {
        type: "http",
        behavior: "classical",
        format: "text",
        interval: 86400,
        url: `${CDN_URL}/gh/powerfullz/override-rules@master/ruleset/AdditionalFilter.list`,
        path: "./ruleset/AdditionalFilter.list",
    },
    Crypto: {
        type: "http",
        behavior: "classical",
        format: "text",
        interval: 86400,
        url: `${CDN_URL}/gh/powerfullz/override-rules@master/ruleset/Crypto.list`,
        path: "./ruleset/Crypto.list",
    },
    Weibo: {
        type: "http",
        behavior: "classical",
        format: "text",
        interval: 86400,
        url: `${CDN_URL}/gh/powerfullz/override-rules@master/ruleset/Weibo.list`,
        path: "./ruleset/Weibo.list",
    },
    GFWList: {
        type: "http",
        behavior: "domain",
        format: "yaml",
        interval: 86400,
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
        path: "./ruleset/GFWList.yaml",
    },
};
