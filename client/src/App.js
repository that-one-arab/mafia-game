import './App.css';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { routes } from './routes';

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
                                    render={(props) => (
                                        <route.component {...props} />
                                    )}
                                />
                            )
                        );
                    })}
                    {/* I dont think theres need to use redirect  <Redirect from="/" to="/dashboard" /> */}
                </Switch>
            </BrowserRouter>
        </div>
    );
}

export default App;
