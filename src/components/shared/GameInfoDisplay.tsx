import type { GameInfo } from "../../hooks/useGameState";

interface GameInfoDisplayProps {
  gameInfo: GameInfo;
}

export const GameInfoDisplay = ({ 
  gameInfo
}: GameInfoDisplayProps) => {
  const moves = ['', 'Rock', 'Paper', 'Scissors', 'Spock', 'Lizard'];

  return (
    <div style={{
      marginTop: '20px',
      padding: '10px',
      border: '1px solid #000',
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
      <div style={{ fontSize: '12px', marginTop: '10px', fontStyle: 'italic' }}>
        Game status refreshes automatically every 2 seconds
      </div>
    </div>
  );
};
