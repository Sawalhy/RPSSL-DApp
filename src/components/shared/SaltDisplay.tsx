interface SaltDisplayProps {
	salt: string;
}

export const SaltDisplay = ({ salt }: SaltDisplayProps) => {
	return (
		<div style={{
			marginTop: '20px',
			padding: '15px',
			backgroundColor: '#fff3cd',
			border: '2px solid #ffc107',
			borderRadius: '8px'
		}}>
			<h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
				⚠️ IMPORTANT: Save Your Salt!
			</h4>
			<p style={{ margin: '0 0 10px 0', color: '#856404', fontSize: '14px' }}>
				You need this salt to reveal your move later. Copy it and save it somewhere safe!
			</p>
			<div style={{
				marginBottom: '10px',
				padding: '8px',
				fontFamily: 'monospace',
				fontSize: '12px',
				border: '1px solid #ccc',
				borderRadius: '4px',
				backgroundColor: '#f8f9fa',
				wordBreak: 'break-all'
			}}>
				{salt}
			</div>
		</div>
	);
};
