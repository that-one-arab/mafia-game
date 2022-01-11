import './loading.css';

export const Loading = (props) => {
    if (props.absolute)
        return (
            <div>
                <div className={props.loading ? 'loader loader-absolute' : ''}>
                    <div className={props.loading ? 'spinner-border' : ''} role='status'>
                        {/* <span className="sr-only loader-icon">Loading...</span> */}
                    </div>
                </div>
                {props.children}
            </div>
        );
    else if (props.relative)
        return (
            <div className='relativePosition'>
                <div className={props.loading ? 'loader loader-relative' : ''}>
                    <div className={props.loading ? 'spinner-border' : ''} role='status'>
                        {/* <span className="sr-only loader-icon">Loading...</span> */}
                    </div>
                </div>
                {props.children}
            </div>
        );
};

export const DisconnectionLoading = (props) => {
    return (
        <div>
            <div className={props.loading ? 'loader loader-absolute' : ''}>
                <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                    <h4 style={{ display: props.loading ? '' : 'none' }}> Awaiting players reconnection... </h4>
                    <h5 style={{ display: props.loading ? '' : 'none' }}>Time left: {props.time}s </h5>
                    <div className={props.loading ? 'spinner-border' : ''} role='status'></div>
                </div>
            </div>
            {props.children}
        </div>
    );
};
