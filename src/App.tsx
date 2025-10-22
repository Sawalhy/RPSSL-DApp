import "./App.css";
import { useGameState } from "./hooks/useGameState";
import { CreateGameView } from "./components/views/CreateGameView";
import { JoinGameView } from "./components/views/JoinGameView";
import { Player1WaitView } from "./components/views/Player1WaitView";
import { Player1RevealView } from "./components/views/Player1RevealView";
import { Player2PlayView } from "./components/views/Player2PlayView";
import { Player2WaitView } from "./components/views/Player2WaitView";
import { WinLoseView } from "./components/views/WinLoseView";
import { Warning } from "./components/shared/Warning";
import { GameInfoDisplay } from "./components/shared/GameInfoDisplay";
import { DeploymentLoading } from "./components/shared/DeploymentLoading";

function App() {
	const gameState = useGameState();
	const { 
		currentView, 
		setCurrentView, 
		gameInfo, 
		generatedSalt, 
		selectedMove, 
		warningMessage, 
		warningType, 
		isDeploying,
		setWarningMessage 
	} = gameState;

	const renderView = () => {
		switch (currentView) {
			case 'create-game':
				return <CreateGameView gameState={gameState} />;
			case 'join-game':
				return <JoinGameView gameState={gameState} />;
			case 'player1-wait':
				return <Player1WaitView gameState={gameState} />;
			case 'player1-reveal':
				return <Player1RevealView gameState={gameState} />;
			case 'player2-play':
				return <Player2PlayView gameState={gameState} />;
			case 'player2-wait':
				return <Player2WaitView gameState={gameState} />;
			case 'player1-win':
				return <WinLoseView gameState={gameState} isWin={true} player="player1" />;
			case 'player1-lose':
				return <WinLoseView gameState={gameState} isWin={false} player="player1" />;
			case 'player2-win':
				return <WinLoseView gameState={gameState} isWin={true} player="player2" />;
			case 'player2-lose':
				return <WinLoseView gameState={gameState} isWin={false} player="player2" />;
			case 'landing':
			default:
				return (
					<div style={{ textAlign: 'center', padding: '50px' }}>
						<h1>Rock Paper Scissors Spock Lizard</h1>
						<p style={{ marginBottom: '30px', fontSize: '18px', color: '#666' }}>
							Choose your role to start playing
						</p>
						<div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
							<button
								onClick={() => setCurrentView('create-game')}
								style={{
									padding: '15px 30px',
									fontSize: '16px',
									backgroundColor: '#4CAF50',
									color: 'white',
									border: 'none',
									borderRadius: '8px',
									cursor: 'pointer',
									boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)',
									transition: 'all 0.2s ease'
								}}
							>
								Create Game
							</button>
							<button
								onClick={() => setCurrentView('join-game')}
								style={{
									padding: '15px 30px',
									fontSize: '16px',
									backgroundColor: '#007bff',
									color: 'white',
									border: 'none',
									borderRadius: '8px',
									cursor: 'pointer',
									boxShadow: '0 4px 8px rgba(0, 123, 255, 0.3)',
									transition: 'all 0.2s ease'
								}}
							>
								Join Game
							</button>
						</div>
					</div>
				);
		}
	};

	// Views that should show GameInfoDisplay
	const showGameInfo = ['player1-wait', 'player1-reveal', 'player2-play', 'player2-wait'].includes(currentView);
	
	// Debug logging
	console.log("App - GameInfoDisplay state:", { 
		currentView, 
		showGameInfo, 
		hasGameInfo: !!gameInfo,
		gameInfoRole: gameInfo?.playerRole 
	});
	
	// Views that should show Back to Menu button
	const showBackButton = !['landing', 'player1-win', 'player1-lose', 'player2-win', 'player2-lose'].includes(currentView);

	return (
		<div className="App">
			{renderView()}
			
			{/* Global Warning Display */}
			{warningMessage && (
				<Warning
					message={warningMessage}
					type={warningType}
					onClose={() => setWarningMessage("")}
				/>
			)}
			
			{/* Game Info Display for active game states */}
			{showGameInfo && gameInfo && (
				<GameInfoDisplay
					gameInfo={gameInfo}
					generatedSalt={generatedSalt}
					selectedMove={selectedMove}
					showSalt={gameInfo.playerRole === 'player1'}
				/>
			)}
			
			{/* Back to Menu Button */}
			{showBackButton && (
				<div style={{ textAlign: 'center', marginTop: '20px' }}>
						<button
						onClick={() => setCurrentView('landing')}
						style={{
							padding: '10px 20px',
							fontSize: '14px',
							backgroundColor: '#666',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer'
						}}
					>
						Back to Menu
						</button>
				</div>
			)}

			{/* Deployment Loading Overlay */}
			<DeploymentLoading isDeploying={isDeploying} />
		</div>
	);
}

export default App;