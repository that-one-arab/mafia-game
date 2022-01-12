import './App.css';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { routes } from './routes';

import 'react-toastify/dist/ReactToastify.css';
import 'react-slideshow-image/dist/styles.css';

function App() {
    return (
        <div>
            <BrowserRouter>
                <Switch>
                    {routes.map((route, idx) => {
                        return (
                            route.component && (
                                <Route
                                    key={idx}
                                    path={route.path}
                                    exact={route.exact}
                                    name={route.name}
                                    render={(props) => <route.component {...props} />}
                                />
                            )
                        );
                    })}
                </Switch>
            </BrowserRouter>
        </div>
    );
}

export default App;
