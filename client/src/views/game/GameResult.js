import { useHistory } from 'react-router-dom';

export default function GameResult({ players, winnerTeam }) {
    const history = useHistory();

    return (
        <div>
            <section className='game lobby-1'>
                <h2>
                    The winner is{' '}
                    <strong style={{ color: winnerTeam === 'MAFIA' ? 'red' : 'green' }}>{winnerTeam === 'MAFIA' ? 'Mafia' : 'Town'}</strong>{' '}
                </h2>
                <div>
                    <h3>Results: </h3>
                </div>
                <div className='game__table'>
                    <div className='game__table--container'>
                        <table id='tab' className='table content-table-people'>
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
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button className='btnbox_btn--animation btn-creat' onClick={() => history.push('/')}>
                        Main Menu
                    </button>
                </div>
            </section>
            {/* <div>
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
            </table> */}
        </div>
    );
}
