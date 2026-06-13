// frontend/src/lib/chain.js — ethers provider wired to Mantle
import { ethers } from "ethers";
import { IDENTITY_REGISTRY, REPUTATION_REGISTRY, VALIDATION_REGISTRY } from "./addresses.js";

export const MANTLE_TESTNET = {
  chainId: "0x138B",   // 5003
  chainName: "Mantle Sepolia Testnet",
  rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
  nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
  blockExplorerUrls: ["https://explorer.sepolia.mantle.xyz"],
};

export const MANTLE_MAINNET = {
  chainId: "0x1388",  // 5000
  chainName: "Mantle Network",
  rpcUrls: ["https://rpc.mantle.xyz"],
  nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
  blockExplorerUrls: ["https://explorer.mantle.xyz"],
};

export const VALIDATION_ABI = [
  "function commitPrediction(uint256,bytes32,string,bool,uint8,int256) returns (uint256)",
  "function getPrediction(uint256) view returns (tuple(uint256,uint256,bytes32,string,bool,uint8,int256,int256,int256,uint8,uint256,uint256))",
  "function predCount() view returns (uint256)",
  "function getAgentPredictions(uint256) view returns (uint256[])",
];

export const REPUTATION_ABI = [
  "function getScore(uint256) view returns (uint256)",
  "function getRecord(uint256) view returns (tuple(uint256,uint256,uint256,uint256,uint256))",
  "function getAccuracy(uint256) view returns (uint256)",
];

export const IDENTITY_ABI = [
  "function getAgent(uint256) view returns (tuple(uint256,address,string,bytes32,uint256,bool))",
  "function agentCount() view returns (uint256)",
];

export function getReadProvider() {
  return new ethers.JsonRpcProvider("https://rpc.sepolia.mantle.xyz");
}

export async function requestWallet() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  await window.ethereum.request({ method: "eth_requestAccounts" });
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: MANTLE_TESTNET.chainId }] });
  } catch (e) {
    if (e.code === 4902) {
      await window.ethereum.request({ method: "wallet_addEthereumChain", params: [MANTLE_TESTNET] });
    }
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export function getReadContracts() {
  const provider = getReadProvider();
  return {
    validation: new ethers.Contract(VALIDATION_REGISTRY, VALIDATION_ABI, provider),
    reputation: new ethers.Contract(REPUTATION_REGISTRY, REPUTATION_ABI, provider),
    identity:   new ethers.Contract(IDENTITY_REGISTRY,   IDENTITY_ABI,   provider),
  };
}