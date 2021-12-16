import "./style.css";
import "../../styles/button.css";
import { useHistory } from "react-router-dom";

/** Main screen */
export default function Main() {
  const history = useHistory();
  return (
    <div id="main">
      <div>
        <h1>Mafia</h1>
      </div>
      <div className="row justify-content-center">
        <div style={{ marginBottom: "20%" }}> </div>
        <div className="col-lg-2">
          <button className="button" onClick={() => history.push("/lobby")}>
            Create Game
          </button>
        </div>
        <div className="col-lg-2">
          <button className="button" onClick={() => history.push("/join-game")}>
            Join Game
          </button>
        </div>
      </div>
    </div>
  );
}
