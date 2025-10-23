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
						<p style={{ marginBottom: '30px' }}>
							Choose your role to start playing
						</p>
						<div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
							<button
								onClick={() => setCurrentView('create-game')}
								style={{
									padding: '10px 20px',
									cursor: 'pointer'
								}}
							>
								Create Game
							</button>
							<button
								onClick={() => setCurrentView('join-game')}
								style={{
									padding: '10px 20px',
									cursor: 'pointer'
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
							cursor: 'pointer'
						}}
					>
						Back to Menu
					</button>
				</div>
			)}

		</div>
	);
}

export default App;