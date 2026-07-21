import { CDN_URL, SPEEDTEST_URL, NODE_SUFFIX, PROXY_GROUPS, countriesMeta } from "./constants";
import type { BuildProxyGroupsInput, GroupType, ProxyGroup } from "./types";
import { isNotNull } from "./utils";

interface BuildGroupByTypeInput {
    name: string;
    icon: string;
    groupType: GroupType;
    nodeSource: Pick<ProxyGroup, "proxies" | "include-all" | "filter" | "exclude-filter">;
}

/**
 * 自定义：AI 服务偏好节点（Reality/VLRV 协议变体）。手动维护，不随节点列表
 * 自动变化——物理节点改名/增删时记得同步这里。US-LAX-Bwh1 是当前日常手动
 * 固定使用的节点，排最前面。多数主流 AI 服务会封禁香港 IP，所以香港节点单独
 * 放进 AI_HK_FALLBACK_NODES，垫底保留，不放进主优先级列表。
 * 见 _fork/adr/（AI 服务策略组相关记录）。
 */
const AI_PREFERRED_NODES = [
    "US-LAX-Bwh1-VLRV-dllxr1",
    "US-LAX-Dmit1-VLRV-dllxr1",
    "JP-OSA-Bwh2-VLRV-dllxr1",
    "JP-NRT-HH1-VLRV-dllxr1",
    "JP-NRT-Alice1-VLRV-dllxr1",
];
const AI_HK_FALLBACK_NODES = ["HK-HKG-Dmit1-VLRV-dllxr1", "HK-HKG-HH1-VLRV-dllxr1"];

/**
 * 根据代理组类型生成对应的代理组配置。
 * 将 groupType 映射为具体的类型字段（select/url-test/load-balance），
 * 并与节点来源字段合并，消除各处重复的 switch 逻辑。
 */
function buildGroupByType({
    name,
    icon,
    groupType,
    nodeSource,
}: BuildGroupByTypeInput): ProxyGroup {
    switch (groupType) {
        case 0:
            return { name, icon, type: "select", ...nodeSource };
        case 1:
            return {
                name,
                icon,
                type: "url-test",
                url: SPEEDTEST_URL,
                interval: 60,
                tolerance: 20,
                ...nodeSource,
            };
        case 2:
            return {
                name,
                icon,
                type: "load-balance",
                strategy: "sticky-sessions",
                url: SPEEDTEST_URL,
                interval: 60,
                tolerance: 20,
                ...nodeSource,
            };
    }
}

/**
 * 生成所有代理组配置，包含内联的国家地区代理组。
 * @param input - 构建代理组所需的输入参数（详见 BuildProxyGroupsInput）
 * @returns 代理组配置数组
 */
