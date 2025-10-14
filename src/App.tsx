import { useState } from "react";
import "./App.css";
import CreateGameView from "./components/CreateGameView";
import JoinGameView from "./components/JoinGameView";

function App() {
	const [viewMode, setViewMode] = useState<'landing' | 'create' | 'join'>('landing');

	const renderView = () => {
		switch (viewMode) {
			case 'create':
				return <CreateGameView />;
			case 'join':
				return <JoinGameView />;
			default:
				return (
					<div style={{ textAlign: 'center', padding: '50px' }}>
						<h1>Rock Paper Scissors Spock Lizard</h1>
						<p style={{ marginBottom: '30px', fontSize: '18px', color: '#666' }}>
							Choose your role to start playing
						</p>
						<div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
							<button
								onClick={() => setViewMode('create')}
								style={{
									padding: '15px 30px',
									fontSize: '18px',
									backgroundColor: '#4CAF50',
									color: 'white',
									border: 'none',
									borderRadius: '8px',
									cursor: 'pointer',
									boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
								}}
							>
								Create Game
							</button>
							<button
								onClick={() => setViewMode('join')}
								style={{
									padding: '15px 30px',
									fontSize: '18px',
									backgroundColor: '#2196F3',
									color: 'white',
									border: 'none',
									borderRadius: '8px',
									cursor: 'pointer',
									boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
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
			{(viewMode === 'create' || viewMode === 'join') && (
				<div style={{ textAlign: 'center', marginTop: '20px' }}>
						<button
						onClick={() => setViewMode('landing')}
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