import { moves } from "../../constants/moves";

interface MoveSelectorProps {
	selectedMove: number;
	onMoveSelect: (move: number) => void;
}

export const MoveSelector = ({ selectedMove, onMoveSelect }: MoveSelectorProps) => {
	return (
		<div style={{ marginBottom: '10px', textAlign: 'center' }}>
			<label>Select Your Move:</label>
			<div style={{ marginTop: '5px', display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
				{moves.slice(1).map((move) => (
					<button
						key={move.id}
						onClick={() => onMoveSelect(move.value)}
						style={{
							padding: '8px 12px',
							backgroundColor: selectedMove === move.value ? '#4CAF50' : '#f0f0f0',
							color: selectedMove === move.value ? 'white' : 'black',
							border: '1px solid #ccc',
							borderRadius: '4px',
							cursor: 'pointer',
							fontSize: '14px'
						}}
					>
						{move.name}
					</button>
				))}
			</div>
		</div>
	);
};