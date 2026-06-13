// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IReputationRegistry {
    function updateReputation(uint256 agentId, bool wasCorrect) external;
}

/// @title VeritasValidationRegistry — ERC-8004 Validation Layer
/// @notice Commits reasoning hashes BEFORE execution, proves predictions after
contract VeritasValidationRegistry {

    event PredictionCommitted(
        uint256 indexed predId,
        uint256 indexed agentId,
        bytes32         reasoningHash,
        string          market,
        bool            isLong,
        uint256         confidence,
        uint256         timestamp
    );
    event PredictionValidated(
        uint256 indexed predId,
        bool            wasCorrect,
        int256          pnl,
        uint256         timestamp
    );

    enum Status { Pending, Verified, Disproven }

    struct Prediction {
        uint256 id;
        uint256 agentId;
        bytes32 reasoningHash;   // keccak256 of full reasoning text
        string  market;
        bool    isLong;
        uint8   confidence;      // 0–100
        int256  entryPrice;      // scaled ×100
        int256  exitPrice;
        int256  pnl;
        Status  status;
        uint256 committedAt;
        uint256 validatedAt;
    }

    uint256 public predCount;
    mapping(uint256 => Prediction) public predictions;
    mapping(uint256 => uint256[])  public agentPredictions; // agentId → predIds

    IReputationRegistry public immutable reputationRegistry;
    address             public immutable owner;
    mapping(address => bool) public validators;

    modifier onlyValidator() {
        require(validators[msg.sender] || msg.sender == owner, "Not validator");
        _;
    }

    constructor(address _reputationRegistry) {
        reputationRegistry = IReputationRegistry(_reputationRegistry);
        owner              = msg.sender;
        validators[msg.sender] = true;
    }

    function addValidator(address v) external { require(msg.sender==owner); validators[v]=true; }

    /// @notice Agent commits reasoning hash BEFORE trade executes
    function commitPrediction(
        uint256 agentId,
        bytes32 reasoningHash,
        string  calldata market,
        bool    isLong,
        uint8   confidence,
        int256  entryPrice
    ) external onlyValidator returns (uint256 predId) {
        predId = ++predCount;
        predictions[predId] = Prediction({
            id:            predId,
            agentId:       agentId,
            reasoningHash: reasoningHash,
            market:        market,
            isLong:        isLong,
            confidence:    confidence,
            entryPrice:    entryPrice,
            exitPrice:     0,
            pnl:           0,
            status:        Status.Pending,
            committedAt:   block.timestamp,
            validatedAt:   0
        });
        agentPredictions[agentId].push(predId);
        emit PredictionCommitted(predId, agentId, reasoningHash, market, isLong, confidence, block.timestamp);
    }

    /// @notice Validates outcome after trade resolves — updates reputation
    function validatePrediction(
        uint256 predId,
        bool    wasCorrect,
        int256  exitPrice,
        int256  pnl
    ) external onlyValidator {
        Prediction storage p = predictions[predId];
        require(p.id != 0,                   "Not found");
        require(p.status == Status.Pending,  "Already resolved");

        p.exitPrice    = exitPrice;
        p.pnl          = pnl;
        p.status       = wasCorrect ? Status.Verified : Status.Disproven;
        p.validatedAt  = block.timestamp;

        reputationRegistry.updateReputation(p.agentId, wasCorrect);
        emit PredictionValidated(predId, wasCorrect, pnl, block.timestamp);
    }

    function getPrediction(uint256 id) external view returns (Prediction memory) {
        return predictions[id];
    }

    function getAgentPredictions(uint256 agentId) external view returns (uint256[] memory) {
        return agentPredictions[agentId];
    }
}