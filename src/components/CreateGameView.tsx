import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "../contract/abi";
import { bytecode } from "../contract/bytecode";
import { MoveSelector } from "./shared/MoveSelector";
import { Timer } from "./shared/Timer";
import { Warning } from "./shared/Warning";
import { Player2AddressInput } from "./create/Player2AddressInput";

// Create Game Component
const CreateGameView = () => {
    const [contractAddress, setContractAddress] = useState<string | undefined>(undefined);
    const [player2Address, setPlayer2Address] = useState<string>("");
    const [selectedMove, setSelectedMove] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
    const [stakeAmount, setStakeAmount] = useState<string>("");
    const [generatedSalt, setGeneratedSalt] = useState<string>("");
    const [warningMessage, setWarningMessage] = useState<string>("");
    const [warningType, setWarningType] = useState<'error' | 'warning' | 'info'>('warning');

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isTimerActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((timeLeft) => timeLeft - 1);
            }, 1000);
		} else if (timeLeft === 0 && isTimerActive) {
			setIsTimerActive(false);
			setWarningMessage("Time's up! Player 2's turn has expired.\n\n⚠️ WARNING: Calling timeout will spend gas that cannot be recovered. Only call timeout if you're sure Player 2 will not play.");
			setWarningType('warning');
		}

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerActive, timeLeft]);


    const callTimeout = async () => {
        if (!contractAddress) {
            setWarningMessage("No contract address available for timeout call.");
            setWarningType('error');
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, abi, signer);

            const tx = await contract.j2Timeout();
            await tx.wait();

            setWarningMessage("Timeout called successfully! You can now claim the stake.");
            setWarningType('info');
        } catch (err: unknown) {
            console.error("Timeout call error:", err);
            setWarningMessage("Failed to call timeout. Please try again.");
            setWarningType('error');
        }
    };

    async function deployContract() {
        setWarningMessage(""); // Clear any previous warnings first
        try {
            if (!player2Address) {
                setWarningMessage("Please enter Player 2's address");
                setWarningType('error');
                return;
            }
            if (selectedMove === 0) {
                setWarningMessage("Please select a move");
                setWarningType('error');
                return;
            }
            if (!stakeAmount || stakeAmount === "0") {
                setWarningMessage("Please enter a stake amount");
                setWarningType('error');
                return;
            }

            const saltHex = ethers.hexlify(ethers.randomBytes(32));
            const saltBig = BigInt(saltHex);

            const c1Hash = ethers.solidityPackedKeccak256(
                ["uint8", "uint256"],
                [selectedMove, saltBig]
            );

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const factory = new ethers.ContractFactory(abi, bytecode, signer);
            const contract = await factory.deploy(
                c1Hash,
                player2Address,
                { value: ethers.parseEther(stakeAmount) }
            );
            const deployedAddress = await contract.getAddress();
            setContractAddress(deployedAddress);
            setGeneratedSalt(saltHex);
            setTimeLeft(300);
            setIsTimerActive(true);
            setWarningMessage(""); // Clear any previous warnings
            console.info("Contract deployed", { deployedAddress, c1Hash, salt: saltHex });
        } catch (err: unknown) {
            console.error("deployContract error:", err);
            setWarningMessage("Transaction was rejected or failed. Please check your wallet connection and try again.");
            setWarningType('error');
        }
    }

    return (
        <div>
            <h3>Create New Game</h3>

            <Player2AddressInput
                player2Address={player2Address}
                onAddressChange={setPlayer2Address}
            />

            <MoveSelector
                selectedMove={selectedMove}
                onMoveSelect={setSelectedMove}
            />

            <div style={{ marginBottom: '10px' }}>
                <label htmlFor="stake">Stake Amount (ETH):</label>
                <input
                    id="stake"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.0001"
                    style={{
                        marginLeft: '10px',
                        padding: '5px',
                        width: '150px',
                        fontFamily: 'monospace'
                    }}
                />
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                <button
                    onClick={() => deployContract()}
                    style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Start Game
                </button>

                {contractAddress && (
                    <button
                        onClick={callTimeout}
                        disabled={isTimerActive}
                        style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            backgroundColor: isTimerActive ? '#ccc' : '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isTimerActive ? 'not-allowed' : 'pointer',
                            opacity: isTimerActive ? 0.6 : 1
                        }}
                    >
                        Call Timeout
                    </button>
                )}
            </div>

			{contractAddress && (
				<Warning 
					message={`Contract deployed successfully!\n\nContract Address: ${contractAddress} \n\nShare this address with Player 2`}
					type="info"
				/>
			)}

            {generatedSalt && (
                <Warning
                    message={`⚠️ IMPORTANT: Save Your Salt!\n\nYou need this salt to reveal your move later. Copy it and save it somewhere safe!\n\nSalt: ${generatedSalt}`}
                    type="warning"
                />
            )}

            <Timer
                timeLeft={timeLeft}
                isActive={isTimerActive}
                title="Player 2's Turn Timer"
                subtitle={timeLeft <= 60 ? '⚠️ Less than 1 minute left!' : 'Player 2 has time to make their move'}
            />

			{warningMessage && (
				<Warning 
					message={warningMessage} 
					type={warningType} 
					onClose={() => setWarningMessage("")}
				/>
			)}
		</div>
	);
};

export default CreateGameView;
