import './style1.css';
import '../../styles/button.css';
import { useHistory } from 'react-router-dom';

/** Main screen */
export default function Main() {
    const history = useHistory();

    return (
        <header className='header'>
            <div className='header_namebox'>
                <h1 className='header_namebox--name heading-Trans'>mafia</h1>
            </div>
            <div className='disc_box'>
                <h2 className='disc_box--content'>A way to play papular social games without a game master (needs to change) </h2>
            </div>

            <div className='btnbox'>
                <button className='btnbox_btn--animation btn-creat' onClick={() => history.push('/create-game')}>
                    create game
                </button>
                <button className='btnbox_btn--animation btn-join' onClick={() => history.push('/join-game')}>
                    Join game
                </button>
            </div>
        </header>
    );
}
