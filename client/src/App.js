import './App.css';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { routes } from './routes';

function App() {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(`http://localhost:8080`, {
            transports: ['websocket'],
        });
        setSocket(newSocket);
        return () => newSocket.close();
    }, [setSocket]);

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
