import { PROXY_GROUPS } from "./constants";

const baseRules = [
    `DST-PORT,22,${PROXY_GROUPS.SSH}`,
    `GEOIP,private,DIRECT,no-resolve`,
    `RULE-SET,ADBlock,${PROXY_GROUPS.AD_BLOCK}`,
    `RULE-SET,AdditionalFilter,${PROXY_GROUPS.AD_BLOCK}`,
    `RULE-SET,SogouInput,${PROXY_GROUPS.SOGOU_INPUT}`,
    `DOMAIN-SUFFIX,truthsocial.com,${PROXY_GROUPS.TRUTH_SOCIAL}`,
    `GEOSITE,category-ai-!cn,${PROXY_GROUPS.AI_SERVICE}`,
    `GEOSITE,bilibili,${PROXY_GROUPS.BILIBILI}`,
    `GEOSITE,youtube,${PROXY_GROUPS.YOUTUBE}`,
    `GEOSITE,telegram,${PROXY_GROUPS.TELEGRAM}`,
    `GEOIP,telegram,${PROXY_GROUPS.TELEGRAM},no-resolve`,
    `GEOSITE,xbox,${PROXY_GROUPS.XBOX}`,
    `GEOSITE,github,${PROXY_GROUPS.GITHUB}`,
    `GEOSITE,netflix,${PROXY_GROUPS.NETFLIX}`,
    `GEOSITE,twitch,${PROXY_GROUPS.TWITCH}`,
    `GEOIP,netflix,${PROXY_GROUPS.NETFLIX},no-resolve`,
    `GEOSITE,spotify,${PROXY_GROUPS.SPOTIFY}`,
    `GEOSITE,bahamut,${PROXY_GROUPS.BAHAMUT}`,
    `GEOSITE,pikpak,${PROXY_GROUPS.PIKPAK}`,
    `GEOSITE,twitter,${PROXY_GROUPS.TWITTER}`,
    `RULE-SET,Weibo,${PROXY_GROUPS.WEIBO}`,
    `RULE-SET,EHentai,${PROXY_GROUPS.EHENTAI}`,
    `RULE-SET,TikTok,${PROXY_GROUPS.TIKTOK}`,
    // 自定义：自维护的"确实想直连"CDN 域名清单，取代上游的静态资源规则集。
    // 特意放在所有专属服务规则之后——避免重蹈"静态资源抢跑其他服务"的覆辙
    // （即便这份清单目前只有几个国内 CDN 镜像域名，风险很低，但保持这个顺序
    // 习惯本身就是对这类问题的免疫）。
    `RULE-SET,MyDirectCDN,DIRECT`,
    `RULE-SET,SteamFix,DIRECT`,
    `RULE-SET,GoogleFCM,DIRECT`,
    `GEOSITE,google-play@cn,DIRECT`,
    `GEOSITE,microsoft@cn,DIRECT`,
    `GEOSITE,apple,${PROXY_GROUPS.APPLE}`,
    `GEOSITE,microsoft,${PROXY_GROUPS.MICROSOFT}`,
    `GEOSITE,google,${PROXY_GROUPS.GOOGLE}`,
    `RULE-SET,Crypto,${PROXY_GROUPS.CRYPTO}`,
    `RULE-SET,GFWList,${PROXY_GROUPS.SELECT}`,
    `GEOIP,cn,DIRECT`,
    `MATCH,${PROXY_GROUPS.FINAL}`,
];

/**
 * 构建最终的规则列表。
 *
 * @param {Object} params - 构建参数
 * @param {boolean} params.quicEnabled - 是否启用 QUIC（如未启用会插入 UDP:443 拦截规则）
 * @returns {string[]} 规则字符串数组
 */
export function buildRules({ quicEnabled }: { quicEnabled: boolean }): string[] {
    const ruleList = [...baseRules];
    if (!quicEnabled) {
        ruleList.unshift("AND,((DST-PORT,443),(NETWORK,UDP)),REJECT");
    }
    return ruleList;
}
