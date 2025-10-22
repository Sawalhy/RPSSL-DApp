import React from 'react';

interface DeploymentLoadingProps {
  isDeploying: boolean;
}

export const DeploymentLoading = ({ isDeploying }: DeploymentLoadingProps) => {
  if (!isDeploying) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: 'white'
    }}>
      <div style={{
        backgroundColor: '#2c3e50',
        padding: '40px',
        borderRadius: '12px',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px',
          animation: 'spin 2s linear infinite'
        }}>
          ⚙️
        </div>
        
        <h2 style={{ marginBottom: '20px', color: '#ecf0f1' }}>
          Deploying Contract...
        </h2>
        
        <p style={{ 
          marginBottom: '20px', 
          color: '#bdc3c7',
          lineHeight: '1.5'
        }}>
          Please wait while your contract is being deployed to the blockchain.
          <br />
          This may take a few moments.
        </p>
        
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#34495e',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#3498db',
            animation: 'loading 2s ease-in-out infinite'
          }} />
        </div>
        
        <p style={{ 
          fontSize: '12px', 
          color: '#95a5a6',
          fontStyle: 'italic'
        }}>
          Do not close this window or refresh the page
        </p>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
