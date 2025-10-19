import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "../contract/abi";
import { bytecode } from "../contract/bytecode";

export type GameState = 
  | 'landing'
  | 'create-game'
  | 'join-game'
  | 'player1-wait'
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
      } else if (gameInfo?.playerRole === 'player1' && currentView === 'player1-wait') {
        setWarningMessage("Time's up! Player 2's turn has expired.\n\n⚠️ WARNING: Calling timeout will spend gas that cannot be recovered. Only call timeout if you're sure Player 2 will not play.");
        setWarningType('warning');
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timeLeft, gameInfo?.playerRole, currentView]);

  // Check game status function
  const checkGameStatus = async () => {
    if (!gameInfo?.contractAddress) {
      setWarningMessage("No contract address provided");
      setWarningType('error');
      return;
    }

    // Validate contract address format
    if (!ethers.isAddress(gameInfo.contractAddress)) {
      setWarningMessage("Invalid contract address format");
      setWarningType('error');
      return;
    }

    try {
      console.log("🔍 DEBUGGING CONTRACT INTERACTION");
      console.log("📋 Contract Address:", gameInfo.contractAddress);
      console.log("🌐 Window.ethereum available:", !!window.ethereum);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      console.log("🔗 Provider created:", !!provider);
      
      // Check network
      const network = await provider.getNetwork();
      console.log("🌍 Network Info:", {
        name: network.name,
        chainId: network.chainId.toString(),
        isSepolia: network.chainId === 11155111n
      });
      
      // Check if we're on the right network
      if (network.chainId !== 11155111n) {
        console.warn("⚠️ Wrong network! Expected Sepolia (11155111), got:", network.chainId.toString());
        setWarningMessage(`Wrong network detected. Please switch to Sepolia testnet. Current: ${network.name} (${network.chainId})`);
        setWarningType('error');
        return;
      }
      
      const contract = new ethers.Contract(gameInfo.contractAddress, abi, provider);
      console.log("📄 Contract instance created:", !!contract);
      console.log("📋 ABI length:", abi.length);
      
      const signer = await provider.getSigner();
      const currentAddress = await signer.getAddress();
      console.log("👤 Current address:", currentAddress);
      
      // Check account balance
      const balance = await provider.getBalance(currentAddress);
      console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
      
      // Check if account has enough balance for gas
      if (balance < ethers.parseEther("0.001")) {
        console.warn("⚠️ Low balance! May not have enough for gas fees");
      }

      // Check if contract exists by calling a simple view function first
      let j1Address, j2Address, stake, c1Hash, c2, lastAction, timeout;
      
      try {
        console.log("Attempting to call contract functions...");
        console.log("Contract address:", gameInfo.contractAddress);
        
        // First, check if there's any code at the address
        const code = await provider.getCode(gameInfo.contractAddress);
        if (code === '0x') {
          setWarningMessage("No contract found at this address. The address is empty. Please deploy a contract first or check the address.");
          setWarningType('error');
          return;
        }
        console.log("Contract code found:", code.substring(0, 10) + "...");
        
        // Check if this is actually a contract (not an EOA)
        const balance = await provider.getBalance(gameInfo.contractAddress);
        const nonce = await provider.getTransactionCount(gameInfo.contractAddress);
        console.log("Contract balance:", ethers.formatEther(balance), "ETH");
        console.log("Contract nonce:", nonce);
        
        if (nonce === 0 && balance === 0n) {
          setWarningMessage("This address appears to be empty (no transactions, no balance). Please verify the contract address.");
          setWarningType('error');
          return;
        }
        
        // Check network information
        const network = await provider.getNetwork();
        console.log("Connected to network:", network);
        
        // Try to call a simple function first to test connectivity
        try {
          console.log("🧪 Testing basic contract connectivity with stake()...");
          const testCall = await contract.stake();
          console.log("✅ Test call to stake() successful:", testCall);
          console.log("📊 Stake value type:", typeof testCall);
          console.log("📊 Stake value:", testCall.toString());
        } catch (testError) {
          console.error("❌ Test call failed:", testError);
          console.error("🔍 Error details:", {
            code: testError.code,
            message: testError.message,
            reason: testError.reason,
            data: testError.data
          });
          
          if (testError.code === 'CALL_EXCEPTION' && testError.message.includes('missing revert data')) {
            setWarningMessage(`Contract not found at this address on ${network.name} (Chain ID: ${network.chainId}). Please verify the contract address and ensure you're connected to the correct network.`);
          } else {
            setWarningMessage("Contract exists but cannot be called. This might be a different contract type or the contract is not properly initialized.");
          }
          setWarningType('error');
          return;
        }
        
        // Try to access j1 and j2 as functions (they are getter functions for public variables)
        try {
          console.log("📞 Calling j1() function...");
          j1Address = await contract.j1();
          console.log("✅ j1() successful:", j1Address);
          console.log("📊 j1() type:", typeof j1Address);
          console.log("📏 j1() length:", j1Address.length);
          console.log("🔍 j1() is valid address:", ethers.isAddress(j1Address));
          
          // Check if it's a valid address
          if (!ethers.isAddress(j1Address)) {
            console.warn("j1() returned invalid address, treating as placeholder");
            j1Address = "0x0000000000000000000000000000000000000000";
          } else {
            // Check if it's a zero address or uninitialized
            if (j1Address === "0x0000000000000000000000000000000000000000" || 
                j1Address.startsWith("0x00000000000000000000000000000000000000")) {
              console.warn("j1() returned zero/uninitialized address, treating as placeholder");
              j1Address = "0x0000000000000000000000000000000000000000";
            }
          }
        } catch (j1Error) {
          console.error("❌ j1() failed:", j1Error);
          console.error("🔍 j1() error details:", {
            code: j1Error.code,
            message: j1Error.message,
            reason: j1Error.reason,
            data: j1Error.data
          });
          j1Address = "0x0000000000000000000000000000000000000000"; // Placeholder
        }

        try {
          console.log("📞 Calling j2() function...");
          j2Address = await contract.j2();
          console.log("✅ j2() successful:", j2Address);
          console.log("📊 j2() type:", typeof j2Address);
          console.log("📏 j2() length:", j2Address.length);
          console.log("🔍 j2() is valid address:", ethers.isAddress(j2Address));
          
          // Check if it's a valid address
          if (!ethers.isAddress(j2Address)) {
            console.warn("j2() returned invalid address, treating as placeholder");
            j2Address = "0x0000000000000000000000000000000000000000";
          } else {
            // Check if it's a zero address or uninitialized
            if (j2Address === "0x0000000000000000000000000000000000000000" || 
                j2Address.startsWith("0x00000000000000000000000000000000000000")) {
              console.warn("j2() returned zero/uninitialized address, treating as placeholder");
              j2Address = "0x0000000000000000000000000000000000000000";
            }
          }
        } catch (j2Error) {
          console.error("❌ j2() failed:", j2Error);
          console.error("🔍 j2() error details:", {
            code: j2Error.code,
            message: j2Error.message,
            reason: j2Error.reason,
            data: j2Error.data
          });
          j2Address = "0x0000000000000000000000000000000000000000"; // Placeholder
        }
        
        if (j1Address === "0x0000000000000000000000000000000000000000" && j2Address === "0x0000000000000000000000000000000000000000") {
          console.log("j1 and j2 not available - ABI mismatch detected");
        } else if (j1Address === "0x0000000000000000000000000000000000000000") {
          console.log("j1 not available, but j2 is - partial ABI mismatch");
        } else if (j2Address === "0x0000000000000000000000000000000000000000") {
          console.log("j2 not available, but j1 is - partial ABI mismatch");
        } else {
          console.log("Both j1 and j2 addresses retrieved successfully");
        }
        
        console.log("📞 Calling stake() function...");
        stake = await contract.stake();
        console.log("✅ stake() successful:", stake);
        console.log("📊 stake value:", stake.toString());
        
        console.log("📞 Calling c1Hash() function...");
        c1Hash = await contract.c1Hash();
        console.log("✅ c1Hash() successful:", c1Hash);
        console.log("📊 c1Hash length:", c1Hash.length);
        
        console.log("📞 Calling c2() function...");
        c2 = await contract.c2();
        console.log("✅ c2() successful:", c2);
        console.log("📊 c2 value:", c2.toString());
        
        console.log("📞 Calling lastAction() function...");
        lastAction = await contract.lastAction();
        console.log("✅ lastAction() successful:", lastAction);
        console.log("📊 lastAction value:", lastAction.toString());
        
        // Try to get TIMEOUT, but handle if it fails
        try {
          console.log("📞 Calling TIMEOUT() function...");
          timeout = await contract.TIMEOUT();
          console.log("✅ TIMEOUT() successful:", timeout);
          console.log("📊 TIMEOUT value:", timeout.toString());
        } catch (timeoutError) {
          console.error("❌ TIMEOUT() failed:", timeoutError);
          console.error("🔍 TIMEOUT() error details:", {
            code: timeoutError.code,
            message: timeoutError.message,
            reason: timeoutError.reason,
            data: timeoutError.data
          });
          try {
            console.log("📞 Trying TIMEOUT as property...");
            timeout = await contract.TIMEOUT;
            console.log("✅ TIMEOUT property successful:", timeout);
            console.log("📊 TIMEOUT property value:", timeout.toString());
          } catch (timeoutPropError) {
            console.error("❌ TIMEOUT property also failed:", timeoutPropError);
            console.error("🔍 TIMEOUT property error details:", {
              code: timeoutPropError.code,
              message: timeoutPropError.message,
              reason: timeoutPropError.reason,
              data: timeoutPropError.data
            });
            timeout = 300; // Default to 5 minutes (300 seconds)
            console.log("⚠️ Using default timeout of 300 seconds");
          }
        }
        
      } catch (contractError) {
        console.error("Contract call failed:", contractError);
        console.error("Error details:", {
          message: contractError.message,
          code: contractError.code,
          data: contractError.data
        });
        
        // Check for specific error types
        if (contractError.code === 'BAD_DATA' && contractError.message.includes('could not decode result data')) {
          setWarningMessage("No contract found at this address. The address may be empty or the contract may not be deployed yet. Please verify the contract address and ensure it's deployed on the current network.");
        } else if (contractError.message.includes('missing revert data')) {
          setWarningMessage("Contract not found at this address. Please verify the contract address is correct.");
        } else if (contractError.message.includes('CALL_EXCEPTION')) {
          setWarningMessage("Unable to connect to contract. Please check the network and contract address.");
        } else {
          setWarningMessage(`Contract call failed: ${contractError.message}`);
        }
        setWarningType('error');
        return;
      }

      console.log("🎉 CONTRACT INTERACTION SUMMARY:");
      console.log("📋 Contract Address:", gameInfo.contractAddress);
      console.log("👤 Player 1 (j1):", j1Address);
      console.log("👤 Player 2 (j2):", j2Address);
      console.log("💰 Stake:", ethers.formatEther(stake), "ETH");
      console.log("🔐 C1 Hash:", c1Hash);
      console.log("🎯 C2 Move:", c2);
      console.log("⏰ Last Action:", new Date(Number(lastAction) * 1000).toLocaleString());
      console.log("⏱️ Timeout:", timeout, "seconds");
      console.log("🌍 Network:", network.name, "(Chain ID:", network.chainId.toString() + ")");
      console.log("👤 Current User:", currentAddress);

      const updatedGameInfo: GameInfo = {
        contractAddress: gameInfo.contractAddress,
        j1Address,
        j2Address,
        stake: ethers.formatEther(stake),
        c1Hash,
        c2: Number(c2),
        lastAction: Number(lastAction),
        timeout: Number(timeout),
        playerRole: gameInfo.playerRole
      };

      setGameInfo(updatedGameInfo);

      // Determine next view based on game state
      if (j1Address === "0x0000000000000000000000000000000000000000" && j2Address === "0x0000000000000000000000000000000000000000") {
        // We can't determine player role from contract, so show a generic view
        setWarningMessage("Contract loaded successfully, but player addresses cannot be retrieved. This contract may have been deployed with a different ABI. You can still view the game state.");
        setWarningType('warning');
        setCurrentView('join-game'); // Stay on join game view
      } else {
        // Check if current user is Player 1 (if we have j1 address)
        if (j1Address !== "0x0000000000000000000000000000000000000000" && j1Address.toLowerCase() === currentAddress.toLowerCase()) {
          // Player 1
          if (c2 === 0) {
            setCurrentView('player1-wait');
          } else {
            setCurrentView('player1-wait');
          }
        } 
        // Check if current user is Player 2 (if we have j2 address)
        else if (j2Address !== "0x0000000000000000000000000000000000000000" && j2Address.toLowerCase() === currentAddress.toLowerCase()) {
          // Player 2
          if (c2 === 0) {
            setCurrentView('player2-play');
          } else {
            setCurrentView('player2-wait');
          }
        }
        // If we can't determine role, show generic view
        else {
          setWarningMessage("Contract loaded successfully, but cannot determine your player role. You may not be a player in this game.");
          setWarningType('warning');
          setCurrentView('join-game');
        }
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
    setWarningMessage(""); // Clear any previous warnings first
    console.log("🚀 STARTING CONTRACT DEPLOYMENT");
    
    try {
      console.log("🔍 Validating deployment parameters...");
      console.log("👤 Player 2 address:", gameInfo?.j2Address);
      console.log("🎯 Selected move:", selectedMove);
      console.log("💰 Stake amount:", stakeAmount);
      
      if (!gameInfo?.j2Address) {
        console.error("❌ Missing Player 2 address");
        setWarningMessage("Please enter Player 2's address");
        setWarningType('error');
        return;
      }
      if (selectedMove === 0) {
        console.error("❌ No move selected");
        setWarningMessage("Please select a move");
        setWarningType('error');
        return;
      }
      if (!stakeAmount || stakeAmount === "0") {
        console.error("❌ Invalid stake amount");
        setWarningMessage("Please enter a stake amount");
        setWarningType('error');
        return;
      }

      console.log("✅ All parameters valid");
      console.log("🔐 Generating salt and commitment hash...");
      
      const saltHex = ethers.hexlify(ethers.randomBytes(32));
      const saltBig = BigInt(saltHex);
      const c1Hash = ethers.solidityPackedKeccak256(
        ["uint8", "uint256"],
        [selectedMove, saltBig]
      );
      
      console.log("🔐 Salt generated:", saltHex);
      console.log("🔐 Commitment hash:", c1Hash);
      console.log("🎯 Move committed:", selectedMove);

      console.log("🔗 Setting up provider and signer...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const currentAddress = await signer.getAddress();
      console.log("👤 Deployer address:", currentAddress);
      
      // Check network
      const network = await provider.getNetwork();
      console.log("🌍 Network:", network.name, "(Chain ID:", network.chainId.toString() + ")");
      
      // Check balance
      const balance = await provider.getBalance(currentAddress);
      console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
      
      const stakeValue = ethers.parseEther(stakeAmount);
      console.log("💰 Stake value:", ethers.formatEther(stakeValue), "ETH");
      
      if (balance < stakeValue) {
        console.error("❌ Insufficient balance for stake");
        setWarningMessage("Insufficient balance for the stake amount");
        setWarningType('error');
        return;
      }

      console.log("📄 Creating contract factory...");
      console.log("📋 ABI length:", abi.length);
      console.log("📦 Bytecode length:", bytecode.length);
      
      const factory = new ethers.ContractFactory(abi, bytecode, signer);
      console.log("✅ Contract factory created");
      
      console.log("🚀 Deploying contract...");
      console.log("📋 Constructor args:", {
        c1Hash,
        j2Address: gameInfo.j2Address,
        value: ethers.formatEther(stakeValue) + " ETH"
      });
      
      const contract = await factory.deploy(
        c1Hash,
        gameInfo.j2Address,
        { value: stakeValue }
      );

      console.log("⏳ Waiting for deployment confirmation...");
      const deployedAddress = await contract.getAddress();
      console.log("✅ Contract deployed successfully!");
      console.log("📍 Contract address:", deployedAddress);
      
      console.log("📋 Creating game info object...");
      const newGameInfo: GameInfo = {
        contractAddress: deployedAddress,
        j1Address: currentAddress,
        j2Address: gameInfo.j2Address,
        stake: stakeAmount,
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
      
      console.log("🎉 DEPLOYMENT COMPLETE!");
      console.log("📍 Contract Address:", deployedAddress);
      console.log("🔐 Salt (SAVE THIS!):", saltHex);
      console.log("🎯 Committed Move:", selectedMove);
      console.log("💰 Stake:", stakeAmount, "ETH");
      console.log("👤 Player 1:", currentAddress);
      console.log("👤 Player 2:", gameInfo.j2Address);
      console.log("⏰ Timer started: 5 minutes");
    } catch (err: unknown) {
      console.error("❌ DEPLOYMENT FAILED!");
      console.error("🔍 Error details:", err);
      
      if (err instanceof Error) {
        console.error("📋 Error message:", err.message);
        console.error("📋 Error code:", (err as any).code);
        console.error("📋 Error reason:", (err as any).reason);
        console.error("📋 Error data:", (err as any).data);
        
        if (err.message.includes('user rejected')) {
          setWarningMessage("Transaction was rejected by user. Please try again.");
        } else if (err.message.includes('insufficient funds')) {
          setWarningMessage("Insufficient funds for deployment. Please check your balance.");
        } else if (err.message.includes('gas')) {
          setWarningMessage("Gas estimation failed. Please try again or increase gas limit.");
        } else {
          setWarningMessage(`Deployment failed: ${err.message}`);
        }
      } else {
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
      setWarningMessage("Please select a move");
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
