import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "../contract/abi";
import { moves } from "../constants/moves";
import { MoveSelector } from "./shared/MoveSelector";
import { Timer } from "./shared/Timer";
import { Warning } from "./shared/Warning";

// Join Game Component
const JoinGameView = () => {
	const [contractAddress, setContractAddress] = useState<string>("");
	const [selectedMove, setSelectedMove] = useState<number>(0);
	const [gameInfo, setGameInfo] = useState<any>(null);
	const [playerRole, setPlayerRole] = useState<'player1' | 'player2' | null>(null);
	const [timeLeft, setTimeLeft] = useState<number>(0);
	const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
	const [warningMessage, setWarningMessage] = useState<string>("");
	const [warningType, setWarningType] = useState<'error' | 'warning' | 'info'>('warning');

	useEffect(() => {
		let interval: NodeJS.Timeout | null = null;

		if (isTimerActive && timeLeft > 0) {
			interval = setInterval(() => {
				setTimeLeft((timeLeft) => timeLeft - 1);
			}, 1000);
		} else if (timeLeft === 0 && isTimerActive) {
			setIsTimerActive(false);
			if (playerRole === 'player2') {
				setWarningMessage("Time's up! You can now call timeout to win the game.");
				setWarningType('info');
			}
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isTimerActive, timeLeft, playerRole]);

	const checkGameAndJoin = async () => {
		if (!contractAddress) {
			setWarningMessage("Please enter a contract address");
			setWarningType('error');
			return;
		}

		try {
			const provider = new ethers.BrowserProvider(window.ethereum);
			const contract = new ethers.Contract(contractAddress, abi, provider);
			const signer = await provider.getSigner();
			const currentAddress = await signer.getAddress();

			// Get game info
			const j1Address = await contract.j1();
			const j2Address = await contract.j2();
			const stake = await contract.stake();
			const c2 = await contract.c2();
			const lastAction = await contract.lastAction();
			const timeout = await contract.TIMEOUT();

			setGameInfo({
				j1Address,
				j2Address,
				stake: ethers.formatEther(stake),
				c2: Number(c2),
				lastAction: Number(lastAction),
				timeout: Number(timeout)
			});

			// Determine player role
			if (j1Address.toLowerCase() === currentAddress.toLowerCase()) {
				setPlayerRole('player1');
				setWarningMessage("You are Player 1. Waiting for Player 2 to play their move.");
				setWarningType('info');
			} else if (j2Address.toLowerCase() === currentAddress.toLowerCase()) {
				setPlayerRole('player2');
				setWarningMessage("You are Player 2. You can now play your move.");
				setWarningType('info');
				
				// Start timer for Player 2
				if (c2 === 0) {
					const timeElapsed = Math.floor(Date.now() / 1000) - lastAction;
					const remainingTime = timeout - timeElapsed;
					if (remainingTime > 0) {
						setTimeLeft(remainingTime);
						setIsTimerActive(true);
					}
				}
			} else {
				setWarningMessage("You are not a player in this game.");
				setWarningType('error');
				setPlayerRole(null);
			}
		} catch (error) {
			console.error("Error checking game:", error);
			setWarningMessage("Invalid contract address or error connecting to contract");
			setWarningType('error');
		}
	};

	const playMove = async () => {
		if (!contractAddress || !gameInfo) {
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
			const contract = new ethers.Contract(contractAddress, abi, signer);

			const tx = await contract.play(selectedMove, {
				value: ethers.parseEther(gameInfo.stake)
			});

			await tx.wait();
			setWarningMessage("Move submitted successfully! Waiting for Player 1 to reveal their move.");
			setWarningType('info');
			
			// Refresh game info
			checkGameAndJoin();
		} catch (error) {
			console.error("Error playing move:", error);
			setWarningMessage("Failed to submit move. Please try again.");
			setWarningType('error');
		}
	};

	const callTimeout = async () => {
		if (!contractAddress) {
			setWarningMessage("No contract address available for timeout call.");
			setWarningType('error');
			return;
		}

		try {
			const provider = new ethers.BrowserProvider(window.ethereum);
			const signer = await provider.getSigner();
			const contract = new ethers.Contract(contractAddress, abi, signer);

			const tx = playerRole === 'player1' 
				? await contract.j1Timeout()
				: await contract.j2Timeout();
			
			await tx.wait();
			setWarningMessage("Timeout called successfully! You won the game.");
			setWarningType('info');
		} catch (err: unknown) {
			console.error("Timeout call error:", err);
			setWarningMessage("Failed to call timeout. Please try again.");
			setWarningType('error');
		}
	};

	const checkGameState = async () => {
		if (!contractAddress) return;
		checkGameAndJoin();
	};

	const renderPlayer1View = () => {
		if (!gameInfo) return null;

		return (
			<div>
				<h3>Player 1 - Waiting for Player 2</h3>
				
				<div style={{ marginBottom: '20px' }}>
					<button 
						onClick={checkGameState}
						style={{
							padding: '10px 20px',
							fontSize: '14px',
							backgroundColor: '#2196F3',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							marginRight: '10px'
						}}
					>
						Check Game State
					</button>

					{gameInfo.c2 > 0 && (
						<button 
							onClick={callTimeout}
							disabled={isTimerActive}
							style={{
								padding: '10px 20px',
								fontSize: '14px',
								backgroundColor: isTimerActive ? '#ccc' : '#f44336',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: isTimerActive ? 'not-allowed' : 'pointer',
								opacity: isTimerActive ? 0.6 : 1
							}}
						>
							Call Timeout
						</button>
					)}
				</div>

				{isTimerActive && (
					<Timer 
						timeLeft={timeLeft}
						isActive={isTimerActive}
						title="Player 1's Reveal Timer"
						subtitle="Time to reveal your move"
					/>
				)}

				<div style={{
					marginTop: '20px',
					padding: '15px',
					backgroundColor: '#f8f9fa',
					border: '1px solid #dee2e6',
					borderRadius: '8px'
				}}>
					<h4>Game Status:</h4>
					<div>Player 2 Move: {gameInfo.c2 > 0 ? moves[gameInfo.c2].name : 'Not played yet'}</div>
					<div>Stake Amount: {gameInfo.stake} ETH</div>
				</div>
			</div>
		);
	};

	const renderPlayer2View = () => {
		if (!gameInfo) return null;

		if (gameInfo.c2 === 0) {
			// Player 2 hasn't played yet
			return (
				<div>
					<h3>Player 2 - Play Your Move</h3>
					
					<MoveSelector 
						selectedMove={selectedMove}
						onMoveSelect={setSelectedMove}
					/>

					<div style={{ marginBottom: '20px' }}>
						<label>Stake Amount: {gameInfo.stake} ETH</label>
					</div>

					<div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
						<button 
							onClick={playMove}
							style={{
								padding: '10px 20px',
								fontSize: '14px',
								backgroundColor: '#4CAF50',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer'
							}}
						>
							Play Move
						</button>
					</div>

					{isTimerActive && (
						<Timer 
							timeLeft={timeLeft}
							isActive={isTimerActive}
							title="Your Turn Timer"
							subtitle="Time to play your move"
						/>
					)}
				</div>
			);
		} else {
			// Player 2 has played, waiting for Player 1
			return (
				<div>
					<h3>Player 2 - Waiting for Player 1</h3>
					
					<div style={{ marginBottom: '20px' }}>
						<button 
							onClick={checkGameState}
							style={{
								padding: '10px 20px',
								fontSize: '14px',
								backgroundColor: '#2196F3',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								marginRight: '10px'
							}}
						>
							Check Game State
						</button>

						<button 
							onClick={callTimeout}
							disabled={isTimerActive}
							style={{
								padding: '10px 20px',
								fontSize: '14px',
								backgroundColor: isTimerActive ? '#ccc' : '#f44336',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: isTimerActive ? 'not-allowed' : 'pointer',
								opacity: isTimerActive ? 0.6 : 1
							}}
						>
							Call Timeout
						</button>
					</div>

					{isTimerActive && (
						<Timer 
							timeLeft={timeLeft}
							isActive={isTimerActive}
							title="Player 1's Reveal Timer"
							subtitle="Time for Player 1 to reveal"
						/>
					)}

					<div style={{
						marginTop: '20px',
						padding: '15px',
						backgroundColor: '#d4edda',
						border: '1px solid #c3e6cb',
						borderRadius: '8px',
						color: '#155724'
					}}>
						<h4>Move Already Played</h4>
						<p>You played: <strong>{moves[gameInfo.c2].name}</strong></p>
						<p>Waiting for Player 1 to reveal their move...</p>
					</div>
				</div>
			);
		}
	};

	return (
		<div>
			<h3>Join Existing Game</h3>
			
			<div style={{ marginBottom: '10px' }}>
				<label htmlFor="contractAddress">Contract Address:</label>
				<input
					id="contractAddress"
					type="text"
					value={contractAddress}
					onChange={(e) => setContractAddress(e.target.value)}
					placeholder="0x..."
					style={{
						marginLeft: '10px',
						padding: '5px',
						width: '300px',
						fontFamily: 'monospace'
					}}
				/>
				<button 
					onClick={checkGameAndJoin}
					style={{ marginLeft: '10px', padding: '5px 10px' }}
				>
					Join Game
				</button>
			</div>

			{warningMessage && (
				<Warning 
					message={warningMessage} 
					type={warningType} 
					onClose={() => setWarningMessage("")}
				/>
			)}

			{playerRole === 'player1' && renderPlayer1View()}
			{playerRole === 'player2' && renderPlayer2View()}
		</div>
	);
};

export default JoinGameView;