import './App.css';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { routes } from './routes';

import 'react-toastify/dist/ReactToastify.css';
import './styles/style.css';

function App() {
    return (
        <div>
            {/* <p>Day regular table</p>
            <table id='tab' class='content-table'>
                <thead>
                    <tr>
                        <th scope='col'>Name</th>
                        <th></th>
                        <th>Votes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Awss</td>
                        <td>
                            <button>Vote</button>
                        </td>
                        <td> 0 </td>
                    </tr>
                    <tr class='active-row'>
                        <td>Sally</td>
                        <td>
                            <button>Vote</button>
                        </td>
                        <td> 0 </td>
                    </tr>
                    <tr>
                        <td>Ahmed</td>
                        <td>
                            <button>Vote</button>
                        </td>
                        <td> 0 </td>
                    </tr>
                    <tr>
                        <td>rize</td>
                        <td>
                            <button>Vote</button>
                        </td>
                        <td> 0 </td>
                    </tr>
                </tbody>
            </table>
            <p>Night Town team table</p>
            <table id='tab' class='content-table'>
                <thead>
                    <tr>
                        <th scope='col'>Name</th>
                        <th scope='col'></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Awss</td>
                        <td>
                            <button>Choose</button>
                        </td>
                    </tr>
                    <tr class='active-row'>
                        <td>Sally</td>
                        <td>
                            <button style={{ backgroundColor: 'green' }}>Choose</button>
                        </td>
                    </tr>
                    <tr>
                        <td>Ahmed</td>
                        <td>
                            <button>Choose</button>
                        </td>
                    </tr>
                    <tr>
                        <td>rize</td>
                        <td>
                            <button>Choose</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p>Night Mafia team table</p>
            <table id='tab' class='content-table'>
                <thead>
                    <tr>
                        <th scope='col'>Name</th>
                        <th scope='col'></th>
                        <th scope='col'>Votes</th>
                        <th scope='col'>Godfather</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Awss</td>
                        <td>
                            <button>Choose</button>
                        </td>
                        <td>1</td>
                    </tr>
                    <tr class='active-row'>
                        <td>Sally</td>
                        <td>
                            <button style={{ backgroundColor: 'green' }}>Choose</button>
                        </td>
                        <td>2</td>
                        <td>Icon</td>
                    </tr>
                    <tr>
                        <td>Ahmed</td>
                        <td>
                            <button>Choose</button>
                        </td>
                        <td>0</td>
                    </tr>
                    <tr>
                        <td>rize</td>
                        <td>
                            <button>Choose</button>
                        </td>
                        <td>0</td>
                    </tr>
                </tbody>
            </table> */}
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
