export default function GameResult({ players, winnerTeam }) {
    return (
        <div>
            <div>
                <h2>
                    The winner is{' '}
                    <strong style={{ color: winnerTeam === 'MAFIA' ? 'red' : 'green' }}>{winnerTeam === 'MAFIA' ? 'Mafia' : 'Town'}</strong>{' '}
                </h2>
            </div>
            <div>
                <h3>Results: </h3>
            </div>
            <table className='table'>
                <thead>
                    <tr>
                        <th scope='col'>Name</th>
                        <th scope='col'>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((player) => (
                        <tr key={player.playerID}>
                            <th>{player.playerName}</th>
                            <th>
                                <p style={{ color: player.playerTeam === 'MAFIA' ? 'red' : 'green' }}>{player.playerRole}</p>
                            </th>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