export function buildProxyGroups({
    regexFilter,
    groupType,
    countryNames,
    countryNodes,
    landing,
    landingNodes,
    defaultProxies,
    defaultProxiesDirect,
    defaultSelector,
    defaultFallback,
    frontProxySelector,
}: BuildProxyGroupsInput): ProxyGroup[] {
    const hasTW = countryNames.includes("台湾");
    const hasHK = countryNames.includes("香港");
    const hasUS = countryNames.includes("美国");
    const groups: Array<ProxyGroup | null> = [
        {
            name: PROXY_GROUPS.SELECT,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Proxy.png`,
            type: "select",
            proxies: defaultSelector,
        },
        {
            name: PROXY_GROUPS.MANUAL,
            icon: `${CDN_URL}/gh/shindgewongxj/WHATSINStash@master/icon/select.png`,
            "include-all": true,
            type: "select",
        },
        landing
            ? {
                  name: PROXY_GROUPS.FRONT_PROXY,
                  icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Area.png`,
                  type: "select",
                  proxies: frontProxySelector,
              }
            : null,
        landing
            ? {
                  name: PROXY_GROUPS.LANDING,
                  icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Airport.png`,
                  type: "select",
                  proxies: landingNodes.map((node) => node.name).filter(isNotNull),
              }
            : null,
        {
            name: PROXY_GROUPS.AI_SERVICE,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/ChatGPT.png`,
            type: "select",
            // 自定义：手动选择为主，不用自动测速——AI 服务对 IP 跳变敏感，频繁
            // 换节点容易触发登录风控。US-LAX-Bwh1（当前常用节点）排最前，美/日
            // 节点在前、香港节点垫底保留。
            proxies: [
                ...AI_PREFERRED_NODES,
                PROXY_GROUPS.AI_FALLBACK,
                PROXY_GROUPS.MANUAL,
                ...AI_HK_FALLBACK_NODES,
            ],
        },
        {
            name: PROXY_GROUPS.AI_FALLBACK,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/ChatGPT.png`,
            type: "fallback",
            // 探测目标用 AI 服务自己的域名，不用默认的测速地址——要测的是"这个
            // 节点的出口 IP 有没有被 AI 服务单独拉黑"，不是单纯测网络通不通。
            // interval 拉长到 300 秒，减少探测频率，避免被识别成异常流量。
            url: "https://chatgpt.com",
            interval: 300,
            tolerance: 20,
            proxies: AI_PREFERRED_NODES,
        },
        {
            name: PROXY_GROUPS.CRYPTO,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Cryptocurrency_1.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.APPLE,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Apple_2.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.GOOGLE,
            icon: `${CDN_URL}/gh/Orz-3/mini@master/Color/Google.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.MICROSOFT,
            icon: `${CDN_URL}/gh/powerfullz/override-rules@master/icons/Microsoft_Copilot.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.XBOX,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Xbox.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.GITHUB,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/GitHub.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.BILIBILI,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/bilibili.png`,
            type: "select",
            proxies: hasTW && hasHK ? ["DIRECT", `台湾节点`, `香港节点`] : defaultProxiesDirect,
        },
        {
            name: PROXY_GROUPS.BAHAMUT,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Bahamut.png`,
            type: "select",
            proxies: hasTW
                ? [`台湾节点`, PROXY_GROUPS.SELECT, PROXY_GROUPS.MANUAL, "DIRECT"]
                : defaultProxies,
        },
        {
            name: PROXY_GROUPS.YOUTUBE,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/YouTube.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.TWITCH,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Twitch.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.NETFLIX,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Netflix.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.TIKTOK,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/TikTok.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.SPOTIFY,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Spotify.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.TELEGRAM,
            icon: `${CDN_URL}/gh/powerfullz/override-rules@master/icons/Telegram.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.TWITTER,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Twitter.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.WEIBO,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Weibo.png`,
            type: "select",
            "include-all": true,
            proxies: defaultProxiesDirect,
        },
        {
            name: PROXY_GROUPS.TRUTH_SOCIAL,
            icon: `${CDN_URL}/gh/powerfullz/override-rules@master/icons/Truth_Social.png`,
            type: "select",
            proxies: hasUS
                ? [`美国节点`, PROXY_GROUPS.SELECT, PROXY_GROUPS.MANUAL]
                : defaultProxies,
        },
        {
            name: PROXY_GROUPS.EHENTAI,
            icon: `${CDN_URL}/gh/powerfullz/override-rules@master/icons/Ehentai.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.PIKPAK,
            icon: `${CDN_URL}/gh/powerfullz/override-rules@master/icons/PikPak.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.SOGOU_INPUT,
            icon: `${CDN_URL}/gh/powerfullz/override-rules@master/icons/Sougou.png`,
            type: "select",
            proxies: ["DIRECT", "REJECT"],
        },
        {
            name: PROXY_GROUPS.SSH,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Server.png`,
            type: "select",
            proxies: defaultProxies,
        },
        {
            name: PROXY_GROUPS.AD_BLOCK,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/AdBlack.png`,
            type: "select",
            proxies: ["REJECT", "REJECT-DROP", "DIRECT"],
        },
        {
            name: PROXY_GROUPS.FINAL,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Final.png`,
            type: "select",
            proxies: [PROXY_GROUPS.SELECT, "DIRECT"],
        },
        {
            name: PROXY_GROUPS.AUTO,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Auto.png`,
            type: "url-test",
            url: SPEEDTEST_URL,
            proxies: defaultFallback,
            interval: 60,
            tolerance: 20,
        },
        {
            name: PROXY_GROUPS.FALLBACK,
            icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Available_1.png`,
            type: "fallback",
            url: SPEEDTEST_URL,
            proxies: defaultFallback,
            interval: 60,
            tolerance: 20,
        },
        // 自定义：移除"低倍率节点"分组。这是机场（商业订阅）场景的概念，纯自建
        // VPS 没有"倍率"这个属性，这个分组对这份 fork 没有意义，直接不生成。
        ...countryNames.map((country) => {
            const meta = countriesMeta[country];
            if (!meta) return null;
            const nodeSource = regexFilter
                ? {
                      "include-all": true as const,
                      filter: meta.pattern,
                      ...(meta.excludePattern ? { "exclude-filter": meta.excludePattern } : {}),
                  }
                : { proxies: countryNodes[country]?.map((n) => n.name).filter(isNotNull) };
            return buildGroupByType({
                name: `${country}${NODE_SUFFIX}`,
                icon: meta.icon,
                groupType,
                nodeSource,
            });
        }),
    ];

    return groups.filter(isNotNull);
}
