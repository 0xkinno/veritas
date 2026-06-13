// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIdentityRegistry {
    function agents(uint256 id) external view
        returns (uint256, address, string memory, bytes32, uint256, bool);
}

/// @title VeritasReputationRegistry — ERC-8004 Reputation Layer
/// @notice Stores live reputation scores per agent, updated on every verified prediction
contract VeritasReputationRegistry {

    event ReputationUpdated(uint256 indexed agentId, int256 delta, uint256 newScore, bool wasCorrect);
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    struct ReputationRecord {
        uint256 agentId;
        uint256 score;          // scaled ×100  e.g. 9470 = 94.70
        uint256 totalPreds;
        uint256 correctPreds;
        uint256 lastUpdated;
    }

    uint256 public constant INITIAL_SCORE  = 5000;   // 50.00
    uint256 public constant MAX_SCORE      = 10000;  // 100.00
    uint256 public constant REWARD_DELTA   = 80;     // +0.80
    uint256 public constant PENALTY_DELTA  = 140;    // -1.40

    IIdentityRegistry public immutable identityRegistry;
    address           public immutable owner;

    mapping(uint256 => ReputationRecord) public records;
    mapping(address => bool)             public validators;

    modifier onlyValidator() {
        require(validators[msg.sender] || msg.sender == owner, "Not validator");
        _;
    }

    constructor(address _identityRegistry) {
        identityRegistry = IIdentityRegistry(_identityRegistry);
        owner            = msg.sender;
        validators[msg.sender] = true;
    }

    function addValidator(address v)    external { require(msg.sender==owner); validators[v]=true;  emit ValidatorAdded(v); }
    function removeValidator(address v) external { require(msg.sender==owner); validators[v]=false; emit ValidatorRemoved(v); }

    /// @notice Called when a prediction outcome is confirmed
    function updateReputation(uint256 agentId, bool wasCorrect) external onlyValidator {
        ReputationRecord storage r = records[agentId];
        if (r.agentId == 0) {
            r.agentId = agentId;
            r.score   = INITIAL_SCORE;
        }
        r.totalPreds++;
        if (wasCorrect) {
            r.correctPreds++;
            r.score = r.score + REWARD_DELTA > MAX_SCORE
                ? MAX_SCORE
                : r.score + REWARD_DELTA;
        } else {
            r.score = r.score < PENALTY_DELTA ? 0 : r.score - PENALTY_DELTA;
        }
        r.lastUpdated = block.timestamp;

        int256 delta = wasCorrect ? int256(int256(REWARD_DELTA)) : -int256(int256(PENALTY_DELTA));
        emit ReputationUpdated(agentId, delta, r.score, wasCorrect);
    }

    function getScore(uint256 agentId) external view returns (uint256) {
        return records[agentId].agentId == 0 ? INITIAL_SCORE : records[agentId].score;
    }

    function getRecord(uint256 agentId) external view returns (ReputationRecord memory) {
        return records[agentId];
    }

    function getAccuracy(uint256 agentId) external view returns (uint256) {
        ReputationRecord memory r = records[agentId];
        if (r.totalPreds == 0) return 0;
        return (r.correctPreds * 10000) / r.totalPreds;
    }
}