import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "../contract/abi";
import { bytecode } from "../contract/bytecode";

const TIMEOUT_SECONDS = 300; // 5 minutes

export type GameState = 
  | 'landing'
  | 'create-game'
  | 'join-game'
  | 'player1-wait'
  | 'player1-reveal'
  | 'player2-play'
  | 'player2-wait'
  | 'player1-win'
  | 'player1-lose'
  | 'player2-win'
  | 'player2-lose';

export interface GameInfo {
  contractAddress: string;
  j1Address: string;
  j2Address: string;
  stake: string;
  originalStake: string; // Store the original stake amount before game ends
  c1Hash: string;
  c2: number;
  lastAction: number;
  playerRole: 'player1' | 'player2' | null;
}

export interface GameContextType {
  // Current state
  currentView: GameState;
  gameInfo: GameInfo | null;
  
  // Game data
  selectedMove: number;
  stakeAmount: string;
  generatedSalt: string;
  timeLeft: number;
  isTimerActive: boolean;
  
  // UI state
  warningMessage: string;
  warningType: 'error' | 'warning' | 'info';
  
  // Actions
  setCurrentView: (view: GameState) => void;
  setGameInfo: (info: GameInfo | null) => void;
  setSelectedMove: (move: number) => void;
  setStakeAmount: (amount: string) => void;
  setGeneratedSalt: (salt: string) => void;
  setTimeLeft: (time: number) => void;
  setIsTimerActive: (active: boolean) => void;
  setWarningMessage: (message: string) => void;
  setWarningType: (type: 'error' | 'warning' | 'info') => void;
  
  // Game functions
  checkGameStatus: () => Promise<void>;
  deployContract: () => Promise<void>;
  playMove: () => Promise<void>;
  callTimeout: () => Promise<void>;
  revealMove: () => Promise<void>;
}

