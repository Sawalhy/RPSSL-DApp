import type { GameInfo } from "../../hooks/useGameState";

interface GameInfoDisplayProps {
  gameInfo: GameInfo;
  generatedSalt?: string;
  selectedMove?: number;
  showSalt?: boolean;
}

export const GameInfoDisplay = ({ 
  gameInfo, 
  generatedSalt, 
  selectedMove, 
  showSalt = false 
}: GameInfoDisplayProps) => {
  const moves = ['', 'Rock', 'Paper', 'Scissors', 'Spock', 'Lizard'];

  return (
    <div style={{
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      width: '75%',
      margin: '20px auto 0',
      textAlign: 'center'
    }}>
      <h4>Game Information</h4>
      <div><strong>Contract Address:</strong> {gameInfo.contractAddress}</div>
      <div><strong>Stake Amount:</strong> {gameInfo.originalStake || gameInfo.stake} ETH</div>
      <div><strong>Player 1:</strong> {gameInfo.j1Address}</div>
      <div><strong>Player 2:</strong> {gameInfo.j2Address}</div>
      <div><strong>Player 2 Move:</strong> {gameInfo.c2 > 0 ? moves[gameInfo.c2] : 'Not played yet'}</div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '10px', fontStyle: 'italic' }}>
        Game status refreshes automatically every 60 seconds
      </div>
      
      {showSalt && generatedSalt && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '4px',
          color: '#856404'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            ⚠️ IMPORTANT: Save Your Salt!
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            Salt: {generatedSalt}
          </div>
          {selectedMove && selectedMove > 0 && (
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              Committed Move: {moves[selectedMove]}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
