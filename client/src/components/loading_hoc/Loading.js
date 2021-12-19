import "./loading.css";

const Loading = (props) => {
  if (props.absolute)
    return (
      <div>
        <div className={props.loading ? "loader loader-absolute" : ""}>
          <div className={props.loading ? "spinner-border" : ""} role="status">
            {/* <span className="sr-only loader-icon">Loading...</span> */}
          </div>
        </div>
        {props.children}
      </div>
    );
  else if (props.relative)
    return (
      <div className="relativePosition">
        <div className={props.loading ? "loader loader-relative" : ""}>
          <div className={props.loading ? "spinner-border" : ""} role="status">
            {/* <span className="sr-only loader-icon">Loading...</span> */}
          </div>
        </div>
        {props.children}
      </div>
    );
};

export default Loading;
