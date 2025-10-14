interface ContractAddressInputProps {
	contractAddress: string;
	onAddressChange: (address: string) => void;
	onCheckGame: () => void;
}

export const ContractAddressInput = ({ contractAddress, onAddressChange, onCheckGame }: ContractAddressInputProps) => {
	return (
		<div style={{ marginBottom: '10px' }}>
			<label htmlFor="contractAddress">Contract Address:</label>
			<input
				id="contractAddress"
				type="text"
				value={contractAddress}
				onChange={(e) => onAddressChange(e.target.value)}
				placeholder="0x..."
				style={{
					marginLeft: '10px',
					padding: '5px',
					width: '300px',
					fontFamily: 'monospace'
				}}
			/>
			<button 
				onClick={onCheckGame}
				style={{ marginLeft: '10px', padding: '5px 10px' }}
			>
				Check Game
			</button>
		</div>
	);
};
