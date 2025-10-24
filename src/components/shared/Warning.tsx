interface WarningProps {
	message: string;
	onClose?: () => void;
}

export const Warning = ({ message, onClose }: WarningProps) => {

	return (
		<div style={{
			marginTop: '20px',
			padding: '10px',
			border: '2px solid red',
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
				Error:
			</div>
			<div style={{ whiteSpace: 'pre-line' }}>
				{message}
			</div>
		</div>
	);
};
