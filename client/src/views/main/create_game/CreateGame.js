import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useRef, useEffect } from 'react';
import { Toast } from 'bootstrap';

function ToastDemo({ toast, setToast }) {
    const toastRef = useRef();
    console.log({ toast });

    useEffect(() => {
        var myToast = toastRef.current;
        var bsToast = Toast.getInstance(myToast);

        if (!bsToast) {
            // initialize Toast
            bsToast = new Toast(myToast, { autohide: true });
            // hide after init
            bsToast.hide();
            // setToastHandler();
        } else {
            // toggle
            toast.show ? bsToast.show() : bsToast.hide();
        }
    }, [toast]);

    return (
        <div className='py-2'>
            <button
                className='btn btn-success'
                onClick={() =>
                    setToast((prevVal) => ({
                        show: prevVal + 1,
                        body: prevVal.body,
                        header: prevVal.header,
                    }))
                }
            >
                Toast handler
            </button>
            <div
                className='toast position-absolute top-0 end-0 m-4'
                role='alert'
                ref={toastRef}
            >
                <div className='toast-header'>
                    <strong className='me-auto'>{toast.header}</strong>
                    {/* <small>4 mins ago</small> */}
                    <button
                        type='button'
                        className='btn-close'
                        onClick={() =>
                            setToast((prevVal) => ({
                                show: prevVal + 1,
                                body: prevVal.body,
                                header: prevVal.header,
                            }))
                        }
                        aria-label='Close'
                    ></button>
                </div>
                <div className='toast-body'>{toast.body}</div>
            </div>
        </div>
    );
}

export default function CreateGame() {
    const history = useHistory();
    const dispatch = useDispatch();
    const playersAmount = useSelector(
        (state) => state.gameOptions.playersAmount
    );
    console.log({ playersAmount });

    const [toast, setToast] = useState({
        show: 0,
        body: 'choose amount of players',
        header: 'choose amount',
    });

    const dispatchPlayerAmountHandler = (e) =>
        dispatch({
            type: 'SET_PLAYERS_AMOUNT',
            payload: Number(e.target.value),
        });

    return (
        <div>
            <div>
                <h3>Input your name</h3>
                <input />
            </div>
            <div>
                <ToastDemo toast={toast} setToast={setToast} />
                <h3>Choose amount of players</h3>
                <div
                    className='btn-group'
                    role='group'
                    aria-label='Basic outlined example'
                >
                    <button
                        type='button'
                        className={`btn btn-outline-primary ${
                            playersAmount === 4 ? 'active' : ''
                        }`}
                        onClick={dispatchPlayerAmountHandler}
                        value={4}
                    >
                        4 Players
                    </button>
                    <button
                        type='button'
                        className={`btn btn-outline-primary ${
                            playersAmount === 6 ? 'active' : ''
                        }`}
                        onClick={dispatchPlayerAmountHandler}
                        value={6}
                    >
                        6 Players
                    </button>
                </div>
            </div>
            <div>
                <button onClick={() => history.push('/lobby')}>Continue</button>
            </div>
        </div>
    );
}
