/**
 * Day counter
 * Time counter
 * Players
 * Vote time
 */

import { useEffect, useState } from 'react';
import { useInterval } from '../../hooks';

function useTimer({ timer, setTimer }) {
    useInterval(() => {
        timer !== 0 && setTimer((prevVal) => prevVal - 1);
    }, 1000);
}

export default function Day({ state, socket }) {
    const [timer, setTimer] = useState(30);
    const [voteStart, setVoteStart] = useState(false);
    const [voteFor, setVoteFor] = useState('');
    const [votes, setVotes] = useState([]);

    useTimer({ timer, setTimer });

    useEffect(() => {
        if (state.myPlayer.isOwner) {
            socket.emit('day-end');
        }
    }, [socket, timer, state.myPlayer.isOwner]);

    useEffect(() => {
        socket.on('vote-start', () => {
            setVoteStart(true);
        });
    }, [socket]);

    useEffect(() => {
        socket.on('current-votes', (votes) => {
            setVotes(votes);
        });
    }, [socket]);

    useEffect(() => {});

    return (
        <div>
            <div className='header'>
                <h3> Day 1</h3>
                <h3> {timer} s </h3>
            </div>

            <div className='players-table'>
                <table className='table'>
                    <thead>
                        <tr>
                            <th scope='col'>#</th>
                            <th scope='col'>Player Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.players.length
                            ? state.players.map((p, i) => (
                                  <tr key={p.playerID}>
                                      <th scope='col'>#{i + 1}</th>
                                      <th scope='col'>{p.playerName} </th>

                                      {voteStart && (
                                          <th>
                                              {' '}
                                              <button onClick={() => socket.emit('vote-for', p.playerID)}>Vote</button>{' '}
                                          </th>
                                      )}
                                  </tr>
                              ))
                            : null}
                    </tbody>
                </table>
            </div>

            <div className='player'>
                <p> Description </p>
                <p> Image </p>
            </div>
        </div>
    );
}
