import Moralis from 'moralis'

const config = {
  main: {
    serverUrl: 'https://7k3fhzs3lfq7.usemoralis.com:2053/server',
    appId: 'TYssyyTAoXqKreMt5Sv5ePmGGuMeXITDxnZrwtuF',
  },
  test: {
    serverUrl: 'https://n1nlmbwjtoar.usemoralis.com:2053/server',
    appId: 'ElIVyOrLds7aP98AKmbkHFX5ec0QDrb0Sk70umyT',
  },
  local: {
    serverUrl: 'https://lsoku5barapv.usemoralis.com:2053/server',
    appId: 'xbX2eFu5lJi4htooFmnDek50EfhcKXskiVyXgya6',
  },
}

Moralis.start(config.main)

window.Moralis = Moralis
export default Moralis
