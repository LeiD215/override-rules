/*!
powerfullz 的 Substore 订阅转换脚本
https://github.com/powerfullz/override-rules

支持的传入参数：
- grouptype: 地区代理组类型（0=select 手动选择, 1=url-test 自动测速, 2=load-balance 负载均衡，默认 0）
  - 向后兼容：若未传 grouptype 但传了 loadbalance，则 loadbalance=true 映射为 grouptype=2，loadbalance=false 映射为 grouptype=1
- landing: auto-detected from nodes with `dialer-proxy` field; no user parameter needed
- ipv6: 启用 IPv6 支持（默认 false）
- tun: 启用 TUN 模式（默认 false）
- full: 输出完整配置（适合纯内核启动，默认 false）
- keepalive: 启用 tcp-keep-alive（默认 false）
- fakeip: DNS 使用 FakeIP 模式（默认 true；传 false 时为 RedirHost）
- quic: 允许 QUIC 流量（UDP 443，默认 false）
- threshold: 地区节点数量小于该值时不显示分组 (默认 0)
- regex: 使用正则过滤模式（include-all + filter）写入各地区代理组，而非直接枚举节点名称（默认 false）

源码已迁移至 `src/*.ts`。
*/

import { CDN_URL, PROXY_GROUPS } from "./constants";
import { buildFeatureFlags } from "./args";
import { buildProxyGroups } from "./proxy_groups";
import {
    getActiveCountryNames,
    parseCountries,
    parseLowCost,
    parseNodesByLanding,
    parseTailscale,
} from "./node_parser";
import { buildRules } from "./rules";
import { ruleProviders } from "./rule_providers";
import { buildDns, snifferConfig } from "./dns";
import { buildTunConfig } from "./tun";
import { buildBaseLists } from "./selectors";
import type { ClashConfig, ScriptArgs } from "./types";

// 由 scripts/build.mjs 在 esbuild 编译期通过 define 替换：
//   __OVERRIDE_RULES_VERSION__ ← OVERRIDE_RULES_VERSION env / package.json version / "unknown"
//   __OVERRIDE_RULES_SCHEMA__  ← 当前 schema 版本号（写死；breaking change 时递增）
// declare 仅为 TypeScript 类型提示；esbuild 编译后这两个名字会完全消失。
declare const __OVERRIDE_RULES_VERSION__: string;
declare const __OVERRIDE_RULES_SCHEMA__: string;
const VERSION: string = __OVERRIDE_RULES_VERSION__;
const SCHEMA: string = __OVERRIDE_RULES_SCHEMA__;

const geoxURL = {
    geoip: `${CDN_URL}/gh/MetaCubeX/meta-rules-dat@release/geoip.dat`,
    geosite: `${CDN_URL}/gh/MetaCubeX/meta-rules-dat@release/geosite.dat`,
    mmdb: `${CDN_URL}/gh/MetaCubeX/meta-rules-dat@release/country.mmdb`,
    asn: `${CDN_URL}/gh/MetaCubeX/meta-rules-dat@release/GeoLite2-ASN.mmdb`,
};

declare const $arguments: ScriptArgs;

function getRawArgs(): ScriptArgs {
    try {
        return $arguments;
    } catch {
        // console.log("[powerfullz 的覆写脚本] 未检测到传入参数，使用默认参数。");
        return {};
    }
}

const rawArgs = getRawArgs();
const {
    groupType,
    ipv6Enabled,
    fullConfig,
    keepAliveEnabled,
    fakeIPEnabled,
    quicEnabled,
    regexFilter,
    tunEnabled,
    countryThreshold,
} = buildFeatureFlags(rawArgs);

function main(config: ClashConfig): ClashConfig {
    if (!config.proxies || !Array.isArray(config.proxies)) {
        throw new Error("[powerfullz 的覆写脚本] 错误：Clash 配置中缺少有效的 proxies 字段");
    }
    const { landingNodes, nonLandingNodes } = parseNodesByLanding(config.proxies);
    const landing = landingNodes.length > 0 && nonLandingNodes.length > 0;
    const countryNodes = parseCountries(landing ? nonLandingNodes : config.proxies);
    const lowCostNodes = parseLowCost(landing ? nonLandingNodes : config.proxies);
    const countryNames = getActiveCountryNames(countryNodes, countryThreshold);
    const allNodes = config.proxies.map((node) => node.name);
    const tailscaleNodes = parseTailscale(config.proxies);
    const hasTailscale = tailscaleNodes.length > 0;

    const {
        defaultProxies,
        defaultProxiesDirect,
        defaultSelector,
        defaultFallback,
        frontProxySelector,
    } = buildBaseLists({
        landing,
        countryNames,
        nonLandingNodes,
        regexFilter,
    });

    const proxyGroups = buildProxyGroups({
        allNodes,
        regexFilter,
        groupType,
        countryNames,
        countryNodes,
        lowCostNodes,
        tailscaleNodes,
        landing,
        landingNodes,
        defaultProxies,
        defaultProxiesDirect,
        defaultSelector,
        defaultFallback,
        frontProxySelector,
    });

    const globalProxies = proxyGroups.map((item) => String(item.name));
    proxyGroups.push({
        name: PROXY_GROUPS.GLOBAL,
        icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Global.png`,
        "include-all": true,
        type: "select",
        proxies: globalProxies,
    });

    const finalRules = buildRules({ quicEnabled }, hasTailscale);

    // x-override-rules 是 vendor-extension 命名空间（仿 OpenAPI / Docker compose 的 x- 前缀约定）。
    // 客户端 yaml 渲染器（mihomo / clash verge / stash）会原样写入 yaml，
    // 不被识别为 clash 配置字段 → 不参与规则匹配 / 路由决策。
    // 用途：让客户端用户一眼看到这份 yaml 是哪个版本、哪个 schema 生成的。
    //
    // 键顺序在 return 对象里保留（yaml 默认按对象键插入顺序），
    // 因此排在 return 第一位 = 在 yaml 输出顶部出现。
    return {
        "x-override-rules": {
            version: VERSION,
            schema: SCHEMA,
            generator: "override-rules",
        },
        proxies: config.proxies,
        ...(fullConfig && {
            "mixed-port": 7890,
            "redir-port": 7892,
            "tproxy-port": 7893,
            "routing-mark": 7894,
            "allow-lan": true,
            "bind-address": "*",
            ipv6: ipv6Enabled,
            mode: "rule",
            "unified-delay": true,
            "tcp-concurrent": true,
            "find-process-mode": "off",
            "log-level": "info",
            "geodata-loader": "standard",
            "external-controller": ":9999",
            "disable-keep-alive": !keepAliveEnabled,
            profile: { "store-selected": true },
        }),
        "proxy-groups": proxyGroups,
        "rule-providers": ruleProviders,
        rules: finalRules,
        sniffer: snifferConfig,
        dns: buildDns({ fakeIPEnabled, ipv6Enabled }),
        tun: buildTunConfig(tunEnabled, hasTailscale),
        "geodata-mode": true,
        "geox-url": geoxURL,
    };
}

(globalThis as Record<string, unknown>).main = main;
