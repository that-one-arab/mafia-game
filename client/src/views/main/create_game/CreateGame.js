import { useHistory } from 'react-router-dom';

export default function CreateGame() {
    const history = useHistory();
    return (
        <div>
            <div>
                <h3>Input your name</h3>
                <input />
            </div>
            <div>
                <h3>Choose max amount of players</h3>
                <button>6 players</button>
            </div>
            <div>
                <button onClick={() => history.push('/lobby')}>Continue</button>
            </div>
        </div>
    );
}
