interface WarningProps {
	message: string;
	type?: 'error' | 'warning' | 'info';
	onClose?: () => void;
}

export const Warning = ({ message, type = 'warning', onClose }: WarningProps) => {
	const getStyle = () => {
		switch (type) {
			case 'error':
				return {
					backgroundColor: '#f8d7da',
					border: '2px solid #dc3545',
					color: '#721c24'
				};
			case 'warning':
				return {
					backgroundColor: '#fff3cd',
					border: '2px solid #ffc107',
					color: '#856404'
				};
			case 'info':
				return {
					backgroundColor: '#d1ecf1',
					border: '2px solid #17a2b8',
					color: '#0c5460'
				};
			default:
				return {
					backgroundColor: '#fff3cd',
					border: '2px solid #ffc107',
					color: '#856404'
				};
		}
	};

	const style = getStyle();

	return (
		<div style={{
			marginTop: '20px',
			padding: '15px',
			borderRadius: '8px',
			position: 'relative',
			width: '50%',
			margin: '20px auto 0',
			...style
		}}>
			{onClose && (
				<button
					onClick={onClose}
					style={{
						position: 'absolute',
						top: '10px',
						right: '10px',
						background: 'none',
						border: 'none',
						fontSize: '18px',
						cursor: 'pointer',
						color: style.color,
						opacity: 0.7
					}}
				>
					×
				</button>
			)}
			<div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
				{type === 'error' && '❌ Error:'}
				{type === 'warning' && '⚠️ Warning:'}
				{type === 'info' && 'ℹ️ Info:'}
			</div>
			<div style={{ fontSize: '14px', whiteSpace: 'pre-line' }}>
				{message}
			</div>
		</div>
	);
};
