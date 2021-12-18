import { useSelector } from 'react-redux';

export default function Lobby() {
    const playerName = useSelector((state) => state.player.name);
    if (playerName.trim() === '') console.log('No player name in this screen');

    return (
        <div>
            <div>
                <h1>This is the lobby!</h1>
                <p> Your code is INSERT CODE</p>
            </div>
            <div>
                <p>Joined players table</p>
            </div>
            <table className='table'>
                <thead>
                    <tr>
                        <th scope='col'>#</th>
                        <th scope='col'>Player Name</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope='row'>1</th>
                        <td>Mark</td>
                    </tr>
                    <tr>
                        <th scope='row'>2</th>
                        <td>Jacob</td>
                    </tr>
                    <tr>
                        <th scope='row'>3</th>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
