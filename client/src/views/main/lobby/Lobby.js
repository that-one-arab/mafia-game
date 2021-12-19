import { useSelector } from 'react-redux';

export default function Lobby() {
    const player = useSelector((state) => state.player);
    const roomCode = useSelector((state) => state.game.roomCode);
    console.log({ player, roomCode });

    const players = [player];

    return (
        <div>
            <div>
                <h1>This is the lobby!</h1>
                <p> Your code is </p>
                <h2>{roomCode} </h2>
                <p>Share this code with people who wanna join!</p>
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
                    {players.map((p, i) => (
                        <tr key={p.ID}>
                            <th scope='col'>#{i + 1}</th>
                            <th scope='col'>{p.name} </th>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
