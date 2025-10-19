import "./App.css";
import { useGameState } from "./hooks/useGameState";
import { CreateGameView } from "./components/views/CreateGameView";
import { JoinGameView } from "./components/views/JoinGameView";
import { Player1WaitView } from "./components/views/Player1WaitView";
import { Player2PlayView } from "./components/views/Player2PlayView";
import { Player2WaitView } from "./components/views/Player2WaitView";
import { WinLoseView } from "./components/views/WinLoseView";

function App() {
	const gameState = useGameState();
	const { currentView, setCurrentView } = gameState;

	const renderView = () => {
		switch (currentView) {
			case 'create-game':
				return <CreateGameView gameState={gameState} />;
			case 'join-game':
				return <JoinGameView gameState={gameState} />;
			case 'player1-wait':
				return <Player1WaitView gameState={gameState} />;
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

	return (
		<div className="App">
			{renderView()}
			{(currentView !== 'landing' && currentView !== 'player1-win' && currentView !== 'player1-lose' && currentView !== 'player2-win' && currentView !== 'player2-lose') && (
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
		</div>
	);
}

export default App;