import { useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';

export default function ActionResult({ actionResult }) {
    useEffect(() => {
        if (actionResult.results.length) {
            actionResult.results.forEach((result) => {
                switch (result.code) {
                    case 'MY_DOCTOR_PROTECTED':
                        toast.success('You have successfuly protected your target!', {
                            position: 'top-center',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'colored',
                        });
                        break;

                    case 'SHERRIF_RESULT':
                        toast.info(
                            () => (
                                <div>
                                    {' '}
                                    <p>
                                        Your investigation result is{' '}
                                        <strong style={{ color: result.payload === 'MAFIA' ? 'red' : 'green' }}> {result.payload} </strong>
                                    </p>{' '}
                                </div>
                            ),
                            {
                                position: 'top-center',
                                autoClose: 5000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: 'colored',
                            }
                        );
                        break;

                    case 'DETECTIVE_RESULT':
                        toast.info(`Your investigation result is: "${result.payload}"`, {
                            position: 'top-center',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'colored',
                        });
                        break;

                    case 'BRAWLER_GUARDED':
                        toast.success('You have successfuly guarded yourself and killed your intruder!', {
                            position: 'top-center',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'colored',
                        });
                        break;

                    case 'DOCTOR_PROTECTED_ME':
                        toast.success('You have been saved from death by a doctor!', {
                            position: 'top-center',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'light',
                        });
                        break;

                    case 'TARGET_PROTECTED':
                        toast.error('This target is protected', {
                            position: 'top-center',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'light',
                        });
                        break;

                    case 'KILLED':
                        toast.error('You have successfully killed your target', {
                            position: 'top-center',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'dark',
                        });
                        break;

                    case 'VIG_KILLED':
                        toast.success('You have successfully killed your target', {
                            position: 'top-center',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'light',
                        });
                        break;

                    case 'BLOCKED':
                        toast.warn('You have been blocked!', {
                            position: 'top-center',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'colored',
                        });
                        break;

                    case 'MAF_GUNNER_BLOCKED':
                        toast.warn('Your mafia gunner has been blocked!', {
                            position: 'top-center',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'colored',
                        });
                        break;

                    case 'I_BLOCKED':
                        toast.success('You have successfully blocked your target!', {
                            position: 'top-center',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'light',
                        });
                        break;

                    case 'DEATH':
                        toast.error('You have died!', {
                            position: 'top-center',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'colored',
                        });
                        break;

                    default:
                        break;
                }
            });
        }
    }, [actionResult]);

    return (
        <div>
            <ToastContainer
                position='top-center'
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                draggable
                pauseOnHover
                pauseOnFocusLoss={false}
            />
        </div>
    );
}
