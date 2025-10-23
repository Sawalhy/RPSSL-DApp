interface WarningProps {
	message: string;
	type?: 'error' | 'warning' | 'info';
	onClose?: () => void;
}

export const Warning = ({ message, type = 'warning', onClose }: WarningProps) => {
	const getBorderColor = () => {
		switch (type) {
			case 'error':
				return 'red';
			case 'warning':
				return 'orange';
			case 'info':
				return 'blue';
			default:
				return 'orange';
		}
	};

	return (
		<div style={{
			marginTop: '20px',
			padding: '10px',
			border: `2px solid ${getBorderColor()}`,
			position: 'relative',
			width: '50%',
			margin: '20px auto 0'
		}}>
			{onClose && (
				<button
					onClick={onClose}
					style={{
						position: 'absolute',
						top: '5px',
						right: '5px',
						background: 'none',
						border: 'none',
						fontSize: '18px',
						cursor: 'pointer'
					}}
				>
					×
				</button>
			)}
			<div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
				{type === 'error' && 'Error:'}
				{type === 'warning' && 'Warning:'}
				{type === 'info' && 'Info:'}
			</div>
			<div style={{ whiteSpace: 'pre-line' }}>
				{message}
			</div>
		</div>
	);
};
