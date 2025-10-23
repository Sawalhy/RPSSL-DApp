import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther, formatEther, type Address, decodeFunctionData } from "viem";
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
  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

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

  // Automatic status checking every 30 seconds for active game states
  useEffect(() => {
    let statusInterval: NodeJS.Timeout | null = null;
    
    const activeStates = ['player1-wait', 'player1-reveal', 'player2-play', 'player2-wait'];
    
    if (activeStates.includes(currentView) && gameInfo?.contractAddress && isConnected) {
      statusInterval = setInterval(() => {
        checkGameStatus();
      }, 30000); // Check every 30 seconds
    }

    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [currentView, gameInfo?.contractAddress, isConnected]);

  // Determine winner by parsing transaction history
  const determineWinner = async (j1Address: string, j2Address: string, c2: number, userAddress: string) => {
    if (!publicClient || !gameInfo) return;

    try {
      // Get recent transactions to the contract (last 25 blocks ~5 minutes)
      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = latestBlock > 25n ? latestBlock - 25n : 0n;
      
      const logs = await publicClient.getLogs({
        address: gameInfo.contractAddress as Address,
        fromBlock,
        toBlock: 'latest',
      });
      
      // Find the most recent transaction that ended the game
      let lastEndingTransaction = null;
      for (const log of logs.reverse()) {
        try {
          const tx = await publicClient.getTransaction({ hash: log.transactionHash });
          if (tx && tx.to?.toLowerCase() === gameInfo.contractAddress.toLowerCase()) {
            // Decode the transaction input to see which function was called
            const decoded = decodeFunctionData({
              abi,
              data: tx.input,
            });
            
            if (decoded.functionName === 'solve' || decoded.functionName === 'j1Timeout' || decoded.functionName === 'j2Timeout') {
              lastEndingTransaction = { tx, decoded };
              break;
            }
          }
        } catch (e) {
          // Skip invalid transactions
          continue;
        }
      }
     
      if (!lastEndingTransaction) {
        setWarningMessage("Game ended but couldn't determine winner. Check your wallet balance.");
        setWarningType('warning');
        setCurrentView(userAddress.toLowerCase() === j1Address.toLowerCase() ? 'player1-win' : 'player2-win');
        return;
      }
      
      const { decoded } = lastEndingTransaction;
      const isPlayer1 = userAddress.toLowerCase() === j1Address.toLowerCase();
      const isPlayer2 = userAddress.toLowerCase() === j2Address.toLowerCase();
      
      // Check transfer transactions to determine winner
      const receipt = await publicClient.getTransactionReceipt({
        hash: lastEndingTransaction.transactionHash as `0x${string}`,
      });
      
      // Look for transfers in the logs
      const transfers = receipt.logs.filter(log => 
        (log as any).topics && (log as any).topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer event
      );
      
      if (transfers.length === 1) {
        // Single transfer - check if it's 2*stake (winner) or just stake (timeout)
        const transferValue = BigInt(transfers[0].data);
        const stakeValue = parseEther(gameInfo.stake);
        
        if (transferValue === stakeValue * 2n) {
          // Winner gets 2*stake
          const winnerAddress = (transfers[0] as any).topics?.[2]; // 'to' address
          
          if (winnerAddress?.toLowerCase() === j1Address.toLowerCase()) {
            setCurrentView(isPlayer1 ? 'player1-win' : 'player2-lose');
            setWarningMessage(isPlayer1 ? "You won! Player 1 beats Player 2." : "You lost! Player 1 beats Player 2.");
          } else {
            setCurrentView(isPlayer1 ? 'player1-lose' : 'player2-win');
            setWarningMessage(isPlayer1 ? "You lost! Player 2 beats Player 1." : "You won! Player 2 beats Player 1.");
          }
        } else if (transferValue === stakeValue) {
          // Timeout - only stake returned
          setCurrentView(isPlayer1 ? 'player1-lose' : 'player2-win');
          setWarningMessage(isPlayer1 ? "You lost! You timed out." : "You won! Player 1 timed out.");
        }
      } else if (transfers.length === 2) {
        // Two transfers - tie (both get stake back)
        setCurrentView(isPlayer1 ? 'player1-win' : 'player2-win'); // Both get their stake back
        setWarningMessage("It's a tie! Both players get their stake back.");
      }
      
      
      setWarningType('info');
    } catch (error) {
      setWarningMessage("Game ended but couldn't determine winner. Check your wallet balance.");
      setWarningType('warning');
      setCurrentView(userAddress.toLowerCase() === j1Address.toLowerCase() ? 'player1-win' : 'player2-win');
    }
  };

  // Check game status function
  const checkGameStatus = async () => {
    if (!gameInfo?.contractAddress || !publicClient || !address) {
      setWarningMessage("No contract address provided or wallet not connected");
      setWarningType('error');
      return;
    }

    try {
      // Get contract data
      const readContract = (functionName: string) => 
        publicClient.readContract({
          address: gameInfo.contractAddress as Address,
          abi: abi as any,
          functionName,
        } as any);

      const [j1Address, j2Address, stake, c1Hash, c2, lastAction] = await Promise.all([
        readContract('j1'),
        readContract('j2'),
        readContract('stake'),
        readContract('c1Hash'),
        readContract('c2'),
        readContract('lastAction'),
      ]);

      const updatedGameInfo: GameInfo = {
        contractAddress: gameInfo.contractAddress,
        j1Address: j1Address as string,
        j2Address: j2Address as string,
        stake: formatEther(stake as bigint),
        originalStake: gameInfo.originalStake || formatEther(stake as bigint),
        c1Hash: c1Hash as string,
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
        await determineWinner(j1Address as string, j2Address as string, c2Value, address);
        return;
      }
      
      // Determine player role and state
      if (j1Address === "0x0000000000000000000000000000000000000000" && j2Address === "0x0000000000000000000000000000000000000000") {
        setWarningMessage("Unable to read contract data");
        setWarningType('error');
        setCurrentView('join-game');
      } else if (j1Address !== "0x0000000000000000000000000000000000000000" && (j1Address as string).toLowerCase() === address.toLowerCase()) {
        // Player 1
        if (c2Value === 0) {
          setCurrentView('player1-wait');
          setWarningMessage("");
          // Sync timer while waiting for Player 2 to play
          const timeSinceLastAction = Math.floor(Date.now() / 1000) - Number(lastAction);
          const remainingTime = Math.max(0, TIMEOUT_SECONDS - timeSinceLastAction);
          setTimeLeft(remainingTime);
          setIsTimerActive(remainingTime > 0);
        } else {
          setCurrentView('player1-reveal');
          setWarningMessage("Player 2 has played! Reveal your move to determine the winner.");
          setWarningType('info');
          // Sync timer during reveal window
          const timeSinceLastAction = Math.floor(Date.now() / 1000) - Number(lastAction);
          const remainingTime = Math.max(0, TIMEOUT_SECONDS - timeSinceLastAction);
          setTimeLeft(remainingTime);
          setIsTimerActive(remainingTime > 0);
        }
      } else if (j2Address !== "0x0000000000000000000000000000000000000000" && (j2Address as string).toLowerCase() === address.toLowerCase()) {
        // Player 2
        if (c2Value === 0) {
          setCurrentView('player2-play');
          setWarningMessage("");
          // Sync timer while Player 2 can still play
          const timeSinceLastAction = Math.floor(Date.now() / 1000) - Number(lastAction);
          const remainingTime = Math.max(0, TIMEOUT_SECONDS - timeSinceLastAction);
          setTimeLeft(remainingTime);
          setIsTimerActive(remainingTime > 0);
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
        setWarningMessage(`You are not a player in this game. This game is between Player 1 (${(j1Address as string).slice(0,6)}...${(j1Address as string).slice(-4)}) and Player 2 (${(j2Address as string).slice(0,6)}...${(j2Address as string).slice(-4)}).`);
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
    if (!walletClient || !address) {
      setWarningMessage("Wallet not connected");
      setWarningType('error');
      return;
    }

    setWarningMessage("");
    try {
      const hash = await walletClient.deployContract({
        abi: abi as any,
        bytecode: bytecode as `0x${string}`,
        args: [parseEther(stakeAmount), generatedSalt as `0x${string}`] as any,
        value: parseEther(stakeAmount),
      } as any);

      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      
      if (receipt?.contractAddress) {
      const newGameInfo: GameInfo = {
          contractAddress: receipt.contractAddress,
          j1Address: address,
          j2Address: "0x0000000000000000000000000000000000000000",
        stake: stakeAmount,
          originalStake: stakeAmount,
          c1Hash: generatedSalt,
        c2: 0,
        lastAction: Math.floor(Date.now() / 1000),
        playerRole: 'player1'
      };

      setGameInfo(newGameInfo);
        setCurrentView('player1-wait');
        setTimeLeft(TIMEOUT_SECONDS);
      setIsTimerActive(true);
      }
    } catch (error) {
      setWarningMessage("Failed to deploy contract");
      setWarningType('error');
    }
  };

  // Play move function
  const playMove = async () => {
    if (!walletClient || !gameInfo) {
      setWarningMessage("Wallet not connected or no game info");
      setWarningType('error');
      return;
    }

    try {
      const hash = await walletClient.writeContract({
        address: gameInfo.contractAddress as Address,
        abi: abi as any,
        functionName: 'play',
        args: [selectedMove],
        value: parseEther(gameInfo.stake),
      } as any);

      await publicClient?.waitForTransactionReceipt({ hash });
      
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
    if (!walletClient || !gameInfo) {
      setWarningMessage("Wallet not connected or no game info");
      setWarningType('error');
      return;
    }

    // Check game status before calling timeout
    await checkGameStatus();
    try {
      const hash = gameInfo.playerRole === 'player1' 
        ? await walletClient.writeContract({
            address: gameInfo.contractAddress as Address,
            abi: abi as any,
            functionName: 'j1Timeout',
          } as any)
        : await walletClient.writeContract({
            address: gameInfo.contractAddress as Address,
            abi: abi as any,
            functionName: 'j2Timeout',
          } as any);
      
      await publicClient?.waitForTransactionReceipt({ hash });
      
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
    if (!walletClient || !gameInfo) {
      setWarningMessage("Wallet not connected or no game info");
      setWarningType('error');
      return;
    }

    try {
      const hash = await walletClient.writeContract({
        address: gameInfo.contractAddress as Address,
        abi: abi as any,
        functionName: 'solve',
        args: [selectedMove, generatedSalt],
      } as any);
      await publicClient?.waitForTransactionReceipt({ hash });
      
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