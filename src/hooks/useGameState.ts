import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "../contract/abi";
import { bytecode } from "../contract/bytecode";

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
  timeout: number;
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
  isDeploying: boolean;
  
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
  setIsDeploying: (deploying: boolean) => void;
  
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
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false);
      if (gameInfo?.playerRole === 'player2' && currentView === 'player2-play') {
        setWarningMessage("Time's up! You can now call timeout to win the game.");
        setWarningType('info');
      } else if (gameInfo?.playerRole === 'player2' && currentView === 'player2-wait') {
        setWarningMessage("Time's up! Player 1's turn has expired. You can now call timeout to win the game.");
        setWarningType('info');
      } else if (gameInfo?.playerRole === 'player1' && currentView === 'player1-wait') {
        setWarningMessage("Time's up! Player 2's turn has expired.\n\n⚠️ WARNING: Calling timeout will spend gas that cannot be recovered. Only call timeout if you're sure Player 2 will not play.");
        setWarningType('warning');
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timeLeft, gameInfo?.playerRole, currentView]);

  // Clear warnings when view changes
  useEffect(() => {
    setWarningMessage("");
  }, [currentView]);

  // Automatic status checking every 60 seconds for active game states
  useEffect(() => {
    let statusInterval: NodeJS.Timeout | null = null;
    
    const activeStates = ['player1-wait', 'player1-reveal', 'player2-play', 'player2-wait'];
    
    if (activeStates.includes(currentView) && gameInfo?.contractAddress) {
      console.log("🔄 Starting automatic status checks every 60 seconds (reduced frequency to avoid RPC quota limits)");
      statusInterval = setInterval(() => {
        console.log("⏰ Automatic status check triggered");
        checkGameStatus();
      }, 60000); // Changed to 60000ms (60 seconds / 1 minute)
    }

    return () => {
      if (statusInterval) {
        console.log("🛑 Stopping automatic status checks");
        clearInterval(statusInterval);
      }
    };
  }, [currentView, gameInfo?.contractAddress]);

  // Local win function implementation
  const win = (c1: number, c2: number): boolean => {
    if (c1 === c2) return false;
    if (c1 === 0) return false;
    if (c1 % 2 === c2 % 2) return c1 < c2;
    return c1 > c2;
  };

  // Determine winner by parsing transaction history
  const determineWinner = async (j1Address: string, j2Address: string, c2: number, currentAddress: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(gameInfo!.contractAddress, abi, provider);
      
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
            const decoded = contract.interface.parseTransaction(tx);
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
      
      if (!lastEndingTransaction) {
        // Fallback: determine winner based on who should have won
        setWarningMessage("Game ended but couldn't determine winner from transaction history. Check your wallet balance to see if you won.");
        setWarningType('warning');
        setCurrentView(currentAddress.toLowerCase() === j1Address.toLowerCase() ? 'player1-win' : 'player2-win');
        return;
      }
      
      const { decoded } = lastEndingTransaction;
      const isPlayer1 = currentAddress.toLowerCase() === j1Address.toLowerCase();
      const isPlayer2 = currentAddress.toLowerCase() === j2Address.toLowerCase();
      
      if (decoded.name === 'solve') {
        // Game ended via solve() - need to determine winner based on moves
        const c1 = decoded.args[0]; // First argument is the move
        const winner = win(c1, c2);
        
        if (winner) {
          // Player 1 won
          setCurrentView(isPlayer1 ? 'player1-win' : 'player1-lose');
          setWarningMessage(isPlayer1 ? "You won! Player 1 beats Player 2." : "You lost! Player 1 beats Player 2.");
        } else if (win(c2, c1)) {
          // Player 2 won
          setCurrentView(isPlayer2 ? 'player2-win' : 'player2-lose');
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
      console.error("Error determining winner:", error);
      setWarningMessage("Game ended but couldn't determine winner due to error. Check your wallet balance to see if you won.");
      setWarningType('warning');
      setCurrentView(currentAddress.toLowerCase() === j1Address.toLowerCase() ? 'player1-win' : 'player2-win');
    }
  };

  // Check game status function
  const checkGameStatus = async () => {
    console.log("🔍 Starting game status check...");
    
    if (!gameInfo?.contractAddress) {
      console.log("❌ No contract address provided");
      setWarningMessage("No contract address provided");
      setWarningType('error');
      return;
    }
    
    console.log("📍 Contract address:", gameInfo.contractAddress);

    // Validate contract address format
    if (!ethers.isAddress(gameInfo.contractAddress)) {
      console.log("❌ Invalid contract address format");
      setWarningMessage("Invalid contract address format");
      setWarningType('error');
      return;
    }
    console.log("✅ Contract address format is valid");

    try {
      console.log("🔌 Connecting to provider...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      console.log("🌐 Checking network...");
      // Check network
      const network = await provider.getNetwork();
      console.log("Network info:", { name: network.name, chainId: network.chainId.toString() });
      
      // Check if we're on the right network
      if (network.chainId !== 11155111n) {
        console.log("❌ Wrong network detected");
        setWarningMessage(`Wrong network detected. Please switch to Sepolia testnet. Current: ${network.name} (${network.chainId})`);
        setWarningType('error');
        return;
      }
      console.log("✅ Correct network (Sepolia)");
      
      console.log("📄 Creating contract instance...");
      const contract = new ethers.Contract(gameInfo.contractAddress, abi, provider);
      const signer = await provider.getSigner();
      const currentAddress = await signer.getAddress();
      console.log("✅ Contract instance created, current address:", currentAddress);

      // Check if contract exists by calling a simple view function first
      let j1Address, j2Address, stake, c1Hash, c2, lastAction, timeout;
      console.log("🔍 Checking if contract exists...");
      
      try {
        // Check if there's any code at the address
        const code = await provider.getCode(gameInfo.contractAddress);
        console.log("Contract code length:", code.length);
        if (code === '0x') {
          console.log("❌ No contract code found at address");
          setWarningMessage("No contract found at this address. The address is empty. Please deploy a contract first or check the address.");
          setWarningType('error');
          return;
        }
        console.log("✅ Contract code found");
        
        // Test basic contract connectivity with multiple approaches
        let contractWorking = false;
        let testError: any = null;
        
        try {
          console.log("🧪 Testing contract connectivity with stake() call...");
          const stakeValue = await contract.stake();
          console.log("✅ Contract stake() call successful:", stakeValue.toString());
          contractWorking = true;
        } catch (error) {
          testError = error;
          console.error("❌ Contract stake() call failed:", testError);
          
          // Try alternative approach - check if we can get any data
          try {
            console.log("Trying alternative contract detection...");
            const code = await provider.getCode(gameInfo.contractAddress);
            console.log("Contract code length:", code.length);
            
            if (code.length > 2) {
              console.log("Contract has code, trying to get balance...");
              const balance = await provider.getBalance(gameInfo.contractAddress);
              console.log("Contract balance:", ethers.formatEther(balance), "ETH");
              
              if (balance > 0) {
                console.log("Contract has balance, likely working but ABI mismatch");
                contractWorking = true; // Assume it's working despite ABI issues
              }
            }
          } catch (altError) {
            console.error("Alternative detection failed:", altError);
          }
        }
        
        if (!contractWorking) {
          // More specific error handling
          if (testError && testError.code === 'CALL_EXCEPTION') {
            if (testError.message.includes('missing revert data')) {
              setWarningMessage(`Contract not found at this address on ${network.name} (Chain ID: ${network.chainId}). Please verify the contract address and ensure you're connected to the correct network.`);
        } else if (testError.message.includes('could not decode result data')) {
          setWarningMessage("Contract found but ABI mismatch detected. This contract may have been deployed with a different version or ABI.");
        } else if (testError.message.includes('project ID exceeded quota')) {
          setWarningMessage("RPC quota exceeded. Please switch to a different RPC endpoint in MetaMask or wait for quota reset (usually resets daily).");
        } else {
          setWarningMessage(`Contract call failed: ${testError.message}`);
        }
          } else {
            setWarningMessage("Contract exists but cannot be called. This might be a different contract type or the contract is not properly initialized.");
          }
          setWarningType('error');
          return;
        }
        
        // Get player addresses
        try {
          j1Address = await contract.j1();
          if (!ethers.isAddress(j1Address) || j1Address === "0x0000000000000000000000000000000000000000") {
            j1Address = "0x0000000000000000000000000000000000000000";
          }
        } catch (j1Error) {
          console.error("j1() failed:", j1Error);
          j1Address = "0x0000000000000000000000000000000000000000";
        }

        try {
          j2Address = await contract.j2();
          if (!ethers.isAddress(j2Address) || j2Address === "0x0000000000000000000000000000000000000000") {
            j2Address = "0x0000000000000000000000000000000000000000";
          }
        } catch (j2Error) {
          console.error("j2() failed:", j2Error);
          j2Address = "0x0000000000000000000000000000000000000000";
        }
        
        // Get contract data
        stake = await contract.stake();
        c1Hash = await contract.c1Hash();
        c2 = await contract.c2();
        lastAction = await contract.lastAction();
        
        // Try to get TIMEOUT, but handle if it fails
        try {
          timeout = await contract.TIMEOUT();
        } catch (timeoutError) {
          try {
            timeout = await contract.TIMEOUT;
          } catch (timeoutPropError) {
            timeout = 300; // Default to 5 minutes (300 seconds)
          }
        }
        
      } catch (contractError) {
        console.error("Contract call failed:", contractError);
        
        // Check for specific error types
        if (contractError.code === 'BAD_DATA' && contractError.message.includes('could not decode result data')) {
          setWarningMessage("No contract found at this address. The address may be empty or the contract may not be deployed yet. Please verify the contract address and ensure it's deployed on the current network.");
        } else if (contractError.message.includes('missing revert data')) {
          setWarningMessage("Contract call failed - missing revert data. Please verify the contract address is correct.");
        } else if (contractError.message.includes('CALL_EXCEPTION')) {
          setWarningMessage("Unable to connect to contract. Please check the network and contract address.");
        } else {
          setWarningMessage(`Contract call failed: ${contractError.message}`);
        }
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
        timeout: Number(timeout),
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
        // ABI mismatch - can't determine player role
        setWarningMessage("Contract loaded successfully, but player addresses cannot be retrieved. This contract may have been deployed with a different ABI.");
        setWarningType('warning');
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
          setCurrentView('player2-wait');
          setWarningMessage("");
        }
      } else {
        // Not a player in this game
        setWarningMessage(`You are not a player in this game. This game is between Player 1 (${j1Address.slice(0,6)}...${j1Address.slice(-4)}) and Player 2 (${j2Address.slice(0,6)}...${j2Address.slice(-4)}).`);
        setWarningType('warning');
        setCurrentView('join-game');
      }

    } catch (error) {
      console.error("Error checking game status:", error);
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('missing revert data')) {
          setWarningMessage("Contract not found at this address. Please verify the contract address is correct.");
        } else if (error.message.includes('CALL_EXCEPTION')) {
          setWarningMessage("Unable to connect to contract. Please check the network and contract address.");
        } else {
          setWarningMessage(`Failed to check game status: ${error.message}`);
        }
      } else {
        setWarningMessage("Failed to check game status. Please try again.");
      }
      setWarningType('error');
    }
  };

  // Deploy contract function
  const deployContract = async () => {
    console.log("🚀 Starting contract deployment...");
    setWarningMessage(""); // Clear any previous warnings first
    setIsDeploying(true); // Start loading state
    
    try {
      if (!gameInfo?.j2Address) {
        console.log("❌ Missing Player 2 address");
        setWarningMessage("Please enter Player 2's address");
        setWarningType('error');
        setIsDeploying(false);
        return;
      }
      if (selectedMove === 0) {
        console.log("❌ No move selected");
        setWarningMessage("Please select a move");
        setWarningType('error');
        setIsDeploying(false);
        return;
      }
      if (!stakeAmount || stakeAmount === "0") {
        console.log("❌ No stake amount provided");
        setWarningMessage("Please enter a stake amount");
        setWarningType('error');
        setIsDeploying(false);
        return;
      }
      
      console.log("✅ Validation passed:", {
        j2Address: gameInfo.j2Address,
        selectedMove,
        stakeAmount
      });
      
      console.log("🔐 Generating salt and hash...");
      const saltHex = ethers.hexlify(ethers.randomBytes(32));
      const saltBig = BigInt(saltHex);
      const c1Hash = ethers.solidityPackedKeccak256(
        ["uint8", "uint256"],
        [selectedMove, saltBig]
      );
      console.log("✅ Salt and hash generated:", { saltHex, c1Hash });

      console.log("🔌 Connecting to provider and signer...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const currentAddress = await signer.getAddress();
      console.log("✅ Connected to wallet:", currentAddress);
      
      console.log("💰 Checking balance...");
      const balance = await provider.getBalance(currentAddress);
      const stakeValue = ethers.parseEther(stakeAmount);
      console.log("Balance:", ethers.formatEther(balance), "ETH, Stake:", ethers.formatEther(stakeValue), "ETH");
      
      if (balance < stakeValue) {
        console.log("❌ Insufficient balance");
        setWarningMessage("Insufficient balance for the stake amount");
        setWarningType('error');
        setIsDeploying(false);
        return;
      }

      console.log("🏭 Creating contract factory...");
      console.log("ABI length:", abi.length);
      console.log("Bytecode length:", bytecode.length);
      console.log("Bytecode starts with:", bytecode.substring(0, 20));
      
      const factory = new ethers.ContractFactory(abi, bytecode, signer);
      console.log("✅ Contract factory created");
      
      console.log("🚀 Deploying contract...");
      const contract = await factory.deploy(
        c1Hash,
        gameInfo.j2Address,
        { value: stakeValue }
      );
      console.log("✅ Contract deployment transaction sent");

      console.log("⏳ Waiting for deployment confirmation...");
      const deployedAddress = await contract.getAddress();
      console.log("📍 Contract address:", deployedAddress);
      
      await contract.waitForDeployment();
      console.log("✅ Contract deployed successfully!");
      
      const newGameInfo: GameInfo = {
        contractAddress: deployedAddress,
        j1Address: currentAddress,
        j2Address: gameInfo.j2Address,
        stake: stakeAmount,
        originalStake: stakeAmount, // Store original stake amount
        c1Hash,
        c2: 0,
        lastAction: Math.floor(Date.now() / 1000),
        timeout: 300, // 5 minutes
        playerRole: 'player1'
      };

      console.log("🎮 Setting up game state...");
      setGameInfo(newGameInfo);
      setGeneratedSalt(saltHex);
      setTimeLeft(300);
      setIsTimerActive(true);
      setCurrentView('player1-wait');
      setWarningMessage(""); // Clear any previous warnings
      setIsDeploying(false); // Stop loading state
      console.log("✅ Game setup complete!");
    } catch (err: unknown) {
      console.error("❌ Deployment failed:", err);
      setIsDeploying(false); // Stop loading state
      
      if (err instanceof Error) {
        console.error("Error details:", {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        
        if (err.message.includes('user rejected')) {
          console.log("❌ User rejected transaction");
          setWarningMessage("Transaction was rejected by user. Please try again.");
        } else if (err.message.includes('gas')) {
          console.log("❌ Gas estimation failed");
          setWarningMessage("Gas estimation failed. Please try again or increase gas limit.");
        } else if (err.message.includes('InvalidJump')) {
          console.log("❌ InvalidJump error - bytecode issue");
          setWarningMessage("Contract deployment failed due to bytecode error. Please check the contract bytecode.");
        } else if (err.message.includes('project ID exceeded quota')) {
          console.log("❌ RPC quota exceeded");
          setWarningMessage("RPC quota exceeded. Please switch to a different RPC endpoint in MetaMask or wait for quota reset (usually resets daily).");
        } else {
          console.log("❌ Other deployment error");
          setWarningMessage(`Deployment failed: ${err.message}`);
        }
      } else {
        console.log("❌ Unknown error type");
        setWarningMessage("Transaction was rejected or failed. Please check your wallet connection and try again.");
      }
      setWarningType('error');
    }
  };

  // Play move function
  const playMove = async () => {
    if (!gameInfo?.contractAddress) {
      setWarningMessage("Please check game eligibility first");
      setWarningType('error');
      return;
    }
    if (selectedMove === 0) {
      setWarningMessage("Please select a move to play");
      setWarningType('error');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(gameInfo.contractAddress, abi, signer);

      const tx = await contract.play(selectedMove, {
        value: ethers.parseEther(gameInfo.stake)
      });

      await tx.wait();
      setWarningMessage("Move submitted successfully! Waiting for Player 1 to reveal their move.");
      setWarningType('info');
      
      // Update game info and switch to wait view
      await checkGameStatus();
      setCurrentView('player2-wait');
    } catch (error) {
      console.error("Error playing move:", error);
      setWarningMessage("Failed to submit move. Please try again.");
      setWarningType('error');
    }
  };

  // Call timeout function
  const callTimeout = async () => {
    if (!gameInfo?.contractAddress) {
      setWarningMessage("No contract address available for timeout call.");
      setWarningType('error');
      return;
    }

    // Check game status before calling timeout
    await checkGameStatus();

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(gameInfo.contractAddress, abi, signer);

      const tx = gameInfo.playerRole === 'player1' 
        ? await contract.j1Timeout()
        : await contract.j2Timeout();
      
      await tx.wait();
      
      // Determine winner based on who called timeout
      if (gameInfo.playerRole === 'player1') {
        setCurrentView('player1-win');
      } else {
        setCurrentView('player2-win');
      }
      
      setWarningMessage("Timeout called successfully! You won the game.");
      setWarningType('info');
    } catch (err: unknown) {
      console.error("Timeout call error:", err);
      setWarningMessage("Failed to call timeout. Please try again.");
      setWarningType('error');
    }
  };

  // Reveal move function
  const revealMove = async () => {
    if (!gameInfo?.contractAddress || !generatedSalt) {
      setWarningMessage("No contract address or salt available for reveal.");
      setWarningType('error');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(gameInfo.contractAddress, abi, signer);

      const tx = await contract.solve(selectedMove, generatedSalt);
      await tx.wait();
      
      // Check game status to determine winner
      await checkGameStatus();
      
      setWarningMessage("Move revealed successfully!");
      setWarningType('info');
    } catch (err: unknown) {
      console.error("Reveal move error:", err);
      setWarningMessage("Failed to reveal move. Please try again.");
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
    isDeploying,
    
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
    setIsDeploying,
    
    // Game functions
    checkGameStatus,
    deployContract,
    playMove,
    callTimeout,
    revealMove,
  };
};
