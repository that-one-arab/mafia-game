import { useHistory } from 'react-router-dom';

export default function JoinGameEnterCode() {
    const history = useHistory();
    return (
        <div>
            <h3>Enter code</h3>
            <input />
            <button onClick={() => history.push('/lobby')}>continue</button>
        </div>
    );
}
