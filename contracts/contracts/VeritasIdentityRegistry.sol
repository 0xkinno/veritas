// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title VeritasIdentityRegistry — ERC-8004 Identity Layer
/// @notice Registers every VERITAS AI agent with a unique on-chain identity
contract VeritasIdentityRegistry {

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string name, bytes32 metadataHash);
    event AgentUpdated(uint256 indexed agentId, bytes32 newMetadataHash);

    struct AgentIdentity {
        uint256 id;
        address owner;
        string  name;
        bytes32 metadataHash;
        uint256 registeredAt;
        bool    active;
    }

    uint256 public agentCount;
    mapping(uint256 => AgentIdentity)  public agents;
    mapping(address  => uint256[])     public ownerAgents;
    mapping(string   => bool)          public nameTaken;
    mapping(string   => uint256)       public nameToId;

    function registerAgent(string calldata name, bytes32 metadataHash)
        external returns (uint256 agentId)
    {
        require(bytes(name).length > 0, "Name required");
        require(!nameTaken[name],        "Name taken");

        agentId = ++agentCount;
        agents[agentId] = AgentIdentity({
            id:           agentId,
            owner:        msg.sender,
            name:         name,
            metadataHash: metadataHash,
            registeredAt: block.timestamp,
            active:       true
        });
        ownerAgents[msg.sender].push(agentId);
        nameTaken[name]  = true;
        nameToId[name]   = agentId;

        emit AgentRegistered(agentId, msg.sender, name, metadataHash);
    }

    function updateAgent(uint256 agentId, bytes32 newMetadataHash) external {
        require(agents[agentId].owner == msg.sender, "Not owner");
        agents[agentId].metadataHash = newMetadataHash;
        emit AgentUpdated(agentId, newMetadataHash);
    }

    function getAgent(uint256 id) external view returns (AgentIdentity memory) {
        return agents[id];
    }

    function getAgentByName(string calldata name) external view returns (AgentIdentity memory) {
        return agents[nameToId[name]];
    }
}