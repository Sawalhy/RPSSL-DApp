interface TimerProps {
	timeLeft: number;
	isActive: boolean;
	title: string;
	subtitle?: string;
}

export const Timer = ({ timeLeft, isActive, title, subtitle }: TimerProps) => {
	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	};

	if (!isActive) return null;

	return (
		<div style={{
			marginTop: '20px',
			padding: '10px',
			backgroundColor: timeLeft <= 60 ? '#ffebee' : '#e8f5e8',
			border: `2px solid ${timeLeft <= 60 ? '#f44336' : '#4caf50'}`,
			borderRadius: '8px',
			textAlign: 'center',
			width: '75%',
			margin: '20px auto 0'
		}}>
			<h4 style={{ margin: '0 0 5px 0', color: timeLeft <= 60 ? '#d32f2f' : '#2e7d32' }}>
				{title}
			</h4>
			<div style={{
				fontSize: '24px',
				fontWeight: 'bold',
				color: timeLeft <= 60 ? '#d32f2f' : '#2e7d32'
			}}>
				{formatTime(timeLeft)}
			</div>
			<div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
				{subtitle || (timeLeft <= 60 ? '⚠️ Less than 1 minute left!' : 'Time remaining')}
			</div>
		</div>
	);
};
