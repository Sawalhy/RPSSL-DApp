interface Player2AddressInputProps {
	player2Address: string;
	onAddressChange: (address: string) => void;
}

//Used by Player 2 to enter the address of the smart contract
export const Player2AddressInput = ({ player2Address, onAddressChange }: Player2AddressInputProps) => {
	return (
		<div style={{ marginBottom: '10px' }}>
			<label htmlFor="player2">Player 2 Address:</label>
			<input
				id="player2"
				type="text"
				value={player2Address}
				onChange={(e) => onAddressChange(e.target.value)}
				placeholder="0x..."
				style={{
					marginLeft: '10px',
					padding: '5px',
					width: '300px',
					fontFamily: 'monospace'
				}}
			/>
		</div>
	);
};
