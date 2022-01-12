import { useState } from 'react';
import Modal from 'react-modal';
import { Fade } from 'react-slideshow-image';
import './style1.css';

import Img1 from './temp/1.jpg';
import Img2 from './temp/2.jpg';
import Img3 from './temp/3.jpg';

const FadeExample = () => {
    return (
        <div>
            <h2>Fade Effect</h2>
            <div className='slide-container'>
                <Fade>
                    <div className='each-fade'>
                        <div>
                            <img src={Img1} />
                        </div>
                        <p>First Slide</p>
                    </div>
                    <div className='each-fade'>
                        <p>Second Slide</p>
                        <div>
                            <img src={Img2} />
                        </div>
                    </div>
                    <div className='each-fade'>
                        <div>
                            <img src={Img3} />
                        </div>
                        <p>Third Slide</p>
                    </div>
                </Fade>
            </div>
        </div>
    );
};

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
    },
};

// Modal.setAppElement('#root');

export function HowToPlay({ modalIsOpen, closeModal }) {
    return (
        <>
            <FadeExample />

            <Modal
                isOpen={modalIsOpen}
                // onAfterOpen={afterOpenModal}
                onRequestClose={closeModal}
                style={customStyles}
                contentLabel='Example Modal'
                ariaHideApp={false}
            >
                <div>
                    <button onClick={closeModal}>close</button>
                    <div>
                        <FadeExample />
                    </div>
                </div>
            </Modal>
        </>
    );
}
