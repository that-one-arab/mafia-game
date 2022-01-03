export default function Night({ socket, state, dispatch }) {
    return (
        <div>
            <div className='header'>
                <h3> Night </h3>
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
                                          <>
                                              <th>
                                                  {' '}
                                                  <button
                                                      onClick={() =>
                                                          socket.volatile.emit('use-on', lobbyCode, state.myPlayer.playerID, p.playerID)
                                                      }
                                                  >
                                                      Vote
                                                  </button>{' '}
                                              </th>
                                              <th>
                                                  <p>{votes.find((vote) => vote.playerID === p.playerID).voters.length}</p>
                                              </th>
                                          </>
                                      )}
                                  </tr>
                              ))
                            : null}
                    </tbody>
                </table>
            </div>

            <div className='row'>
                <div className='col-6'>
                    <p> {description} </p>
                </div>
                <div className='col-6'>
                    <div className=''>{Svg}</div>
                </div>
            </div>
        </div>
    );
}
