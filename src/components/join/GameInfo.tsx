import { moves } from "../../constants/moves";

interface GameInfoProps {
	gameInfo: {
		j2Address: string;
		stake: string;
		c2: number;
	};
	isEligible: boolean;
}

export const GameInfo = ({ gameInfo, isEligible }: GameInfoProps) => {
	return (
		<div style={{
			marginBottom: '20px',
			padding: '15px',
			backgroundColor: '#f8f9fa',
			border: '1px solid #dee2e6',
			borderRadius: '8px'
		}}>
			<h4>Game Information:</h4>
			<div>Stake Amount: {gameInfo.stake} ETH</div>
			<div>Player 2 Address: {gameInfo.j2Address}</div>
			<div>Player 2 Move: {gameInfo.c2 > 0 ? moves[gameInfo.c2].name : 'Not played yet'}</div>
			<div style={{ 
				color: isEligible ? '#28a745' : '#dc3545',
				fontWeight: 'bold'
			}}>
				Status: {isEligible ? 'You are eligible to play' : 'You are not eligible to play'}
			</div>
		</div>
	);
};
