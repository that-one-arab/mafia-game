import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { HowToPlay } from './HowToPlay';
import './style1.css';
import '../../styles/button.css';

/** Main screen */
export default function Main() {
    const history = useHistory();

    const [modalIsOpen, setIsOpen] = useState(false);

    function openModal() {
        setIsOpen(true);
    }

    // function afterOpenModal() {
    //     // references are now sync'd and can be accessed.
    //     subtitle.style.color = '#f00';
    // }

    function closeModal() {
        setIsOpen(false);
    }

    return (
        <div>
            {/* <HowToPlay modalIsOpen={modalIsOpen} closeModal={closeModal} /> */}
            <header className='header'>
                <div className='header_namebox'>
                    <h1 className='header_namebox--name heading-Trans'>mafia</h1>
                </div>
                <div className='disc_box'>
                    <h2 className='disc_box--content'>The online party game</h2>
                </div>

                <div className='btnbox'>
                    <button className='btnbox_btn--animation btn-creat' onClick={() => history.push('/create-game')}>
                        create game
                    </button>
                    <button className='btnbox_btn--animation btn-join' onClick={() => history.push('/join-game')}>
                        Join game
                    </button>
                    {/* <button className='btnbox_btn--animation btn-join' onClick={openModal}>
                        How To Play
                    </button> */}
                </div>
            </header>
        </div>
    );
}
