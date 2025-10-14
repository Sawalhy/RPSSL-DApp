interface ContractInfoProps {
	contractAddress: string;
}

export const ContractInfo = ({ contractAddress }: ContractInfoProps) => {
	return (
		<div style={{ marginTop: '20px' }}>
			<div>Contract Address: {contractAddress}</div>
			<div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
				Share this address with Player 2
			</div>
		</div>
	);
};
