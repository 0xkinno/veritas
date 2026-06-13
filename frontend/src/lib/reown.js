// frontend/src/lib/reown.js — Reown AppKit config
import { createAppKit } from "@reown/appkit";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { defineChain } from "@reown/appkit/networks";

export const mantleSepolia = defineChain({
  id:        5003,
  name:      "Mantle Sepolia",
  nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantle Explorer", url: "https://explorer.sepolia.mantle.xyz" },
  },
  testnet: true,
});

const ethersAdapter = new EthersAdapter();

export const modal = createAppKit({
  adapters:   [ethersAdapter],
  projectId:  "b16882842344ea7a3f1a64a5cedb1007",
  networks:   [mantleSepolia],
  defaultNetwork: mantleSepolia,
  metadata: {
    name:        "VERITAS",
    description: "The first accountable AI trader — every decision permanently onchain via ERC-8004",
    url:         "https://veritas.vercel.app",
    icons:       ["https://veritas.vercel.app/favicon.ico"],
  },
  features: {
    analytics: false,
    email:     false,
    socials:   false,
  },
  featuredWalletIds: [
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust
    "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Coinbase
    "163d2cf19babf05eb8962e9748f9ebe613ed52ebf9c8107c9a0f104bfcf161b3", // Bybit
    "15c8b91ade1a4e58f3ce4e7a0dd7f42b97996ad2ad6f5cce3058e39ef5a3c946", // Rabby
    "85db431492aa2e8672e93f4ea7acf10c88b97b867b0d373107af63dc4880f041", // Zerion
  ],
  themeMode: "dark",
  themeVariables: {
    "--w3m-color-mix":             "#7CFF6B",
    "--w3m-color-mix-strength":    15,
    "--w3m-accent":                "#7CFF6B",
    "--w3m-background-color":      "#060D08",
    "--w3m-font-family":           "JetBrains Mono, monospace",
    "--w3m-border-radius-master":  "0px",
  },
});

export function getAppKitProvider() {
  return modal.getWalletProvider();
}