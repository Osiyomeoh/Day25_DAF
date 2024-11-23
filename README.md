# Decentralized Autonomous Fund (DAF)

A smart contract implementation of a decentralized fund where token holders can vote on fund management decisions. This project demonstrates the use of token-based governance in decentralized finance.

## Features

- 🗳️ Token-based voting system
- 💰 Decentralized fund management
- ⏰ Time-locked voting periods
- 🔐 Proposal creation and execution
- 📊 Community-driven investment decisions

## Technology Stack

- Solidity ^0.8.20
- Hardhat Development Environment
- OpenZeppelin Contracts
- TypeScript Testing Suite

## Contract Structure

The main components of the DAF contract include:

```solidity
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
```

## Getting Started

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd DAF
```

2. Install dependencies
```bash
npm install
```

3. Compile contracts
```bash
npx hardhat compile
```

4. Run tests
```bash
npx hardhat test
```

## Core Functions

### Proposal Management

- `createProposal(address recipient, uint256 amount, string memory description)`: Create a new funding proposal
- `vote(uint256 proposalId, bool support)`: Vote on an existing proposal
- `executeProposal(uint256 proposalId)`: Execute a successful proposal

### Governance

- `setVotingPeriod(uint256 newPeriod)`: Update the voting period duration
- `setMinimumTokensRequired(uint256 newMinimum)`: Update minimum tokens required for proposal creation

### View Functions

- `getProposal(uint256 proposalId)`: Get details of a specific proposal
- `governanceToken()`: Get the address of the governance token

## Testing

The test suite covers:

- Contract deployment
- Proposal creation
- Voting mechanics
- Proposal execution
- Access control
- Edge cases

Run the full test suite:
```bash
npx hardhat test
```

## Security Features

- Minimum token requirement for proposal creation
- Time-locked voting periods
- Vote delegation prevention
- Single vote per proposal
- Owner-only administrative functions

## Usage Example

```javascript
// Create a proposal
await daf.createProposal(
    recipientAddress,
    ethers.parseEther("100"),
    "Fund allocation for project X"
);

// Vote on proposal
await daf.vote(1, true);

// Execute successful proposal
await daf.executeProposal(1);
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Acknowledgments

- OpenZeppelin for secure contract implementations
- Ethereum community for best practices
- Hardhat for the development environment
