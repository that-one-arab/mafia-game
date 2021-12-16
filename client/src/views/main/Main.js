import './style.css';
import '../../styles/button.css';
import { useHistory } from 'react-router-dom';

/** Main screen */
export default function Main() {
    const history = useHistory();
    return (
        <div id='main'>
            <div>
                <h1 className='display-1 mt-3'>Mafia</h1>
                <p class='lead'>
                    A way to play the popular social game without a game master!
                </p>
            </div>
            <div className='row justify-content-center' id='mid-section'>
                <div className='row justify-content-center'>
                    <div style={{ marginBottom: '20%' }}> </div>
                    <div className='col-lg-6'>
                        <button
                            className='button'
                            onClick={() => history.push('/create-game')}
                        >
                            Create Game
                        </button>
                    </div>
                    <div className='col-lg-6'>
                        <button
                            className='button'
                            onClick={() => history.push('/join-game')}
                        >
                            Join Game
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