export const useGameState = (): GameContextType => {
  // Current state
  const [currentView, setCurrentView] = useState<GameState>('landing');
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  
  // Game data
  const [selectedMove, setSelectedMove] = useState<number>(0);
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [generatedSalt, setGeneratedSalt] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  
  // UI state
  const [warningMessage, setWarningMessage] = useState<string>("");
  const [warningType, setWarningType] = useState<'error' | 'warning' | 'info'>('warning');

  // Web3 instances
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  // Initialize Web3 on mount
  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const prov = new ethers.BrowserProvider(window.ethereum);
        const sign = await prov.getSigner();
        setProvider(prov);
        setSigner(sign);
      }
    };
    initWeb3();
  }, []);

  // Update contract whenever gameInfo.contractAddress changes
  useEffect(() => {
    if (gameInfo?.contractAddress && signer) {
      const newContract = new ethers.Contract(gameInfo.contractAddress, abi, signer);
      setContract(newContract);
    }
  }, [gameInfo?.contractAddress]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timeLeft]);

  // Clear warnings when view changes
  useEffect(() => {
    setWarningMessage("");
  }, [currentView]);

  // Automatic status checking every 60 seconds for active game states
  useEffect(() => {
    let statusInterval: NodeJS.Timeout | null = null;
    
    const activeStates = ['player1-wait', 'player1-reveal', 'player2-play', 'player2-wait'];
    
    if (activeStates.includes(currentView) && gameInfo?.contractAddress) {
      statusInterval = setInterval(() => {
        checkGameStatus();
      }, 60000); // Check every 60 seconds
    }

    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [currentView, gameInfo?.contractAddress]);


  // Determine winner by parsing transaction history
  const determineWinner = async (j1Address: string, j2Address: string, c2: number, currentAddress: string) => {
    try {
      // Get recent transactions to the contract
      const filter = {
        address: gameInfo!.contractAddress,
        fromBlock: -1000, // Last 1000 blocks
        toBlock: 'latest'
      };
      
      const logs = await provider.getLogs(filter);
      
      // Find the most recent transaction that ended the game
      let lastEndingTransaction = null;
      for (const log of logs.reverse()) {
        try {
          const tx = await provider.getTransaction(log.transactionHash);
          if (tx && tx.to === gameInfo!.contractAddress) {
            // Decode the transaction input to see which function was called
            const decoded = contract!.interface.parseTransaction(tx);
            if (decoded && (decoded.name === 'solve' || decoded.name === 'j1Timeout' || decoded.name === 'j2Timeout')) {
              lastEndingTransaction = { tx, decoded };
              break;
            }
          }
        } catch (e) {
          // Skip invalid transactions
          continue;
        }
      }
     
      
      const { decoded } = lastEndingTransaction;
      const isPlayer1 = currentAddress.toLowerCase() === j1Address.toLowerCase();
      const isPlayer2 = currentAddress.toLowerCase() === j2Address.toLowerCase();
      
      if (decoded.name === 'solve') {
        // Game ended via solve() - use contract's win function to determine winner
        const c1 = Number(decoded.args[0]); // Player 1's revealed move
        const c2Number = Number(c2); // Player 2's move from contract
        
        // Call the contract's win function to determine the winner
        const player1Wins = await contract!.win(c1, c2Number);
        const player2Wins = await contract!.win(c2Number, c1);
        
        if (player1Wins) {
          // Player 1 won
          setCurrentView(isPlayer1 ? 'player1-win' : 'player2-lose');
          setWarningMessage(isPlayer1 ? "You won! Player 1 beats Player 2." : "You lost! Player 1 beats Player 2.");
        } else if (player2Wins) {
          // Player 2 won
          setCurrentView(isPlayer2 ? 'player2-win' : 'player1-lose');
          setWarningMessage(isPlayer2 ? "You won! Player 2 beats Player 1." : "You lost! Player 2 beats Player 1.");
        } else {
          // Tie
          setCurrentView(isPlayer1 ? 'player1-win' : 'player2-win'); // Both get their stake back
          setWarningMessage("It's a tie! Both players get their stake back.");
        }
      } else if (decoded.name === 'j1Timeout') {
        // Player 2 won via timeout
        setCurrentView(isPlayer2 ? 'player2-win' : 'player1-lose');
        setWarningMessage(isPlayer2 ? "You won! Player 1 timed out." : "You lost! You timed out.");
      } else if (decoded.name === 'j2Timeout') {
        // Player 1 won via timeout
        setCurrentView(isPlayer1 ? 'player1-win' : 'player2-lose');
        setWarningMessage(isPlayer1 ? "You won! Player 2 timed out." : "You lost! You timed out.");
      }
      
      setWarningType('info');
    } catch (error) {
      setWarningMessage("Game ended but couldn't determine winner. Check your wallet balance.");
      setWarningType('warning');
      setCurrentView(currentAddress.toLowerCase() === j1Address.toLowerCase() ? 'player1-win' : 'player2-win');
    }
  };

  // Check game status function
  const checkGameStatus = async () => {
    if (!gameInfo?.contractAddress) {
      setWarningMessage("No contract address provided");
      setWarningType('error');
      return;
    }

    // Validate contract address format
    if (!ethers.isAddress(gameInfo.contractAddress)) {
      setWarningMessage("Invalid contract address");
      setWarningType('error');
      return;
    }

    try {
      const network = await provider!.getNetwork();
      const currentAddress = await signer!.getAddress();

      let j1Address, j2Address, stake, c1Hash, c2, lastAction;
      
      try {
        const code = await provider!.getCode(gameInfo.contractAddress);
        if (code === '0x') {
          setWarningMessage("No contract found at this address");
          setWarningType('error');
          return;
        }
        
        // Get player addresses and contract data
        j1Address = await contract!.j1();
        j2Address = await contract!.j2();
        stake = await contract!.stake();
        c1Hash = await contract!.c1Hash();
        c2 = await contract!.c2();
        lastAction = await contract!.lastAction();
        
      } catch (contractError) {
        setWarningMessage("Failed to connect to contract");
        setWarningType('error');
        return;
      }


      const updatedGameInfo: GameInfo = {
        contractAddress: gameInfo.contractAddress,
        j1Address,
        j2Address,
        stake: ethers.formatEther(stake),
        originalStake: gameInfo.originalStake || ethers.formatEther(stake), // Preserve original stake
        c1Hash,
        c2: Number(c2),
        lastAction: Number(lastAction),
        playerRole: gameInfo.playerRole
      };

      setGameInfo(updatedGameInfo);

      // Determine next view based on contract state
      const stakeValue = Number(stake);
      const c2Value = Number(c2);
      
      // Check if game has ended (stake = 0)
      if (stakeValue === 0) {
        await determineWinner(j1Address, j2Address, c2Value, currentAddress);
        return;
      }
      
      // Determine player role and state
      if (j1Address === "0x0000000000000000000000000000000000000000" && j2Address === "0x0000000000000000000000000000000000000000") {
        setWarningMessage("Unable to read contract data");
        setWarningType('error');
        setCurrentView('join-game');
      } else if (j1Address !== "0x0000000000000000000000000000000000000000" && j1Address.toLowerCase() === currentAddress.toLowerCase()) {
        // Player 1
        if (c2Value === 0) {
          setCurrentView('player1-wait');
          setWarningMessage("");
        } else {
          setCurrentView('player1-reveal');
          setWarningMessage("Player 2 has played! Reveal your move to determine the winner.");
          setWarningType('info');
        }
      } else if (j2Address !== "0x0000000000000000000000000000000000000000" && j2Address.toLowerCase() === currentAddress.toLowerCase()) {
        // Player 2
        if (c2Value === 0) {
          setCurrentView('player2-play');
          setWarningMessage("");
        } else {
          // Player 2 has already played, waiting for Player 1 to reveal
          setCurrentView('player2-wait');
          setWarningMessage("");
          // Initialize timer for Player 1's reveal phase
          const timeSinceLastAction = Math.floor(Date.now() / 1000) - Number(lastAction);
          const remainingTime = Math.max(0, TIMEOUT_SECONDS - timeSinceLastAction);
          setTimeLeft(remainingTime);
          setIsTimerActive(remainingTime > 0);
        }
      } else {
        // Not a player in this game
        setWarningMessage(`You are not a player in this game. This game is between Player 1 (${j1Address.slice(0,6)}...${j1Address.slice(-4)}) and Player 2 (${j2Address.slice(0,6)}...${j2Address.slice(-4)}).`);
        setWarningType('warning');
        setCurrentView('join-game');
      }

    } catch (error) {
      setWarningMessage("Failed to check game status");
      setWarningType('error');
    }
  };

  // Deploy contract function
  const deployContract = async () => {
    setWarningMessage("");
    
    try {
      if (!gameInfo?.j2Address) {
        setWarningMessage("Please enter Player 2's address");
        setWarningType('error');
        return;
      }
      if (selectedMove === 0) {
        setWarningMessage("Please select a move");
        setWarningType('error');
        return;
      }
      if (!stakeAmount || stakeAmount === "0") {
        setWarningMessage("Please enter a stake amount");
        setWarningType('error');
        return;
      }
      
      const saltHex = ethers.hexlify(ethers.randomBytes(32));
      const saltBig = BigInt(saltHex);
      const c1Hash = ethers.solidityPackedKeccak256(
        ["uint8", "uint256"],
        [selectedMove, saltBig]
      );

      const currentAddress = await signer!.getAddress();
      
      const balance = await provider!.getBalance(currentAddress);
      const stakeValue = ethers.parseEther(stakeAmount);
      
      if (balance < stakeValue) {
        setWarningMessage("Insufficient balance for the stake amount");
        setWarningType('error');
        return;
      }

      const factory = new ethers.ContractFactory(abi, bytecode, signer!);
      
      const contract = await factory.deploy(
        c1Hash,
        gameInfo.j2Address,
        { value: stakeValue }
      );

      const deployedAddress = await contract.getAddress();
      
      await contract.waitForDeployment();
      
      const newGameInfo: GameInfo = {
        contractAddress: deployedAddress,
        j1Address: currentAddress,
        j2Address: gameInfo.j2Address,
        stake: stakeAmount,
        originalStake: stakeAmount, // Store original stake amount
        c1Hash,
        c2: 0,
        lastAction: Math.floor(Date.now() / 1000),
        playerRole: 'player1'
      };

      setGameInfo(newGameInfo);
      setGeneratedSalt(saltHex);
      setTimeLeft(TIMEOUT_SECONDS);
      setIsTimerActive(true);
      setCurrentView('player1-wait');
      setWarningMessage("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('user rejected')) {
          setWarningMessage("Transaction rejected");
        } else if (err.message.includes('insufficient funds')) {
          setWarningMessage("Insufficient funds");
        } else {
          setWarningMessage("Deployment failed");
        }
      } else {
        setWarningMessage("Deployment failed");
      }
      setWarningType('error');
    }
  };
  // Play move function
  const playMove = async () => {
    if (selectedMove === 0) {
      setWarningMessage("Please select a move to play");
      setWarningType('error');
      return;
    }
    try {
      const tx = await contract!.play(selectedMove, {
        value: ethers.parseEther(gameInfo!.originalStake)
      });
      await tx.wait();
      // Initialize timer for Player 1's reveal phase
      setTimeLeft(TIMEOUT_SECONDS);
      setIsTimerActive(true);
      // Update game info and switch to wait view
      await checkGameStatus();
      setCurrentView('player2-wait');
    } catch (error) {
      setWarningMessage("Failed to submit move");
      setWarningType('error');
    }
  };

  // Call timeout function
  const callTimeout = async () => {
    // Check game status before calling timeout
    await checkGameStatus();
    try {
      const tx = gameInfo!.playerRole === 'player1' 
        ? await contract!.j1Timeout()
        : await contract!.j2Timeout();
      await tx.wait();
      // Determine winner based on who called timeout
      if (gameInfo.playerRole === 'player1') {
        setCurrentView('player1-win');
      } else {
        setCurrentView('player2-win');
      }
    } catch (err: unknown) {
      setWarningMessage("Failed to call timeout");
      setWarningType('error');
    }
  };

  // Reveal move function
  const revealMove = async () => {
    try {
      const tx = await contract!.solve(selectedMove, generatedSalt);
      await tx.wait();
      // Check game status to determine winner
      await checkGameStatus();
    } catch (err: unknown) {
      setWarningMessage("Failed to reveal move");
      setWarningType('error');
    }
  };

  return {
    // Current state
    currentView,
    gameInfo,
    
    // Game data
    selectedMove,
    stakeAmount,
    generatedSalt,
    timeLeft,
    isTimerActive,
    
    // UI state
    warningMessage,
    warningType,
    
    // Actions
    setCurrentView,
    setGameInfo,
    setSelectedMove,
    setStakeAmount,
    setGeneratedSalt,
    setTimeLeft,
    setIsTimerActive,
    setWarningMessage,
    setWarningType,
    
    // Game functions
    checkGameStatus,
    deployContract,
    playMove,
    callTimeout,
    revealMove,
  };
};
