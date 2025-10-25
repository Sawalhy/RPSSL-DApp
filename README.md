# RPSSL DApp

A web client for the commit–reveal Rock–Paper–Scissors–Lizard–Spock game defined by `RPS.sol`. It guides two counterparties through creating, joining, and resolving a single match on the Ethereum Sepolia testnet using MetaMask.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Gameplay Walkthrough](#gameplay-walkthrough)
  - [Player 1 — Commit Phase](#player-1--commit-phase)
  - [Player 2 — Response Phase](#player-2--response-phase)
  - [Player 1 — Reveal Phase](#player-1--reveal-phase)
  - [Timeouts and Completion](#timeouts-and-completion)
- [Security Practices](#security-practices)
- [Mixed-Strategy Nash Equilibrium](#mixed-strategy-nash-equilibrium)

---

## Project Overview
- **Purpose:** Provide a decentralized interface for two players to execute the Rock–Paper–Scissors–Lizard–Spock (RPSSL) smart contract without modifying the on-chain logic.
- **Supported Network:** Ethereum Sepolia testnet. The frontend polls Sepolia block data via wagmi and Blockscout-compatible endpoints.
- **Wallet Compatibility:** MetaMask only.
- **Smart Contract:** `RPS.sol` supplied with the exercise (bundled under `src/Solidity/RPS.sol`).

## Prerequisites
- Node.js 18+
- npm or pnpm
- MetaMask configured for Sepolia and funded with test ETH

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open the printed localhost URL in a browser with your wallet connected to Sepolia.

## Gameplay Walkthrough
### Player 1 — Commit Phase
1. Connect your wallet from the landing view. The **Create Game** button remains disabled until the wallet is active.
2. Enter Player 2's address, choose a move, and specify the ETH stake. Moves follow the canonical ordering enforced by the Solidity contract.
3. When you pick a move, the app derives a 32-byte salt via `crypto.getRandomValues`. The salt is automatically saved to your browser's localStorage and will persist across page refreshes, so you don't need to manually record it.
4. Click **Start Game** to deploy a new `RPS` contract instance with the commitment `keccak256(move, salt)` and the posted stake. On success, the UI transitions to **Player 1 Waiting**, starts a five-minute countdown tied to the on-chain timeout, and shows the contract address to share with Player 2.

### Player 2 — Response Phase
1. Choose **Join Game**, connect your wallet, and paste the contract address received from Player 1.
2. The client loads the contract state. After you match the stake and choose a move, submit `play(move)`; the UI mirrors the on-chain timeout locally.

### Player 1 — Reveal Phase
1. As soon as Player 2's move is detected, the UI prompts you to reveal.
2. Submit `solve(originalMove, savedSalt)`. If the salt/move pair matches the original commitment, the contract resolves immediately and sends the winnings (or refunds in a tie).

### Timeouts and Completion
- Both players share the same five-minute timeout countdown derived from `lastAction` on chain.
- Either party can trigger the appropriate timeout branch if the opponent stalls.
- Once `stake` reaches zero, the app decodes the latest transaction to determine the outcome (win, loss, tie) and routes to the summary view.

### Status Polling and Timing Tradeoffs
- The application polls the blockchain every 2 seconds during active gameplay states (`player1-wait`, `player1-reveal`, `player2-play`, `player2-wait`) to detect state changes and update the UI accordingly.
- This creates a fundamental tradeoff: more frequent polling provides faster UI updates and better user experience, but increases network requests and potential rate limiting. Less frequent polling reduces resource usage but may result in delayed state updates, especially during critical moments like move reveals or timeout conditions.

## Security Practices
- **Commitment Integrity:** The frontend constructs the exact keccak256 commitment expected by `RPS.sol` and never leaks Player 1's move before the reveal transaction.
- **High-Entropy Salt:** Salts are generated with `crypto.getRandomValues` to provide 256 bits of entropy, mitigating the other player trying to find the commited move via trying replicate the hash.
- **Input Validation:** Deployment and play actions require a connected wallet, a valid opponent address, and a non-zero stake before submitting any transactions.
- **Timeout Awareness:** A synchronized five-minute timer (based on `lastAction`) keeps both parties aware of when timeout functions become safe to call.
- **Salt Persistence:** The app automatically saves Player 1's salt to localStorage, ensuring it persists across browser refreshes and prevents the critical risk of losing the ability to reveal.


## Mixed-Strategy Nash Equilibrium
In Rock–Paper–Scissors–Lizard–Spock, each weapon beats two choices and loses to two others. No alternative has an upside to any other alternative, it's a balanced game like the classic Rock-Paper-Scissors, so the mixed-strategy nash equilibrium would be playing one move randomly out of the 5 each turn.

## Additional Notes
The decentralised version of the game introduces some complexities that do not exist in other versions of the game, since the commit-reveal scheme incurs network fees, if the stake is not much bigger than the network fees, the fees will dictate part of the optimal behaviour of the players ex. if Player 1 knows he's lost, he would not reveal his move and force Player 2 to call time out. 
