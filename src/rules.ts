import { PROXY_GROUPS } from "./constants";
import { isNotNull } from "./utils";

/**
 * 构建最终的规则列表。
 *
 * @param {Object} params - 构建参数
 * @param {boolean} params.quicEnabled - 是否启用 QUIC（如未启用会插入 UDP:443 拦截规则）
 * @param {boolean} tailscale - 是否有 Tailscale 节点
 * @returns {string[]} 规则字符串数组
 */
export function buildRules(
    { quicEnabled }: { quicEnabled: boolean },
    tailscale: boolean
): string[] {
    return [
        quicEnabled ? `AND,((DST-PORT,443),(NETWORK,UDP)),REJECT` : null,
        tailscale ? `IP-CIDR,100.64.0.0/10,${PROXY_GROUPS.TAILSCALE},no-resolve` : null,
        tailscale ? `IP-CIDR,fd7a:115c:a1e0::/48,${PROXY_GROUPS.TAILSCALE},no-resolve` : null,
        tailscale ? `DOMAIN-SUFFIX,ts.net,${PROXY_GROUPS.TAILSCALE}` : null,
        `GEOIP,private,DIRECT,no-resolve`,
        // 强制覆盖名单：优先级高于所有业务规则（广告拦截、GFWList、服务专属分组等），
        // 但低于私有内网直连（保留内网安全兜底）。
        // 三个按"严格程度由高到低"排列：Reject（阻断）> Direct（直连）> Proxy（强制代理）。
        `RULE-SET,MustReject,REJECT`,
        `RULE-SET,MustDirect,DIRECT`,
        `RULE-SET,MustProxy,${PROXY_GROUPS.SELECT}`,
        // Adobe / Autodesk：跟 MyDirectCDN 一样是"用户希望锁定"的特定服务
        // 名单，优先级应跟强制覆盖名单平起平坐（命中 → ADOBE/AUTODESK group；
        // 实际走 REJECT 还是 SELECT 由用户在客户端手动切换）。
        `RULE-SET,Adobe,${PROXY_GROUPS.ADOBE}`,
        `RULE-SET,Autodesk,${PROXY_GROUPS.AUTODESK}`,
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
        // 特意放在所有专属服务规则之后——避免重蹈"静态资源抢跑其他服务"的覆辙。
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
    ].filter(isNotNull);
}
