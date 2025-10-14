import { moves } from "../../constants/moves";

interface MovePlayedStatusProps {
	gameInfo: {
		c2: number;
	};
}

export const MovePlayedStatus = ({ gameInfo }: MovePlayedStatusProps) => {
	return (
		<div style={{
			padding: '15px',
			backgroundColor: '#d4edda',
			border: '1px solid #c3e6cb',
			borderRadius: '8px',
			color: '#155724'
		}}>
			<h4>Move Already Played</h4>
			<p>You have already played your move: <strong>{moves[gameInfo.c2].name}</strong></p>
			<p>Waiting for Player 1 to reveal their move...</p>
		</div>
	);
};
