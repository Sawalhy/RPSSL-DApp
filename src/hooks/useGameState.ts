import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther, formatEther, type Address, decodeFunctionData, keccak256, encodePacked } from "viem";
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
  | 'player2-lose'
  | 'tie';

export interface GameInfo {
  contractAddress: string;
  j1Address: string;
  j2Address: string;
  stake: string;
  originalStake: string; // Store the original stake amount before game ends
  c1Hash: string;
  c1: number; // Player 1's revealed move
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
  getLastContractTransaction: (contractAddress: string) => Promise<string | null>;
  determineWinner: (j1Address: string, j2Address: string, c2: number, userAddress: string) => Promise<void>;
  determineGameWinner: (c1: number, c2: number) => number;
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

  // Custom function to set selected move and generate salt
  const handleSetSelectedMove = (move: number) => {
    setSelectedMove(move);
    // Generate cryptographically secure salt (32 bytes = 256 bits)
    const saltBytes = crypto.getRandomValues(new Uint8Array(32));
    const saltHex = '0x' + Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    setGeneratedSalt(saltHex);
  };

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

  // Automatic status checking every 10 seconds for active game states
  useEffect(() => {
    let statusInterval: NodeJS.Timeout | null = null;
    
    const activeStates = ['player1-wait', 'player1-reveal', 'player2-play', 'player2-wait'];
    
    if (activeStates.includes(currentView) && gameInfo?.contractAddress && isConnected) {
      statusInterval = setInterval(() => {
        checkGameStatus();
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [currentView, gameInfo?.contractAddress, isConnected]);


  // Find the last transaction on the contract using Blockscout V1 API
  const getLastContractTransaction = async (contractAddress: string): Promise<string | null> => {
    try {
      const V1_BASE = 'https://eth-sepolia.blockscout.com/api';
      
      const url = new URL(V1_BASE);
      url.searchParams.set('module', 'account');
      url.searchParams.set('action', 'txlist');
      url.searchParams.set('address', contractAddress);
      url.searchParams.set('startblock', '0');
      url.searchParams.set('endblock', '99999999');
      url.searchParams.set('page', '1');
      url.searchParams.set('offset', '1');
      url.searchParams.set('sort', 'desc');
      
      const res = await fetch(url.toString());
      if (!res.ok) return null;
      
      const data = await res.json();
      if (data.status !== '1') return null;
      
      const tx = data.result?.[0];
      return tx?.hash || null;
    } catch (error) {
      console.error('Error getting last contract transaction:', error);
      return null;
    }
  };

  // Determine winner locally based on the last transaction
  const determineWinner = async (j1Address: string, j2Address: string, c2: number, userAddress: string) => {
    if (!publicClient || !gameInfo) return;

    const isPlayer1 = userAddress.toLowerCase() === j1Address.toLowerCase();
    
    try {
      // Get the last transaction on the contract
      const lastTxHash = await getLastContractTransaction(gameInfo.contractAddress);
      
      if (!lastTxHash) {
        setWarningMessage("Could not find last transaction");
        setWarningType('error');
        return;
      }

      // Get the transaction details
      const tx = await publicClient.getTransaction({ hash: lastTxHash as `0x${string}` });
      
      // Decode the function call
      const decoded = decodeFunctionData({
        abi: abi as any,
        data: tx.input,
      });


      if (decoded.functionName === 'j1Timeout') {
        setCurrentView(isPlayer1 ? 'player1-lose' : 'player2-win');
      } else if (decoded.functionName === 'j2Timeout') {
        setCurrentView(isPlayer1 ? 'player1-win' : 'player2-lose');
      } else if (decoded.functionName === 'solve') {
        const c1 = Number(decoded.args[0]);
        const winner = determineGameWinner(c1, c2);
        
        // Update gameInfo with Player 1's revealed move
        const updatedGameInfo = {
          ...gameInfo,
          c1: c1
        };
        setGameInfo(updatedGameInfo);
        
        if (winner === 1) {
          setCurrentView(isPlayer1 ? 'player1-win' : 'player2-lose');
        } else if (winner === 2) {
          setCurrentView(isPlayer1 ? 'player1-lose' : 'player2-win');
        } else {
          setCurrentView('tie');
        }
      } 
    } catch (error) {
      console.error('Error determining winner:', error);
      setWarningMessage("Could not determine winner");
      setWarningType('error');
    }
  };

  // Local game winner determination logic (same as contract)
  const determineGameWinner = (c1: number, c2: number): number => {
    if (c1 === c2) return 0; // Tie
    if (c1 === 0) return 2; // Player 1 didn't play
    if (c2 === 0) return 1; // Player 2 didn't play
    
    // Same parity: lower number wins
    if (c1 % 2 === c2 % 2) {
      return c1 < c2 ? 1 : 2;
    }
    // Different parity: higher number wins
    return c1 > c2 ? 1 : 2;
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
        c1: gameInfo.c1 || 0,
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
      
    if (!gameInfo.j2Address) {
      setWarningMessage("Please enter Player 2's address");
        setWarningType('error');
        return;
      }

    setWarningMessage("");
    try {
      // Generate keccak256 hash of move and salt
      const saltBigInt = BigInt(generatedSalt);
      const packed = encodePacked(['uint8', 'uint256'], [selectedMove, saltBigInt]);
      const c1Hash = keccak256(packed);

      const hash = await walletClient.deployContract({
        abi: abi as any,
        bytecode: bytecode as `0x${string}`,
        args: [c1Hash, gameInfo.j2Address] as any,
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
          c1Hash: c1Hash,
        c1: 0,
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
            functionName: 'j2Timeout',
          } as any)
        : await walletClient.writeContract({
            address: gameInfo.contractAddress as Address,
            abi: abi as any,
            functionName: 'j1Timeout',
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
    setSelectedMove: handleSetSelectedMove,
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
    getLastContractTransaction,
    determineWinner,
    determineGameWinner,
  };
};