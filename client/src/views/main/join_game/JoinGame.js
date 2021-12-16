import { useHistory } from 'react-router-dom';

export default function JoinGame() {
    const history = useHistory();
    return (
        <div>
            <h3>Join game!</h3>
            <input src='Input game code' />
            <button onClick={() => history.push('/join-game/enter-code')}>
                Continue
            </button>
        </div>
    );
}
