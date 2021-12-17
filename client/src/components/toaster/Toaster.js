import { useRef, useEffect } from 'react';
import { Toast } from 'bootstrap';

export default function Toaster({toast, setToast}) {
    // var [toast, setToast] = useState(false);
    const toastRef = useRef();

    useEffect(() => {
        var myToast = toastRef.current
        var bsToast = Toast.getInstance(myToast)
        
        if (!bsToast) {
            // initialize Toast
            bsToast = new Toast(myToast, {autohide: true})
            // hide after init
            bsToast.hide()
            setToast({show: toast.show, header: toast.header, body: toast.body})
        }
        else {
            // toggle
            toast.show !== 0 ? bsToast.show() : bsToast.hide()
        }
    }, [toast, setToast])

    return (
    <div className="py-2">
        <div className="toast position-absolute top-0 end-0 m-4" role="alert" ref={toastRef}>
            <div className="toast-header">
                <strong className="me-auto">
                    {toast.header}
                </strong>
                <button type="button" className="btn-close" onClick={() => setToast({show: 0, header: toast.header, body: toast.body})} aria-label="Close"></button>
            </div>
            <div className="toast-body">
              {toast.body}
            </div>
        </div>
    </div>
    )
}