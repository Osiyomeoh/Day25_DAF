// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DAF is Ownable {
    struct Proposal {
        uint256 id;
        address recipient;
        uint256 amount;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 endTime;
        bool executed;
        bool exists;
    }

    IERC20 public governanceToken;
    uint256 public proposalCount;
    uint256 public votingPeriod = 3 days;
    uint256 public minimumTokensRequired = 100 * 10**18; // 100 tokens required to create proposal
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public lastVoteTime;

    event ProposalCreated(
        uint256 indexed proposalId,
        address recipient,
        uint256 amount,
        string description
    );
    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    event ProposalExecuted(uint256 indexed proposalId);

    constructor(address _governanceToken) Ownable(msg.sender) {
        governanceToken = IERC20(_governanceToken);
    }

    function createProposal(
        address recipient,
        uint256 amount,
        string memory description
    ) external returns (uint256) {
        require(
            governanceToken.balanceOf(msg.sender) >= minimumTokensRequired,
            "Insufficient tokens to create proposal"
        );

        proposalCount++;
        Proposal storage proposal = proposals[proposalCount];
        proposal.id = proposalCount;
        proposal.recipient = recipient;
        proposal.amount = amount;
        proposal.description = description;
        proposal.endTime = block.timestamp + votingPeriod;
        proposal.exists = true;

        emit ProposalCreated(proposalCount, recipient, amount, description);
        return proposalCount;
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.exists, "Proposal does not exist");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        require(block.timestamp < proposal.endTime, "Voting period ended");

        uint256 voteWeight = governanceToken.balanceOf(msg.sender);
        require(voteWeight > 0, "No voting power");

        if (support) {
            proposal.votesFor += voteWeight;
        } else {
            proposal.votesAgainst += voteWeight;
        }

        hasVoted[proposalId][msg.sender] = true;
        lastVoteTime[msg.sender] = block.timestamp;

        emit Voted(proposalId, msg.sender, support, voteWeight);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.exists, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp >= proposal.endTime, "Voting period not ended");
        require(
            proposal.votesFor > proposal.votesAgainst &&
                proposal.votesFor >= minimumTokensRequired,
            "Proposal did not pass"
        );

        proposal.executed = true;

        require(
            governanceToken.transfer(proposal.recipient, proposal.amount),
            "Transfer failed"
        );

        emit ProposalExecuted(proposalId);
    }

    function getProposal(uint256 proposalId)
        external
        view
        returns (
            address recipient,
            uint256 amount,
            string memory description,
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 endTime,
            bool executed,
            bool exists
        )
    {
        Proposal memory proposal = proposals[proposalId];
        return (
            proposal.recipient,
            proposal.amount,
            proposal.description,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.endTime,
            proposal.executed,
            proposal.exists
        );
    }

    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        votingPeriod = newPeriod;
    }

    function setMinimumTokensRequired(uint256 newMinimum) external onlyOwner {
        minimumTokensRequired = newMinimum;
    }

    receive() external payable {}
}